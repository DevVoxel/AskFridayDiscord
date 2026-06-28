/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert";
import test from "node:test";

import { maskTerms, sanitize } from "./filter";

// Synthetic "terms" so no real slurs appear in tests. maskTerms covers all the
// masking logic; sanitize just binds it to the real HATE_TERMS array.
const TERMS = ["frobnicate", "badword"];

test("maskTerms replaces a matched term with length-matched asterisks", () => {
    assert.equal(maskTerms("you frobnicate too much", TERMS), "you ********** too much");
});

test("maskTerms is case-insensitive", () => {
    assert.equal(maskTerms("FROBNICATE", TERMS), "**********");
});

test("maskTerms only matches whole words, not substrings", () => {
    assert.equal(maskTerms("refrobnicated", TERMS), "refrobnicated");
});

test("maskTerms tolerates simple separators inside a term", () => {
    assert.equal(maskTerms("b.a.dword here", TERMS), "********* here");
    assert.equal(maskTerms("bad-word here", TERMS), "******** here");
});

test("maskTerms leaves clean text and ordinary words untouched", () => {
    assert.equal(maskTerms("this is a normal damn sentence", TERMS), "this is a normal damn sentence");
});

test("maskTerms preserves surrounding punctuation", () => {
    assert.equal(maskTerms("ugh, frobnicate!", TERMS), "ugh, **********!");
});

test("sanitize is a no-op for clean text", () => {
    assert.equal(sanitize("hello there, how are you?"), "hello there, how are you?");
});

test("maskTerms does not treat spaces as separators", () => {
    assert.equal(maskTerms("fr ob", ["frob"]), "fr ob");
    assert.equal(maskTerms("go ok then", ["frob"]), "go ok then");
});

test("maskTerms still catches dot and hyphen obfuscation", () => {
    assert.equal(maskTerms("fr.ob", ["frob"]), "*****");
    assert.equal(maskTerms("fr-ob", ["frob"]), "*****");
});
