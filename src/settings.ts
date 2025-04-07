// NOTE: Screenshot in GD.md of the curve.

// May be slightly higher due to ceil.
const INITIAL_FALL_TIME_SEC = 8;
const MIN_FALL_TIME = 1;

// Desmos
// h\left(x\right)=c\cdot\frac{\log\left(\frac{a-x}{k}\right)}{\log\left(\frac{a}{k}\right)}
function h(x: number, a: number, c: number, k: number) {
  return c * (Math.log((a - x) / k) / Math.log(a / k));
}

/**
 * Target is a confirmed gamer (FDJ game dev), with short gameplay 1min-2min per run.
 */
const prodSettings = {
  lives: 9,
  bomb: {
    // Fall time based on screen height (1280) (easier to reason with than pixels per second speed)
    fallTimeSec: (t: number): number => {
      // Desmos
      // g\operatorname{ceil}\left(\frac{h\left(x\right)}{g}\right)
      function gCeil(x: number, g: number) {
        return g * Math.ceil(x / g);
      }

      return Math.max(
        MIN_FALL_TIME,
        // Highly recommend using Desmos to visualize the curve.
        // a represent where the curve goes to infinite minus, at a=84 and k=20, y=0 at x=66 (0 fall time at x=66)
        // k modify the curve profile,
        // g how many steps there are, 5 steps at g=2
        gCeil(h(t, 130, INITIAL_FALL_TIME_SEC, 40), 1.6)
      );
    },
    bombPerMin: (t: number): number => {
      // Trying to avoid increase of bombs being at the same time as the increase of speed.
      // which is why it re-uses part of fallTime formula.

      // Desmos
      // 5g\operatorname{ceil}\left(\frac{-0.6h\left(x-15\right)}{g}\right)+70
      function compute(x: number, g: number, a: number, c: number, k: number): number {
        return 5 * g * Math.ceil((-0.6 * h(x - 15, a, c, k)) / g) + 70;
      }

      // Same as falltime
      return compute(t, 1.6, 130, INITIAL_FALL_TIME_SEC, 40);
    },
  },
};

// Settings to be used to quickly test something
const devSettings = {
  lives: prodSettings.lives,
  bomb: {
    fallTimeSec: prodSettings.bomb.fallTimeSec,
    bombPerMin: prodSettings.bomb.bombPerMin,
  },
};

export default devSettings;
