/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { Menu } from "@webpack/common";

import { openStyleModal } from "./styleModal";

const patch: NavContextMenuPatchCallback = (children, props: any) => {
    const message = props?.message;
    if (!message?.content) return;

    children.push(
        <Menu.MenuItem
            id="ask-friday-as"
            label="Ask Friday as..."
            action={() => openStyleModal(message)}
        />
    );
};

export function addFridayContextMenu() {
    addContextMenuPatch("message", patch);
}

export function removeFridayContextMenu() {
    removeContextMenuPatch("message", patch);
}
