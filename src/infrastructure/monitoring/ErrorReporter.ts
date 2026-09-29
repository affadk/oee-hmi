import type { IErrorReporter } from '../../domain/ports/IErrorReporter';

export class NoopErrorReporter implements IErrorReporter {
  captureException(): void {}
}
