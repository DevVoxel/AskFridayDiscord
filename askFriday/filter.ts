/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Curated slurs / hate terms. This is DATA, not logic - the masking behavior is
// fully covered by maskTerms tests with synthetic terms. Keep this list
// conservative (slurs and hate terms only); ordinary profanity is intentionally
// left out so replies can still match the channel's register. Populate from a
// curated slurs source and extend as needed.
export const HATE_TERMS: string[] = [
    "faggot",
    "nigger",
    "kike",
    "gook",
    "spic",
    "retard",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, m => "\\" + m);

// Allow a single dot or hyphen between each letter of a term so light
// obfuscation ("b.a.d") is still caught. Whitespace is deliberately NOT a
// separator - allowing it masks across word gaps (e.g. "go ok" -> a slur).
function termPattern(term: string): RegExp {
    const body = term
        .split("")
        .map(ch => escape(ch))
        .join("[.-]?");
    return new RegExp(`\\b${body}\\b`, "gi");
}

export function maskTerms(text: string, terms: string[]): string {
    let out = text;
    for (const term of terms) {
        if (!term) continue;
        out = out.replace(termPattern(term), match => "*".repeat(match.length));
    }
    return out;
}

export function sanitize(text: string): string {
    return maskTerms(text, HATE_TERMS);
}
