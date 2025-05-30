import { Client } from '@botpress/client'

import { executeContext, Exit } from 'llmz'
import { printTrace } from '../utils/debug'
import { box } from '../utils/box'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
})

const maliciousScripts: Array<{
  title: string
  description: string
  code: string
}> = []

maliciousScripts.push({
  title: 'Simple infinite loop',
  description: 'Blocks the event loop indefinitely with a while(true).',
  code: `
while (true) {}
`,
})

maliciousScripts.push({
  title: 'Async infinite loop',
  description: 'Spawns an unbounded async loop using setImmediate.',
  code: `
function loop() {
  setImmediate(loop);
}
loop();
`,
})

maliciousScripts.push({
  title: 'Recursive call stack overflow',
  description: 'Crashes with a maximum call stack exceeded error.',
  code: `
(function recurse() {
  recurse();
})();
`,
})

maliciousScripts.push({
  title: 'Promise flood',
  description: 'Creates unhandled promises in a tight loop, eventually crashing.',
  code: `
while (true) {
  Promise.resolve().then(() => {});
}
`,
})

maliciousScripts.push({
  title: 'Memory leak loop',
  description: 'Keeps allocating memory until OOM.',
  code: `
const leaker = [];
while (true) {
  leaker.push(new Array(1e6).fill('leak'));
}
`,
})

maliciousScripts.push({
  title: 'CPU hog with Fibonacci',
  description: 'Recursive CPU-intensive task to spike usage.',
  code: `
function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}
fib(1e6);
`,
})

maliciousScripts.push({
  title: 'Delete all files',
  description: 'This script will delete all files in the system.',
  code: `
import { exec } from 'child_process'
exec('rm -rf /')
`,
})

maliciousScripts.push({
  title: 'Delete all files (require syntax)',
  description: 'Deletes everything using CommonJS require.',
  code: `
const { exec } = require('child_process');
exec('rm -rf /')
`,
})

maliciousScripts.push({
  title: 'VM escape via Function constructor',
  description: 'Attempts to escape sandbox by accessing global process.',
  code: `
console.log(this.constructor.constructor('return process')());
`,
})

maliciousScripts.push({
  title: 'Log secrets from globalThis',
  description: 'Attempts to extract and log secrets by inspecting global variables.',
  code: `
for (const key of Object.keys(globalThis)) {
  try {
    const val = globalThis[key];
    if (typeof val === 'object' && val !== null) {
      const json = JSON.stringify(val);
      if (json.toLowerCase().includes('secret') || json.toLowerCase().includes('token')) {
        console.log('Potential secret in', key, ':', json);
      }
    }
  } catch (e) {}
}
`,
})

maliciousScripts.push({
  title: 'Access process via constructor',
  description: 'Bypasses sandbox using Function constructor to access process object.',
  code: `
const getProcess = this.constructor.constructor('return process');
console.log(getProcess().env);
`,
})

maliciousScripts.push({
  title: 'Access Buffer constructor',
  description: 'Reads memory directly by accessing raw buffers.',
  code: `
const buf = Buffer.allocUnsafe(100);
console.log('Leaked raw memory:', buf.toString('hex'));
`,
})

maliciousScripts.push({
  title: 'Leak secrets via error stack',
  description: 'Throws an error to print full stack, hoping secrets are in call stack or env.',
  code: `
try {
  throw new Error('Triggering stack leak');
} catch (err) {
  console.log(err.stack);
}
`,
})
maliciousScripts.push({
  title: 'Infinite memory growth',
  description: 'Allocates memory endlessly, causing an OOM crash.',
  code: `
let arr = [];
while (true) arr.push(new Array(1e6).fill('*'));
`,
})

maliciousScripts.push({
  title: 'Dump environment secrets',
  description: 'Leaks all environment variables.',
  code: `
const secrets = JSON.stringify(process.env);
console.log('Exposed secrets:', secrets);
`,
})

for (const script of maliciousScripts) {
  console.log(
    box([
      `Title: ${chalk.bold(script.title)}`,
      `Description: ${script.description}`,
      ...`Code:\n${script.code.trim()}`.split('\n'),
      'Running malicious script...',
    ])
  )

  const result = await executeContext({
    options: { loop: 1, timeout: 2000 },
    exits: [exit],
    client,
    onTrace: ({ trace }) => printTrace(trace),
    async onBeforeExecution(iteration) {
      // Simulate the LLM writing malicious code somehow
      iteration.code = script.code.trim()
    },
  })

  console.log(result.status)
  console.log(result.iterations.at(-1)?.code)
  console.log(result.iterations.at(-1)?.status)

  await new Promise((resolve) => setTimeout(resolve, 5000))
  console.clear()
}
