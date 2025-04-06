import { Application } from 'pixi.js';


export function setBasicOptions(app: Application) {
  window.document.body.style.backgroundColor = '#FEFEFE';
  app.ticker.maxFPS = 144;
}
