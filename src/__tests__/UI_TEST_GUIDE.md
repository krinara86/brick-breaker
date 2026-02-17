# UI Test Guide — Manual & Visual Tests

This document describes how to manually verify each feature of the Brick Breaker game.
Run `npm run dev` and open the browser to test each scenario.

---

## 1. Core Game Loop

### TEST 1.1: Game starts from menu
- **Steps**: Open the app → see "BRICK BREAKER" title → click "START GAME"
- **Expected**: Transitions to play scene, ball sits on paddle, bricks visible
- **Pass criteria**: Canvas shows paddle at bottom, ball attached, brick grid at top

### TEST 1.2: Ball launches
- **Steps**: Press SPACE
- **Expected**: Ball launches upward at slight angle, moves freely
- **Pass criteria**: Ball detaches from paddle and moves

### TEST 1.3: Paddle movement (keyboard)
- **Steps**: Use LEFT/RIGHT arrow keys or A/D
- **Expected**: Paddle moves smoothly, clamped to screen edges
- **Pass criteria**: Paddle stops at left/right walls

### TEST 1.4: Paddle movement (mouse)
- **Steps**: Move mouse left and right
- **Expected**: Paddle follows mouse X position
- **Pass criteria**: Paddle tracks mouse accurately

### TEST 1.5: Ball-wall bouncing
- **Steps**: Launch ball → observe wall collisions
- **Expected**: Ball bounces off left, right, and top walls
- **Pass criteria**: Ball reverses direction appropriately at each wall

### TEST 1.6: Ball-paddle bouncing
- **Steps**: Let ball fall toward paddle → intercept it
- **Expected**: Ball bounces upward. Angle varies based on where it hits the paddle (center = straight up, edges = angled)
- **Pass criteria**: Ball behavior changes based on paddle hit position

### TEST 1.7: Ball lost
- **Steps**: Let ball pass below the paddle
- **Expected**: "Ball Lost!" message, life decremented, ball resets to paddle
- **Pass criteria**: Lives counter decreases, ball returns to start position

### TEST 1.8: Game over
- **Steps**: Lose all lives
- **Expected**: "GAME OVER" message → transition to Game Over screen with stats
- **Pass criteria**: Score, level, bricks destroyed, max combo all displayed

---

## 2. Brick System

### TEST 2.1: Standard brick destruction
- **Steps**: Hit a standard (blue) brick with the ball
- **Expected**: Brick disappears, particles emit, score increases
- **Pass criteria**: Brick removed, score updates in HUD

### TEST 2.2: Multi-hit bricks
- **Steps**: Advance to Level 2 ("Fortress") → hit a red/orange brick
- **Expected**: Brick changes color per hit (red → orange → yellow), then destroys
- **Pass criteria**: Color transitions visible, brick takes 2-3 hits

### TEST 2.3: Indestructible bricks
- **Steps**: In Level 2, hit a grey brick with border
- **Expected**: Ball bounces off, brick flashes but does NOT destroy
- **Pass criteria**: Brick remains, visual feedback on hit

### TEST 2.4: Explosive bricks
- **Steps**: In Level 3 ("Diamond"), hit a purple brick in the center
- **Expected**: Brick destroys, then all adjacent bricks also destroy (chain reaction)
- **Pass criteria**: Multiple bricks destroyed from single hit, particles everywhere

### TEST 2.5: Level completion
- **Steps**: Destroy all destructible bricks
- **Expected**: "Level Complete!" message → next level loads
- **Pass criteria**: New brick layout appears, level counter increments

---

## 3. Power-Ups

### TEST 3.1: Power-up drops
- **Steps**: Destroy a green-bordered brick
- **Expected**: Small colored rectangle falls from the brick's position
- **Pass criteria**: Power-up drop visible, falls downward at steady pace

### TEST 3.2: MultiBall collection
- **Steps**: Catch a cyan power-up drop
- **Expected**: 2 additional balls spawn from paddle area
- **Pass criteria**: 3 balls in play simultaneously

### TEST 3.3: Wide paddle
- **Steps**: Catch a green power-up drop
- **Expected**: Paddle becomes 50% wider for ~10 seconds, then returns to normal
- **Pass criteria**: Visible paddle width change, reverts after timer

### TEST 3.4: Laser mode
- **Steps**: Catch a purple/pink power-up (laser)
- **Expected**: Paddle turns purple, auto-fires laser shots upward. Lasers destroy bricks on contact
- **Pass criteria**: Laser projectiles visible, bricks destroyed by lasers

### TEST 3.5: Fire ball
- **Steps**: Catch an orange power-up
- **Expected**: Ball turns orange, passes through bricks without bouncing
- **Pass criteria**: Ball visually changes, destroys multiple bricks in a line

---

## 4. Scoring & Combos

### TEST 4.1: Basic scoring
- **Steps**: Destroy bricks, watch score
- **Expected**: Score increases by base points (10) per brick
- **Pass criteria**: Score updates in real-time in HUD

### TEST 4.2: Combo system
- **Steps**: Destroy bricks rapidly (within 2 seconds of each other)
- **Expected**: "Combo x2", "Combo x3" etc. appears, bonus points added
- **Pass criteria**: Combo text visible, score accelerates during combos

### TEST 4.3: Combo break
- **Steps**: Stop hitting bricks for 2+ seconds
- **Expected**: Combo counter resets, combo text disappears
- **Pass criteria**: Combo resets to 0

---

## 5. Pause & Game Flow

### TEST 5.1: Pause
- **Steps**: Press P during gameplay
- **Expected**: "PAUSED" message, all movement stops
- **Pass criteria**: Ball frozen, paddle frozen, game halted

