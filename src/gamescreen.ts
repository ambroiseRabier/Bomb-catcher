import { Application, Container, Loader, Sprite } from 'pixi.js';
import { spawnBomb } from './spawn-bomb';


export function useGameScreen(app: Application) {
  // Negligible sync loading time
  const background = Sprite.from('/placeholders/game/Background.PNG');
  const container = new Container();


  background.position.set(0,0);
  background.anchor.set(0,0);
  container.addChild(background);
  app.stage.addChild(container);

  // app.ticker.add(() => {
  //
  // });
  // Math fc to increase diff, and change the curve to steps. with a max playtime defined ?



  return {
    /**
     * We need to preload some assets to make sure the sprite doesn't return 1 px in size.
     */
    async preload() {
      return new Promise<void>((resolve, reject) => {
        const loader = new Loader();
        // todo: maybe put into gameSprite.ts which provide all sprite in an object.
        loader.add('bomb', '/placeholders/game/Bomb.PNG');
        loader.load(() => {
          resolve();
        });
      });
    },
    enable() {
        spawnBomb(app);
      // setInterval(() => {
      //   spawnBomb(app);
      // },500);
    }
  }
}
