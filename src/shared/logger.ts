type LogFn = (context: object, message: string) => void;

// The slice of a logger the app needs; pino satisfies it, tests pass a stub.
export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}
