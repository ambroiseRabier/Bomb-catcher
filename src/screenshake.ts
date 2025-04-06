import { Container } from 'pixi.js';
import gsap from 'gsap';

export function screenShake(cameraContainer: Container, intensity: number, duration: number) {
  const originalX = cameraContainer.x;
  const originalY = cameraContainer.y;

  gsap.to(cameraContainer, {
    x: originalX + (Math.random() - 0.5) * intensity,
    y: originalY + (Math.random() - 0.5) * intensity,
    // repeat: Math.floor(duration * 60), // Assuming ~60fps for the duration ?
    yoyo: true, // Return to original position after each step
    ease: "rough({ strength: 2, points: 20, taper: 'none', randomize: true })", // Optional easing
    onComplete: () => {
      // Reset to original position
      cameraContainer.x = originalX;
      cameraContainer.y = originalY;
    },
    duration: duration / 60, // Adjust animation step duration
  });
}
