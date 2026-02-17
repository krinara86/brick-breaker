# 🧱 Brick Breaker — AI Powered

A classic Brick Breaker game with AI features: generate levels from text descriptions, modify game settings with natural language, and get real-time AI commentary on your gameplay.

Built with Phaser 3, TypeScript, React, and HuggingFace AI.

---

## Prerequisites

You need these installed on your computer before starting. If you already have them, skip to **Setup**.

### 1. Node.js (v18 or newer)

Check if you have it:
```bash
node --version
```

If not installed, download from [nodejs.org](https://nodejs.org/) — pick the LTS version. On Mac you can also install via Homebrew:
```bash
brew install node
```

### 2. Git

Check if you have it:
```bash
git --version
```

If not installed: [git-scm.com/downloads](https://git-scm.com/downloads). On Mac:
```bash
xcode-select --install
```

### 3. A code editor

Any editor works. [VS Code](https://code.visualstudio.com/) and [IntelliJ IDEA](https://www.jetbrains.com/idea/) are both great.

---

## Setup (first time only)

### Step 1: Get the code

```bash
git clone <your-repo-url>
cd brick-breaker
```

Or if you have the tarball:
```bash
tar xzf brick-breaker.tar.gz
cd brick-breaker
```

### Step 2: Install dependencies

```bash
npm install
```

This downloads all the libraries the project needs. It takes a minute or two the first time.

### Step 3: Set up the AI features (optional)

The game works perfectly without this — you just won't have the AI chat features.

1. Create a free account at [huggingface.co](https://huggingface.co/join)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Click **New Token**, give it a name, click **Generate**
4. Copy the token (starts with `hf_`)
5. In the project folder, create a file called `.env`:

```bash
cp .env.example .env
```

6. Open `.env` in your editor and paste your token:

```
VITE_HF_API_KEY=hf_your_actual_token_here
VITE_HF_MODEL=Qwen/Qwen2.5-72B-Instruct
```

> **Important:** Never commit `.env` to git. It's already in `.gitignore` so this happens automatically.

### Step 4: Verify AI connection (optional)

```bash
node test-hf.mjs
```

You should see `✅ WORKING!`. If not, double-check your token in `.env`.

---

## Running the game

```bash
npm run dev
```

Open the URL it shows (usually http://localhost:5173) in your browser. That's it!

To stop the server: press `Ctrl+C` in the terminal.

> **Note:** After editing `.env`, you must restart `npm run dev` for changes to take effect.

---

## How to play

| Input | Action |
|-------|--------|
| **Mouse** | Move paddle |
| **← → or A D** | Move paddle (keyboard) |
| **Space** | Launch ball |
| **P** | Pause / Resume |
| **🤖 AI Panel** button | Open the AI chat panel |

### AI features (requires HuggingFace token)

Click the **🤖 AI Panel** button in the top right to open the AI chat panel. It has three tabs:

**⚙️ Config** — change game settings with natural language:
- `make the ball huge and slow`
- `tiny paddle, 5 lives, green background`
- `max speed, no particles`

**🧱 Levels** — describe a level and AI generates it:
- `a heart shape made of tough bricks`
- `spiral with explosives in the center`
- `fortress with power-ups behind walls`

**🎙️ Narrator** — AI commentates on your gameplay. Pick a personality:
- **GLaDOS** — passive-aggressive (Portal style)
- **Coach** — overenthusiastic sports coach
- **Pirate** — everything is about the sea
- **Noir** — hardboiled detective narration
- **Hype** — esports commentator

The narrator log appears as a strip below the game canvas.

---

## Running tests

```bash
npm test              # Run all unit tests
npm run test:watch    # Re-run tests on file changes
```

For manual UI tests, see `src/__tests__/UI_TEST_GUIDE.md`.

---

## Hosting on GitHub Pages

GitHub Pages hosts your game for free as a static website. Anyone with the link can play it.

### The API key question

**Your HuggingFace API key will be embedded in the built JavaScript bundle.** This means anyone who opens browser dev tools can find it. For a personal/learning project this is fine. Your options:

1. **Don't include it** — deploy without AI features. The game is fully playable without them. Just don't create a `.env` file before building.
2. **Include it** — accept that it's visible. Set a spending limit on your HuggingFace account to avoid surprises.
3. **Use a backend proxy** — beyond the scope of this project, but the proper production solution.

### Deploy step by step

#### First time setup

1. Create a GitHub repository at [github.com/new](https://github.com/new)
2. Connect your local project to it:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/brick-breaker.git
git branch -M main
git push -u origin main
```

3. If you want AI features in the deployed version, make sure `.env` exists with your key before building. If not, skip this.

4. Deploy:

```bash
npm run deploy
```

This builds the project and pushes the output to a `gh-pages` branch.

5. Go to your repo on GitHub → **Settings** → **Pages**
6. Under "Build and deployment", set:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **(root)**
7. Click **Save**

Your game will be live at `https://YOUR_USERNAME.github.io/brick-breaker/` within a few minutes.

#### Updating after changes

After making any changes, just run:

```bash
git add .
git commit -m "describe your changes"
git push
npm run deploy
```

---

## Project structure (for the curious)

```
brick-breaker/
├── src/
│   ├── game/            # Phaser game engine code
│   │   ├── scenes/      # Menu, Play, GameOver screens
│   │   └── api/         # GameCommandAPI — how UI and AI talk to the game
│   ├── llm/             # All AI integration
│   │   ├── client.ts    # HuggingFace API connection
│   │   ├── config-parser.ts   # "make ball fast" → game settings
│   │   ├── level-generator.ts # "heart shape" → brick layout
│   │   ├── flavor-text.ts     # Creative power-up descriptions
│   │   └── narrator.ts        # AI gameplay commentary
│   ├── ui/              # React interface (panels, buttons, HUD)
│   ├── types/           # TypeScript type definitions
│   └── __tests__/       # Tests
├── .env.example         # Template for your API key
├── test-hf.mjs          # Script to test your HuggingFace connection
├── package.json         # Dependencies and scripts
└── README.md            # You are here
```

---

## Troubleshooting

**`npm run dev` shows errors about missing modules**
→ Run `npm install` first.

**AI panel says "AI not configured"**
→ Create `.env` from `.env.example` and add your HuggingFace token. Restart `npm run dev`.

**AI commands return "Network error: Failed to fetch"**
→ Run `node test-hf.mjs` to diagnose. Usually means the token is wrong or missing.

**Keyboard moves the paddle when typing in the AI chat**
→ This is fixed in the latest version. Make sure you have the latest code.

**Game starts with no bricks**
→ This is fixed in the latest version. The level loads before the game starts.

**GitHub Pages shows a blank page**
→ Check that `vite.config.ts` has `base: './'`. Make sure you ran `npm run deploy`, not just `git push`.

---

## License

MIT
