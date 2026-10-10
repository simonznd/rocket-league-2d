const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME.width,
  height: window.GAME.height,
  backgroundColor: '#091321',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.game = new Phaser.Game(config);
