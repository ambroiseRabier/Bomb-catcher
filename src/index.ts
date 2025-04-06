// Import the html file so that it is added to the bundle.
import './index.html';

// You can import images this way
import spaceshipPNG from './spaceship.png';

import {Application, Sprite} from 'pixi.js';
import { setBasicOptions } from './helpers/set-basic-options';
import { useTitleScreen } from './titlescreen';
import { useGameScreen } from './gamescreen';


const app = new Application({
  // You should also update tauri.conf.json is you change width or height.
  width: 720,
  height: 1280,
  backgroundColor: 0xEEEEEE
});
// If we have less space, downscale, if we have more, don't upscale.
app.view.style.height = 'min(1280px, 100vh)';

setBasicOptions(app);
document.body.appendChild(app.view);

const gameScreen = useGameScreen(app);
const titleScreen = useTitleScreen({
  app,
  playClick: () => {
    titleScreen.disable();
    gameScreen.enable();
  }
});

titleScreen.enable();


// const player = Sprite.from(spaceshipPNG);
//
//
// // Center the sprite's anchor point
// player.anchor.set(0.5);
//
// // Move the sprite to the center of the screen
// player.x = app.renderer.width / 2;
// player.y = app.renderer.height / 2;
// player.scale.set(0.15);
//
// app.stage.addChild(player);
//
// app.ticker.add(() => {
//   player.rotation += 0.02 * app.ticker.deltaTime;
// });
//
// const bunny = Sprite.from('/bunny.png');
// app.stage.addChild(bunny);
// bunny.position.set(50, 50);

// set TAURI to false if you want to develop on web browser instead of Tauri.
// requiring it that way, also make the error not break this script here.
const TAURI = false;

if (TAURI) {
  require('./init-tauri');
}
