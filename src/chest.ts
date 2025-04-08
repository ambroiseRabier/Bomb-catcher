import { AnimatedSprite, Assets } from 'pixi.js';
import { assets } from './assets';

export function useChest() {
  const chest: AnimatedSprite = AnimatedSprite.fromFrames(
    Assets.cache.get(assets.game.chestSP).data.animations['frame']
  );

  chest.anchor.set(0.5, 1);
  chest.gotoAndStop(0);

  return {
    container: chest,
    reset() {
      chest.gotoAndStop(0);
    },
    loseLive() {
      if (chest.currentFrame < chest.totalFrames) {
        chest.gotoAndStop(chest.currentFrame + 1);
      }
    },
  };
}
