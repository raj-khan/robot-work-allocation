import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';

export interface Io {
  ask(question: string): Promise<string | undefined>;
  // Prompt text that only helps a human at a terminal.
  hint(line: string): void;
  print(line: string): void;
  printError(line: string): void;
}

export interface ConsoleIo extends Io {
  close(): void;
}

// Reads one line per question, so typed and piped input behave the same.
export function createConsoleIo(
  input: Readable & { isTTY?: boolean },
  output: Writable,
  errorOutput: Writable,
): ConsoleIo {
  const reader = createInterface({ input, terminal: false });
  const lines = reader[Symbol.asyncIterator]();
  const interactive = input.isTTY === true;

  return {
    async ask(question) {
      if (interactive) output.write(question);
      const next = await lines.next();
      return next.done === true ? undefined : next.value;
    },
    hint(line) {
      if (interactive) output.write(`${line}\n`);
    },
    print(line) {
      output.write(`${line}\n`);
    },
    printError(line) {
      errorOutput.write(`${line}\n`);
    },
    close() {
      reader.close();
    },
  };
}
