import { Application, Assets, Container, Point, Sprite, Ticker } from 'pixi.js';
import { Bomb, spawnBomb } from './spawn-bomb';
import { assets } from './assets';
import { useGameOverScreen } from './game-over.screen';
import { screenShake } from './helpers/screenshake';
import { useGameTime } from './helpers/game-time';
import settings from './settings';
import { ShockwaveFilter } from 'pixi-filters';
import gsap from 'gsap';
import { useRainbow } from './rainbow';
import { useChest } from './chest';
import { usePlane } from './plane';
import { useGueux } from './gueux';

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
  // Should be lower than 72px, that is the margin on the background.
  const SCREEN_SHAKE_FORCE = 50; // 25 max on y or x
  const SCREEN_SHAKE_DURATION = 0.2;
  const container = new Container();
  let lives: number;
  const bombs: Bomb[] = [];
  let state = GameState.GameOver;
  /**
   * Since how long the game has started.
   * In ms.
   */
  const gameTime = useGameTime(app);
  const rainbow = useRainbow();
  let chest: ReturnType<typeof useChest>;
  /**
   * Plane that appears when the speed of bombs goes up. (feedback on time and difficulty)
   * PS: As a player I really want to be able to click the plane, but that's another feature.
   */
  let planeSpeedIncrease: ReturnType<typeof usePlane>;
  /**
   * Same as planeSpeedIncrease but for quantity
   */
  let planeQuantityIncrease: ReturnType<typeof usePlane>;

  let gueux: ReturnType<typeof useGueux>;

  function init() {
    const background = Sprite.from(assets.game.background);

    // Background
    background.position.set(app.screen.width / 2, app.screen.height / 2);
    background.anchor.set(0.5);
    background.filters = [shockwaveFilter];
    container.addChild(background);

    // Rainbow
    rainbow.container.position.set(app.screen.width / 2, app.screen.height + 5); // 5 offset
    container.addChild(rainbow.container);

    // Sprite needs to be loaded first.
    chest = useChest();
    // Placing the chest correctly +3 and -80, and -64 for the background margin bottom.
    chest.container.position.set(app.screen.width / 2 + 3, app.screen.height - 79 - 64);
    container.addChild(chest.container);

    // Gueux
    gueux = useGueux(app.screen, chest.container.position);
    container.addChild(gueux.container);

    // Planes
    planeSpeedIncrease = usePlane();
    planeSpeedIncrease.container.position.y = planeSpeedIncrease.container.height / 2 + 20;
    planeSpeedIncrease.container.visible = false;
    container.addChild(planeSpeedIncrease.container);
    planeQuantityIncrease = usePlane();
    planeQuantityIncrease.container.position.y = planeQuantityIncrease.container.height / 2 + 40;
    planeQuantityIncrease.container.visible = false;
    container.addChild(planeQuantityIncrease.container);

    app.stage.addChild(container);
  }

  const gameOverScreen = useGameOverScreen({
    app,
    retryClick: () => {
      gameOverScreen.disable();
      gameStart();
    },
  });

  async function gameOver() {
    // Catch errors early.
    if (state !== GameState.PreGameOver) {
      throw new Error(`Game over called with wrong state ${state}`);
    }
    state = GameState.GameOver;

    // Safeguard: Reset container position (shouldn't be needed since we wait for screenshake to finish)
    container.position.set(0);

    gueux.start();

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

    bombs.forEach(bomb => {
      bomb.freeze();
    });

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
    bombs.length = 0;

    // Waiting for explosion to finish is a little dramatic touch
    // and also avoid screenshake to misplace the game over screen.
    await Promise.all([
      ...explosions,
      explosionAnim,
      // Also await screenshake duration, in case it take more time than the explosion anim.
      // + margin of 100
      new Promise(resolve => setTimeout(resolve, SCREEN_SHAKE_DURATION * 1000 + 100)),
    ]);

    gameOver();
  }

  let elapsedTime = 0;
  let previousBombPerMin = settings.bomb.bombPerMin(0); // already ceiled in formula
  let previousFallTime = settings.bomb.fallTimeSec(0); // already ceiled in formula

  function onExplode(explosionAnim: Promise<void>, pos: Point) {
    lives--;
    // max 7 bows to remove.
    if (lives <= 8 && lives >= 2) {
      rainbow.loseBow();
    }
    if (lives < 2 && lives >= 0) {
      chest.loseLive();
    }
    screenShake(container, SCREEN_SHAKE_FORCE, SCREEN_SHAKE_DURATION);
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

    if (lives <= 0) {
      preGameOver(explosionAnim);
    }
  }

  function bombSpawnTick(ticker: Ticker) {
    if (lives <= 0) {
      throw new Error('Unexpected spawning of bomb when lives <= 0');
    }

    // Math.min fix the issue of alt-tabbing making a lot of bombs spawn at once (PIXIJS pause itself but
    // elapsedMS time still grow, there might be a better solution).
    elapsedTime += Math.min(ticker.elapsedMS, 100);

    // Note: this has no catchup mechanism, can spawn max 1 bomb per tick.
    // 60 bomb per minutes, is 1 bomb per second, is 1 bomb every 1000ms
    // 30 bomb per minutes, 0.5 bomb per second, 1 bomb every 2000ms
    const bombPerMs = 1000 / (settings.bomb.bombPerMin(gameTime.elapsedTime) / 60);

    if (elapsedTime >= bombPerMs) {
      if (previousBombPerMin !== settings.bomb.bombPerMin(gameTime.elapsedTime)) {
        previousBombPerMin = settings.bomb.bombPerMin(gameTime.elapsedTime);
        planeQuantityIncrease.leftToRight(app);
        // console.debug('bombPerMs ' + bombPerMs);
      }

      elapsedTime -= bombPerMs;

      const fallTime = settings.bomb.fallTimeSec(gameTime.elapsedTime);
      if (previousFallTime !== fallTime) {
        previousFallTime = fallTime;
        // Different plane, in rare case where both speed and quantity get increased at once.
        // Gd tries to avoid both at the same time.
        planeSpeedIncrease.rightToLeft(app);
        // console.debug('fallTime ' + fallTime);
      }

      const removeBomb = (bomb: (typeof bombs)[number]) => bombs.splice(bombs.indexOf(bomb), 1);

      const bomb = spawnBomb({
        app,
        onExplode: (...params) => {
          // Remove the bomb, so that we won't wait for it at pre-gameover anim.
          removeBomb(bomb);
          onExplode(...params);
        },
        onCatch: () => removeBomb(bomb),
        diagonal: false,
        fallTimeSec: fallTime,
      });
      bombs.push(bomb);

      // Small chance of spawning a bomb with a different fall angle
      if (Math.random() < settings.alsoSpawnDiagonalProb) {
        const bombDiag = spawnBomb({
          app,
          onExplode: (...params) => {
            // Remove the bomb, so that we won't wait for it at pre-gameover anim.
            removeBomb(bombDiag);
            onExplode(...params);
          },
          onCatch: () => removeBomb(bombDiag),
          diagonal: true,
          fallTimeSec: fallTime,
        });
        bombs.push(bombDiag);
      }
    }
  }

  function gameStart() {
    if (state !== GameState.GameOver) {
      throw new Error(`Game start called with wrong state ${state}`);
    }
    state = GameState.Playing;

    // No need to wait for gueux to be gone to start bombing.
    gueux.stop();

    gameTime.start();

    lives = settings.lives;
    rainbow.reset();
    chest.reset();
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
