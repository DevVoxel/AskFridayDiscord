/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/*
 * Local end-to-end smoke test - runs the REAL provider calls in native.ts with
 * your own keys, outside Discord. Nothing here touches Vencord.
 *
 * API-key mode (set whichever keys you have):
 *   ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... GEMINI_API_KEY=AIza... \
 *     npx tsx askFriday/smoke.ts
 *
 * Local-CLI / subscription mode (log the CLIs in first: `claude /login`, etc.):
 *   FRIDAY_CLI=1 npx tsx askFriday/smoke.ts
 *
 * Optionally pin models: ANTHROPIC_MODEL=claude-opus-4-8 OPENAI_MODEL=gpt-5.5 ...
 */

import { generateReply } from "./native";
import { DEFAULT_MODEL, GenerateOptions, Provider } from "./providers";

const SYSTEM = "You are terse. Reply with exactly one short sentence, no preamble.";
const USER = 'Someone said: "how do I download a Nix package?"\n\nWrite my casual reply.';

const useCli = process.env.FRIDAY_CLI === "1";

const KEYS: Record<Provider, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
};
const MODEL_ENV: Record<Provider, string | undefined> = {
    anthropic: process.env.ANTHROPIC_MODEL,
    openai: process.env.OPENAI_MODEL,
    gemini: process.env.GEMINI_MODEL,
};

async function run(provider: Provider) {
    const model = MODEL_ENV[provider] || DEFAULT_MODEL[provider];
    const opts: GenerateOptions = useCli
        ? { provider, authMode: "local-cli", model, system: SYSTEM, user: USER }
        : { provider, authMode: "apikey", model, apiKey: KEYS[provider], system: SYSTEM, user: USER };

    if (!useCli && !opts.apiKey) {
        console.log(`• ${provider.padEnd(9)} SKIP (no API key in env)`);
        return;
    }

    const label = `• ${provider.padEnd(9)} [${useCli ? "cli" : "api"} ${model}]`;
    const t0 = Date.now();
    const res = await generateReply(null, opts);
    const ms = Date.now() - t0;
    if ("error" in res) console.log(`${label}  ✗ ${res.error}  (${ms}ms)`);
    else console.log(`${label}  ✓ ${JSON.stringify(res.text)}  (${ms}ms)`);
}

(async () => {
    console.log(`AskFriday smoke - mode: ${useCli ? "local-cli (subscription)" : "api key"}\n`);
    for (const p of ["anthropic", "openai", "gemini"] as Provider[]) {
        try { await run(p); } catch (e: any) { console.log(`• ${p} threw: ${e?.message ?? e}`); }
    }
})();
