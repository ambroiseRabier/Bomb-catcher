import { Application, Container, Sprite } from 'pixi.js';


export function gameScreen(app: Application) {
  // Negligible sync loading time
  const background = Sprite.from('/placeholders/Background.PNG');
  const bomb = Sprite.from('/placeholders/Bomb.PNG');

  const container = new Container();

  app.stage.addChild(container);



  return {
    enable() {

    }
  }
}
