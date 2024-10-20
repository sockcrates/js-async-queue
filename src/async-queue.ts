interface Options {
  callback?: <TData>(result: TData) => void;
  callbackError?: (error: unknown) => void;
}

type TaskFactory<TData> = () => Promise<TData>;

interface Request<TData> {
  options?: Options;
  task: TaskFactory<TData>;
}

export class AsyncQueue {
  #queue: Request<unknown>[] = [];
  #workers: number;
  constructor(workers = 3) {
    this.#workers = workers;
  }
  enqueue<TData>(
    task: TaskFactory<TData>,
    options: Options = {},
  ): Promise<void> {
    const { callback } = options;
    if (this.#workers) {
      this.#workers -= 1;
      return task()
        .then((result) => {
          callback?.(result);
        })
        .finally(() => {
          this.#workers += 1;
        });
    }
    this.#queue.push({ options, task });
    return this.#processQueue();
  }
  #processQueue(): Promise<void> {
    if (this.#workers) {
      const nextRequest = this.#queue.shift();
      if (nextRequest) {
        this.#workers -= 1;
        return nextRequest
          .task()
          .then((result) => {
            nextRequest.options?.callback?.(result);
          })
          .finally(() => {
            this.#workers += 1;
          })
          .then(() => {
            if (this.#processQueue.length) {
              return this.#processQueue();
            }
          });
      }
    }
  }
}