### TEST 5.2: Resume
- **Steps**: Press P while paused
- **Expected**: Game resumes from exact state
- **Pass criteria**: Ball continues from paused position and velocity

---

## 6. AI Panel — Chat-to-Config

### TEST 6.1: Open AI panel
- **Steps**: Click "🤖 AI Panel" button in header
- **Expected**: Side panel opens with tabs (Config, Levels, Narrator)
- **Pass criteria**: Panel visible, tabs clickable

### TEST 6.2: Config change (with API key)
- **Steps**: In Config tab, type "make the ball huge and slow"
- **Expected**: "Parsing config change..." → applied message with values → game updates
- **Pass criteria**: Ball visually larger, moves slower

### TEST 6.3: Config change (without API key)
- **Steps**: Run without .env → try config command
- **Expected**: Error message about API key not configured
- **Pass criteria**: Graceful error, no crash

### TEST 6.4: Multiple config changes
- **Steps**: "fast ball tiny paddle" → "5 lives red background"
- **Expected**: Each change applies incrementally
- **Pass criteria**: Changes compound correctly

---

## 7. AI Panel — Level Generator

### TEST 7.1: Generate a level
- **Steps**: Switch to Levels tab → type "a heart shape made of tough bricks"
- **Expected**: "Generating level..." → success message → new level loads in game
- **Pass criteria**: Brick layout appears, game resets ball to start

### TEST 7.2: Invalid generation
- **Steps**: Type something very vague or nonsensical
- **Expected**: Error message (graceful), game continues normally
- **Pass criteria**: No crash, previous level still playable

---

## 8. AI Panel — Narrator

### TEST 8.1: Narrator personality select
- **Steps**: Switch to Narrator tab → select different personality from dropdown
- **Expected**: Confirmation message in chat
- **Pass criteria**: Personality name displayed

### TEST 8.2: Narrator commentary (with API key)
- **Steps**: Play the game → lose a life or complete a level
- **Expected**: Narrator text overlay appears at bottom of game canvas
- **Pass criteria**: Commentary text visible, fades after ~4 seconds

### TEST 8.3: Narrator fallback (without API key)
- **Steps**: Play without API key → trigger events
- **Expected**: Simple emoji-based fallback commentary
- **Pass criteria**: Fallback messages appear (🔥, 💀, etc.)

---

## 9. Visual Polish

### TEST 9.1: Particle effects
- **Steps**: Destroy a brick
- **Expected**: Small colored particles explode from brick position
- **Pass criteria**: Particles visible, match brick color, fade out

### TEST 9.2: Screen shake
- **Steps**: Destroy a brick
- **Expected**: Subtle camera shake
- **Pass criteria**: Slight screen movement, not jarring

### TEST 9.3: Combo text animation
- **Steps**: Build a combo
- **Expected**: Combo text appears in center-top area
- **Pass criteria**: Text shows combo multiplier

---

## 10. Responsive & Edge Cases

### TEST 10.1: Window resize
- **Steps**: Resize browser window
- **Expected**: Game canvas scales proportionally (Phaser Scale.FIT)
- **Pass criteria**: Game remains playable at different sizes

### TEST 10.2: Multiple rapid power-ups
- **Steps**: Collect several power-ups in quick succession
- **Expected**: Effects compound or replace correctly, no crashes
- **Pass criteria**: Game remains stable

### TEST 10.3: Many balls
- **Steps**: Collect multiple MultiBall power-ups
- **Expected**: Many balls bounce around, losing one doesn't end game
- **Pass criteria**: Game only triggers "ball lost" when ALL balls are gone

### TEST 10.4: Level generator + gameplay
- **Steps**: Generate a custom level via AI → play it to completion
- **Expected**: Level complete triggers normally
- **Pass criteria**: Generated level is fully playable

---

## Test Status Tracking

| Test | Status | Notes |
|------|--------|-------|
| 1.1 - Menu start | ☐ | |
| 1.2 - Ball launch | ☐ | |
| 1.3 - Keyboard paddle | ☐ | |
| 1.4 - Mouse paddle | ☐ | |
| 1.5 - Wall bounce | ☐ | |
| 1.6 - Paddle bounce | ☐ | |
| 1.7 - Ball lost | ☐ | |
| 1.8 - Game over | ☐ | |
| 2.1 - Standard brick | ☐ | |
| 2.2 - Multi-hit brick | ☐ | |
| 2.3 - Indestructible | ☐ | |
| 2.4 - Explosive brick | ☐ | |
| 2.5 - Level complete | ☐ | |
| 3.1 - Power-up drops | ☐ | |
| 3.2 - MultiBall | ☐ | |
| 3.3 - Wide paddle | ☐ | |
| 3.4 - Laser mode | ☐ | |
| 3.5 - Fire ball | ☐ | |
| 4.1 - Basic scoring | ☐ | |
| 4.2 - Combo system | ☐ | |
| 4.3 - Combo break | ☐ | |
| 5.1 - Pause | ☐ | |
| 5.2 - Resume | ☐ | |
| 6.1 - AI panel | ☐ | |
| 6.2 - Config (with key) | ☐ | |
| 6.3 - Config (no key) | ☐ | |
| 6.4 - Multiple configs | ☐ | |
| 7.1 - Generate level | ☐ | |
| 7.2 - Invalid generation | ☐ | |
| 8.1 - Narrator select | ☐ | |
| 8.2 - Narrator (with key) | ☐ | |
| 8.3 - Narrator fallback | ☐ | |
| 9.1 - Particles | ☐ | |
| 9.2 - Screen shake | ☐ | |
| 9.3 - Combo text | ☐ | |
| 10.1 - Resize | ☐ | |
| 10.2 - Rapid power-ups | ☐ | |
| 10.3 - Many balls | ☐ | |
| 10.4 - Generated level | ☐ | |
