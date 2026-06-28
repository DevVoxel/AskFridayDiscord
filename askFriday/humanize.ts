/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Split out code spans (fenced ```...``` or inline `...`) so we never rewrite
// punctuation inside code. The capturing group keeps the delimiters in the
// resulting array, at odd indices.
const CODE_SPAN = /(```[\s\S]*?```|`[^`]*`)/;

// Replace em dash (U+2014) and en dash (U+2013), with any spaces around them,
// by a comma and a single space, then tidy spacing. Hyphen-minus, semicolons,
// and colons are intentionally left untouched.
function stripDashes(s: string): string {
    return s
        .replace(/\s*[—–]\s*/g, ", ")
        .replace(/ {2,}/g, " ")
        .replace(/ +([,.!?;:])/g, "$1");
}

export function humanizeText(text: string): string {
    return text
        .split(CODE_SPAN)
        .map((seg, i) => (i % 2 === 1 ? seg : stripDashes(seg)))
        .join("");
}
