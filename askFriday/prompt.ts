/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface MessageLike {
    content: string;
    author?: { username?: string; };
}

export interface ToneView {
    tone: string;
    customTone: string;
    length: string;
    useEmojis: boolean;
    matchLanguage: boolean;
    extraInstructions: string;
}

/** Tone presets. `human` is false only for robotic — everything else gets the
 *  "sound like a real person" framing so replies don't read like AI. */
interface TonePreset { line: string; human: boolean; }

export const TONE_PRESETS: Record<string, TonePreset> = {
    human: { line: "Be a helpful, knowledgeable engineer helping out a peer — clear and genuinely useful, sounding human and natural while using correct technical terms where they fit. Don't dumb it down.", human: true },
    casual: { line: "Keep it casual and relaxed, like texting a friend. Lowercase is fine.", human: true },
    friendly: { line: "Be warm and friendly.", human: true },
    technical: { line: "Be technical and precise. Assume domain knowledge, use correct terminology, stay accurate.", human: true },
    professional: { line: "Stay professional and polished, but still natural.", human: true },
    witty: { line: "Be witty and a little playful.", human: true },
    concise: { line: "Be blunt and to the point — no fluff.", human: true },
    robotic: { line: "Reply in a formal, robotic, bot-like manner. Structured and impersonal.", human: false },
};

const LENGTH_LINES: Record<string, string> = {
    short: "Keep it to a sentence or two.",
    medium: "A short paragraph is fine.",
    long: "A few sentences to a full paragraph is fine.",
};

/**
 * ───────────────────────────────────────────────────────────────────────────
 * composeSystemPrompt — THE VOICE OF THE FEATURE (yours to tune)
 *
 * This string is what makes replies read like a real person typed them instead
 * of an AI. The mechanical fragments (tone/length/emoji/language/extra) are
 * assembled for you below; the framing sentences around them are the part worth
 * making your own. Tweak wording, ordering, the "rules" list — anything here.
 * ───────────────────────────────────────────────────────────────────────────
 */
function composeSystemPrompt(t: ToneView, hasContext: boolean): string {
    const isCustom = t.tone === "custom" && t.customTone.trim();
    const preset = TONE_PRESETS[t.tone] ?? TONE_PRESETS.human;
    const toneLine = isCustom ? t.customTone.trim() : preset.line;
    // Custom tones are treated as human unless they say otherwise; robotic opts out.
    const human = isCustom ? true : preset.human;

    const lines: string[] = [
        "You are helping me write a reply to a Discord message.",
        "Write the reply AS ME, in first person, ready to paste into the chat box.",
        hasContext
            ? "Recent channel messages are provided for context — use them for continuity if this is part of an ongoing conversation; otherwise just reply to the target message on its own."
            : "",
        toneLine,
        LENGTH_LINES[t.length] ?? LENGTH_LINES.short,
        t.useEmojis ? "Emojis are okay if they fit." : "Do not use emojis.",
        t.matchLanguage ? "Reply in the same language as the original message." : "",
        human ? "Sound like a real person — no corporate tone, no 'As an AI', no preamble." : "",
        "Output ONLY the reply text. No quotes, no labels, no explanation.",
        t.extraInstructions.trim(),
    ];
    return lines.filter(Boolean).join("\n");
}

export function buildPrompt(
    message: MessageLike,
    store: ToneView,
    context: MessageLike[] = [],
): { system: string; user: string; } {
    const system = composeSystemPrompt(store, context.length > 0);
    const who = message.author?.username ? `${message.author.username} said:` : "Someone said:";
    const target = `${who}\n"""\n${message.content}\n"""`;

    let convo = "";
    if (context.length) {
        const lines = context
            .map(m => `${m.author?.username ?? "someone"}: ${m.content}`)
            .join("\n");
        convo = `Recent conversation (oldest to newest):\n${lines}\n\n`;
    }

    const user = `${convo}The message I'm replying to:\n${target}\n\nWrite my reply.`;
    return { system, user };
}
