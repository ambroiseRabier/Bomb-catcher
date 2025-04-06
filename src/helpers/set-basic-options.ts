import { Application } from 'pixi.js';


export function setBasicOptions(app: Application) {
  window.document.body.style.backgroundColor = 'black';
  app.ticker.maxFPS = 144;
}
