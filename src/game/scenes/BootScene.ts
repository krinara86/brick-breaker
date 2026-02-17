import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // Generate all textures procedurally
  }

  create(): void {
    this.generateTextures();
    this.scene.start('Menu');
  }

  private generateTextures(): void {
    // --- Ball with glow ---
    const ballGfx = this.add.graphics();
    // Outer glow
    ballGfx.fillStyle(0xffffff, 0.08);
    ballGfx.fillCircle(24, 24, 20);
    ballGfx.fillStyle(0xffffff, 0.15);
    ballGfx.fillCircle(24, 24, 14);
    // Core
    ballGfx.fillStyle(0xffffff, 0.95);
    ballGfx.fillCircle(24, 24, 8);
    // Highlight
    ballGfx.fillStyle(0xffffff, 0.4);
    ballGfx.fillCircle(22, 22, 4);
    ballGfx.generateTexture('ball', 48, 48);
    ballGfx.destroy();

    // --- Paddle (rounded capsule) ---
    const padGfx = this.add.graphics();
    padGfx.fillStyle(0xffffff, 1);
    padGfx.fillRoundedRect(0, 0, 120, 16, 8);
    // Top highlight
    padGfx.fillStyle(0xffffff, 0.3);
    padGfx.fillRoundedRect(4, 1, 112, 6, 4);
    padGfx.generateTexture('paddle', 120, 16);
    padGfx.destroy();

    // --- Rounded brick ---
    const brickGfx = this.add.graphics();
    brickGfx.fillStyle(0xffffff, 1);
    brickGfx.fillRoundedRect(0, 0, 60, 22, 4);
    // Top highlight for 3D feel
    brickGfx.fillStyle(0xffffff, 0.2);
    brickGfx.fillRoundedRect(1, 1, 58, 8, { tl: 4, tr: 4, bl: 0, br: 0 });
    brickGfx.generateTexture('brick', 60, 22);
    brickGfx.destroy();

    // --- Indestructible brick (metallic) ---
    const metalGfx = this.add.graphics();
    metalGfx.fillStyle(0xffffff, 1);
    metalGfx.fillRoundedRect(0, 0, 60, 22, 4);
    // Cross-hatch pattern
    metalGfx.lineStyle(1, 0x000000, 0.15);
    for (let i = 0; i < 80; i += 8) {
      metalGfx.lineBetween(i, 0, i - 22, 22);
    }
    metalGfx.fillStyle(0xffffff, 0.15);
    metalGfx.fillRoundedRect(1, 1, 58, 8, { tl: 4, tr: 4, bl: 0, br: 0 });
    metalGfx.generateTexture('brick_metal', 60, 22);
    metalGfx.destroy();

    // --- Power-up drop (pill shape) ---
    const puGfx = this.add.graphics();
    puGfx.fillStyle(0xffffff, 1);
    puGfx.fillRoundedRect(0, 0, 24, 14, 7);
    puGfx.fillStyle(0xffffff, 0.3);
    puGfx.fillRoundedRect(2, 1, 20, 5, 3);
    puGfx.generateTexture('powerup', 24, 14);
    puGfx.destroy();

    // --- Laser beam ---
    const laserGfx = this.add.graphics();
    laserGfx.fillStyle(0xffffff, 1);
    laserGfx.fillRoundedRect(0, 0, 4, 14, 2);
    laserGfx.fillStyle(0xffffff, 0.5);
    laserGfx.fillRect(1, 0, 2, 14);
    laserGfx.generateTexture('laser', 4, 14);
    laserGfx.destroy();
  }
}
