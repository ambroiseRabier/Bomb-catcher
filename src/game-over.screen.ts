import { Application, Container, FillGradient, Graphics, Text, TextStyle } from 'pixi.js';

export function useGameOverScreen({app, retryClick}: { app: Application, retryClick: () => void }) {
  const container = new Container();
  const background = new Graphics();
  background.beginFill(0x000000, 0.5);
  background.drawRect(0, 0, app.screen.width, app.screen.height);
  background.endFill();
  const fill = new FillGradient(0, 0, 0, 10);

  const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 72,
    fontWeight: 'bold',
    align: 'center',
    fill: { fill }, // fillGradientType for dir
    stroke: { color: '#d62424', width: 3, join: 'round' },
    dropShadow: {
      color: '#000000',
      blur: 4,
      angle: Math.PI / 6,
      distance: 6,
    },
    wordWrap: true,
    wordWrapWidth: app.screen.width * 0.8, // 10% margin each side
  });

  const gameOverText = new Text({
    text: 'Your treasure has been ransacked!', // or "game over"?
    style,
  });

  const retryText = new Text({ text: 'Try again?' });

  background.position.set(0);
  container.addChild(background);

  gameOverText.anchor.set(0.5, 0);
  gameOverText.position.set(app.screen.width/2, 200);
  container.addChild(gameOverText);

  retryText.anchor.set(0.5, 1);
  retryText.position.set(app.screen.width/2, app.screen.height - 200);
  retryText.interactive = true;
  retryText.cursor = 'pointer';
  retryText.on('pointerdown', retryClick);
  container.addChild(retryText);

  // Start disabled
  container.visible = false;
  container.interactive = false;

  /**
   * Track parent, to render above others, it needs to be the last child.
   */
  let _parent: Container;

  return {
    // todo animations
    // fade in of background,
    // and game over falls from the sky, heavily.
    // score shows immediately bellow
    // after a second or two, show "try again ?" button
    enable(parent: Container) {
      _parent = parent;
      parent.addChild(container);
      container.visible = true;
      container.interactive = true;
    },
    disable() {
      _parent.removeChild(container);
      container.visible = false;
      container.interactive = false;
    }
  };
}
