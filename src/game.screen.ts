import { Application, Assets, Container, Sprite, Ticker, Text, Point } from 'pixi.js';
import { Bomb, spawnBomb } from './spawn-bomb';
import { assets } from './assets';
import { useGameOverScreen } from './game-over.screen';
import { screenShake } from './helpers/screenshake';
import { useGameTime } from './helpers/game-time';
import settings from './settings';
import { ShockwaveFilter } from 'pixi-filters';
import gsap from 'gsap';
import { useRainbow } from './rainbow';

const shockwaveFilter = new ShockwaveFilter({
  center: new Point(100, 100),
  amplitude: 50, // Strength of the distortion
  wavelength: 160, // Size of the ripple
  brightness: 1, // Brightness of the effect
  radius: 300, // Size of the shockwave
  speed: 600, // Speed of the ripple animation
  time: 0,
});

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
  const lifeText = new Text(settings.lives.toString());
  let lives: number;
  const bombs: Bomb[] = [];
  let state = GameState.GameOver;
  /**
   * Since how long the game has started.
   * In ms.
   */
  const gameTime = useGameTime(app);
  const rainbow = useRainbow();

  function init() {
    const background = Sprite.from(assets.game.background);

    // Background
    background.position.set(app.screen.width / 2, app.screen.height / 2);
    background.anchor.set(0.5);
    // Small hack on background image so that screen shake doesn't show white borders
    background.scale.set((app.screen.width + SCREEN_SHAKE_FORCE * 2) / app.screen.width);
    background.filters = [shockwaveFilter];
    container.addChild(background);

    // Rainbow
    rainbow.container.position.set(app.screen.width / 2, app.screen.height + 5); // 5 offset
    container.addChild(rainbow.container);

    // Life text
    lifeText.anchor.set(0.5);
    lifeText.position.set(app.screen.width / 2, 150);
    lifeText.style.fill = 'red';
    container.addChild(lifeText);

    app.stage.addChild(container);
  }

  const gameOverScreen = useGameOverScreen({
    app,
    retryClick: () => {
      gameOverScreen.disable();
      gameStart();
    },
  });

  // todo: Math fc to increase diff, and change the curve to steps. with a max playtime defined ?

  async function gameOver() {
    // Catch errors early.
    if (state !== GameState.PreGameOver) {
      throw new Error(`Game over called with wrong state ${state}`);
    }
    state = GameState.GameOver;

    // Retry?
    gameOverScreen.enable(container, gameTime.elapsedTime);
  }

  async function preGameOver(explosionAnim: Promise<void>) {
    if (state !== GameState.Playing) {
      throw new Error(`Pre Game over called with wrong state ${state}`);
    }
    state = GameState.PreGameOver;

    gameTime.end();

    // Stop spawning bombs
    app.ticker.remove(bombSpawnTick);

    const BOMB_EXPLO_GAP_MS = 100;

    const explosions = bombs
      .sort((a, b) => b.positionY - a.positionY)
      .map(
        (bomb, index) =>
          new Promise<void>(resolve => {
            setTimeout(() => {
              bomb.explodeNow().then(resolve);
            }, index * BOMB_EXPLO_GAP_MS);
          })
      );

    // Waiting for explosion to finish is a little dramatic touch
    // and also avoid screenshake to misplace the game over screen.
    await Promise.all([...explosions, explosionAnim]);
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

      function onExplode(explosionAnim: Promise<void>, pos: Point) {
        lives--;
        // max 7 bows to remove.
        if (settings.lives - lives <= 7) {
          rainbow.loseBow();
        }
        lifeText.text = lives.toString();
        screenShake(container, SCREEN_SHAKE_FORCE, 0.2);
        shockwaveFilter.center = pos;
        shockwaveFilter.enabled = true;
        gsap.fromTo(
          shockwaveFilter,
          { time: 0 },
          {
            time: 1,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
              shockwaveFilter.time = 0;
              shockwaveFilter.enabled = false;
            },
          }
        );

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
      const ALSO_SPAWN_DIAGONAL = 0.25;
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

    lives = settings.lives;
    rainbow.reset();
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
    },
  };
}
