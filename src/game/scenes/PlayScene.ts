import Phaser from 'phaser';
import { gameAPI } from '../api/GameCommandAPI';
import { gameEventBus } from '../../types/events';
import { BrickType, PowerUpType, LevelSpec, BrickDef } from '../../types/level';
import { GameConfig } from '../../types/config';

/** Color mapping for brick types and hit counts */
const BRICK_COLORS: Record<string, number> = {
  standard: 0x5b8def,
  multi_3: 0xef5b5b,
  multi_2: 0xf0923b,
  multi_1: 0xf0c43b,
  indestructible: 0x4a4a58,
  powerup: 0x34d399,
  explosive: 0xc084fc,
};

const POWERUP_COLORS: Record<string, number> = {
  [PowerUpType.MultiBall]: 0x44ffff,
  [PowerUpType.WidePaddle]: 0x44ff44,
  [PowerUpType.NarrowPaddle]: 0xff4444,
  [PowerUpType.FastBall]: 0xff8844,
  [PowerUpType.SlowBall]: 0x4488ff,
  [PowerUpType.Laser]: 0xff44ff,
  [PowerUpType.StickyPaddle]: 0xffff44,
  [PowerUpType.ExtraLife]: 0xff88ff,
  [PowerUpType.FireBall]: 0xff6600,
};

interface BrickSprite extends Phaser.GameObjects.Rectangle {
  brickData: BrickDef & { hitsLeft: number };
}

interface PowerUpSprite extends Phaser.GameObjects.Rectangle {
  powerUpType: PowerUpType;
}

export class PlayScene extends Phaser.Scene {
  // Game objects
  private paddle!: Phaser.GameObjects.Rectangle;
  private balls: Phaser.GameObjects.Arc[] = [];
  private bricks: BrickSprite[] = [];
  private powerUps: PowerUpSprite[] = [];
  private lasers: Phaser.GameObjects.Rectangle[] = [];

  // Physics velocities (manual, not Phaser physics for more control)
  private ballVelocities: { x: number; y: number }[] = [];

  // State
  private isLaunched = false;
  private isPaused = false;
  private config!: GameConfig;
  private comboTimer: Phaser.Time.TimerEvent | null = null;
  private currentCombo = 0;
  private stickyBall = false;
  private fireBall = false;
  private hasLaser = false;
  private laserTimer: Phaser.Time.TimerEvent | null = null;

  // UI elements in scene
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  // Particles
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Layout constants
  private readonly GAME_TOP = 50;
  private readonly BRICK_PADDING = 4;

  // Registered keys
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'Play' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.config = gameAPI.getConfig();

    this.cameras.main.setBackgroundColor(this.config.visual.backgroundColor);

    // --- HUD ---
    this.scoreText = this.add.text(16, 12, 'Score: 0', {
      fontSize: '13px', fontFamily: '"IBM Plex Mono", monospace', color: '#e4e4e9',
    });
    this.livesText = this.add.text(width - 16, 12, 'Lives: 3', {
      fontSize: '13px', fontFamily: '"IBM Plex Mono", monospace', color: '#f87171',
    }).setOrigin(1, 0);
    this.levelText = this.add.text(width / 2, 12, 'Level 1', {
      fontSize: '13px', fontFamily: '"IBM Plex Mono", monospace', color: '#888896',
    }).setOrigin(0.5, 0);
    this.comboText = this.add.text(width / 2, 32, '', {
      fontSize: '12px', fontFamily: '"IBM Plex Mono", monospace', color: '#fbbf24',
    }).setOrigin(0.5, 0);
    this.messageText = this.add.text(width / 2, height / 2, '', {
      fontSize: '20px', fontFamily: '"Inter", sans-serif', color: '#e4e4e9', align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // --- Paddle ---
    this.paddle = this.add.rectangle(
      width / 2, height - 40,
      this.config.paddle.width, this.config.paddle.height,
      0x6d5dfc
    );

    // --- Particle emitter ---
    this.particles = this.add.particles(0, 0, undefined, {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 400,
      quantity: 0, // Manual emit
      emitting: false,
    });

    // --- Create initial ball ---
    this.createBall();

    // --- Load level ---
    gameAPI.bindScene(this);

    // Subscribe BEFORE starting so we catch the first level load
    gameAPI.onLevelLoad((level) => this.buildLevel(level));
    gameAPI.onConfigChange((config) => this.applyRuntimeConfig(config));

    gameAPI.startGame();

    // --- Input ---
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.paddle.x = Phaser.Math.Clamp(
        pointer.x, this.config.paddle.width / 2, width - this.config.paddle.width / 2
      );
      if (!this.isLaunched) {
        this.balls[0].x = this.paddle.x;
      }
    });

