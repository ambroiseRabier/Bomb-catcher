import { Application, Assets, Container, Sprite } from 'pixi.js';
import { assets } from './assets';

interface Props {
  app: Application;
  playClick: () => void;
}

export function useTitleScreen({app, playClick}: Props) {
  let loaded = false;
  let inited = false;
  const container = new Container();

  function init() {
    // Negligible sync loading time (otherwise we would need a loading screen)
    const background = Sprite.from(assets.titlescreen.background);
    const playBtn = Sprite.from(assets.titlescreen.playBtn);
    const title = Sprite.from(assets.titlescreen.title);

    // Ideally, positioning is done in some kind of editor.
    container.addChild(background);

    // Title
    title.anchor.set(0.5, 0);
    title.position.set(app.screen.width/2, 100);
    container.addChild(title);

    // PlayBtn
    playBtn.anchor.set(0.5, 1);
    playBtn.position.set(app.screen.width/2, app.screen.height - 100);
    playBtn.interactive = true;
    playBtn.cursor = 'pointer';
    playBtn.on('pointerdown', () => {
      // anim then
      playClick();
    });
    playBtn.on('mouseenter', () => {
      playBtn.tint = '#EFBF04';
    });
    playBtn.on('mouseout', () => {
      playBtn.tint = 0xFFFFFF;
    });
    container.addChild(playBtn);

    app.stage.addChild(container);
  }

  return {
    load: async () => {
      await Assets.load(Object.values(assets.titlescreen));
      loaded = true;
    },
    /**
     * Make sure to call load first.
     */
    enable: () => {
      // Safeguard
      if (!loaded) {
        throw new Error('Game screen not loaded');
      }
      // auto-init
      if (!inited) {
        init();
        inited = true;
      }
      container.visible = true;
      container.interactive = true;
    },
    disable: () => {
      container.visible = false;
      container.interactive = false;
    }
  }
}
