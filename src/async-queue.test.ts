import { describe, expect, it, vi } from 'vitest';
import { AsyncQueue } from './async-queue';

function makeTask<TValue>(value: TValue, timeoutMs: number) {
  return () =>
    new Promise<TValue>((resolve) => {
      setTimeout(() => {
        resolve(value);
      }, timeoutMs);
    });
}

describe('asyncQueue', () => {
  it('processes a task', async () => {
    const callback = vi.fn();
    const queue = new AsyncQueue();
    const task = (): Promise<number> => Promise.resolve(1);
    queue.enqueue(task, { callback }).catch((_: unknown) => {
      expect.unreachable();
    });
    await expect.poll(() => callback).toHaveBeenCalledWith(1);
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
    await Promise.all(tasks.map((task) => queue.enqueue(task)));
    expect(maxConcurrent).toEqual(3);
  });
  it('executes tasks in the order they were added', async () => {
    const callback = vi.fn();
    const queue = new AsyncQueue(3);
    const tasks = Array.from({ length: 5 }, (_, index) =>
      makeTask(index + 1, (index + 1) * 100),
    );
    tasks.forEach((task) => {
      queue.enqueue(task, { callback }).catch((_: unknown) => {
        expect.unreachable();
      });
    });
    await expect
      .poll(() => callback.mock.calls.map((call: number[]) => call[0]))
      .toEqual([1, 2, 3, 4, 5]);
  });
  it('handles task rejection and continues processing others', async () => {
    const callback = vi.fn();
    const callbackError = vi.fn();
    const queue = new AsyncQueue(3);
    const tasks = [1, 2, 3, 4, 5].map(
      (num) => () =>
        new Promise<number>((resolve, reject) => {
          if (num === 3) {
            reject(new Error('Task failed'));
          } else {
            resolve(num);
          }
        }),
    );
    tasks.forEach((task) => {
      queue.enqueue(task, { callback, callbackError }).catch((_: unknown) => {
        expect.unreachable();
      });
    });
    await expect
      .poll(() => callback.mock.calls.map((call: number[]) => call[0]))
      .toEqual([1, 2, 4, 5]);
    expect(callbackError).toHaveBeenCalledWith(3);
  });
});
