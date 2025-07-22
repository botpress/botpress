/**
 * Example 18: Security Testing and Sandbox Protection
 * 
 * This example demonstrates LLMz's security capabilities by testing various attack vectors.
 * It shows how to:
 * - Test sandbox isolation against malicious code
 * - Verify protection against VM escape attempts
 * - Demonstrate timeout and resource protection
 * - Test against memory exhaustion attacks
 * - Validate security against process access attempts
 * 
 * Key concepts:
 * - Sandbox security and isolation
 * - Malicious code detection and prevention
 * - Resource limits and timeout protection
 * - VM escape prevention
 * - Security testing patterns
 * 
 * ⚠️  SECURITY TESTING ONLY - This file contains malicious code patterns for testing purposes
 */

import { Client } from '@botpress/client'

import { execute, Exit } from 'llmz'
import { printTrace } from '../utils/debug'
import { box } from '../utils/box'
import chalk from 'chalk'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Exit condition for controlled termination
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
})

// Collection of malicious code patterns for security testing
// These test various attack vectors that LLMz's sandbox should protect against
const maliciousScripts: Array<{
  title: string
  description: string
  code: string
}> = []

// Test 1: Event loop blocking attacks
maliciousScripts.push({
  title: 'Simple infinite loop',
  description: 'Blocks the event loop indefinitely with a while(true).',
  code: `
while (true) {}
`,
})

// Test 2: Asynchronous DoS attacks
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

// Test 3: Stack overflow attacks
maliciousScripts.push({
  title: 'Recursive call stack overflow',
  description: 'Crashes with a maximum call stack exceeded error.',
  code: `
(function recurse() {
  recurse();
})();
`,
})

// Test 4: Promise flooding attacks
maliciousScripts.push({
  title: 'Promise flood',
  description: 'Creates unhandled promises in a tight loop, eventually crashing.',
  code: `
while (true) {
  Promise.resolve().then(() => {});
}
`,
})

// Test 5: Memory exhaustion attacks
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

// Test 6: CPU exhaustion attacks
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

// Test 7: File system attacks (should be blocked)
maliciousScripts.push({
  title: 'Delete all files',
  description: 'This script will delete all files in the system.',
  code: `
import { exec } from 'child_process'
exec('rm -rf /')
`,
})

// Test 8: File system attacks via CommonJS
maliciousScripts.push({
  title: 'Delete all files (require syntax)',
  description: 'Deletes everything using CommonJS require.',
  code: `
const { exec } = require('child_process');
exec('rm -rf /')
`,
})

// Test 9: VM escape attempts
maliciousScripts.push({
  title: 'VM escape via Function constructor',
  description: 'Attempts to escape sandbox by accessing global process.',
  code: `
console.log(this.constructor.constructor('return process')());
`,
})

// Test 10: Secret extraction attempts
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

// Test 11: Process access attempts
maliciousScripts.push({
  title: 'Access process via constructor',
  description: 'Bypasses sandbox using Function constructor to access process object.',
  code: `
const getProcess = this.constructor.constructor('return process');
console.log(getProcess().env);
`,
})

// Test 12: Memory inspection attacks
maliciousScripts.push({
  title: 'Access Buffer constructor',
  description: 'Reads memory directly by accessing raw buffers.',
  code: `
const buf = Buffer.allocUnsafe(100);
console.log('Leaked raw memory:', buf.toString('hex'));
`,
})

// Test 13: Stack trace information leakage
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

// Test 14: Continuous memory allocation
maliciousScripts.push({
  title: 'Infinite memory growth',
  description: 'Allocates memory endlessly, causing an OOM crash.',
  code: `
let arr = [];
while (true) arr.push(new Array(1e6).fill('*'));
`,
})

// Test 15: Environment variable extraction
maliciousScripts.push({
  title: 'Dump environment secrets',
  description: 'Leaks all environment variables.',
  code: `
const secrets = JSON.stringify(process.env);
console.log('Exposed secrets:', secrets);
`,
})

// Execute each malicious script to test sandbox security
for (const script of maliciousScripts) {
  // Display the attack being tested
  console.log(
    box([
      `Title: ${chalk.bold(script.title)}`,
      `Description: ${script.description}`,
      ...`Code:\n${script.code.trim()}`.split('\n'),
      'Running malicious script...',
    ])
  )

  // Execute the malicious code with security protections
  const result = await execute({
    options: { 
      loop: 1,         // Limit iterations
      timeout: 2000    // 2 second timeout for protection
    },
    exits: [exit],
    client,
    onTrace: ({ trace }) => printTrace(trace),
    
    // Inject the malicious code directly (simulating compromised generation)
    async onBeforeExecution(iteration) {
      iteration.code = script.code.trim()
    },
  })

  // Report the security test results
  console.log('Result Status:', result.status)
  console.log('Generated Code:', result.iteration?.code)
  console.log('Execution Status:', result.iteration?.status)

  // Wait and clear screen between tests
  await new Promise((resolve) => setTimeout(resolve, 5000))
  console.clear()
}
