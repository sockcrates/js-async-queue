# js-async-queue

`js-async-queue` is a small, typed asynchronous task queue for TypeScript. It
runs promise-returning tasks with a configurable concurrency limit, starts
queued work in first-in, first-out order.

## Usage

Create a queue with the maximum number of tasks that may run at once (three by
default), then enqueue functions that return promises:

```ts
import { AsyncQueue } from "./async-queue";

const queue = new AsyncQueue<number>(2);

const count = await queue.enqueue(async () => {
  const response = await fetch("https://example.com/count");
  return Number(await response.text());
});
console.log(`Received ${count}`);
```

`enqueue` accepts a task factory, `() => Promise<T>`, and returns a
`Promise<T>`. The returned promise settles with that specific task: it resolves
with the task result, or rejects with the task error. This makes
`await queue.enqueue(task)` safe to use when subsequent work depends on the
task's completion.

Tasks that cannot start immediately wait in FIFO order. The queue immediately
fills every available worker slot and starts waiting work whenever a running
task settles, including when it rejects. A rejection is propagated to the
corresponding `enqueue` caller and does not stop later tasks from running.

## Requirements and development

The project uses Node.js, pnpm, TypeScript, ESLint, and Vitest.
[mise](https://mise.jdx.dev/) installs the configured Node.js and pnpm
versions.

```sh
mise install
pnpm install
pnpm test       # Run the test suite
pnpm run lint   # Lint the source
pnpm run build  # Type-check and write JavaScript to dist/
```

## Behaviour

- `new AsyncQueue()` allows up to three concurrent tasks.
- Pass a positive worker count to set a different concurrency limit.
- Tasks begin in the order they are added, while completion order depends on
  each task's asynchronous work.
- The queue propagates task rejections to the corresponding `enqueue` promise
  and continues processing queued tasks.

## License

This project is available under the terms of the [MIT License](LICENSE).
