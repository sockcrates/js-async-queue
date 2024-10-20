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
    return task().then((result) => {
      callback?.(result);
    });
  }
}
