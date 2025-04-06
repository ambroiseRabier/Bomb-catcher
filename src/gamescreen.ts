import { Application, Container, Sprite } from 'pixi.js';
import { spawnBomb } from './spawn-bomb';


export function useGameScreen(app: Application) {
  // Negligible sync loading time
  const background = Sprite.from('/placeholders/Background.PNG');

  const container = new Container();

  container.addChild(background);
  app.stage.addChild(container);

  // app.ticker.add(() => {
  //
  // });
  // Math fc to increase diff, and change the curve to steps. with a max playtime defined ?



  return {
    enable() {
      setInterval(() => {
        spawnBomb(app);
      },500);
    }
  }
}
