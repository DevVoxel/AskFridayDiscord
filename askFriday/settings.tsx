/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { MODELS } from "./providers";

const isProvider = (p: string) => () => settings.store.provider !== p;
const notApiKey = () => settings.store.authMode !== "apikey";
const isApiKeyFor = (p: string) => () => settings.store.authMode !== "apikey" || settings.store.provider !== p;

export const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Which AI to ask",
        options: [
            { label: "Anthropic (Claude)", value: "anthropic", default: true },
            { label: "OpenAI (ChatGPT)", value: "openai" },
            { label: "Google (Gemini)", value: "gemini" },
        ],
    },
    authMode: {
        type: OptionType.SELECT,
        description: "How to authenticate",
        options: [
            { label: "API key (pay per use)", value: "apikey", default: true },
            { label: "Local CLI (use my subscription, safe)", value: "local-cli" },
        ],
    },

    // ── API keys (plaintext — see warning) ──────────────────────────────────
    anthropicKey: {
        type: OptionType.STRING,
        description: "Anthropic API key — stored in PLAINTEXT in Vencord settings. Use a scoped key.",
        default: "",
        hidden: isApiKeyFor("anthropic"),
    },
    openaiKey: {
        type: OptionType.STRING,
        description: "OpenAI API key — stored in PLAINTEXT. Use a scoped key.",
        default: "",
        hidden: isApiKeyFor("openai"),
    },
    geminiKey: {
        type: OptionType.STRING,
        description: "Google Gemini API key — stored in PLAINTEXT. Use a scoped key.",
        default: "",
        hidden: isApiKeyFor("gemini"),
    },

    // ── Models (per provider SELECT + free-text override) ───────────────────
    anthropicModel: {
        type: OptionType.SELECT,
        description: "Claude model",
        options: MODELS.anthropic.map((m, i) => ({ ...m, default: i === 0 })),
        hidden: isProvider("anthropic"),
    },
    openaiModel: {
        type: OptionType.SELECT,
        description: "OpenAI model",
        options: MODELS.openai.map((m, i) => ({ ...m, default: i === 0 })),
        hidden: isProvider("openai"),
    },
    geminiModel: {
        type: OptionType.SELECT,
        description: "Gemini model",
        options: MODELS.gemini.map((m, i) => ({ ...m, default: i === 0 })),
        hidden: isProvider("gemini"),
    },
    customModel: {
        type: OptionType.STRING,
        description: "Custom model id (overrides the dropdown above if set)",
        default: "",
    },

    // ── Local CLI mode ──────────────────────────────────────────────────────
    cliPath: {
        type: OptionType.STRING,
        description: "CLI binary path (blank = use 'claude'/'codex'/'gemini' on PATH). " +
            "Log the CLI in first, e.g. `claude /login`. Counts against your subscription usage.",
        default: "",
        hidden: notApiKey, // only relevant in local-cli mode
    },

    // ── Tone / attributes (shape the prompt) ────────────────────────────────
    tone: {
        type: OptionType.SELECT,
        description: "Reply tone",
        options: [
            { label: "Human (natural)", value: "human", default: true },
            { label: "Casual", value: "casual" },
            { label: "Technical", value: "technical" },
            { label: "Friendly", value: "friendly" },
            { label: "Professional", value: "professional" },
            { label: "Witty", value: "witty" },
            { label: "Concise / blunt", value: "concise" },
            { label: "Robotic / bot-like", value: "robotic" },
            { label: "Custom (see field below)", value: "custom" },
        ],
    },
    customTone: {
        type: OptionType.STRING,
        description: "Custom tone description (used when tone = Custom)",
        default: "",
        hidden: () => settings.store.tone !== "custom",
    },
    length: {
        type: OptionType.SELECT,
        description: "Reply length",
        options: [
            { label: "Short (a sentence or two)", value: "short", default: true },
            { label: "Medium", value: "medium" },
            { label: "Long", value: "long" },
        ],
    },
    useEmojis: {
        type: OptionType.BOOLEAN,
        description: "Allow emojis in replies",
        default: false,
    },
    matchLanguage: {
        type: OptionType.BOOLEAN,
        description: "Reply in the same language as the original message",
        default: true,
    },
    extraInstructions: {
        type: OptionType.STRING,
        description: "Extra instructions appended to every prompt (optional)",
        default: "",
    },
});
