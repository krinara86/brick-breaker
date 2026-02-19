# Brick Breaker — Codebase Overview

## Project Overview

An **AI-powered Brick Breaker game** built with **Phaser 3** (game engine), **React** (UI), **TypeScript**, and **Vite**. It integrates HuggingFace's LLM API to let users generate levels from text descriptions, tweak game settings with natural language, and get real-time AI commentary during gameplay.

---

## Architecture

```
┌──────────────────────────────────────────┐
│         React UI Layer                   │
│  (App, ChatPanel, Narrator, StatusBar)   │
└──────────────────┬───────────────────────┘
                   │ callbacks / state
                   ▼
┌──────────────────────────────────────────┐
│     GameCommandAPI (Singleton)           │
│  Central entry point for all mutations   │
└──────────────────┬───────────────────────┘
                   │ EventBus
          ┌────────┼────────┐
          ▼        ▼        ▼
     Phaser     LLM       Event
     Scenes    Module    Subscribers
```

Key design patterns: **Command Pattern** (GameCommandAPI), **Event Bus** (typed, decoupled communication), **Singletons** for shared services.

---

## Directory Structure

```
src/
├── game/
│   ├── scenes/
│   │   ├── BootScene.ts       # Procedurally generates all textures (no external assets)
│   │   ├── MenuScene.ts       # Animated start screen
│   │   ├── PlayScene.ts       # Main gameplay (~800 lines) — custom physics, collisions, power-ups
│   │   └── GameOverScene.ts
│   ├── api/
│   │   └── GameCommandAPI.ts  # Sole mutation interface for game state
│   └── index.ts               # Game factory (800x600, Phaser AUTO renderer)
├── llm/
│   ├── client.ts              # HuggingFace API wrapper (OpenAI-compatible)
│   ├── level-generator.ts     # Natural language → LevelSpec JSON
│   ├── config-parser.ts       # Natural language → ConfigPatch JSON
│   ├── narrator.ts            # Event-driven AI commentary (6 personalities)
│   └── prompts/index.ts       # System prompts & templates
├── ui/
│   ├── App.tsx                # Main container, Phaser lifecycle, React state
│   ├── components/
│   │   ├── ChatPanel.tsx      # 3-tab AI control panel (Config / Levels / Narrator)
│   │   ├── NarratorSidebar.tsx# Live commentary feed
│   │   └── StatusBar.tsx      # Score, level, combo, LLM status
├── types/
│   ├── level.ts               # LevelSpec, BrickType, PowerUpType + 5 built-in levels
│   ├── config.ts              # GameConfig, ConfigPatch, validation ranges
│   ├── events.ts              # Typed EventBus with 20+ event types
│   └── stats.ts               # GameStats interface
└── __tests__/                 # Vitest unit tests
```

---

## Game Logic (PlayScene.ts)

- **Custom physics** — no Phaser physics engine; manual velocity-based movement with AABB and circle-rect collision detection
- **5 brick types**: Standard, Multi-hit, Indestructible, PowerUp, Explosive (destroys 3x3 area)
- **9 power-ups**: MultiBall, WidePaddle, NarrowPaddle, FastBall, SlowBall, Laser, StickyPaddle, ExtraLife, FireBall
- **Combo system**: Incremented on each brick destroy, resets after 2s timeout, score multiplier
- **All graphics are procedurally generated** in BootScene (no image assets)

---

## AI Integration (3 systems)

| System | Input | Output | Temperature |
|--------|-------|--------|-------------|
| **Level Generator** | "a heart shape of tough bricks" | LevelSpec JSON | 0.5 (creative) |
| **Config Parser** | "make the ball huge and slow" | ConfigPatch JSON | 0.2 (precise) |
| **Narrator** | Buffered game events | Free-form commentary | 0.9 (very creative) |

- All LLM outputs are **validated and clamped** to safe ranges before use
- 6 narrator personalities: GLaDOS, Coach, Pirate, Noir, Hype, Custom
- Rate-limited (1s between API calls), with fallback text when LLM unavailable

---

## React UI

- **ChatPanel**: 3 tabs — modify config via NL, generate levels via NL, switch narrator personality
- **NarratorSidebar**: Scrollable commentary feed with opacity fade on older messages
- **StatusBar**: Score, level, combo, LLM connection status
- Dark theme with purple accents

---

## Config & Build

- **Vite** dev server + production build
- **TypeScript** strict mode
- **Vitest** + jsdom for unit tests
- HuggingFace API key configured via `.env` (`VITE_HF_API_KEY`)
- `npm run deploy` builds and pushes to GitHub Pages
