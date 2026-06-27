# AskFriday

Vencord userplugin. Hover any Discord message → **Ask Friday** button → an LLM
drafts a human-sounding reply (using the surrounding conversation as context) and
drops it into your compose box for you to review, edit, and send.

> **Desktop / Vesktop only.** Requests go through the plugin's `native.ts` (the
> Electron main process) to dodge browser CORS. Web Vencord has no native side
> and can't reach OpenAI/Gemini.

## Features

- Message-hover button that drafts a reply to that message.
- **Conversation-aware** - feeds the recent messages around the target (before
  *and* after, when they exist) so replies follow the thread.
- Three providers: **Anthropic (Claude)**, **OpenAI (ChatGPT)**, **Google (Gemini)**.
- Two auth modes:
  - **API key (BYOK)** - pay-per-token. Official and stable.
  - **Local CLI** - uses your *subscription* via the official CLI's own OAuth
    login (`claude`, `codex`, `gemini`). Safe and sanctioned (no token handling,
    no scraping). Slower (spawns a process) and counts against your subscription.
- **Tone controls** - human / casual / technical / friendly / professional /
  witty / concise / robotic / custom, plus length, emojis, match-language, and
  free-form extra instructions.
- **Regenerate** - click again to replace Friday's previous (untouched) draft
  instead of stacking a second one.

---

## Install

Friday rides inside Vencord, which rides inside desktop Discord / Vesktop. You
build Vencord from source with this plugin folder dropped in.

### Prerequisites
- [Node.js](https://nodejs.org) 18+ and [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- [Git](https://git-scm.com)
- Desktop Discord or [Vesktop](https://github.com/Vencord/Vesktop) (not the browser)

### Steps

```bash
# 1. get a Vencord source tree
git clone https://github.com/Vendicated/Vencord && cd Vencord
pnpm install --frozen-lockfile

# 2. drop AskFriday into userplugins (COPY, don't symlink - a symlink to a path
#    outside the tree breaks Vencord's @api/@utils path aliases at build time)
mkdir -p src/userplugins
cp -r /path/to/AskFridayDiscord/askFriday src/userplugins/askFriday

# 3. build + inject into your client
pnpm build
pnpm inject     # arrow-key pick Vesktop / your desktop Discord, Enter
```

Fully quit Discord (tray included) and reopen it. Then
**User Settings → Vencord → Plugins → search "AskFriday" → toggle on → click the
cog** to configure.

> Updating the plugin later: re-`cp` the folder, `pnpm build`, restart Discord.

---

## Configure

Open the AskFriday cog (Plugins page). Settings:

### Provider & auth
| Setting | What it does |
|---------|--------------|
| **Which AI to ask** | Anthropic / OpenAI / Gemini |
| **How to authenticate** | `API key` or `Local CLI` (subscription) |
| **<provider> API key** | shown in API-key mode - stored **plaintext**, use a scoped key |
| **Model** | per-provider dropdown; **Custom model id** overrides it |
| **CLI binary path** | shown in Local-CLI mode - blank = `claude`/`codex`/`gemini` on PATH |

### Tone & shape
| Setting | What it does |
|---------|--------------|
| **Reply tone** | `Human (natural)` default - a helpful, knowledgeable engineer using correct technical terms. Also casual, technical, friendly, professional, witty, concise, robotic/bot-like, or **custom** |
| **Custom tone** | free-text tone (used when tone = Custom) |
| **Reply length** | short / medium / long |
| **Allow emojis** | on/off |
| **Reply in the same language** | mirror the original message's language |
| **Extra instructions** | appended to every prompt |

### Conversation context
| Setting | What it does |
|---------|--------------|
| **Feed recent channel messages as context** | on by default - gives Friday the thread around the message so replies follow the conversation |
| **How many recent messages** | slider: `0 / 5 / 10 / 15 / 20` (default **15**) - the lead-up count; up to 5 follow-up messages are added automatically when the target isn't the latest |

Context is read from Discord's in-memory message cache (whatever's loaded in the
channel) - no extra network fetch. The model is told to use it only when the
message is part of an ongoing conversation, otherwise reply on its own.

---

## Using it

1. Hover a message in any channel.
2. Click the sparkle **Ask Friday** button in the hover toolbar.
3. Toast: *"Friday is thinking…"* → ~1–3s later the reply lands in your compose
   box (CLI mode is slower).
4. **Not sent.** Read / edit / regenerate (click again) → press Enter yourself.

### Auth modes in detail

**API key** - paste a key for the active provider. Plaintext in settings; use a
scoped/limited key.

**Local CLI (subscription)** - log the relevant CLI in first:
```bash
claude /login      # Claude Pro/Max
codex login        # ChatGPT subscription
gemini             # Google login
```
The plugin shells out to the already-logged-in CLI; it never reads a token. This
is the safe way to use a subscription - **not** web session scraping, which
violates ToS and risks bans (intentionally not implemented here).

---

## Develop / test

Pure logic (prompt building, settings → request mapping) is Vencord-free and unit
tested:
```bash
npx tsx --test askFriday/pure.test.ts
```

End-to-end provider smoke test with your own keys (runs the real `native.ts`
calls, outside Discord):
```bash
# API-key mode
ANTHROPIC_API_KEY=sk-ant-... OPENAI_API_KEY=sk-... GEMINI_API_KEY=AIza... \
  npx tsx askFriday/smoke.ts

# subscription / local-CLI mode (log the CLIs in first)
FRIDAY_CLI=1 npx tsx askFriday/smoke.ts
```

## Layout

| File | Role |
|------|------|
| `index.tsx` | plugin def, hover button, context gathering, draft insert/replace |
| `settings.tsx` | `definePluginSettings`: provider, keys, models, tone, context |
| `config.ts` | settings store → `GenerateOptions` (pure, tested) |
| `prompt.ts` | `buildPrompt()` - persona/voice + conversation context (pure, tested) |
| `native.ts` | Node-side HTTP calls + CLI spawning (CORS-free) |
| `providers.ts` | shared types + model/CLI tables |
| `pure.test.ts` | tests for the Vencord-free modules |
| `smoke.ts` | live provider smoke test (uses your keys) |

## Notes / limits

- Context only includes messages already loaded in the channel's cache; Friday
  doesn't fetch history over the network.
- Provider model ids drift; the model dropdowns plus a custom-model override keep
  you unstuck.
- Local-CLI mode needs the CLI installed and logged in; errors surface as toasts.
- Personal userplugin - official Vencord doesn't accept AI/API-key plugins, so
  there's no upstream PR.
