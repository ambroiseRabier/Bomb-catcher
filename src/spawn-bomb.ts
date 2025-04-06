import { Application, Circle, Container, Rectangle, Sprite, Ticker } from 'pixi.js';
import { circRect } from './helpers/collisions';
import { assets } from './assets';
import { biasedRandom } from './biased-random';


interface Props {
  app: Application;
  onExplode: () => void;
}

let previousXRandom = Math.random();

enum BombState {
  Idle = 'Idle',
  Falling = 'Falling',
  Exploding = 'Exploding',
  Catched = 'Catched',
}

export type Bomb = ReturnType<typeof spawnBomb>;

export function spawnBomb({app, onExplode}: Props) {
  // Note: PIXI internally cache the sprite, that means no overhead in calling this multiple times :)
  const sprite = Sprite.from(assets.game.bomb); // todo better constant links
  const container = new Container();
  const touchHitBox = new Circle(0, 0, 60);
  const explodeHitBox = new Circle(0, 0, 40);

  // Fall time (easier to reason with than pixels per second speed)
  const INITIAL_FALL_TIME_SEC = 6;

  // todo: likely need to move that elsewhere
  // Add screen height to the rectangle to avoid missing collision on fast moving objects.
  const bottom = new Rectangle(0, app.screen.height, app.screen.width, app.screen.height);

  let updateTicker: Ticker;
  let state = BombState.Idle;

  init();

  function init() {

    // Instead of rectangle bounding box clickable zone, we use a circle, that should be
    // slightly bigger than the sprite.
    container.hitArea = touchHitBox;
    container.cursor = 'pointer';
    container.on('pointerdown', catchedState);

    sprite.anchor.set(0.5);
    container.addChild(sprite);

    app.stage.addChild(container);

    enable();
    // disable(); // todo pooling.
  }

  async function catchedState() {
    // Catch errors early.
    if (state !== BombState.Falling) {
      throw new Error(`Explode state called with wrong state ${state}`);
    }
    state = BombState.Catched;
    // move out of screen with a bounce, while scaling down a bit (ease fc type log)
    // and a strong rotation
    // maybe explosion in background ?
    container.position.y = -sprite.height*2; // good temp solution

    updateTicker.stop(); // todo: should be a cleanup handled where we add that state initially
    container.interactive = false;

    // Animate
    await new Promise(resolve => setTimeout(resolve, 1000));
    disable();



    // todo: each state, in and out (, param fromState ?)
  }

  function update() {
    // update hitbox position.
    explodeHitBox.x = container.position.x;
    explodeHitBox.y = container.position.y;
    const explode = circRect(explodeHitBox, bottom);

    if (!explode) {
      // Move downward
      // Approximate total fall height to screen.height.
      container.position.y += (app.screen.height / INITIAL_FALL_TIME_SEC) * (app.ticker.deltaMS / 1000);
    } else {
      // Remove one live
      explodeState(); // todo state handling, each his coroutine ?
      // Call right after state has been changed to Exploding or explodeState will be called twice for this bomb.
      onExplode();
    }
  }

  // todo anim
  async function explodeState() {
    if (state !== BombState.Falling) {
      throw new Error(`Explode state called with wrong state ${state}`);
    }
    state = BombState.Exploding;

    // Stop update loop
    updateTicker.stop();

    // Too late to "catch" it.
    container.interactive = false;

    // Animate
    await new Promise(resolve => setTimeout(resolve, 1000));
    disable();
  }


  function enable() {
    state = BombState.Falling;

    container.visible = true;
    container.interactive = true;

    // Initial position
    container.position.y = -sprite.height*2;
    const HORIZONTAL_SPAWN_MARGIN_PX = 50;
    const rand = biasedRandom({
      min: 0,
      max: 1,
      previous: previousXRandom,
      avoidRange: 0.1,
      avoidProbability: 0.75,
    });
    container.position.x = HORIZONTAL_SPAWN_MARGIN_PX + rand * (app.screen.width - HORIZONTAL_SPAWN_MARGIN_PX*2 - sprite.width);

    updateTicker = new Ticker();
    updateTicker.add(update);
    updateTicker.start();
  }

  function disable() {
    state = BombState.Idle;
    container.visible = false;
    container.interactive = false;

    // Note: Should only be destroyed once, cannot be re-used as elapsedMS/deltaTime are not resetted on stop().
    updateTicker.destroy();
  }


  // random start position, angle
  // difficulty increase (as param of useBomb?)
  // state explode
  // trail renderer
  // sound?

  return {
    /**
     * Explode if currently falling, safe to call.
     */
    explodeNow: () => {
      if (state === BombState.Falling) {
        return explodeState();
      }
      return Promise.resolve();
    }
  }
}
