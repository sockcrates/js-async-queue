import { describe, expect, it } from 'vitest';
import { AsyncQueue } from './async-queue';

describe('an asynchronous task queue in JavaScript', () => {
  it('processes a task', async () => {
    const queue = new AsyncQueue();
    const task = (): Promise<number> => Promise.resolve(1);
    const result = await queue
      .enqueue(task)
      .catch((_: unknown) => expect.unreachable());
    expect(result).toEqual(1);
  });
  it('does not exceed the concurrency limit', async () => {
    const queue = new AsyncQueue(3);
    let runningTasks = 0;
    let maxConcurrent = 0;
    const tasks = Array.from(
      { length: 10 },
      () => () =>
        new Promise<void>((resolve) => {
          runningTasks += 1;
          maxConcurrent = Math.max(maxConcurrent, runningTasks);
          setTimeout(() => {
            runningTasks -= 1;
            resolve();
          }, 100);
        }),
    );
    await Promise.all(tasks.map(queue.enqueue)).catch((_: unknown) =>
      expect.unreachable(),
    );
    expect(maxConcurrent).toEqual(3);
  });
  it.skip('executes tasks in the order they were added', async () => {
    const queue = new AsyncQueue(3);
    const tasks = Array.from(
      { length: 5 },
      (_, index) => () =>
        new Promise<number>((resolve) => {
          setTimeout(() => {
            resolve(index + 1);
          }, Math.random() * 100);
        }),
    );
    const results = await Promise.all(tasks.map(queue.enqueue));
    expect(results).toEqual([1, 2, 3, 4, 5]);
  });
  it.skip('handles task rejection and continues processing others', async () => {
    const queue = new AsyncQueue(3);
    const tasks = [1, 2, 3, 4, 5].map((num) =>
      queue.enqueue(
        () =>
          new Promise<number>((resolve, reject) => {
            if (num === 3) {
              reject(new Error(`Task ${String(num)} failed`));
            } else {
              resolve(num);
            }
          }),
      ),
    );
    expect(await tasks.pop()).toEqual(5);
    expect(await tasks.pop()).toEqual(4);
    await expect(tasks.pop()).rejects.toThrowError('Task 3 failed');
    expect(await tasks.pop()).toEqual(2);
    expect(await tasks.pop()).toEqual(1);
  });
});
