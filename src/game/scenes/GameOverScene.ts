import Phaser from 'phaser';
import { gameAPI } from '../api/GameCommandAPI';
import { highScores } from '../highscores';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(): void {
    const { width, height } = this.scale;
    const stats = gameAPI.getStats();

    this.cameras.main.setBackgroundColor('#0c0c0f');

    // Subtle grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x <= width; x += 40) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 40) grid.lineBetween(0, y, width, y);

    // Save the score
    const savedIndex = highScores.save({
      score: stats.score,
      level: stats.level,
      maxCombo: stats.maxCombo,
      timePlaying: stats.timePlaying,
      date: new Date().toISOString(),
    });

    // Title
    this.add.text(width / 2, 36, 'GAME OVER', {
      fontSize: '32px',
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

    this.add.text(width / 2, 110, statsText, {
      fontSize: '13px',
      fontFamily: '"IBM Plex Mono", monospace',
      color: '#888896',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Leaderboard
    const entries = highScores.getAll();
    if (entries.length > 0) {
      this.add.text(width / 2, 215, 'HIGH SCORES', {
        fontSize: '15px',
        fontFamily: '"IBM Plex Mono", monospace',
        color: '#6d5dfc',
      }).setOrigin(0.5);

      const startY = 240;
      const lineH = 22;

      entries.forEach((entry, i) => {
        const isCurrent = i === savedIndex;
        const rank = `${i + 1}.`.padStart(3);
        const score = `${entry.score}`.padStart(8);
        const lvl = `L${entry.level}`;
        const line = `${rank}${score}  ${lvl}`;
        const color = isCurrent ? '#f59e0b' : '#888896';

        this.add.text(width / 2, startY + i * lineH, line, {
          fontSize: '13px',
          fontFamily: '"IBM Plex Mono", monospace',
          color,
          fontStyle: isCurrent ? 'bold' : 'normal',
        }).setOrigin(0.5);
      });
    }

    // Restart button
    const btnY = entries.length > 0 ? 250 + entries.length * 22 + 20 : height * 0.72;

    const restartBtn = this.add.text(width / 2, btnY, 'PLAY AGAIN', {
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
    const menuBtn = this.add.text(width / 2, btnY + 44, 'MAIN MENU', {
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
