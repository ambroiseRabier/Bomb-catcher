import { assets } from './assets';
import { Container, Point, Rectangle, Sprite } from 'pixi.js';
import gsap from 'gsap';

export function useGueux(screen: Rectangle, chestPos: Point) {
  const gueuxA = Sprite.from(assets.game.gueuxA);
  const gueuxB = Sprite.from(assets.game.gueuxB);
  const container = new Container();
  let lastRunSignal = false;
  let activeRun: Promise<void> = Promise.resolve();

  gueuxA.visible = false;
  gueuxA.anchor.set(0.5, 1);
  gueuxB.visible = false;
  gueuxB.anchor.set(0.5, 1);
  container.addChild(gueuxA);
  container.addChild(gueuxB);

  async function runGueux(gueux: Sprite) {
    const Y_MARGIN = 50;
    const randomBottomXPos = () => screen.width * Math.random();
    const bottomYPosOutSideScreen = screen.height + gueux.height + Y_MARGIN;
    gueux.position.set(randomBottomXPos(), bottomYPosOutSideScreen);

    // towards the chest (a bit slow and hesitant)
    // Note: haven't found how to target nested properties :/, since rough is random, this will give slightly incorrect results
    gsap.to(gueux.scale, { x: 0.8, y: 0.8, duration: 3, ease: 'none' });
    await gsap.to(gueux, {
      x: chestPos.x + (Math.random() - 0.5) * 200,
      y: chestPos.y + Math.random() * 50, // random for slight visual variation
      duration: 3,
      ease: `rough({
          template: none.out,
          strength: 1,
          points:10,
          taper:out,
          randomize:true,
          clamp:false
        })`,
    });

    // towards the bottom edge (moving fast!)
    gsap.to(gueux.scale, { x: 1, y: 1, duration: 1, ease: 'back.in(1)' });
    await gsap.to(gueux, {
      x: randomBottomXPos(),
      y: bottomYPosOutSideScreen, // random for slight visual variation
      duration: 1,
      ease: 'back.in(1)',
    });

    gueux.scale.set(1);
  }

  async function run() {
    const RUN_DELAY_MS = 1000;
    while (!lastRunSignal) {
      await new Promise(resolve => setTimeout(resolve, RUN_DELAY_MS));
      await Promise.all([
        Math.random() > 0.5 ? runGueux(gueuxA) : Promise.resolve(),
        Math.random() > 0.5 ? runGueux(gueuxB) : Promise.resolve(),
      ]);
    }
  }

  return {
    container,
    start() {
      lastRunSignal = false;
      gueuxA.visible = true;
      gueuxB.visible = true;
      activeRun = run();
    },
    async stop() {
      lastRunSignal = true;
      await activeRun;
      gueuxA.visible = false;
      gueuxB.visible = false;
    },
  };
}
