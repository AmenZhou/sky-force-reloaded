/**
 * Generic object pool — reuse entities instead of allocate/GC in the game loop.
 */
class ObjectPool {
  constructor(factory, initialSize = 32) {
    this.factory = factory;
    this.free = [];
    this.active = [];
    for (let i = 0; i < initialSize; i += 1) {
      this.free.push(factory());
    }
  }

  acquire() {
    const obj = this.free.pop() || this.factory();
    obj.active = true;
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    obj.active = false;
    const idx = this.active.indexOf(obj);
    if (idx !== -1) this.active.splice(idx, 1);
    this.free.push(obj);
  }

  releaseAll() {
    while (this.active.length) {
      this.release(this.active[0]);
    }
  }

  forEachActive(fn) {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      fn(this.active[i], i);
    }
  }

  get activeCount() {
    return this.active.length;
  }
}
