/**
 * Use case example: Between 0 and 100, you get first value 10, you want to avoid it having the next number be between 0 and 20.
 * @param min
 * @param max
 * @param previous Last generated value.
 * @param avoidRange Range within which we want to reduce probability. For example, if `avoidRange` is 20 and `previous = 50`, numbers between `30–70` will have a reduced likelihood.
 * @param avoidProbability The likelihood of rejecting numbers within the `avoidRange`. Probability of avoiding close values (e.g., 20%) (Between 0 and 1)
 */
export function biasedRandom({min, max, previous, avoidRange, avoidProbability}: {
  min: number,
  max: number,
  previous: number,
  avoidRange: number,
  avoidProbability: number
}): number {
  const range = max - min;

  // Safeguard against harsh parameters
  const maxIterations = 100;
  let iterations = 0;

  // Function to generate a random number within min and max
  const randomFunc = () => Math.random() * range + min;

  while (iterations++ < maxIterations) {
    const candidate = randomFunc(); // Generate a random number

    // Calculate the distance from the "previous" value
    const distance = Math.abs(candidate - previous);

    // If the candidate falls within the "avoid range," apply reduced probability
    if (distance <= avoidRange) {
      // Generate a random chance (0-1)
      const chance = Math.random();

      // Avoid close values with the given avoidProbability
      if (chance < avoidProbability) {
        continue; // Retry if the candidate is too close (reject this value)
      }
    }

    return candidate; // Value is acceptable
  }

  // Too many iterations, don't want to infinite loop here :)
  return randomFunc();
}
