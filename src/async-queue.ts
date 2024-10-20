type Task<TData> = () => Promise<TData>;

interface Request<TData> {
  reject: (error: unknown) => void;
  resolve: (result: TData) => void;
  task: Task<TData>;
}

export class AsyncQueue<TData> {
  #activeWorkers = 0;
  #queue: Request<TData>[] = [];
  constructor(private readonly maxWorkers = 3) {}
  readonly enqueue = (task: Task<TData>): Promise<TData> =>
    new Promise((resolve, reject) => {
      this.#queue.push({ task, resolve, reject });
      this.#processQueue();
    });

  #processQueue(): void {
    while (this.#queue.length && this.#activeWorkers < this.maxWorkers) {
      const nextRequest = this.#queue.shift();
      if (!nextRequest) {
        return;
      }
      this.#activeWorkers += 1;

      void nextRequest
        .task()
        .then(nextRequest.resolve)
        .catch(nextRequest.reject)
        .finally(() => {
          this.#activeWorkers -= 1;
          this.#processQueue();
        });
    }
  }
}
