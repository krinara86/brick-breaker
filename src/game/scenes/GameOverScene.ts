import Phaser from 'phaser';
import { gameAPI } from '../api/GameCommandAPI';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(): void {
    const { width, height } = this.scale;
    const stats = gameAPI.getStats();

    this.cameras.main.setBackgroundColor('#0c0c0f');

    // Title
    this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontSize: '36px',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#f87171',
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
      fontSize: '14px',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#888896',
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5);

    // Restart button
    const restartBtn = this.add.text(width / 2, height * 0.72, 'PLAY AGAIN', {
      fontSize: '16px',
      fontFamily: '"Inter", sans-serif',
      color: '#ffffff',
      backgroundColor: '#6d5dfc',
      padding: { x: 32, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#5848c9' }));
    restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#6d5dfc' }));
    restartBtn.on('pointerdown', () => this.scene.start('Play'));

    // Menu button
    const menuBtn = this.add.text(width / 2, height * 0.82, 'MAIN MENU', {
      fontSize: '13px',
      fontFamily: '"Inter", sans-serif',
      color: '#55555f',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#888896'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#55555f'));
    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
  }
}
