// Enforces the team commit style: "<Verb> <summary>" with a short subject and no AI trailers.
import { readFileSync } from 'node:fs';

const VERBS = ['Add', 'Fix', 'Update', 'Remove', 'Refactor', 'Test', 'Docs', 'Chore'];
const MAX_SUBJECT = 72;

const message = readFileSync(process.argv[2], 'utf8');
const subject = message.split('\n')[0].trim();

const fail = (reason) => {
  console.error(`commit-msg: ${reason}\n  got: "${subject}"`);
  process.exit(1);
};

if (/^(Merge|Revert) /.test(subject)) process.exit(0);
if (!VERBS.some((verb) => subject.startsWith(`${verb} `))) {
  fail(`subject must start with one of: ${VERBS.join(', ')}`);
}
if (subject.length > MAX_SUBJECT) fail(`subject must be ${MAX_SUBJECT} characters or fewer`);
if (subject.endsWith('.')) fail('subject must not end with a period');
if (/co-authored-by:.*(claude|copilot|gpt|anthropic|openai)/i.test(message)) {
  fail('AI co-author trailers are not allowed');
}
