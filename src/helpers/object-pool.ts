// Won't do because of time. Opti is always last anyway, if not uneeded on such a short game.

export class ObjectPool<T> {
  private pool: T[] = [];
  private createObject: () => T; // Function to create new objects when needed.

  constructor(
    createObject: () => T,
    private size = 10
  ) {
    this.createObject = createObject;
    this.initialize();
  }

  // Pre-fill the pool with objects
  private initialize(): void {
    for (let i = 0; i < this.size; i++) {
      this.pool.push(this.createObject());
    }
  }

  // Get an object from the pool
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop() as T; // Retrieve from pool if available
    }
    return this.createObject(); // Or, create a new object if the pool is empty
  }

  // Return an object to the pool
  return(obj: T): void {
    if (this.pool.length < this.size) {
      this.pool.push(obj); // Recycle the object back into the pool
    }
  }
}
