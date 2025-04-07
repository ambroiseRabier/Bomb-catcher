import { Container } from 'pixi.js';
import gsap from 'gsap';

export function screenShake(cameraContainer: Container, intensity: number, duration: number) {
  const originalX = cameraContainer.x;
  const originalY = cameraContainer.y;

  const randX = Math.random() - 0.3;
  const randY = Math.random() - 0.3;
  gsap.to(cameraContainer, {
    // Add a minimum value so we don't have screenshake where nothing happen.
    x: originalX + (randX + Math.sign(randX) * 0.2) * intensity,
    y: originalY + (randY + Math.sign(randY) * 0.2) * intensity,
    repeat: Math.floor(duration * 24),
    yoyo: true, // Return to original position after each step
    // ease: "rough({ strength: 2, points: 20, taper: 'none', randomize: true })",
    onComplete: () => {
      // Reset to original position
      cameraContainer.x = originalX;
      cameraContainer.y = originalY;
    },
    duration: duration / 24, // Adjust animation step duration
  });
}
