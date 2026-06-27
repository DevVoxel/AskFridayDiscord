/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { execFile } from "child_process";

import {
    DEFAULT_CLI,
    GenerateOptions,
    GenerateResult,
    Provider,
} from "./providers";

const MAX_TOKENS = 1024;

export async function generateReply(_: unknown, opts: GenerateOptions): Promise<GenerateResult> {
    try {
        if (opts.authMode === "local-cli") return await viaCli(opts);
        return await viaApi(opts);
    } catch (e: any) {
        return { error: `Friday: ${e?.message ?? String(e)}` };
    }
}

// ── HTTP API path (bring-your-own key) ──────────────────────────────────────

async function viaApi(opts: GenerateOptions): Promise<GenerateResult> {
    if (!opts.apiKey) return { error: "Friday: no API key set for this provider" };
    switch (opts.provider) {
        case "anthropic": return anthropic(opts);
        case "openai": return openai(opts);
        case "gemini": return gemini(opts);
    }
}

async function anthropic(o: GenerateOptions): Promise<GenerateResult> {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": o.apiKey!,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: o.model,
            max_tokens: MAX_TOKENS,
            system: o.system,
            messages: [{ role: "user", content: o.user }],
        }),
    });
    const j = await r.json();
    if (!r.ok) return { error: apiError("Anthropic", r.status, j?.error?.message) };
    const text = j?.content?.[0]?.text;
    return text ? { text } : { error: "Friday: empty Anthropic response" };
}

async function openai(o: GenerateOptions): Promise<GenerateResult> {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${o.apiKey}`,
        },
        body: JSON.stringify({
            model: o.model,
            messages: [
                { role: "system", content: o.system },
                { role: "user", content: o.user },
            ],
        }),
    });
    const j = await r.json();
    if (!r.ok) return { error: apiError("OpenAI", r.status, j?.error?.message) };
    const text = j?.choices?.[0]?.message?.content;
    return text ? { text } : { error: "Friday: empty OpenAI response" };
}

async function gemini(o: GenerateOptions): Promise<GenerateResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${o.model}:generateContent`;
    const r = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-goog-api-key": o.apiKey!,
        },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: o.system }] },
            contents: [{ role: "user", parts: [{ text: o.user }] }],
        }),
    });
    const j = await r.json();
    if (!r.ok) return { error: apiError("Gemini", r.status, j?.error?.message) };
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? { text } : { error: "Friday: empty Gemini response" };
}

function apiError(name: string, status: number, msg?: string) {
    if (status === 401 || status === 403) return `Friday: ${name} rejected the API key (${status})`;
    if (status === 429) return `Friday: ${name} rate limit / quota hit (429)`;
    return `Friday: ${name} error ${status}${msg ? ` - ${msg}` : ""}`;
}

// ── Local CLI path (subscription via the CLI's own OAuth login) ──────────────
// We spawn the official, already-logged-in CLI in non-interactive mode. The CLI
// owns all auth - we never read or handle a token. Sanctioned subscription use.

function viaCli(o: GenerateOptions): Promise<GenerateResult> {
    const bin = o.cliPath?.trim() || DEFAULT_CLI[o.provider];
    const { args, input } = cliInvocation(o.provider, o.model, o.system, o.user);

    return new Promise(resolve => {
        const child = execFile(bin, args, { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 },
            (err, stdout, stderr) => {
                if (err) {
                    if ((err as any).code === "ENOENT")
                        return resolve({ error: `Friday: '${bin}' not found on PATH - install the CLI or set its path` });
                    return resolve({ error: `Friday: ${bin} failed - ${stderr?.trim() || err.message}` });
                }
                resolve(parseCliOutput(o.provider, stdout));
            });
        if (input) { child.stdin?.write(input); child.stdin?.end(); }
    });
}

function cliInvocation(provider: Provider, model: string, system: string, user: string) {
    switch (provider) {
        case "anthropic":
            // Claude Code: prompt on stdin, JSON out, system prompt appended.
            return {
                args: ["-p", "--output-format", "json", "--model", model,
                    "--append-system-prompt", system],
                input: user,
            };
        case "openai":
            // Codex non-interactive exec; prompt as final arg.
            return { args: ["exec", "--model", model, `${system}\n\n${user}`], input: "" };
        case "gemini":
            // Gemini CLI one-shot.
            return { args: ["-m", model, "-p", `${system}\n\n${user}`], input: "" };
    }
}

function parseCliOutput(provider: Provider, stdout: string): GenerateResult {
    const raw = stdout.trim();
    if (!raw) return { error: "Friday: CLI returned nothing (logged in?)" };
    if (provider === "anthropic") {
        try {
            const j = JSON.parse(raw);
            const text = j.result ?? j.text;
            return text ? { text } : { error: "Friday: could not parse Claude CLI output" };
        } catch {
            return { text: raw }; // fall back to plain text if not JSON
        }
    }
    return { text: raw };
}
