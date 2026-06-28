/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert";
import test from "node:test";

import { humanizeText } from "./humanize";

test("em dash with spaces becomes comma and space", () => {
    assert.equal(humanizeText("I tried it — works great"), "I tried it, works great");
});

test("em dash without surrounding spaces", () => {
    assert.equal(humanizeText("works great—really"), "works great, really");
});

test("en dash is handled the same", () => {
    assert.equal(humanizeText("pages 10 – 12 here"), "pages 10, 12 here");
});

test("em dash inside inline code is preserved", () => {
    assert.equal(humanizeText("run `a — b` now"), "run `a — b` now");
});

test("em dash inside a fenced block is preserved", () => {
    assert.equal(humanizeText("```\nx — y\n```"), "```\nx — y\n```");
});

test("semicolons, colons, hyphens and clean text are untouched", () => {
    assert.equal(
        humanizeText("meet at 3:30; bring the well-made kit"),
        "meet at 3:30; bring the well-made kit",
    );
});

test("spacing is tidied: no double space, no space before punctuation", () => {
    assert.equal(humanizeText("a —  b"), "a, b");
});
