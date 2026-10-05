import type { Io } from '../cli/io.js';

// Scripted answers in, captured lines out.
export class FakeIo implements Io {
  readonly out: string[] = [];
  readonly err: string[] = [];
  private readonly answers: string[];

  constructor(answers: readonly string[] = []) {
    this.answers = [...answers];
  }

  ask(question: string): Promise<string | undefined> {
    this.out.push(question);
    return Promise.resolve(this.answers.shift());
  }

  hint(line: string): void {
    this.out.push(line);
  }

  print(line: string): void {
    this.out.push(line);
  }

  printError(line: string): void {
    this.err.push(line);
  }

  get text(): string {
    return this.out.join('\n');
  }
}
