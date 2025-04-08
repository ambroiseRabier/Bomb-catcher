import { Application, Circle, Container, Point, Rectangle, Sprite } from 'pixi.js';
import { circRect } from './helpers/collisions';
import { assets } from './assets';
import { biasedRandom } from './helpers/biased-random';
import gsap from 'gsap';

interface Props {
  app: Application;
  onExplode: (explosionAnim: Promise<void>, position: Point) => void;
  onCatch: () => void;
  diagonal: boolean;
  fallTimeSec: number;
}

let previousXRandom = Math.random();
const previousFirstAngleSign = Math.random() > 0 ? 1 : -1;

enum BombState {
  Idle = 'Idle',
  Falling = 'Falling',
  Exploding = 'Exploding',
  Catched = 'Catched',
}

export type Bomb = ReturnType<typeof spawnBomb>;

export function spawnBomb({ app, onExplode, onCatch, diagonal, fallTimeSec }: Props) {
  // Safeguard against wrong formulas.
  if (fallTimeSec <= 0) {
    throw new Error('fallTime must be > 0');
  }

  // Note: PIXI internally cache the sprite, that means no overhead in calling this multiple times :)
  const sprite = Sprite.from(assets.game.bomb);
  const exploSprite = Sprite.from(assets.game.explosion);
  const container = new Container();
  // Bomb sprite is 42px radius.
  const TOUCH_HITBOX = new Circle(0, 0, 48);
  const TOUCH_HITBOX_2 = new Circle(0, -24, 48);
  const TOUCH_HITBOX_3 = new Circle(0, 24, 48);
  const explodeHitBox = new Circle(0, 0, 38);

  // todo: likely need to move that elsewhere
  // Add screen height to the rectangle to avoid missing collision on fast moving objects.
  const bottom = new Rectangle(0, app.screen.height, app.screen.width, app.screen.height);

  let state = BombState.Idle;
  // Fall to the bottom by default
  let fallVector = new Point(0, 1);

  init();

  function init() {
    // Instead of rectangle bounding box clickable zone, we use a circle, that should be
    // slightly bigger than the sprite.
    container.hitArea = {
      contains(x: number, y: number): boolean {
        // In addition to that, we add a hitbox slightly above and bellow to help catch fast moving object.
        // (ovoid)
        return (
          TOUCH_HITBOX.contains(x, y) ||
          TOUCH_HITBOX_2.contains(x, y) ||
          TOUCH_HITBOX_3.contains(x, y)
        );
      },
    };
    container.cursor = 'pointer';
    container.on('pointerdown', catchedState);

    // Bomb sprite anchor needs to be on the center of the bomb, not the bomb fuse.
    // This allows proper rotation to be visible
    // Sprite is 85*145, bomb radius is 42
    sprite.anchor.set(0.5, 1 - 42 / 145);
    container.addChild(sprite);

    exploSprite.anchor.set(0.5);
    container.addChild(exploSprite);

    app.stage.addChild(container);

    enable();
  }

  async function catchedState() {
    // Catch errors early.
    if (state !== BombState.Falling) {
      throw new Error(`Explode state called with wrong state ${state}`);
    }
    state = BombState.Catched;

    app.ticker.remove(update);
    container.interactive = false;

    onCatch();

    // Animate
    await Promise.race([
      gsap.to(container.scale, { x: 0.1, y: 0.1, duration: 1, ease: 'circ.out', yoyo: true }),
      gsap.to(container, {
        angle: (Math.random() * 500 + 400) * (Math.random() > 0.5 ? 1 : -1),
        duration: 1.33, // don't want it to stop spinning before it disappear
        ease: 'power2.out',
      }),
      gsap.to(container, {
        y: container.position.y - 100,
        duration: 1,
        ease: 'back.out(4)',
      }),
      gsap.to(container, {
        x:
          container.position.x +
          (40 * Math.random() + 20) * (container.position.x > app.screen.width / 2 ? 1 : -1),
        duration: 1,
        ease: 'power1.out',
      }),
    ]);

    disable();

    // todo: each state, in and out (, param fromState ?)
  }

  let alarmUsed = false;
  let alarmAnim: GSAPTween;

  function update() {
    // update hitbox position.
    explodeHitBox.x = container.position.x;
    explodeHitBox.y = container.position.y;
    const explode = circRect(explodeHitBox, bottom);

    if (!explode) {
      // Move downward
      // Approximate total fall height to screen.height.
      // Note: fall time is for a straight vertical line, diagonal bombs will take more time.
      // Note: This has the downside of making the game harder on big screens.
      const speed = (app.screen.height / fallTimeSec) * (app.ticker.deltaMS / 1000);
      container.position.y += fallVector.y * speed;
      container.position.x += fallVector.x * speed;

      // Bounce off edge to avoid being unclickable
      const right = container.position.x + TOUCH_HITBOX.radius > app.screen.width;
      const left = container.position.x - TOUCH_HITBOX.radius < 0;
      if (right || left) {
        fallVector.x *= -1;
        gsap.to(container.scale, { x: -container.scale.x, duration: 0.15, ease: 'power2.inOut',
          onComplete: () => {
            // There is a small bug where the scale is a decimal, make the bomb hard to click,
            // This doesn't solve the origin of the issue, but should be enough to prevent
            // it from entering screen while wrongly scaled.
            container.scale.x = Math.sign(container.scale.x);
          }
        });
      }
    } else {
      // Remove one live
      const explosionAnim = explodeState(); // todo state handling, each his coroutine ?
      // Call right after state has been changed to Exploding or explodeState will be called twice for this bomb.
      onExplode(explosionAnim, container.position);
    }

    if (container.position.y > app.screen.height * 0.75 && !alarmUsed) {
      alarmUsed = true;
      // alarm/siren style.
      alarmAnim = gsap.fromTo(container, { tint: 0xffffff},
        { tint: 0xff0000, yoyo: true, repeat:-1, duration: 0.33, ease: 'sine.inOut' }
      );
    }
  }

  // todo anim
  async function explodeState() {
    if (state !== BombState.Falling) {
      throw new Error(`Explode state called with wrong state ${state}`);
    }
    state = BombState.Exploding;

    // Stop update loop
    app.ticker.remove(update);

    // Too late to "catch" it.
    container.interactive = false;

    // Remove alarm anim, or explosion will be colored
    // Bomb forced to explode at game over won't have alarmAnim set though.
    if (alarmAnim) {
      alarmAnim.kill();
      container.tint = 0xffffff;
    }

    // Animate
    sprite.visible = false;
    exploSprite.visible = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    disable();
  }

  function enable() {
    state = BombState.Falling;
    sprite.visible = true;
    exploSprite.visible = false;

    container.visible = true;
    container.interactive = true;

    // Initial position
    container.position.y = -sprite.height * 1.1;
    const HORIZONTAL_SPAWN_MARGIN_PX = 25;
    const rand = biasedRandom({
      min: 0,
      max: 1,
      previous: previousXRandom,
      avoidRange: 0.15,
      avoidProbability: 0.75,
    });
    previousXRandom = rand;
    const margin = HORIZONTAL_SPAWN_MARGIN_PX + TOUCH_HITBOX.radius;
    container.position.x =
      margin +
      rand * (app.screen.width - margin * 2);
    sprite.angle = (Math.random() * 2 - 1) * 10; // visual variation

    // Move in diagonal
    // Funner if it appears in addition and not in replacement of another bomb.
    // KNOWN ISSUE: haven't found out why yet, but rarely, a bomb has the wrong scale.x, which make it hard to click and see.
    //              It could be part of the game design, but it is a bit punitive.
    if (diagonal) {
      const degToRad = Math.PI / 180;
      const angleMin = 30;
      const angleMax = 60;

      // It looks better when angle sign varies at (almost) each bomb
      const SAME_SIGN_PROBABILITY = 0.2;
      const sign =
        Math.random() < SAME_SIGN_PROBABILITY ? previousFirstAngleSign : -previousFirstAngleSign;
      const fallAngle = sign * (angleMin + Math.random() * (angleMax - angleMin)) + 90; // 90 because 0 deg angle is pointing right side
      fallVector = new Point(Math.cos(fallAngle * degToRad), Math.sin(fallAngle * degToRad));
      sprite.angle = fallAngle - 90;
    }

    app.ticker.add(update);
  }

  function disable() {
    state = BombState.Idle;
    container.visible = false;
    container.interactive = false;

    // Should already be stopped, but just in case.
    app.ticker.remove(update);
  }

  // trail renderer
  // sound?

  return {
    get positionY() {
      return container.position.y;
    },
    /**
     * Explode if currently falling, safe to call.
     * Won't trigger onExplode callback.
     */
    explodeNow: () => {
      if (state === BombState.Falling) {
        return explodeState();
      }
      return Promise.resolve();
    },
    /**
     * Since pregamover anim add some delay in explodeNow call, we don't want any bomb to get clicked
     * or to hit the ground an explode, which would mess up the animation.
     */
    freeze() {
      // Stop update loop
      app.ticker.remove(update);

      // Too late to "catch" it.
      container.interactive = false;
    }
  };
}
