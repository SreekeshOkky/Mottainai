# Mottainai

> *"Consider deeply before you acquire."*

**Mottainai** (もったいない) is a Japanese concept expressing regret over waste — the idea that every object has inherent value and should not be discarded or acquired carelessly. This app brings that philosophy into your shopping habits.

Mottainai is a **mindful purchasing decision tool** powered by a conversational AI. Instead of letting impulse drive your purchases, you add items you're tempted to buy, and an honest AI friend asks you the right questions — about need vs. want, real cost, alternatives, and use-case fit — before giving you a clear verdict: **Spend**, **Save**, or **Repair/Upgrade**.

---

## Features

- **Item List** — Add items you're considering buying; each gets its own AI consultation session.
- **Multi-turn AI Chat** — The AI engages in a focused 3–10 turn conversation, tailored to each specific item.
- **Location-aware Pricing** — Detects your currency via GPS geolocation (falls back to timezone, then INR) and quotes real local prices and alternatives accordingly.
- **Final Verdict** — The AI delivers a structured `buy` / `not_needed` / `repair` decision with plain-language reasoning.
- **Client-side Storage** — All items and chat history are stored locally in IndexedDB; no account or server-side database required.
- **Daily Reflection Limit** — Capped at 10 items per day to encourage intentional reflection, not list-dumping.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, CSS Modules, Tailwind CSS 4 |
| Icons | Lucide React |
| AI SDK | [Vercel AI SDK v6](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/react`) |
| LLM | [NVIDIA Nemotron-3 Super (120B)](https://openrouter.ai/) via OpenRouter |
| LLM Provider | `@openrouter/ai-sdk-provider` |
| Client Storage | [`idb`](https://github.com/jakearchibald/idb) (IndexedDB wrapper) |
| Schema Validation | Zod 4 |
| Geolocation | Browser Geolocation API + [BigDataCloud](https://www.bigdatacloud.com/) reverse geocode (no API key needed) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/) API key (free tier works)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/SreekeshOkky/mottainai.git
cd mottainai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# then edit .env.local and fill in your key

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Environment Variables

Create a `.env.local` file at the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## How It Works

1. **Add an item** — Type in something you're thinking of buying and hit *Reflect*.
2. **Chat with the AI** — A conversational assistant asks focused, item-specific questions across up to 10 turns. It probes need vs. want, real market price, budget alternatives, ownership cost, urgency, and emotion.
3. **Receive a verdict** — Once confident, the AI gives a clear `[SPEND]`, `[SAVE]`, or `[REPAIR/UPGRADE]` verdict with a one-sentence reason.
4. **Review your list** — All past decisions (with their reasoning) are saved locally and shown on the main list.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/route.ts   # Server-side OpenRouter API call & decision parsing
│   ├── page.tsx            # Main list UI
│   └── page.module.css     # Page styles
├── components/
│   └── ChatModal.tsx       # Multi-turn chat modal
└── lib/
    ├── currency.ts         # Geolocation → currency resolution
    └── db.ts               # IndexedDB schema, CRUD helpers, daily limit logic
```

---

## Philosophy

The app is intentionally minimal on the UI side — no accounts, no cloud sync, no data collection. Everything stays in your browser. The friction is in the *thinking*, not the interface.

---

## License

MIT
