import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add.text(width / 2, height * 0.25, 'BRICK\nBREAKER', {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#00ffcc',
      align: 'center',
      stroke: '#003322',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.48, 'with AI powers', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#667788',
      align: 'center',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(width / 2, height * 0.62, '[ START GAME ]', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#1a3a5a',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#00ffcc'));
    startBtn.on('pointerout', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerdown', () => {
      this.scene.start('Play');
    });

    // Instructions
    this.add.text(width / 2, height * 0.78, 'Mouse or Arrow Keys to move paddle\nSpace to launch ball\nP to pause', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#556677',
      align: 'center',
    }).setOrigin(0.5);

    // Flicker animation on title
    this.tweens.add({
      targets: this.children.list[1], // Title text
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
  }
}
