import { Application, Circle, Container, Rectangle, Sprite, Ticker } from 'pixi.js';
import { circRect } from './helpers/collisions';


export function spawnBomb(app: Application) {
  // Note: PIXI internally cache the sprite, that means no overhead in calling this multiple times :)
  const sprite = Sprite.from('/placeholders/game/Bomb.PNG'); // todo better constant links
  const container = new Container();
  const touchHitBox = new Circle(0, 0, 60);
  const explodeHitBox = new Circle(0, 0, 40);

  // Fall time (easier to reason with than pixels per second speed)
  const INITIAL_FALL_TIME_SEC = 6;

  // todo: likely need to move that elsewhere
  // Add screen height to the rectangle to avoid missing collision on fast moving objects.
  const bottom = new Rectangle(0, app.screen.height, app.screen.width, app.screen.height);

  let ticker: Ticker;

  init();

  function init() {
    sprite.anchor.set(0.5);

    container.addChild(sprite);
    app.stage.addChild(container);
    enable();
    // disable(); // todo pooling.
  }

  function update() {
    const explode = circRect(explodeHitBox, bottom);

    if (!explode) {
      // Approximate total fall height to screen.height.
      container.position.y += (app.screen.height / INITIAL_FALL_TIME_SEC) * (app.ticker.deltaMS / 1000);
    } else {
      console.log('explode');
    }
  }


  function enable() {
    container.visible = true;
    container.interactive = true;

    // Initial position
    container.position.y = -sprite.height*2;
    const HORIZONTAL_SPAWN_MARGIN_PX = 50;
    container.position.x = HORIZONTAL_SPAWN_MARGIN_PX + Math.random() * (app.screen.width - HORIZONTAL_SPAWN_MARGIN_PX*2 - sprite.width);

    ticker = app.ticker.add(update);
  }

  function disable() {
    container.visible = false;
    container.interactive = false;
    ticker.destroy(); // todo: maybe I can re-use the ticker, not sure.
  }


  // random start position, angle
  // difficulty increase (as param of useBomb?)
  // state explode
  // trail renderer
  // sound?


  return container;
}
