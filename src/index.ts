// Import the html file so that it is added to the bundle.
import './index.html';

import { Application } from 'pixi.js';
import { setBasicOptions } from './helpers/set-basic-options';
import { useTitleScreen } from './title.screen';
import { useGameScreen } from './game.screen';


const app = new Application();
await app.init({
  // You should also update tauri.conf.json is you change width or height.
  width: 720,
  height: 1280,
  backgroundColor: 0xeeeeee,
  antialias: true
});

// If we have less space, downscale, if we have more, don't upscale.
app.canvas.style.height = 'min(1280px, 100vh)';

setBasicOptions(app);
document.body.appendChild(app.canvas);

let gameScreenLoad: Promise<unknown>;
const gameScreen = useGameScreen(app);
const titleScreen = useTitleScreen({
  app,
  playClick: async () => {
    // Animation here. It will also give us some more loading (not that it is necessary in this small game).
    // Make sure loading has finished before proceeding.
    await gameScreenLoad;
    titleScreen.disable();
    gameScreen.enable();
  },
});

// Load fast, if not, we need to add a loading screen.
await titleScreen.load();
titleScreen.enable();

// Immediately start loading the game screen, but no need to await it here
gameScreenLoad = gameScreen.load();

// Set TAURI to false if you want to develop on web browser instead of Tauri (desktop).
const TAURI = false;

if (TAURI) {
  // This is old and may be refactored into await import.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./init-tauri');
}
