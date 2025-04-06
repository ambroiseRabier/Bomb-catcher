import { Application, Container, Sprite } from 'pixi.js';

interface Props {
  app: Application;
  playClick: () => void;
}

export function useTitleScreen({app, playClick}: Props) {
  // Negligible sync loading time
  const background = Sprite.from('/placeholders/titlescreen/Background.PNG');
  const playBtn = Sprite.from('/placeholders/titlescreen/PlayBtn.PNG');
  const title = Sprite.from('/placeholders/titlescreen/Title.PNG');

  const container = new Container();

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
  playBtn.buttonMode = true;
  playBtn.on('pointerdown', () => {
    // anim then
    playClick();
  });
  playBtn.on('mouseover', () => {
    playBtn.tint = 0x9acd32; // Slightly change color on hover
  });
  playBtn.on('mouseout', () => {
    playBtn.tint = 0xFFFFFF; // Reset tint when no longer hovering
  });
  container.addChild(playBtn);

  container.visible = false;
  app.stage.addChild(container);

  return {
    enable: () => {
      container.visible = true;
    },
    disable: () => {
      container.visible = false;
    }
  }
}
