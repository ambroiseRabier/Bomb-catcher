import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';

export function useRainbow() {
  const rainbowColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x8b00ff];
  const startRadius = 600; // Radius of the largest arc
  const arcWidth = 20; // Width of each arc (ring)
  const container = new Container();

  // Iterate over each color to draw the arcs
  const bows = rainbowColors.map((color, index) => {
    const outerRadius = startRadius - index * arcWidth;
    const innerRadius = outerRadius - arcWidth;

    // Draw the half-circle for this color
    const g = new Graphics();
    g.arc(0, 0, outerRadius, Math.PI, 0) // Half circle (PI to 0 radians)
      .arc(0, 0, innerRadius, 0, Math.PI, true) // Inner arc to close the ring
      .closePath()
      .fill(color);

    container.addChild(g);

    return g;
  });

  let index = 0;

  return {
    container,
    reset() {
      index = 0;
      bows.forEach((bow, index) => {
        bow.visible = true;
        gsap.fromTo(
          bow,
          { angle: 180 },
          { angle: 0, duration: 1, delay: (bows.length - 1 - index) * 0.05, ease: 'none' }
        );
      });
    },
    loseBow() {
      if (index > bows.length) {
        throw new Error('No more bows to lose');
      }

      const localIndex = index;
      index++;

      gsap.fromTo(
        bows[localIndex],
        { alpha: 1 },
        {
          duration: 1,
          alpha: 0,
          ease: 'power1.inOut',
          onComplete: () => {
            bows[localIndex].visible = false;
            bows[localIndex].alpha = 1;
          },
        }
      );
    },
  };
}
