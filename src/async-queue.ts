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
    const { callback, callbackError } = options;
    return new Promise((resolve) => {
      if (this.#workers) {
        this.#workers -= 1;
        resolve(
          task()
            .then((result) => {
              callback?.(result);
            })
            .catch((error: unknown) => {
              callbackError?.(error);
            })
            .finally(() => {
              this.#workers += 1;
            })
            .then(() => this.#processQueue()),
        );
      } else {
        this.#queue.push({ options, task });
        resolve();
      }
    });
  }
  #processQueue(): Promise<void> {
    return new Promise((resolve) => {
      if (this.#workers) {
        const nextRequest = this.#queue.shift();
        if (nextRequest) {
          this.#workers -= 1;
          resolve(
            nextRequest
              .task()
              .then((result) => {
                nextRequest.options?.callback?.(result);
              })
              .catch((error: unknown) => {
                nextRequest.options?.callbackError?.(error);
              })
              .finally(() => {
                this.#workers += 1;
              })
              .then(() => this.#processQueue()),
          );
        }
      }
      resolve();
    });
  }
}
