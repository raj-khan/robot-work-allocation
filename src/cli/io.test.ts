import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createConsoleIo } from './io.js';

const collect = (stream: PassThrough): (() => string) => {
  let text = '';
  stream.on('data', (chunk: Buffer) => (text += chunk.toString()));
  return () => text;
};

describe('createConsoleIo', () => {
  it('reads piped lines without echoing prompts', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const read = collect(output);
    const io = createConsoleIo(input, output, new PassThrough());
    input.end('2\n16\n');

    expect(await io.ask('Bravo: ')).toBe('2');
    io.hint('only for humans');
    expect(await io.ask('Hours: ')).toBe('16');
    expect(await io.ask('More: ')).toBeUndefined();
    io.close();

    expect(read()).toBe('');
  });

  it('shows prompts on a terminal and splits output streams', async () => {
    const input = Object.assign(new PassThrough(), { isTTY: true });
    const output = new PassThrough();
    const errors = new PassThrough();
    const [readOut, readErr] = [collect(output), collect(errors)];
    const io = createConsoleIo(input, output, errors);
    input.end('3\n');

    io.hint('Enter:');
    await io.ask('Bravo: ');
    io.print('done');
    io.printError('Error: nope');
    io.close();

    expect(readOut()).toBe('Enter:\nBravo: done\n');
    expect(readErr()).toBe('Error: nope\n');
  });
});
