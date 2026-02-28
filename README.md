# FutureSpend — HYDE MODE

> Turn chaotic multi-calendar life into predictive spending insights — reinforced by gamification and peer engagement.

Built for the **RBC SFU Mountain Madness 2026** hackathon challenge.

---

## Features

| Feature | Description |
|---|---|
| **Multi-Calendar Event Board** | Work / Personal / Family / Social / Health events with social pressure slider |
| **AI Event Scanner (Jekyll vs Hyde)** | Paste any event → get cost breakdown + two personality responses |
| **Hyde-O-Meter** | Dramatic gauge tracking total predicted spend for next 7 days |
| **Savings Strategies** | 3–5 actionable suggestions tied to upcoming events |
| **Gamification** | Jekyll Streak (days under budget), Friends Leaderboard, Spending Challenges |

---

## Tech Stack

- **Vite 7** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Lucide React** (icons)
- **localStorage** for persistence — zero backend
- **No API calls** — predictions are smart deterministic keyword-based estimates

---

## Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

App runs at `http://localhost:5173` by default.

---

## Vercel Deployment

Zero config — just connect the repo to Vercel. It detects Vite automatically.

Or deploy via CLI:

```bash
npm i -g vercel
vercel
```

---

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Sticky nav with compact Hyde-O-Meter + streak
│   ├── HydeOMeter.tsx      # SVG gauge — calm → critical mode
│   ├── JekyllStreak.tsx    # Days-under-budget streak tracker
│   ├── EventBoard.tsx      # Calendar event list, tabbed by category
│   ├── EventCard.tsx       # Individual event with cost preview
│   ├── AddEventModal.tsx   # Add/edit event modal
│   ├── Scanner.tsx         # AI event scanner page
│   ├── SavingsStrategies.tsx # Actionable savings recommendations
│   └── Leaderboard.tsx     # Friends ranking + challenges
├── data/
│   └── mockData.ts         # Seed events + mock friends
├── hooks/
│   └── useLocalStorage.ts  # Persistent state hook
├── types/
│   └── index.ts            # Shared TypeScript types
└── utils/
    ├── predictions.ts      # Keyword-based cost prediction engine
    └── personalities.ts    # Jekyll & Hyde response generator
```

---

## How the Prediction Engine Works

No API. All deterministic:

1. **Keyword scan** — matches event title against patterns (bar, coffee, concert, shopping…)
2. **Base costs** — food, transport, activities buckets assigned per pattern
3. **Social pressure multiplier** — 0–100% slider adds up to 0.75× overhead
4. **Category risk multiplier** — Social = 1.4×, Family = 1.15×, Health = 0.9×
5. **Jekyll/Hyde personalities** — template-selected by event type + cost level

---

## Critical Mode

When predicted spend exceeds 75% of the $120 weekly budget:
- Hyde-O-Meter pulses red
- Subtle screen shake animation activates
- Red vignette overlay appears
- "Damage Control" panel shows 3 emergency suggestions

---

*RBC SFU Mountain Madness 2026 — All predictions are deterministic estimates for educational demonstration.*
