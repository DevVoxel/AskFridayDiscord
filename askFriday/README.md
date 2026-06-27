# AskFriday

Vencord userplugin. Hover any Discord message → **Ask Friday** button → an LLM
drafts a casual, human-sounding reply and drops it into your compose box for you
to review and send.

> **Desktop / Vesktop only.** Requests go through the plugin's `native.ts` (the
> Electron main process) to dodge browser CORS. Web Vencord has no native side
> and can't reach OpenAI/Gemini.

## Features

- Message-hover button that drafts a reply to that message.
- Three providers: **Anthropic (Claude)**, **OpenAI (ChatGPT)**, **Google (Gemini)**.
- Two auth modes:
  - **API key (BYOK)** — pay-per-token. Official and stable.
  - **Local CLI** — uses your *subscription* via the official CLI's own OAuth
    login (`claude`, `codex`, `gemini`). Safe and sanctioned (no token handling,
    no scraping). Slower (spawns a process) and counts against your subscription.
- Tone controls: tone (casual/friendly/professional/witty/concise/custom),
  length, emojis on/off, match-language, and free-form extra instructions.

## Install

```bash
git clone https://github.com/Vendicated/Vencord && cd Vencord
pnpm install --frozen-lockfile

mkdir -p src/userplugins
ln -s /home/meal/projects/AskFridayDiscord/askFriday src/userplugins/askFriday
# (or copy the askFriday/ folder in)

pnpm build
pnpm inject     # pick Vesktop / your desktop Discord
# fully quit and reopen the client
```

Then **Settings → Vencord → Plugins → AskFriday** → enable → open the cog and
configure provider, key (or CLI), and tone.

## Auth modes

### API key
Paste a key for the active provider. Keys are stored in **plaintext** in Vencord
settings — use a scoped/limited key.

### Local CLI (subscription)
Set auth mode to *Local CLI* and log the relevant CLI in first, e.g.:
```bash
claude /login      # Claude Pro/Max
codex login        # ChatGPT subscription
gemini             # Google login
```
The plugin shells out to the already-logged-in CLI; it never reads a token.
This is the safe way to use a subscription — **not** web session scraping, which
violates ToS and risks bans (and is intentionally not implemented here).

## Layout

| File | Role |
|------|------|
| `index.tsx` | plugin def, hover button, click flow, insert into compose box |
| `settings.tsx` | `definePluginSettings`: provider, keys, models, tone |
| `config.ts` | settings store → `GenerateOptions` (pure, tested) |
| `prompt.ts` | `buildPrompt()` — the reply persona/voice (pure, tested) |
| `native.ts` | Node-side HTTP calls + CLI spawning (CORS-free) |
| `providers.ts` | shared types + model lists |
| `pure.test.ts` | tests for the Vencord-free modules |

## Test

```bash
npx tsx --test askFriday/pure.test.ts
```

## Notes / limits

- Provider model ids drift; the model dropdowns plus a custom-model override
  keep you unstuck.
- Local-CLI mode needs the CLI installed and logged in; errors surface as toasts.
- Personal userplugin — official Vencord doesn't accept AI/API-key plugins, so
  there's no upstream PR.
