import { Application } from 'pixi.js';


export function setBasicOptions(app: Application) {
  window.document.body.style.backgroundColor = 'black';
  app.ticker.maxFPS = 144;

  // resize so that the entire canvas always stay visible. Should not impact gameplay.
  // should be combined with overflow: hidden, as browser is 4px bigger for an unknown reason.
  app.view.style.height = 'max(500px, 100vh)';
}
