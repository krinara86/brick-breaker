import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // We generate all graphics procedurally, no external assets needed
    // This scene exists for future asset loading
  }

  create(): void {
    this.scene.start('Menu');
  }
}
