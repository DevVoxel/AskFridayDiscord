/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type Provider = "anthropic" | "openai" | "gemini";
export type AuthMode = "apikey" | "local-cli";

/** What index.tsx ships across IPC to native.ts for one generation. */
export interface GenerateOptions {
    provider: Provider;
    authMode: AuthMode;
    model: string;
    /** API key (authMode "apikey") - ignored in local-cli mode. */
    apiKey?: string;
    /** Optional explicit CLI binary path (authMode "local-cli"). */
    cliPath?: string;
    system: string;
    user: string;
}

/** Normalised result returned from native.ts. Exactly one field is set. */
export type GenerateResult = { text: string } | { error: string };

/** Model dropdown choices per provider. Editable - a custom STRING override in
 *  settings lets the user type any model id these lists don't cover. */
export const MODELS: Record<Provider, { label: string; value: string; }[]> = {
    anthropic: [
        { label: "Claude Opus 4.8", value: "claude-opus-4-8" },
        { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
        { label: "Claude Haiku 4.5", value: "claude-haiku-4-5-20251001" },
    ],
    openai: [
        { label: "GPT-5.5", value: "gpt-5.5" },
        { label: "GPT-5.4 mini", value: "gpt-5.4-mini" },
        { label: "GPT-4o", value: "gpt-4o" },
    ],
    gemini: [
        { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
        { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    ],
};

export const DEFAULT_MODEL: Record<Provider, string> = {
    anthropic: "claude-opus-4-8",
    openai: "gpt-5.5",
    gemini: "gemini-2.5-flash",
};

/** Default CLI binary name when local-cli mode is used and no path is set. */
export const DEFAULT_CLI: Record<Provider, string> = {
    anthropic: "claude",
    openai: "codex",
    gemini: "gemini",
};
