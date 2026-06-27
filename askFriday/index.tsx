/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Aiden Smith
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addMessagePopoverButton, removeMessagePopoverButton } from "@api/MessagePopover";
import { insertTextIntoChatInputBox } from "@utils/discord";
import definePlugin, { PluginNative } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, DraftStore, DraftType, MessageStore, Toasts } from "@webpack/common";

import { buildGenerateOptions } from "./config";
import { buildPrompt } from "./prompt";
import { settings } from "./settings";

const Native = VencordNative.pluginHelpers.AskFriday as PluginNative<typeof import("./native")>;

// Discord's draft action creators — clearDraft empties the visible compose box.
const ChatInputActions = findByPropsLazy("clearDraft", "saveDraft");

// Remembers the last reply Friday dropped per channel, so a regenerate can wipe
// it first instead of stacking a second draft on top.
const lastDraft = new Map<string, string>();

function FridayIcon() {
    return (
        <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l1.9 4.6L18.5 8.5 13.9 10.4 12 15l-1.9-4.6L5.5 8.5 10.1 6.6 12 2zm6 11l.9 2.2 2.1.9-2.1.9L18 19l-.9-2.1L15 16l2.1-.9.9-2.1z" />
        </svg>
    );
}

function toast(message: string, type = Toasts.Type.MESSAGE) {
    Toasts.show({ message, id: Toasts.genId(), type });
}

const MAX_CTX_CHARS = 1000; // cap per message so the prompt can't balloon

// The N cached messages immediately before the target, oldest→newest, as the
// conversation leading up to it. Skips empty/system messages.
function gatherContext(message: any) {
    if (!settings.store.includeContext) return [];
    const count = settings.store.contextCount as number;
    if (!count) return [];

    const all = MessageStore.getMessages(message.channel_id)?._array ?? [];
    const idx = all.findIndex((m: any) => m.id === message.id);
    const end = idx === -1 ? all.length : idx; // messages strictly before target
    return all
        .slice(Math.max(0, end - count), end)
        .filter((m: any) => typeof m.content === "string" && m.content.trim())
        .map((m: any) => ({
            content: m.content.slice(0, MAX_CTX_CHARS),
            author: { username: m.author?.username },
        }));
}

async function handleClick(message: any) {
    toast("Friday is thinking…");

    const context = gatherContext(message);
    const { system, user } = buildPrompt(message, settings.store as any, context);
    const opts = buildGenerateOptions(settings.store as any, system, user);

    if (opts.authMode === "apikey" && !opts.apiKey) {
        toast(`Friday: set your ${opts.provider} API key in plugin settings`, Toasts.Type.FAILURE);
        return;
    }

    const res = await Native.generateReply(opts);
    if ("error" in res) {
        toast(res.error, Toasts.Type.FAILURE);
        return;
    }

    const text = res.text.trim();
    const channelId = message.channel_id;

    // Regenerate: if Friday's previous draft is still sitting in the box
    // untouched, clear it so the new reply replaces it rather than appending.
    const current = DraftStore.getDraft(channelId, DraftType.ChannelMessage) ?? "";
    if (current && current === lastDraft.get(channelId))
        ChatInputActions.clearDraft(channelId, DraftType.ChannelMessage);

    insertTextIntoChatInputBox(text);
    lastDraft.set(channelId, text);
}

export default definePlugin({
    name: "AskFriday",
    description: "Hover a message and ask AI (Friday) to draft a reply into your compose box. Desktop only.",
    authors: [{ name: "Aiden", id: 0n }],
    settings,
    dependencies: ["MessagePopoverAPI"],

    start() {
        addMessagePopoverButton("AskFriday", message => {
            if (!message?.content) return null; // skip empty / embed-only messages
            return {
                label: "Ask Friday",
                icon: FridayIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: () => handleClick(message),
            };
        }, FridayIcon);
    },

    stop() {
        removeMessagePopoverButton("AskFriday");
    },
});
