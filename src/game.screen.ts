import { Application, Assets, Container, Sprite, Ticker, Text } from 'pixi.js';
import { Bomb, spawnBomb } from './spawn-bomb';
import { assets } from './assets';
import { useGameOverScreen } from './game-over.screen';
import { screenShake } from './screenshake';
import { useGameTime } from './game-time';
import settings from './settings';

// todo: move that into a config file.
const TOTAL_LIVES = 9;


enum GameState {
  Playing = 'Playing',
  GameOver = 'GameOver',
  PreGameOver = 'PreGameOver',
}

export function useGameScreen(app: Application) {
  let loaded = false;
  let inited = false;
  const SCREEN_SHAKE_FORCE = 50; // 25 max on y or x
  const container = new Container();
  const lifeText = new Text(TOTAL_LIVES.toString());
  let lives: number;
  const bombs: Bomb[] = [];
  let state = GameState.GameOver;
  /**
   * Since how long the game has started.
   * In ms.
   */
  const gameTime = useGameTime(app);


  function init() {
    const background = Sprite.from(assets.game.background);

    // Background
    background.position.set(app.screen.width/2, app.screen.height/2);
    background.anchor.set(0.5);
    // Small hack on background image so that screen shake doesn't show white borders
    background.scale.set((app.screen.width+SCREEN_SHAKE_FORCE*2) / app.screen.width);
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
    if (state !== GameState.PreGameOver) {
      throw new Error(`Game over called with wrong state ${state}`);
    }
    state = GameState.GameOver;

    // Retry?
    gameOverScreen.enable(container);
  }

  async function preGameOver(explosionAnim: Promise<void>) {
    if (state !== GameState.Playing) {
      throw new Error(`Pre Game over called with wrong state ${state}`);
    }
    state = GameState.PreGameOver;

    gameTime.end();

    // Stop spawning bombs
    app.ticker.remove(bombSpawnTick);

    // Waiting for explosion to finish is a little dramatic touch
    // and also avoid screenshake to misplace the game over screen.
    await explosionAnim;

    const BOMB_EXPLO_GAP_MS = 100;

    const explosions = bombs
      .sort((a,b) => b.positionY - a.positionY)
      .map((bomb, index) => new Promise<void>(resolve => {
        setTimeout(
          () => {
            bomb.explodeNow().then(resolve);
          },
          index * BOMB_EXPLO_GAP_MS
        );
      }));

    await Promise.all(explosions);
    bombs.length = 0;

    gameOver();
  }

  let elapsedTime = 0;
  function bombSpawnTick(ticker: Ticker) {
    if (lives <= 0) {
      throw new Error('Unexpected spawning of bomb when lives <= 0');
    }

    // Math.min fix the issue of alt-tabbing making a lot of bombs spawn at once (PIXIJS pause itself but
    // elapsedMS time still grow, there might be a better solution).
    elapsedTime += Math.min(ticker.elapsedMS, 100);

    // 60 bomb per minutes, is 1 bomb per second, is 1 bomb every 1000ms
    // 30 bomb per minutes, 0.5 bomb per second, 1 bomb every 2000ms
    const bombPerMs = 1000 / (settings.bomb.bombPerMin(gameTime.elapsedTime) / 60);

    if (elapsedTime >= bombPerMs) {
      // console.debug('bombPerMs ' + bombPerMs);
      elapsedTime -= bombPerMs;

      function onExplode(explosionAnim: Promise<void>) {
        lives--;
        lifeText.text = lives.toString();
        screenShake(container, SCREEN_SHAKE_FORCE, 0.2);
        if (lives <= 0 && state === GameState.Playing) {
          preGameOver(explosionAnim);
        }
      }

      const bomb = spawnBomb({
        app,
        onExplode,
        diagonal: false,
        fallTimeSec: settings.bomb.fallTimeSec(gameTime.elapsedTime),
      });
      bombs.push(bomb);

      // Small chance of spawning a bomb with a different fall angle
      const ALSO_SPAWN_DIAGONAL = .25;
      if (Math.random() < ALSO_SPAWN_DIAGONAL) {
        const bomb = spawnBomb({
          app,
          onExplode,
          diagonal: true,
          fallTimeSec: settings.bomb.fallTimeSec(gameTime.elapsedTime),
        });
        bombs.push(bomb);
      }
    }
  }


  function gameStart() {
    if (state !== GameState.GameOver) {
      throw new Error(`Game start called with wrong state ${state}`);
    }
    state = GameState.Playing;

    gameTime.start();

    lives = TOTAL_LIVES;
    lifeText.text = lives.toString();
    app.ticker.add(bombSpawnTick);
  }

  return {
    /**
     * We need to load some assets to make sure the sprite doesn't return 1 px in size.
     * Also since switching from PIXI 6 to 8, that's a requirement.
     */
    async load() {
      await Assets.load(Object.values(assets.game));
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