    const keys = this.input.keyboard!;
    this.keyLeft = keys.addKey('LEFT');
    this.keyRight = keys.addKey('RIGHT');
    this.keyA = keys.addKey('A', false, false);  // no capture — lets browser handle typing
    this.keyD = keys.addKey('D', false, false);
    keys.on('keydown-SPACE', () => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      this.launchBall();
    });
    keys.on('keydown-P', () => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      this.togglePause();
    });

    // Listen for config changes from LLM
    gameEventBus.on('game:configChanged', () => {
      this.config = gameAPI.getConfig();
    });

    // Listen for powerup spawns from API
    gameEventBus.on('powerup:spawn', ({ type, x, y }) => {
      this.createPowerUpDrop(type, x, y);
    });
  }

  update(_time: number, delta: number): void {
    if (this.isPaused) return;

    const dt = delta / 1000;
    const { width, height } = this.scale;

    // Keyboard paddle movement (skip when typing in chat)
    const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
    if (!isTyping) {
      if (this.keyLeft.isDown || this.keyA.isDown) {
        this.paddle.x -= this.config.paddle.speed * dt;
      }
      if (this.keyRight.isDown || this.keyD.isDown) {
        this.paddle.x += this.config.paddle.speed * dt;
      }
    }
    this.paddle.x = Phaser.Math.Clamp(
      this.paddle.x, this.config.paddle.width / 2, width - this.config.paddle.width / 2
    );

    // Sticky ball follows paddle
    if (!this.isLaunched && this.balls.length > 0) {
      this.balls[0].x = this.paddle.x;
      return;
    }

    // Update time tracking
    gameAPI.updateTimePlaying(dt);

    // Update balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      const vel = this.ballVelocities[i];
      if (!vel) continue;

      ball.x += vel.x * dt;
      ball.y += vel.y * dt;

      // Wall collisions
      if (ball.x <= this.config.ball.radius) {
        ball.x = this.config.ball.radius;
        vel.x = Math.abs(vel.x);
        gameEventBus.emit('ball:wallBounce', { side: 'left' });
      }
      if (ball.x >= width - this.config.ball.radius) {
        ball.x = width - this.config.ball.radius;
        vel.x = -Math.abs(vel.x);
        gameEventBus.emit('ball:wallBounce', { side: 'right' });
      }
      if (ball.y <= this.GAME_TOP + this.config.ball.radius) {
        ball.y = this.GAME_TOP + this.config.ball.radius;
        vel.y = Math.abs(vel.y);
        gameEventBus.emit('ball:wallBounce', { side: 'top' });
      }

      // Ball lost (bottom)
      if (ball.y >= height + this.config.ball.radius) {
        ball.destroy();
        this.balls.splice(i, 1);
        this.ballVelocities.splice(i, 1);

        if (this.balls.length === 0) {
          this.onBallLost();
        }
        continue;
      }

      // Paddle collision
      this.checkPaddleCollision(ball, vel);

      // Brick collisions
      this.checkBrickCollisions(ball, vel);
    }

    // Update power-up drops
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.y += 120 * dt;

      // Collect on paddle hit
      if (this.rectOverlap(pu, this.paddle)) {
        this.collectPowerUp(pu.powerUpType);
        pu.destroy();
        this.powerUps.splice(i, 1);
        continue;
      }

      // Remove if off screen
      if (pu.y > height + 20) {
        pu.destroy();
        this.powerUps.splice(i, 1);
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.y -= 500 * dt;

      if (laser.y < 0) {
        laser.destroy();
        this.lasers.splice(i, 1);
        continue;
      }

      // Check laser-brick collision
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const brick = this.bricks[j];
        if (this.rectOverlap(laser, brick)) {
          laser.destroy();
          this.lasers.splice(i, 1);
          this.hitBrick(brick);
          break;
        }
      }
    }

    // Update HUD
    const stats = gameAPI.getStats();
    this.scoreText.setText(`Score: ${stats.score}`);
    this.livesText.setText(`Lives: ${stats.lives}`);
    this.levelText.setText(`Level ${stats.level}`);

    if (this.currentCombo > 1) {
      this.comboText.setText(`Combo x${this.currentCombo}`);
      this.comboText.setAlpha(1);
    } else {
      this.comboText.setAlpha(0);
    }
  }

  // --- Level building ---

  private buildLevel(level: LevelSpec): void {
    // Clear existing bricks
    this.bricks.forEach(b => b.destroy());
    this.bricks = [];
    this.powerUps.forEach(p => p.destroy());
    this.powerUps = [];
    this.lasers.forEach(l => l.destroy());
    this.lasers = [];

    const { width } = this.scale;
    const brickWidth = (width - this.BRICK_PADDING * (level.gridCols + 1)) / level.gridCols;
    const brickHeight = 24;

    for (const brickDef of level.bricks) {
      const x = this.BRICK_PADDING + brickDef.col * (brickWidth + this.BRICK_PADDING) + brickWidth / 2;
      const y = this.GAME_TOP + this.BRICK_PADDING + brickDef.row * (brickHeight + this.BRICK_PADDING) + brickHeight / 2;

      const color = this.getBrickColor(brickDef);
      const brick = this.add.rectangle(x, y, brickWidth - 2, brickHeight - 2, color) as BrickSprite;
      brick.brickData = { ...brickDef, hitsLeft: brickDef.hits ?? 1 };

      // Visual flair for special bricks
      if (brickDef.type === BrickType.Indestructible) {
        brick.setStrokeStyle(2, 0xaaaaaa);
      } else if (brickDef.type === BrickType.PowerUp) {
        brick.setStrokeStyle(1, 0xffffff);
      } else if (brickDef.type === BrickType.Explosive) {
        brick.setStrokeStyle(1, 0xff00ff);
      }

      this.bricks.push(brick);
    }

    // Reset ball
    this.resetBallToStart();

    // Reset powerup states
    this.stickyBall = false;
    this.fireBall = false;
    this.hasLaser = false;
    if (this.laserTimer) this.laserTimer.destroy();
  }

  // --- Ball management ---

  private createBall(): Phaser.GameObjects.Arc {
    const { width, height } = this.scale;
    const ball = this.add.circle(
      this.paddle?.x ?? width / 2,
      height - 40 - this.config.paddle.height / 2 - this.config.ball.radius - 2,
      this.config.ball.radius,
      0xffffff
    );
    this.balls.push(ball);
    this.ballVelocities.push({ x: 0, y: 0 });
    return ball;
  }

  private resetBallToStart(): void {
    // Destroy extra balls
    while (this.balls.length > 1) {
      this.balls.pop()?.destroy();
      this.ballVelocities.pop();
    }

    if (this.balls.length === 0) {
      this.createBall();
    }

    const ball = this.balls[0];
    const { height } = this.scale;
    ball.x = this.paddle.x;
    ball.y = height - 40 - this.config.paddle.height / 2 - this.config.ball.radius - 2;
    this.ballVelocities[0] = { x: 0, y: 0 };
    this.isLaunched = false;
  }

  private launchBall(): void {
    if (this.isLaunched) return;
    this.isLaunched = true;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Slight random angle
    this.ballVelocities[0] = {
      x: Math.cos(angle) * this.config.ball.speed,
      y: Math.sin(angle) * this.config.ball.speed,
    };
    gameEventBus.emit('ball:launch', { x: this.balls[0].x, y: this.balls[0].y });
  }

  // --- Collision detection ---

  private checkPaddleCollision(ball: Phaser.GameObjects.Arc, vel: { x: number; y: number }): void {
    if (vel.y < 0) return; // Ball moving up

    const paddleTop = this.paddle.y - this.config.paddle.height / 2;
    const paddleLeft = this.paddle.x - this.config.paddle.width / 2;
    const paddleRight = this.paddle.x + this.config.paddle.width / 2;

    if (
      ball.y + this.config.ball.radius >= paddleTop &&
      ball.y - this.config.ball.radius <= this.paddle.y + this.config.paddle.height / 2 &&
      ball.x >= paddleLeft &&
      ball.x <= paddleRight
    ) {
      // Calculate bounce angle based on where ball hits paddle
      const relativeX = (ball.x - this.paddle.x) / (this.config.paddle.width / 2);
      const angle = -Math.PI / 2 + relativeX * (Math.PI / 3); // -60° to 60° from vertical
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const clampedSpeed = Math.min(speed, this.config.ball.maxSpeed);

      vel.x = Math.cos(angle) * clampedSpeed;
      vel.y = Math.sin(angle) * clampedSpeed;
      ball.y = paddleTop - this.config.ball.radius;

      if (this.stickyBall) {
        vel.x = 0;
        vel.y = 0;
        this.isLaunched = false;
        this.stickyBall = false;
      }

      gameEventBus.emit('ball:paddleHit', { x: ball.x, relativeX });
    }
  }

  private checkBrickCollisions(ball: Phaser.GameObjects.Arc, vel: { x: number; y: number }): void {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (!this.circleRectOverlap(ball, this.config.ball.radius, brick)) continue;

      // Fireball passes through (except indestructible)
      if (!this.fireBall || brick.brickData.type === BrickType.Indestructible) {
        // Determine bounce direction
        const brickBounds = brick.getBounds();
        const dx = ball.x - Phaser.Math.Clamp(ball.x, brickBounds.left, brickBounds.right);
        const dy = ball.y - Phaser.Math.Clamp(ball.y, brickBounds.top, brickBounds.bottom);

        if (Math.abs(dx) > Math.abs(dy)) {
          vel.x = -vel.x;
        } else {
          vel.y = -vel.y;
        }
      }

      this.hitBrick(brick);

      if (!this.fireBall) break; // Normal ball only hits one brick per frame
    }
  }

  private hitBrick(brick: BrickSprite): void {
    const data = brick.brickData;

    if (data.type === BrickType.Indestructible) {
      gameEventBus.emit('brick:hit', { row: data.row, col: data.col, hitsLeft: 999 });
      // Flash effect
      this.tweens.add({
        targets: brick,
        alpha: 0.5,
        duration: 50,
        yoyo: true,
      });
      return;
    }

    data.hitsLeft--;
    gameEventBus.emit('brick:hit', { row: data.row, col: data.col, hitsLeft: data.hitsLeft });

    if (data.hitsLeft <= 0) {
      this.destroyBrick(brick);
    } else {
      // Update color for remaining hits
      const color = this.getBrickColor({ ...data, hits: data.hitsLeft });
      brick.setFillStyle(color);
      // Hit flash
      this.tweens.add({
        targets: brick,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 60,
        yoyo: true,
      });
    }
  }

  private destroyBrick(brick: BrickSprite): void {
    const data = brick.brickData;

    // Particles
    if (this.config.visual.particlesEnabled) {
      this.particles.setPosition(brick.x, brick.y);
      this.particles.setParticleTint(brick.fillColor);
      this.particles.explode(8);
    }

    // Screen shake
    if (this.config.visual.screenShake) {
      this.cameras.main.shake(50, 0.003);
    }

    // Combo tracking
    this.currentCombo++;
    gameEventBus.emit('combo:increment', { combo: this.currentCombo });
    if (this.comboTimer) this.comboTimer.destroy();
    this.comboTimer = this.time.delayedCall(this.config.gameplay.comboTimeout, () => {
      const finalCombo = this.currentCombo;
      this.currentCombo = 0;
      gameEventBus.emit('combo:break', { finalCombo });
    });

    // Score
    const comboBonus = Math.floor(this.config.gameplay.pointsPerBrick * this.currentCombo * this.config.gameplay.comboMultiplier);
    const points = this.config.gameplay.pointsPerBrick + comboBonus;
    gameEventBus.emit('brick:destroyed', { row: data.row, col: data.col, points });

    // Explosive brick chain reaction
    if (data.type === BrickType.Explosive) {
      gameEventBus.emit('brick:explode', { row: data.row, col: data.col });
      this.time.delayedCall(50, () => {
        this.explodeAdjacent(data.row, data.col);
      });
    }

    // Power-up drop
    if (data.type === BrickType.PowerUp && data.powerUp) {
      this.createPowerUpDrop(data.powerUp, brick.x, brick.y);
    }

    // Remove brick
    const index = this.bricks.indexOf(brick);
    if (index > -1) this.bricks.splice(index, 1);
    brick.destroy();

    // Check level complete
    const destructibleRemaining = this.bricks.filter(
      b => b.brickData.type !== BrickType.Indestructible
    );
    if (destructibleRemaining.length === 0) {
      this.onLevelComplete();
    }
  }

  private explodeAdjacent(row: number, col: number): void {
    const toDestroy = this.bricks.filter(b => {
      const dr = Math.abs(b.brickData.row - row);
      const dc = Math.abs(b.brickData.col - col);
      return (dr <= 1 && dc <= 1) && b.brickData.type !== BrickType.Indestructible;
    });

    for (const brick of toDestroy) {
      this.destroyBrick(brick);
    }
  }

  // --- Power-ups ---

  private createPowerUpDrop(type: PowerUpType, x: number, y: number): void {
    const color = POWERUP_COLORS[type] ?? 0xffffff;
    const drop = this.add.rectangle(x, y, 20, 12, color) as PowerUpSprite;
    drop.powerUpType = type;
    drop.setStrokeStyle(1, 0xffffff);
    this.powerUps.push(drop);
  }

  private collectPowerUp(type: PowerUpType): void {
    gameEventBus.emit('powerup:collect', { type });

    switch (type) {
      case PowerUpType.MultiBall:
        this.spawnExtraBalls(2);
        break;
      case PowerUpType.WidePaddle:
        this.setPaddleWidth(this.config.paddle.width * 1.5);
        this.time.delayedCall(10000, () => {
          this.setPaddleWidth(gameAPI.getConfig().paddle.width);
          gameEventBus.emit('powerup:expire', { type });
        });
        break;
      case PowerUpType.NarrowPaddle:
        this.setPaddleWidth(this.config.paddle.width * 0.6);
        this.time.delayedCall(8000, () => {
          this.setPaddleWidth(gameAPI.getConfig().paddle.width);
          gameEventBus.emit('powerup:expire', { type });
        });
        break;
      case PowerUpType.FastBall:
        this.scaleBallSpeed(1.4);
        this.time.delayedCall(8000, () => {
          this.scaleBallSpeed(1 / 1.4);
          gameEventBus.emit('powerup:expire', { type });
        });
        break;
      case PowerUpType.SlowBall:
        this.scaleBallSpeed(0.7);
        this.time.delayedCall(8000, () => {
          this.scaleBallSpeed(1 / 0.7);
          gameEventBus.emit('powerup:expire', { type });
        });
        break;
      case PowerUpType.Laser:
        this.activateLaser();
        break;
      case PowerUpType.StickyPaddle:
        this.stickyBall = true;
        break;
      case PowerUpType.ExtraLife: {
        const stats = gameAPI.getStats();
        gameAPI.applyConfig({ gameplay: { lives: stats.lives + 1 } });
        break;
      }
      case PowerUpType.FireBall:
        this.fireBall = true;
        // Visual indicator
        this.balls.forEach(b => b.setFillStyle(0xff6600));
        this.time.delayedCall(8000, () => {
          this.fireBall = false;
          this.balls.forEach(b => b.setFillStyle(0xffffff));
          gameEventBus.emit('powerup:expire', { type });
        });
        break;
    }
  }

  private spawnExtraBalls(count: number): void {
    for (let i = 0; i < count; i++) {
      const { height } = this.scale;
      const ball = this.add.circle(
        this.paddle.x + (i - count / 2) * 20,
        height - 80,
        this.config.ball.radius,
        0xffffff
      );
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      this.balls.push(ball);
      this.ballVelocities.push({
        x: Math.cos(angle) * this.config.ball.speed,
        y: Math.sin(angle) * this.config.ball.speed,
      });
    }
  }

  private setPaddleWidth(width: number): void {
    this.paddle.width = width;
    this.config.paddle.width = width;
  }

  private scaleBallSpeed(factor: number): void {
    for (const vel of this.ballVelocities) {
      vel.x *= factor;
      vel.y *= factor;
    }
  }

  private activateLaser(): void {
    this.hasLaser = true;
    this.paddle.setFillStyle(0xff44ff);
    if (this.laserTimer) this.laserTimer.destroy();

    this.laserTimer = this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        if (!this.hasLaser) return;
        const laser = this.add.rectangle(
          this.paddle.x, this.paddle.y - this.config.paddle.height,
          4, 16, 0xff44ff
        );
        this.lasers.push(laser);
      },
    });

    this.time.delayedCall(8000, () => {
      this.hasLaser = false;
      this.paddle.setFillStyle(0x6d5dfc);
      if (this.laserTimer) this.laserTimer.destroy();
      gameEventBus.emit('powerup:expire', { type: PowerUpType.Laser });
    });
  }

  // --- Game flow ---

  private onBallLost(): void {
    const stats = gameAPI.getStats();
    const remaining = stats.lives - 1;

    gameEventBus.emit('ball:lost', { livesRemaining: remaining });

    if (remaining <= 0) {
      gameAPI.gameOver();
      this.showMessage('GAME OVER', () => {
        this.scene.start('GameOver');
      });
    } else {
      this.showMessage('Ball Lost!', () => {
        this.resetBallToStart();
      }, 1000);
    }
  }

  private onLevelComplete(): void {
    gameAPI.levelComplete();
    const hasNext = gameAPI.nextLevel();

    if (hasNext) {
      this.showMessage('Level Complete!', () => {
        // Level will reload via onLevelLoad callback
      }, 1500);
    } else {
      this.showMessage('YOU WIN!\nAll levels complete!', () => {
        this.scene.start('GameOver');
      }, 2500);
    }
  }

  private showMessage(text: string, onComplete?: () => void, duration = 2000): void {
    this.messageText.setText(text);
    this.messageText.setAlpha(1);
    this.time.delayedCall(duration, () => {
      this.messageText.setAlpha(0);
      onComplete?.();
    });
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showMessage('PAUSED\nPress P to resume', undefined, 999999);
      gameEventBus.emit('game:pause', undefined);
    } else {
      this.messageText.setAlpha(0);
      gameEventBus.emit('game:resume', undefined);
    }
  }

  // --- Runtime config ---

  private applyRuntimeConfig(config: GameConfig): void {
    this.config = config;
    this.cameras.main.setBackgroundColor(config.visual.backgroundColor);
    this.paddle.width = config.paddle.width;
    this.paddle.height = config.paddle.height;
    this.balls.forEach(b => {
      b.radius = config.ball.radius;
      b.setDisplaySize(config.ball.radius * 2, config.ball.radius * 2);
    });
  }

  // --- Collision helpers ---

  private circleRectOverlap(
    circle: Phaser.GameObjects.Arc,
    radius: number,
    rect: Phaser.GameObjects.Rectangle
  ): boolean {
    const bounds = rect.getBounds();
    const closestX = Phaser.Math.Clamp(circle.x, bounds.left, bounds.right);
    const closestY = Phaser.Math.Clamp(circle.y, bounds.top, bounds.bottom);
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  private rectOverlap(a: Phaser.GameObjects.Rectangle, b: Phaser.GameObjects.Rectangle): boolean {
    const ab = a.getBounds();
    const bb = b.getBounds();
    return ab.left < bb.right && ab.right > bb.left && ab.top < bb.bottom && ab.bottom > bb.top;
  }

  private getBrickColor(def: { type: BrickType; hits?: number }): number {
    if (def.type === BrickType.Multi) {
      return BRICK_COLORS[`multi_${Math.min(def.hits ?? 1, 3)}`] ?? BRICK_COLORS.multi_1;
    }
    return BRICK_COLORS[def.type] ?? 0x4488ff;
  }
}
