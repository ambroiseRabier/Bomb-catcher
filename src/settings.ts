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
      const INITIAL_FALL_TIME_SEC = 6;
      const HIT_0_AT_TIME = 24;
      const MIN_FALL_TIME = 1;
      const KEEP_INITIAL_FOR = 8;

      // Desmos
      // \min\left(c,\ \max\left(-d\log(x)+d\log(a),\ b\right)\right)
      return Math.min(
        INITIAL_FALL_TIME_SEC,
        Math.max(MIN_FALL_TIME, KEEP_INITIAL_FOR * -Math.log(t) + KEEP_INITIAL_FOR * Math.log(HIT_0_AT_TIME))
      );
    }
  }
};


export default devSettings;
