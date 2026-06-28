/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { RenderModalProps } from "@vencord/discord-types";
import { Button, Forms, Select, useState } from "@webpack/common";

import { generateReply } from "./index";
import { settings } from "./settings";

// Mirror the settings SELECT values. Labels kept short for the modal.
const TONE_OPTIONS = [
    { label: "Human (natural)", value: "human" },
    { label: "Casual", value: "casual" },
    { label: "Technical", value: "technical" },
    { label: "Friendly", value: "friendly" },
    { label: "Professional", value: "professional" },
    { label: "Witty", value: "witty" },
    { label: "Concise / blunt", value: "concise" },
    { label: "Robotic / bot-like", value: "robotic" },
    { label: "Enthusiastic", value: "enthusiastic" },
    { label: "Empathetic", value: "empathetic" },
    { label: "Formal", value: "formal" },
    { label: "Playful", value: "playful" },
    { label: "Dramatic", value: "dramatic" },
    { label: "Matter-of-fact", value: "matteroffact" },
    { label: "Encouraging", value: "encouraging" },
    { label: "Flirty", value: "flirty" },
    { label: "Custom (from settings)", value: "custom" },
];

const PERSONALITY_OPTIONS = [
    { label: "None", value: "none" },
    { label: "Warm mentor", value: "mentor" },
    { label: "Deadpan nerd", value: "nerd" },
    { label: "Hype gamer friend", value: "gamer" },
    { label: "Sarcastic / sardonic", value: "sarcastic" },
    { label: "Wholesome supportive", value: "wholesome" },
    { label: "Chaotic goblin", value: "goblin" },
    { label: "Cool / aloof", value: "aloof" },
    { label: "Geeky enthusiast", value: "enthusiast" },
    { label: "Stoic operator", value: "stoic" },
    { label: "Bubbly optimist", value: "optimist" },
    { label: "Dry British wit", value: "britwit" },
    { label: "Patient professor", value: "professor" },
    { label: "Custom (from settings)", value: "custom" },
];

const LENGTH_OPTIONS = [
    { label: "Short", value: "short" },
    { label: "Medium", value: "medium" },
    { label: "Long", value: "long" },
];

function StyleModal({ message, modalProps }: { message: any; modalProps: RenderModalProps; }) {
    const [toneV, setTone] = useState(settings.store.tone);
    const [persV, setPers] = useState(settings.store.personality);
    const [lenV, setLen] = useState(settings.store.length);

    return (
        <ModalRoot {...modalProps} size={ModalSize.SMALL}>
            <ModalHeader>
                <Forms.FormTitle tag="h2" style={{ margin: 0, flexGrow: 1 }}>Ask Friday</Forms.FormTitle>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent>
                <Forms.FormTitle>Tone</Forms.FormTitle>
                <Select options={TONE_OPTIONS} isSelected={v => v === toneV} select={v => setTone(v)} serialize={v => v} />
                <Forms.FormTitle style={{ marginTop: 16 }}>Personality</Forms.FormTitle>
                <Select options={PERSONALITY_OPTIONS} isSelected={v => v === persV} select={v => setPers(v)} serialize={v => v} />
                <Forms.FormTitle style={{ marginTop: 16 }}>Length</Forms.FormTitle>
                <Select options={LENGTH_OPTIONS} isSelected={v => v === lenV} select={v => setLen(v)} serialize={v => v} />
            </ModalContent>
            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    onClick={() => {
                        generateReply(message, { tone: toneV, personality: persV, length: lenV });
                        modalProps.onClose();
                    }}
                >
                    Generate
                </Button>
                <Button color={Button.Colors.PRIMARY} look={Button.Looks.LINK} onClick={modalProps.onClose}>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export function openStyleModal(message: any) {
    openModal(props => <StyleModal message={message} modalProps={props} />);
}
