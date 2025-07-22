/**
 * Example 13: Worker Sandbox and Execution Control
 * 
 * This example demonstrates advanced execution control in worker mode.
 * It shows how to:
 * - Implement execution timeouts and cancellation with AbortController
 * - Use execution loops with limited iterations
 * - Create monitoring tools for long-running processes
 * - Handle execution signals and cleanup
 * - Control sandbox execution with safety limits
 * 
 * Key concepts:
 * - AbortController for execution cancellation
 * - Execution timeout patterns
 * - Loop limits with options.loop
 * - Signal-based process control
 * - Monitoring and checkin patterns for long-running tasks
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Tool } from 'llmz'

import { printTrace } from '../utils/debug'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Tracking variables for execution monitoring
let startedAt: number

// AbortController for cancelling long-running operations
// This provides a safety mechanism to prevent runaway executions
const controller = new AbortController()

// Tool for introducing delays in execution
// Demonstrates controlled timing in worker processes
const wait = new Tool({
  name: 'wait',
  description: 'pauses the execution for a given number of milliseconds',
  input: z.object({
    ms: z.number().min(0, 'The number of milliseconds must be a positive integer'),
  }),
  async handler(input) {
    // Set up automatic abort after 5 seconds as a safety measure
    // This prevents infinite or excessively long waits
    setTimeout(() => controller.abort('5 seconds elasped'), 1000 * 5)
    
    // Implement the actual wait using Promise and setTimeout
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), input.ms)
    })
  },
})

// Monitoring tool for tracking execution progress
// This allows long-running processes to report their status
const checkin = new Tool({
  name: 'checkin',
  description: 'must call after every 2 seconds',
  async handler() {
    // Log current execution time since start
    console.log(`Checkin at ${Date.now() - startedAt}ms`)
  },
})

// Execute a long-running task with safety controls
const result = await execute({
  // Instructions for a potentially long-running process
  instructions: `console.log the number 1 to 10,000 in a for loop, pausing for 500 milliseconds between each number. Make sure to comment the code very well. Checkin when appropriate.`,
  
  // Provide tools for timing control and monitoring
  tools: [wait, checkin],
  client,
  
  // Attach the abort signal for execution cancellation
  // This allows external cancellation of the execution
  signal: controller.signal,
  
  // Monitor execution progress with detailed tracing
  onTrace: ({ trace }) => {
    printTrace(trace)
    
    // Track when LLM execution begins for timing calculations
    if (trace.type === 'llm_call_success') {
      startedAt = Date.now()
    }
  },
  
  // Execution options for safety and control
  options: {
    loop: 10,  // Limit to maximum 10 execution iterations
    // This prevents infinite loops and provides bounds on execution
  },
})

// Report execution completion status
console.log('Execution finished')
console.log('Last iteration:', result.iteration?.status)
