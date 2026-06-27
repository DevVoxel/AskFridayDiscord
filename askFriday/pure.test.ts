/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert";
import test from "node:test";

import { buildGenerateOptions, resolveModel, StoreView } from "./config";
import { buildPrompt, ToneView } from "./prompt";

const tone = (o: Partial<ToneView> = {}): ToneView => ({
    tone: "human", customTone: "", length: "short",
    useEmojis: false, matchLanguage: true, extraInstructions: "", ...o,
});

const store = (o: Partial<StoreView> = {}): StoreView => ({
    provider: "anthropic", authMode: "apikey",
    anthropicKey: "", openaiKey: "", geminiKey: "",
    anthropicModel: "claude-opus-4-8", openaiModel: "gpt-5.5", geminiModel: "gemini-2.5-flash",
    customModel: "", cliPath: "", ...o,
});

test("system prompt reflects tone flags", () => {
    const { system } = buildPrompt({ content: "hi", author: { username: "bob" } }, tone({ useEmojis: false }));
    assert.match(system, /real person/i);
    assert.match(system, /Do not use emojis/);
    assert.match(system, /same language/i);
    assert.match(system, /Output ONLY the reply/i);
});

test("technical tone keeps the human framing", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({ tone: "technical" }));
    assert.match(system, /technical and precise/i);
    assert.match(system, /real person/i);
});

test("robotic tone drops the human framing", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({ tone: "robotic" }));
    assert.match(system, /robotic, bot-like/i);
    assert.doesNotMatch(system, /real person/i);
});

test("custom tone + emojis + extra instructions flow through", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({
        tone: "custom", customTone: "talk like a pirate", useEmojis: true,
        matchLanguage: false, extraInstructions: "mention Nix",
    }));
    assert.match(system, /pirate/);
    assert.match(system, /Emojis are okay/);
    assert.doesNotMatch(system, /same language/i);
    assert.match(system, /mention Nix/);
});

test("user prompt embeds author + message content", () => {
    const { user } = buildPrompt({ content: "how do I install a Nix package?", author: { username: "alice" } }, tone());
    assert.match(user, /alice said:/);
    assert.match(user, /Nix package/);
});

test("customModel overrides the per-provider dropdown", () => {
    assert.equal(resolveModel(store({ customModel: "my-model" })), "my-model");
    assert.equal(resolveModel(store({ provider: "openai" })), "gpt-5.5");
});

test("apikey mode carries the right key; cli mode omits it", () => {
    const a = buildGenerateOptions(store({ provider: "openai", authMode: "apikey", openaiKey: "sk-x" }), "s", "u");
    assert.equal(a.apiKey, "sk-x");
    assert.equal(a.cliPath, undefined);

    const c = buildGenerateOptions(store({ authMode: "local-cli", cliPath: "/bin/claude" }), "s", "u");
    assert.equal(c.apiKey, undefined);
    assert.equal(c.cliPath, "/bin/claude");
});
