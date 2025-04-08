import { Application, Assets, Container, Sprite, Text, TextStyle } from 'pixi.js';
import { assets } from './assets';
import gsap from 'gsap';
import { buttonStyle } from './text-style';

interface Props {
  app: Application;
  playClick: () => void;
}

export function useTitleScreen({ app, playClick }: Props) {
  let loaded = false;
  let inited = false;
  const container = new Container();

  function init() {
    // Negligible sync loading time (otherwise we would need a loading screen)
    const background = Sprite.from(assets.titlescreen.background);
    const title = Sprite.from(assets.titlescreen.title);
    const playBtnStyle = new TextStyle({
      ...buttonStyle,
      fontSize: 100,
      letterSpacing: 6,
    });
    const playBtn = new Text({ text: 'PLAY', style: playBtnStyle });

    // Ideally, positioning is done in some kind of editor.
    background.position.y = 0;
    container.addChild(background);

    // Title
    title.anchor.set(0.5, 0);
    title.position.set(app.screen.width / 2, 100);
    container.addChild(title);

    // PlayBtn
    playBtn.anchor.set(0.5, 1);
    playBtn.position.set(app.screen.width / 2, app.screen.height - 150);
    playBtn.interactive = true;
    playBtn.cursor = 'pointer';
    playBtn.on('pointerdown', async () => {
      // Anim
      playBtn.visible = false; // no anim for this one
      await Promise.all([
        // it is exactly 305 pixel more than 1280 screen.
        gsap.to(background, { y: -305, duration: 2.618, ease: 'power2.out' }),
        gsap.to(title, { y: title.y - 50, alpha: 0, duration: 0.809, ease: 'power2.out' }),
        gsap.to(title.scale, { y: 0.9, x: 0.9, duration: 0.809, ease: 'power2.out' }),
      ]);

      playClick();
    });
    playBtn.on('mouseenter', () => {
      playBtn.tint = '#EFBF04';
    });
    playBtn.on('mouseout', () => {
      playBtn.tint = 0xffffff;
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
    },
  };
}
