import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#0c0c0f');

    // Title
    this.add.text(width / 2, height * 0.28, 'BRICK\nBREAKER', {
      fontSize: '52px',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#e4e4e9',
      align: 'center',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.47, 'with AI powers', {
      fontSize: '14px',
      fontFamily: '"Inter", sans-serif',
      color: '#55555f',
      align: 'center',
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(width / 2, height * 0.6, 'START GAME', {
      fontSize: '16px',
      fontFamily: '"Inter", sans-serif',
      color: '#ffffff',
      backgroundColor: '#6d5dfc',
      padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => {
      startBtn.setStyle({ backgroundColor: '#5848c9' });
    });
    startBtn.on('pointerout', () => {
      startBtn.setStyle({ backgroundColor: '#6d5dfc' });
    });
    startBtn.on('pointerdown', () => {
      this.scene.start('Play');
    });

    // Instructions
    this.add.text(width / 2, height * 0.76, 'Mouse or Arrow Keys to move\nSpace to launch  ·  P to pause', {
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      color: '#55555f',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);
  }
}
