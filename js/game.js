const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.GAME.width,
  height: window.GAME.height,
  backgroundColor: '#060d18',
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.game = new Phaser.Game(config);
