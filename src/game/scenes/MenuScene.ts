import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#0c0c0f');

    // Subtle grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x <= width; x += 40) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 40) grid.lineBetween(0, y, width, y);

    // Decorative floating bricks
    const colors = [0x3b82f6, 0xef4444, 0xa855f7, 0x10b981, 0xf59e0b, 0xec4899];
    for (let i = 0; i < 12; i++) {
      const bx = Phaser.Math.Between(40, width - 40);
      const by = Phaser.Math.Between(30, height - 30);
      const brick = this.add.image(bx, by, 'brick')
        .setTint(colors[i % colors.length])
        .setDisplaySize(Phaser.Math.Between(30, 60), 18)
        .setAlpha(0.12);
      this.tweens.add({
        targets: brick,
        y: by + Phaser.Math.Between(-15, 15),
        alpha: { from: 0.08, to: 0.16 },
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // Title
    this.add.text(width / 2, height * 0.28, 'BRICK\nBREAKER', {
      fontSize: '48px',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#e4e4e9',
      align: 'center',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.47, 'with AI powers', {
      fontSize: '13px',
      fontFamily: '"Inter", sans-serif',
      color: '#6d5dfc',
      align: 'center',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(width / 2, height * 0.6, 'START GAME', {
      fontSize: '15px',
      fontFamily: '"Inter", sans-serif',
      color: '#ffffff',
      backgroundColor: '#6d5dfc',
      padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#5848c9' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#6d5dfc' }));
    startBtn.on('pointerdown', () => this.scene.start('Play'));

    // Instructions
    this.add.text(width / 2, height * 0.76, 'Mouse or Arrow Keys to move\nSpace to launch  ·  P to pause', {
      fontSize: '11px',
      fontFamily: '"Inter", sans-serif',
      color: '#55555f',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);
  }
}
