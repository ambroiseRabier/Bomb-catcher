import { Application } from 'pixi.js';

export function useGameTime(app: Application) {
  // Track total elapsed time (in seconds)
  let elapsedTime = 0;
  let isPaused = false;
  // Time when the last frame was updated
  let lastFrameTime: number;

  function start() {
    elapsedTime = 0;
    lastFrameTime = performance.now(); // Reset timestamp
    isPaused = false;

    // Don't count time when alt-tabbed
    document.addEventListener('visibilitychange', onVisibilityChange);
    // Time updater
    app.ticker.add(onTick);
  }
  function end() {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    app.ticker.remove(onTick);
  }
  function pause() {
    isPaused = true;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      // Pause when window is not visible
      isPaused = true;
    } else {
      // Resume when window is visible
      isPaused = false;
      lastFrameTime = performance.now(); // Reset the frame time to avoid large time skips
    }
  }

  function onTick() {
    if (isPaused) {
      // If paused, update the lastFrameTime to prevent large time jumps
      lastFrameTime = performance.now();
    } else {
      // Calculate the time delta for this frame in seconds
      const currentFrameTime = performance.now();
      const deltaTime = (currentFrameTime - lastFrameTime) / 1000;

      // Add the delta time to elapsed time
      elapsedTime += deltaTime; // elapsedMS is nice and all, but will give huge value when returning from pause.

      // Store the current time for the next frame
      lastFrameTime = currentFrameTime;
    }
  }

  return {
    // A getter avoid losing reference if deconstructing the object.
    /**
     * Elapsed time, in seconds.
     */
    get elapsedTime() {
      return elapsedTime;
    },
    start,
    end,
    pause,
  };
}
