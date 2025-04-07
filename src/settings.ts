const prodSettings = {
  bomb: {
    // Fall time (easier to reason with than pixels per second speed)
    INITIAL_FALL_TIME_SEC: 6
  }
};

// Settings to be used to quickly test something
const devSettings = {
  bomb: {
    fallTimeSec: (t: number): number => {
      // NOTE: Screenshot in GD.md of the curve.

      // May be slightly higher due to ceil.
      const INITIAL_FALL_TIME_SEC = 8;
      const MIN_FALL_TIME = 1;

      // Desmos
      // h\left(x\right)=c\cdot\frac{\log\left(\frac{a-x}{k}\right)}{\log\left(\frac{a}{k}\right)}
      function h(x: number, a: number, c: number, k: number) {
        return c * (Math.log((a - x) / k) / Math.log(a / k));
      }

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
    }
  }
};



export default devSettings;
