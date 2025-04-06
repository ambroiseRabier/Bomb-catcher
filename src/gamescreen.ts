import { Application, Assets, Container, Sprite, Ticker } from 'pixi.js';
import { spawnBomb } from './spawn-bomb';
import { assets } from './assets';

// todo: move that into a config file.
const TOTAL_LIVES = 9;



export function useGameScreen(app: Application) {
  // Negligible sync loading time
  const background = Sprite.from(assets.game.background);
  const container = new Container();

  background.position.set(0,0);
  background.anchor.set(0,0);
  container.addChild(background);
  app.stage.addChild(container);

  // todo: Math fc to increase diff, and change the curve to steps. with a max playtime defined ?

  let lives = TOTAL_LIVES;
  let bombSpawnerTicker: Ticker;

  function gameOver() {
    // display score and retry screen. with a background that is 50% alpha gray ?
    // explode all bomb also
    bombSpawnerTicker.destroy();
  }

  const BOMB_SPAWN_INTERVAL_MS = 1000;

  function gameStart() {
    let elapsedTime = 0;
    bombSpawnerTicker = app.ticker.add((ticker) => {
      if (lives <= 0) {
        throw new Error('Unexpected spawning of bomb when lives <= 0');
      }

      elapsedTime += ticker.elapsedMS;

      if (elapsedTime >= BOMB_SPAWN_INTERVAL_MS) {
        elapsedTime -= BOMB_SPAWN_INTERVAL_MS;
        spawnBomb({
          app,
          onExplode: () => {
            lives--;
            if (lives <= 0) {
              gameOver();
            }
          }
        })
      }
    });
  }

  return {
    /**
     * We need to load some assets to make sure the sprite doesn't return 1 px in size.
     * Also since switching from PIXI 6 to 8, that's a requirement.
     */
    async load() {
      return Assets.load(Object.values(assets.game));
    },

    enable() {
      gameStart();
    }
  }
}
