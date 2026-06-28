/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert";
import test from "node:test";

import { buildGenerateOptions, resolveModel, StoreView } from "./config";
import { applyOverride, buildPrompt, PERSONALITY_PRESETS, ToneView } from "./prompt";

const tone = (o: Partial<ToneView> = {}): ToneView => ({
    tone: "human", customTone: "", personality: "none", customPersonality: "",
    length: "short", useEmojis: false, matchLanguage: true,
    filterSlurs: true, extraInstructions: "", ...o,
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

test("no context → no conversation block, no context instruction", () => {
    const { system, user } = buildPrompt({ content: "hi" }, tone());
    assert.doesNotMatch(user, /Recent conversation/);
    assert.doesNotMatch(system, /Recent channel messages/);
});

test("before-context → transcript + continuity instruction", () => {
    const before = [
        { content: "anyone use nix?", author: { username: "carol" } },
        { content: "yeah daily", author: { username: "dave" } },
    ];
    const { system, user } = buildPrompt({ content: "how do I install a package?", author: { username: "alice" } }, tone(), { before });
    assert.match(user, /Recent conversation/);
    assert.match(user, /carol: anyone use nix\?/);
    assert.match(user, /dave: yeah daily/);
    assert.match(user, /The message I'm replying to:/);
    assert.match(system, /Recent channel messages.*context/i);
});

test("after-context → appears below the target", () => {
    const { user } = buildPrompt(
        { content: "how do I install a package?", author: { username: "alice" } },
        tone(),
        { before: [{ content: "hey", author: { username: "carol" } }], after: [{ content: "try nix profile install", author: { username: "erin" } }] },
    );
    // ordering: conversation → target → after
    assert.match(user, /Recent conversation[\s\S]*The message I'm replying to:[\s\S]*Messages after it:[\s\S]*erin: try nix profile install/);
});

test("human default reads as a helpful engineer", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({ tone: "human" }));
    assert.match(system, /knowledgeable engineer/i);
    assert.match(system, /technical terms/i);
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

test("personality line is included when set and omitted for none", () => {
    assert.ok(PERSONALITY_PRESETS.mentor.line);
    const withP = buildPrompt({ content: "hi" }, tone({ personality: "mentor" })).system;
    assert.match(withP, /warm, patient mentor/i);

    const withoutP = buildPrompt({ content: "hi" }, tone({ personality: "none" })).system;
    assert.doesNotMatch(withoutP, /persona/i);
});

test("custom personality uses the free-text field", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({
        personality: "custom", customPersonality: "a medieval town crier",
    }));
    assert.match(system, /medieval town crier/);
});

test("robotic tone with a personality still drops the human framing", () => {
    const { system } = buildPrompt({ content: "hi" }, tone({ tone: "robotic", personality: "mentor" }));
    assert.doesNotMatch(system, /real person/i);
    assert.match(system, /warm, patient mentor/i);
});

test("applyOverride merges tone/personality over the view", () => {
    const base = tone({ tone: "human", personality: "none" });
    const merged = applyOverride(base, { tone: "witty", personality: "nerd" });
    assert.equal(merged.tone, "witty");
    assert.equal(merged.personality, "nerd");
    // untouched fields preserved
    assert.equal(merged.length, "short");
    // no override returns an equivalent view
    assert.equal(applyOverride(base).tone, "human");
});

test("applyOverride can override length, reflected in the prompt", () => {
    const base = tone({ length: "short" });
    assert.equal(applyOverride(base, { length: "long" }).length, "long");
    const { system } = buildPrompt({ content: "hi" }, applyOverride(base, { length: "long" }));
    assert.match(system, /full paragraph/i);
    // short still maps to its own line
    const short = buildPrompt({ content: "hi" }, applyOverride(base, { length: "short" })).system;
    assert.match(short, /sentence or two/i);
});

test("sanitizeFn is applied to target + context but not to extraInstructions", () => {
    const fake = (s: string) => s.replace(/z/g, "*");
    const { system, user } = buildPrompt(
        { content: "zebra", author: { username: "zoe" } },
        tone({ filterSlurs: true, extraInstructions: "zest" }),
        { before: [{ content: "zap", author: { username: "zed" } }] },
        fake,
    );
    assert.match(user, /\*ebra/);        // target content sanitized
    assert.match(user, /\*ap/);          // context content sanitized
    assert.match(system, /zest/);        // extraInstructions NOT sanitized
});

test("filterSlurs=false bypasses the sanitizer", () => {
    const fake = (s: string) => s.replace(/z/g, "*");
    const { user } = buildPrompt(
        { content: "zebra" },
        tone({ filterSlurs: false }),
        {},
        fake,
    );
    assert.match(user, /zebra/);
});

test("new tone presets resolve to their line", () => {
    assert.match(buildPrompt({ content: "hi" }, tone({ tone: "enthusiastic" })).system, /enthusiastic/i);
    assert.match(buildPrompt({ content: "hi" }, tone({ tone: "flirty" })).system, /flirty/i);
});

test("usernames in target and context are sanitized too", () => {
    const fake = (s: string) => s.replace(/z/g, "*");
    const { user } = buildPrompt(
        { content: "hi", author: { username: "zoe" } },
        tone({ filterSlurs: true }),
        { before: [{ content: "hey", author: { username: "zed" } }] },
        fake,
    );
    assert.match(user, /\*oe said:/);
    assert.match(user, /\*ed: hey/);
});

test("filterSlurs=false leaves usernames untouched", () => {
    const fake = (s: string) => s.replace(/z/g, "*");
    const { user } = buildPrompt(
        { content: "hi", author: { username: "zoe" } },
        tone({ filterSlurs: false }),
        {},
        fake,
    );
    assert.match(user, /zoe said:/);
});
