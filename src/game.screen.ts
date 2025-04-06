import { Application, Assets, Container, Sprite, Ticker, Text } from 'pixi.js';
import { Bomb, spawnBomb } from './spawn-bomb';
import { assets } from './assets';
import { useGameOverScreen } from './game-over.screen';
import { screenShake } from './screenshake';

// todo: move that into a config file.
const TOTAL_LIVES = 9;


enum GameState {
  Playing = 'Playing',
  GameOver = 'GameOver',
}

export function useGameScreen(app: Application) {
  let loaded = false;
  let inited = false;
  const SCREEN_SHAKE_FORCE = 50; // 25 max on y or x
  const BOMB_SPAWN_INTERVAL_MS = 1000;
  const container = new Container();
  const lifeText = new Text(TOTAL_LIVES.toString());
  let lives: number;
  let bombSpawnerTicker: Ticker;
  const bombs: Bomb[] = [];
  let state = GameState.GameOver;


  function init() {
    const background = Sprite.from(assets.game.background);

    // Background
    background.position.set(app.screen.width/2, app.screen.height/2);
    background.anchor.set(0.5);
    // Small hack on background image so that screen shake doesn't show white borders
    background.scale.set((app.screen.width+SCREEN_SHAKE_FORCE) / app.screen.width);
    container.addChild(background);

    // Life text
    lifeText.anchor.set(0.5);
    lifeText.position.set(app.screen.width/2, 150);
    lifeText.style.fill = 'red';
    container.addChild(lifeText);

    app.stage.addChild(container);
  }

  const gameOverScreen = useGameOverScreen({
    app,
    retryClick: () => {
      gameOverScreen.disable();
      gameStart();
    }
  });

  // todo: Math fc to increase diff, and change the curve to steps. with a max playtime defined ?

  async function gameOver() {
    // Catch errors early.
    if (state !== GameState.Playing) {
      throw new Error(`Game over called with wrong state ${state}`);
    }
    state = GameState.GameOver;

    // Stop spawning bombs
    bombSpawnerTicker.destroy();

    // Clear screen and animate
    await Promise.all(bombs.map(b => b.explodeNow()));
    bombs.length = 0;

    // Retry?
    gameOverScreen.enable(container);
  }


  function gameStart() {
    if (state !== GameState.GameOver) {
      throw new Error(`Game start called with wrong state ${state}`);
    }
    state = GameState.Playing;

    lives = TOTAL_LIVES;
    lifeText.text = lives.toString();
    let elapsedTime = 0;
    bombSpawnerTicker = new Ticker();
    bombSpawnerTicker.add((ticker) => {
      if (lives <= 0) {
        throw new Error('Unexpected spawning of bomb when lives <= 0');
      }

      // Math.min fix the issue of alt-tabbing making a lot of bombs spawn at once (PIXIJS pause itself but
      // elapsedMS time still grow, there might be a better solution).
      elapsedTime += Math.min(ticker.elapsedMS, 100);

      if (elapsedTime >= BOMB_SPAWN_INTERVAL_MS) {
        elapsedTime -= BOMB_SPAWN_INTERVAL_MS;

        function onExplode() {
          lives--;
          lifeText.text = lives.toString();
          screenShake(container, SCREEN_SHAKE_FORCE, 2.25);
          if (lives <= 0) {
            gameOver();
          }
        }

        const bomb = spawnBomb({
          app,
          onExplode,
          diagonal: false,
        });
        bombs.push(bomb);

        // Small chance of spawning a bomb with a different fall angle
        const ALSO_SPAWN_DIAGONAL = .25;
        if (Math.random() < ALSO_SPAWN_DIAGONAL) {
          const bomb = spawnBomb({
            app,
            onExplode,
            diagonal: true,
          });
          bombs.push(bomb);
        }
      }
    });
    bombSpawnerTicker.start();
  }

  return {
    /**
     * We need to load some assets to make sure the sprite doesn't return 1 px in size.
     * Also since switching from PIXI 6 to 8, that's a requirement.
     */
    async load() {
      await Assets.load(Object.values(assets.game)).then((a)=> console.log(a));
      loaded = true;
    },

    enable() {
      // Safeguard
      if (!loaded) {
        throw new Error('Game screen not loaded');
      }

      // Auto-init
      if (!inited) {
        init();
        inited = true;
      }

      gameStart();
    }
  }
}
