import { Application, Container, FillGradient, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';

export function useGameOverScreen({app, retryClick}: { app: Application, retryClick: () => void }) {
  const container = new Container();
  const background = new Graphics();
  background.beginFill(0x000000, 0.5);
  background.drawRect(0, 0, app.screen.width, app.screen.height);
  background.endFill();
  const fill = new FillGradient(0, 0, 0, 10);
  fill.addColorStop(0, 0x000000);
  fill.addColorStop(0, 0xFFFFFF);

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

  const retryStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 42,
    fontWeight: 'bold',
    align: 'center',
    fill: '#e8e8e8',
    wordWrapWidth: app.screen.width * 0.8, // 10% margin each side
  });

  const retryText = new Text({ text: 'Try again?', style: retryStyle });

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

  // todo animations
  // fade in of background,
  // and game over falls from the sky, heavily.
  // score shows immediately bellow
  // after a second or two, show "try again ?" button
  function animate() {
    gsap.fromTo(container, { alpha: 0 }, { alpha: 1, duration: 0.1 });
    gsap.fromTo(retryText, { y: app.screen.height + retryText.height, alpha: 0.8 }, { alpha: 1, y: app.screen.height - 200, duration: 1, delay: 1 })
      .then(() => {
        gsap.fromTo(retryText.scale, {x:1,y:1}, {
          delay: 10,
          duration: 1,
          x: 1.1,
          y: 1.1,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut"
        });
      });
    gsap.fromTo(gameOverText, { y: -gameOverText.height }, {
      y: 200,
      delay: .5,
      duration: .5,
      ease: CustomBounce.create("myBounce", {
        strength: 0.35,
        endAtStart: false,
        squash: 1,
        squashID: "myBounce-squash"
      })
    });
  }

  return {
    enable(parent: Container) {
      _parent = parent;
      parent.addChild(container);
      container.visible = true;
      container.interactive = true;
      animate();
    },
    disable() {
      _parent.removeChild(container);
      container.visible = false;
      container.interactive = false;
    }
  };
}
