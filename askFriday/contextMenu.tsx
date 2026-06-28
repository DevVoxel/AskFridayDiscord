/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { Menu } from "@webpack/common";

import { generateReply } from "./index";
import { PERSONALITY_PRESETS, TONE_PRESETS } from "./prompt";

// Human-readable labels for the menu. Keys must match the preset keys.
const TONE_LABELS: Record<string, string> = {
    human: "Human", casual: "Casual", technical: "Technical", friendly: "Friendly",
    professional: "Professional", witty: "Witty", concise: "Concise", robotic: "Robotic",
    enthusiastic: "Enthusiastic", empathetic: "Empathetic", formal: "Formal", playful: "Playful",
    dramatic: "Dramatic", matteroffact: "Matter-of-fact", encouraging: "Encouraging", flirty: "Flirty",
};

const PERSONALITY_LABELS: Record<string, string> = {
    mentor: "Warm mentor", nerd: "Deadpan nerd", gamer: "Hype gamer friend",
    sarcastic: "Sarcastic", wholesome: "Wholesome", goblin: "Chaotic goblin",
    aloof: "Cool / aloof", enthusiast: "Geeky enthusiast", stoic: "Stoic operator",
    optimist: "Bubbly optimist", britwit: "Dry British wit", professor: "Patient professor",
};

// Length keys match the `length` setting values read by the prompt builder.
const LENGTH_OPTIONS = [
    { value: "short", label: "Short" },
    { value: "medium", label: "Medium" },
    { value: "long", label: "Long" },
];

const patch: NavContextMenuPatchCallback = (children, props: any) => {
    const message = props?.message;
    if (!message?.content) return;

    children.push(
        <Menu.MenuItem id="ask-friday-as" label="Ask Friday as">
            <Menu.MenuItem id="ask-friday-tone" label="Tone">
                {Object.keys(TONE_PRESETS).map(value => (
                    <Menu.MenuItem
                        id={`ask-friday-tone-${value}`}
                        key={`tone-${value}`}
                        label={TONE_LABELS[value] ?? value}
                        action={() => generateReply(message, { tone: value })}
                    />
                ))}
            </Menu.MenuItem>
            <Menu.MenuItem id="ask-friday-personality" label="Personality">
                {Object.keys(PERSONALITY_PRESETS).map(value => (
                    <Menu.MenuItem
                        id={`ask-friday-personality-${value}`}
                        key={`personality-${value}`}
                        label={PERSONALITY_LABELS[value] ?? value}
                        action={() => generateReply(message, { personality: value })}
                    />
                ))}
            </Menu.MenuItem>
            <Menu.MenuItem id="ask-friday-length" label="Length">
                {LENGTH_OPTIONS.map(({ value, label }) => (
                    <Menu.MenuItem
                        id={`ask-friday-length-${value}`}
                        key={`length-${value}`}
                        label={label}
                        action={() => generateReply(message, { length: value })}
                    />
                ))}
            </Menu.MenuItem>
            <Menu.MenuItem
                id="ask-friday-reroll"
                label="Quick re-roll (current style)"
                action={() => generateReply(message)}
            />
        </Menu.MenuItem>
    );
};

export function addFridayContextMenu() {
    addContextMenuPatch("message", patch);
}

export function removeFridayContextMenu() {
    removeContextMenuPatch("message", patch);
}
