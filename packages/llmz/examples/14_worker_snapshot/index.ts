/**
 * Example 14: Worker Snapshots and State Persistence
 * 
 * This example demonstrates LLMz's advanced snapshot system for pausing and resuming executions.
 * It shows how to:
 * - Create snapshots when long-running operations need to be deferred
 * - Serialize and deserialize execution state for persistence
 * - Resume execution from snapshots with resolved data
 * - Handle asynchronous operations that span multiple execution cycles
 * - Implement pausable workflows for better resource management
 * 
 * Key concepts:
 * - SnapshotSignal for creating execution snapshots
 * - Snapshot serialization and persistence
 * - State restoration and continuation
 * - Asynchronous operation deferral patterns
 * - Execution context preservation
 */

import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import chalk from 'chalk'
import { execute, Exit, Snapshot, SnapshotSignal, Tool } from 'llmz'
import { loading } from '../utils/spinner'

// Initialize Botpress client
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Tool that simulates a long-running operation requiring snapshots
// This demonstrates how to pause execution for operations that can't complete immediately
const LongRunningTool = new Tool({
  name: 'long_running_tool',
  description: 'A tool that simulates a long-running operation',
  input: z.object({
    input: z.string(),
  }),
  output: z.object({
    result: z.string(),
  }),
  async handler({ input }) {
    console.log('Executing long-running tool with input:', input)
    
    // Instead of performing the actual long-running operation,
    // throw a SnapshotSignal to pause execution and create a snapshot
    // This allows the operation to be completed later in a different context
    throw new SnapshotSignal(`Long-running operation`)
  },
})

// Exit condition for the final result
const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

// Initial execution that will be interrupted by the snapshot
const result = await execute({
  instructions: `Call the long-running tool with input "Hello, world!" and then exit with the extracted number from the tool's output string.`,
  tools: [LongRunningTool],
  exits: [exit],
  client,
})

// Verify that execution was interrupted as expected
if (!result.isInterrupted()) {
  console.error('Expected an interruption due to the long-running tool, but got:', result.status)
  process.exit(1)
}

// Inform user about the snapshot creation
console.log(chalk.yellow('The execution was interrupted and a snapshot of the state was created.'))
console.log(chalk.yellow('You can now restore the snapshot and continue the execution in the future.'))
console.log(chalk.yellow('[For the sake of this example, we will restore the snapshot immediately.]'))

// Extract the snapshot from the interrupted execution
const snapshot = result.snapshot

// Demonstrate snapshot serialization for persistence
// In production, you would store this in a database, file, or queue system
const serializedSnapshot = snapshot.toJSON()

// Simulate restoring from persistent storage
// This could happen in a different process, server, or time
const restoredSnapshot = Snapshot.fromJSON(serializedSnapshot)

loading(true, 'Resuming the execution from the snapshot...')

// Resolve the snapshot with the data that would have been returned
// by the long-running operation (e.g., from a background job, API call, etc.)
restoredSnapshot.resolve({
  result: `The magic number is 42 !`,
})

loading(false)

// Continue execution from where it left off
const continuation = await execute({
  // Restore the execution context from the snapshot
  // This includes all variables, call stack, and execution state
  snapshot: restoredSnapshot,

  // Provide the original execution configuration
  // These must match the original execution context
  instructions: result.context.instructions,
  tools: result.context.tools,
  exits: result.context.exits,
  client,
})

// Verify that execution completed successfully
if (!continuation.is(exit)) {
  console.error("Expected the continuation to exit with the 'exit' exit, but it did not.")
  process.exit(1)
}

// Extract and display the final result
const magicNumber = continuation.output.result
console.log(chalk.green(`The execution continued to execute from the snapshot and exited with number "${magicNumber}"`))
