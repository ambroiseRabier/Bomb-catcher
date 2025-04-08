import { AnimatedSprite, Application, Assets, Ticker } from 'pixi.js';
import { assets } from './assets';

/**
 * Doesn't really fit the theme, but haven't found better.
 * I wanted something to show the time to the player, and also indicate when
 * the difficulty increases.
 */
export function usePlane() {
  const PLANE_SIZE_QUICK_FIX = 0.5; // ideally, this is done on GA side (krita...)
  const plane: AnimatedSprite = AnimatedSprite.fromFrames(
    Assets.cache.get(assets.game.planeSP).data.animations['frame']
  );

  plane.anchor.set(0.5);
  plane.gotoAndPlay(0);
  plane.loop = true;
  plane.scale.set(PLANE_SIZE_QUICK_FIX);

  return {
    container: plane,
    leftToRight(app: Application) {
      plane.visible = true;
      plane.position.x = -plane.width;
      plane.scale.x = -Math.abs(plane.scale.x);

      const move = (ticker: Ticker) => {
        plane.position.x += app.screen.width * (ticker.deltaMS / 1000);
        if (plane.position.x > app.screen.width + plane.width) {
          app.ticker.remove(move);
          plane.visible = false;
        }
      };

      app.ticker.add(move);
    },
    rightToLeft(app: Application) {
      plane.visible = true;
      plane.position.x = plane.width + app.screen.width;
      plane.scale.x = Math.abs(plane.scale.x);

      const move = (ticker: Ticker) => {
        plane.position.x -= app.screen.width * (ticker.deltaMS / 1000);
        if (plane.position.x < -plane.width) {
          app.ticker.remove(move);
          plane.visible = false;
        }
      };

      app.ticker.add(move);
    },
  };
}
