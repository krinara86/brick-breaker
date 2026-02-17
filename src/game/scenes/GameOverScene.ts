import Phaser from 'phaser';
import { gameAPI } from '../api/GameCommandAPI';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(): void {
    const { width, height } = this.scale;
    const stats = gameAPI.getStats();

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ff4444',
    }).setOrigin(0.5);

    // Stats
    const statsText = [
      `Score: ${stats.score}`,
      `Level Reached: ${stats.level}`,
      `Bricks Destroyed: ${stats.bricksDestroyed}`,
      `Max Combo: ${stats.maxCombo}`,
      `Perfect Levels: ${stats.perfectLevels}`,
      `Time: ${Math.floor(stats.timePlaying)}s`,
    ].join('\n');

    this.add.text(width / 2, height * 0.45, statsText, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aabbcc',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    // Restart button
    const restartBtn = this.add.text(width / 2, height * 0.72, '[ PLAY AGAIN ]', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#1a3a5a',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#00ffcc'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerdown', () => this.scene.start('Play'));

    // Menu button
    const menuBtn = this.add.text(width / 2, height * 0.82, '[ MAIN MENU ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#888888',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#00ffcc'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888888'));
    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
  }
}
