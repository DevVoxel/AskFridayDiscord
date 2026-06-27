/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DEFAULT_MODEL, GenerateOptions, Provider } from "./providers";

/** Subset of settings.store this module reads. */
export interface StoreView {
    provider: Provider;
    authMode: "apikey" | "local-cli";
    anthropicKey: string;
    openaiKey: string;
    geminiKey: string;
    anthropicModel: string;
    openaiModel: string;
    geminiModel: string;
    customModel: string;
    cliPath: string;
}

export function resolveModel(s: StoreView): string {
    if (s.customModel.trim()) return s.customModel.trim();
    const perProvider = {
        anthropic: s.anthropicModel,
        openai: s.openaiModel,
        gemini: s.geminiModel,
    }[s.provider];
    return perProvider || DEFAULT_MODEL[s.provider];
}

export function resolveApiKey(s: StoreView): string {
    return {
        anthropic: s.anthropicKey,
        openai: s.openaiKey,
        gemini: s.geminiKey,
    }[s.provider].trim();
}

export function buildGenerateOptions(s: StoreView, system: string, user: string): GenerateOptions {
    return {
        provider: s.provider,
        authMode: s.authMode,
        model: resolveModel(s),
        apiKey: s.authMode === "apikey" ? resolveApiKey(s) : undefined,
        cliPath: s.authMode === "local-cli" ? s.cliPath : undefined,
        system,
        user,
    };
}
