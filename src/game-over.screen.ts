import { Container, FillGradient, Graphics, Text, TextStyle } from 'pixi.js';

function useGameOverScreen() {
  const container = new Container();
  const background = new Graphics();
  background.beginFill(0x000000, 0.5);
  background.drawRect(0, 0, 100, 100);
  background.endFill();
  const fill = new FillGradient(0, 0, 0, 10);

  const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: { fill }, // fillGradientType for dir
    stroke: { color: '#4a1850', width: 5, join: 'round' },
    dropShadow: {
      color: '#000000',
      blur: 4,
      angle: Math.PI / 6,
      distance: 6,
    },
    wordWrap: true,
    wordWrapWidth: 440,
  });

  const gameOverText = new Text({
    text: 'Your treasure was ransacked!', // or "game over"?
    style,
  });

  const retryText = new Text({ text: 'Try again?' });

  container.addChild(gameOverText);
  container.addChild(background);

  // Start disabled
  container.visible = false;
  container.interactive = false;

  return {
    // todo animations
    // fade in of background,
    // and game over falls from the sky, heavily.
    // score shows immediately bellow
    // after a second or two, show "try again ?" button
    enable() {
      container.visible = true;
      container.interactive = true;

    },
    disable() {
      container.visible = false;
      container.interactive = false;
    }
  };
}
