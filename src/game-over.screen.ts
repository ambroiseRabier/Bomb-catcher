import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import { buttonStyle } from './text-style';

export function useGameOverScreen({
  app,
  retryClick,
}: {
  app: Application;
  retryClick: () => void;
}) {
  const container = new Container();
  const background = new Graphics();
  background.rect(0, 0, app.screen.width, app.screen.height).fill({
    color: 0x000000,
    alpha: 0.5,
  });

  const style = new TextStyle({
    fontFamily: 'VarelaRound',
    fontSize: 72,
    fontWeight: 'bold',
    align: 'center',
    fill: '#cccccc',
    // stroke in red just doesn't feel good.
    // stroke: { color: '#bc1a1a', width: 3, join: 'round' },
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
    ...buttonStyle,
    fontSize: 60,
    wordWrapWidth: app.screen.width * 0.8, // 10% margin each side
  });

  const retryText = new Text({ text: 'Try again?', style: retryStyle });
  const scoreStrTemplate = "You've accumulated %score% days of treasures.";
  const scoreText = new Text({
    text: scoreStrTemplate,
    style: { ...retryText, fontWeight: 'normal', fontSize: 32, fontFamily: 'VarelaRound' },
  });

  background.position.set(0);
  container.addChild(background);

  gameOverText.anchor.set(0.5, 0);
  gameOverText.position.set(app.screen.width / 2, 200);
  container.addChild(gameOverText);

  scoreText.anchor.set(0.5, 0.5);
  scoreText.position.set(app.screen.width / 2, app.screen.height / 2);
  container.addChild(scoreText);

  retryText.anchor.set(0.5, 1);
  retryText.position.set(app.screen.width / 2, app.screen.height - 200);
  retryText.interactive = true;
  retryText.cursor = 'pointer';
  retryText.on('pointerdown', retryClick);
  retryText.on('mouseenter', () => {
    retryText.tint = '#EFBF04';
  });
  retryText.on('mouseout', () => {
    retryText.tint = '#ffffff';
  });
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
  function animate(score: number) {
    gsap.fromTo(container, { alpha: 0 }, { alpha: 1, duration: 0.1 });
    gsap
      .fromTo(
        retryText,
        { y: app.screen.height + retryText.height, alpha: 0.8 },
        { alpha: 1, y: app.screen.height - 200, duration: 1, delay: 1.5 }
      )
      .then(() => {
        gsap.fromTo(
          retryText.scale,
          { x: 1, y: 1 },
          {
            delay: 10,
            duration: 1,
            x: 1.1,
            y: 1.1,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          }
        );
      });
    scoreText.visible = false;
    gsap.fromTo(
      gameOverText,
      { y: -gameOverText.height },
      {
        y: 200,
        delay: 0.5,
        duration: 0.5,
        ease: 'elastic.out(1,0.75)',
        onComplete: () => {
          scoreText.visible = true;
          const obj = {
            score: 0,
          };
          gsap.to(obj, {
            score,
            duration: 1 + score * 0.05,
            roundProps: 'score', // Ensures the number is rounded to integers
            onUpdate: () => {
              // Update the string with the animated number
              scoreText.text = scoreStrTemplate.replace('%score%', obj.score.toString());
            },
          });
        },
      }
    );
  }

  return {
    enable(parent: Container, score: number) {
      _parent = parent;
      parent.addChild(container);
      container.visible = true;
      container.interactive = true;
      animate(score);
    },
    disable() {
      // reset tint
      retryText.tint = '#ffffff';
      _parent.removeChild(container);
      container.visible = false;
      container.interactive = false;
    },
  };
}
