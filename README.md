# 🧱 Brick Breaker — AI Powered

A Brick Breaker game built with Phaser 3, TypeScript, and React, featuring four LLM-powered features via HuggingFace Inference API.

Built as an architectural learning project exploring modern game architecture patterns, typed event systems, and LLM integration as a structured command layer.

---

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd brick-breaker

# Install dependencies
npm install

# (Optional) Set up AI features
cp .env.example .env
# Edit .env and add your HuggingFace API key

# Run development server
npm run dev
```

Open http://localhost:5173 in your browser.

> **Note:** The game is fully playable without an API key. AI features will show fallback behavior.

---

## HuggingFace API Key Setup

1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens → New Token
3. Copy the token
4. Create a `.env` file in the project root:

```
VITE_HF_API_KEY=hf_your_token_here
VITE_HF_MODEL=mistralai/Mistral-7B-Instruct-v0.3
```

> **Security note:** The API key is embedded in the built JS bundle. This is fine for a personal/learning project. For production, use a backend proxy.

---

## Controls

| Input | Action |
|-------|--------|
| Mouse | Move paddle |
| ← → / A D | Move paddle (keyboard) |
| Space | Launch ball |
| P | Pause/Resume |
| 🤖 AI Panel button | Open AI chat panel |

---

## 🤖 AI Features

The game integrates four LLM-powered features, all following the **LLM-as-command-emitter** pattern: the LLM generates structured JSON, the game's internal API executes it.

### 1. Chat-to-Config (⚙️ Config tab)
Type natural language to modify game settings. The LLM parses your input into a typed `ConfigPatch` JSON object, which is validated and applied.

**Examples:**
- `"make the ball huge and slow"`
- `"5 lives, fast paddle, red background"`
- `"tiny ball, max speed, no particles"`

### 2. Level Generator (🧱 Levels tab)
Describe a level in words and the LLM generates a `LevelSpec` JSON with brick positions, types, and properties.

**Examples:**
- `"a heart shape made of tough bricks"`
- `"spiral pattern with explosives in the center"`
- `"fortress with indestructible walls protecting power-ups"`

### 3. Dynamic Narrator (🎙️ Narrator tab)
An AI personality that commentates on your gameplay. Select from:
- **GLaDOS** — passive-aggressive testing commentary
- **Coach** — overenthusiastic sports coach
- **Pirate** — everything is about the sea
- **Noir** — hardboiled detective narration
- **Hype** — esports commentator

### 4. Power-Up Flavor Text
Power-ups get dynamically generated names and descriptions. Results are cached so the API is only called once per power-up type.

---

## Architecture

### Core Pattern: Typed Internal Game API

```
  UI (React)  ←→  Game Command API  ←→  Phaser Game
  LLM Layer   ←→  Game Command API  ←→  Phaser Game
```

The `GameCommandAPI` is the single entry point for all game mutations. Neither the UI nor the LLM layer ever touches Phaser internals directly.

### Key Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| **Typed Event Bus** | `src/types/events.ts` | Decoupled pub/sub — physics emits, audio/particles/scoring subscribe |
| **Command Pattern** | `src/game/api/GameCommandAPI.ts` | Single entry point for all mutations |
| **Adapter Pattern** | `src/llm/*.ts` | LLM JSON → validated typed commands → game API |
| **State Machine** | Phaser Scenes | Boot → Menu → Play → GameOver |
| **Schema-as-Contract** | `src/types/` | Same TypeScript interfaces constrain both game logic and LLM prompts |
| **Observer Pattern** | React subscriptions via callbacks | React UI reacts to game state changes |

### Project Structure

```
src/
├── game/               # Phaser game (zero React dependency)
│   ├── scenes/         # BootScene, MenuScene, PlayScene, GameOverScene
│   ├── api/            # GameCommandAPI — the typed command interface
│   └── index.ts        # Phaser game factory
├── llm/                # All LLM integration
│   ├── client.ts       # HuggingFace API wrapper
│   ├── prompts/        # System prompts with schema definitions
│   ├── level-generator.ts  # NL → LevelSpec JSON
│   ├── config-parser.ts    # NL → ConfigPatch JSON
│   ├── flavor-text.ts      # Stats → creative text (cached)
│   └── narrator.ts         # Event stream → personality commentary
├── ui/                 # React shell
│   ├── App.tsx         # Root component, Phaser mounting
│   ├── App.css         # All styles
│   └── components/     # ChatPanel, StatusBar, NarratorOverlay
├── types/              # Shared TypeScript interfaces
│   ├── level.ts        # LevelSpec, BrickDef, BrickType, PowerUpType
│   ├── config.ts       # GameConfig, ConfigPatch, validation
│   ├── stats.ts        # GameStats
│   └── events.ts       # EventBus, typed GameEventMap
└── __tests__/
    ├── unit/           # Vitest unit tests
    └── UI_TEST_GUIDE.md # Manual test checklist
```

---

## Testing

### Unit Tests (automated)

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

Tests cover:
- **EventBus** — subscription, unsubscription, error handling
- **Config System** — patching, clamping, immutability
- **Level System** — built-in level validity, LevelSpec structure
- **GameCommandAPI** — config management, stats tracking, game flow
- **LevelGenerator** — validation, sanitization, edge cases (mocked API)

### UI Tests (manual)

See [`src/__tests__/UI_TEST_GUIDE.md`](src/__tests__/UI_TEST_GUIDE.md) for a comprehensive 35-test checklist covering all game mechanics, AI features, and edge cases.

---

## Deployment to GitHub Pages

```bash
# Build and deploy
npm run deploy
```

This builds the project and pushes to the `gh-pages` branch. Configure GitHub Pages to serve from that branch in your repo settings.

---

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Game Engine | Phaser 3 | Physics, rendering, input, scenes |
| Language | TypeScript (strict) | Type safety, interface-driven design |
| UI Shell | React 18 | Menus, chat panel, HUD overlays |
| Build | Vite | Fast builds, .env handling, HMR |
| LLM | HuggingFace Inference API | Text generation for AI features |
| Testing | Vitest | Unit and integration tests |
| Hosting | GitHub Pages | Free static hosting |

---

## Brick Types

| Type | Color | Behavior |
|------|-------|----------|
| Standard | Blue | 1 hit to destroy |
| Multi-Hit | Red → Orange → Yellow | Changes color per hit, 2-4 hits |
| Indestructible | Grey (bordered) | Cannot be destroyed |
| Power-Up | Green (bordered) | Drops power-up when destroyed |
| Explosive | Purple (bordered) | Destroys all adjacent bricks |

## Power-Up Types

| Type | Effect | Duration |
|------|--------|----------|
| MultiBall | Spawns 2 extra balls | Permanent |
| Wide Paddle | Paddle 50% wider | 10 seconds |
| Narrow Paddle | Paddle 40% narrower | 8 seconds |
| Fast Ball | Ball 40% faster | 8 seconds |
| Slow Ball | Ball 30% slower | 8 seconds |
| Laser | Auto-fires laser shots | 8 seconds |
| Sticky Paddle | Next hit catches ball | Single use |
| Extra Life | +1 life | Permanent |
| Fire Ball | Ball passes through bricks | 8 seconds |

---

## License

MIT
