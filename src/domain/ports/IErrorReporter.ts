export interface IErrorReporter {
  captureException(err: unknown, context?: Record<string, string>): void;
}
