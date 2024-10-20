type Task<TData> = () => Promise<TData>;

export class AsyncQueue<TData> {
  constructor(private readonly maxWorkers = 3) {}
  readonly enqueue = (_task: Task<TData>) => {
    /* no-op */
  };
}
