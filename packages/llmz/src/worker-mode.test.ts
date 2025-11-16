import { z } from '@bpinternal/zui'

import { beforeAll, afterAll, assert, describe, expect, it } from 'vitest'
import * as llmz from './llmz.js'
import { Tool } from './tool.js'

import { ExecutionResult, SuccessExecutionResult } from './result.js'
import { Traces } from './types.js'
import { getCachedCognitiveClient } from './__tests__/index.js'
import { ObjectInstance } from './objects.js'
import { Exit } from './exit.js'
import { ThinkSignal } from './errors.js'

const client = getCachedCognitiveClient()

function assertSuccess(result: ExecutionResult): asserts result is SuccessExecutionResult {
  assert(
    result instanceof SuccessExecutionResult,
    `Expected result to be success but got ${result.status}\n${result.isError() ? result.error : ''}`.trim()
  )
}

const exec = (result: ExecutionResult) => {
  const removeTraceTimestamps = (trace: Traces.Trace) => {
    const clone: any = { ...trace }
    delete clone.started_at
    delete clone.ended_at
    return clone as Traces.Trace
  }

  const traces = result.iterations.flatMap((i) => i.traces).map(removeTraceTimestamps)

  const getTracesOfType = <T extends Traces.Trace>(type: T['type']) => traces.filter((t): t is T => t.type === type)

  return {
    firstIteration: result.iterations[0]!,
    lastIteration: result.iterations.slice(-1)[0],
    getTracesOfType,
    allCodeExecutions: getTracesOfType<Traces.CodeExecution>('code_execution'),
    allToolCalls: getTracesOfType<Traces.ToolCall>('tool_call') ?? [],
    allErrors: result.iterations.flatMap((i) => i.error).filter(Boolean),
  }
}

describe('worker mode', { retry: 0, timeout: 60_000 }, () => {
  let unsub = () => {}

  beforeAll(() => {
    unsub = client.on('error', (req, err) => {
      console.error('Error from cognitive client', req, err)
    })
  })

  afterAll(() => {
    unsub()
  })

  describe('basic tool orchestration', () => {
    it('can orchestrate multiple tools with complex logic in single iteration', async () => {
      let fetchedData: string[] = []

      const tFetchUser = new Tool({
        name: 'fetchUser',
        description: 'Fetches a user by ID',
        input: z.object({ userId: z.number() }),
        output: z.object({ name: z.string(), age: z.number(), premium: z.boolean() }),
        handler: async ({ userId }) => {
          const users = [
            { name: 'Alice', age: 28, premium: true },
            { name: 'Bob', age: 35, premium: false },
            { name: 'Charlie', age: 42, premium: true },
          ]
          return users[userId - 1] ?? { name: 'Unknown', age: 0, premium: false }
        },
      })

      const tCalculateDiscount = new Tool({
        name: 'calculateDiscount',
        description: 'Calculates discount based on user type',
        input: z.object({ premium: z.boolean(), age: z.number() }),
        output: z.object({ discount: z.number() }),
        handler: async ({ premium, age }) => {
          let discount = premium ? 0.2 : 0.05
          if (age > 40) discount += 0.1
          return { discount }
        },
      })

      const tLogResult = new Tool({
        name: 'logResult',
        description: 'Logs the result for tracking',
        input: z.object({ message: z.string() }),
        output: z.void(),
        handler: async ({ message }) => {
          fetchedData.push(message)
        },
      })

      const eResult = new Exit({
        name: 'result',
        description: 'Return the calculated discount',
        schema: z.object({
          userName: z.string(),
          discount: z.number(),
          totalUsers: z.number(),
        }),
      })

      const result = await llmz.executeContext({
        options: { loop: 5 },
        exits: [eResult],
        instructions:
          'Fetch users with IDs 1, 2, and 3. For each user, calculate their discount. Log each result with the format "User {name}: {discount}". Finally, return the results with the name of the user with the highest discount. Make sure to loop as few times as needed to process all users.',
        tools: [tFetchUser, tCalculateDiscount, tLogResult],
        client,
      })

      assertSuccess(result)
      const res = exec(result)

      // Should complete in one or two iterations due to code generation
      expect(result.iterations.length).toBeLessThanOrEqual(3)

      // Should have called all three tools multiple times
      expect(res.allToolCalls.filter((t) => t.tool_name === 'fetchUser')).toHaveLength(3)
      expect(res.allToolCalls.filter((t) => t.tool_name === 'calculateDiscount').length).toBeGreaterThanOrEqual(1)
      expect(res.allToolCalls.filter((t) => t.tool_name === 'logResult').length).toBeGreaterThanOrEqual(1)

      // Should have logged results
      expect(fetchedData.length).toBeGreaterThanOrEqual(1)

      // Should return the correct result
      assert(result.is(eResult))
      expect(result.output.totalUsers).toBe(3)
      expect(result.output.discount).toBeGreaterThan(0)
    })

    it('uses conditionals and loops in generated code', async () => {
      const numbers: number[] = []

      const tCheckNumber = new Tool({
        name: 'checkNumber',
        description: 'Checks if a number is prime',
        input: z.object({ n: z.number() }),
        output: z.object({ isPrime: z.boolean() }),
        handler: async ({ n }) => {
          if (n < 2) return { isPrime: false }
          for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return { isPrime: false }
          }
          return { isPrime: true }
        },
      })

      const tStoreNumber = new Tool({
        name: 'storeNumber',
        description: 'Stores a prime number',
        input: z.object({ n: z.number() }),
        output: z.void(),
        handler: async ({ n }) => {
          numbers.push(n)
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Complete with the count of primes',
        schema: z.object({ primeCount: z.number() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        instructions:
          'Check numbers from 10 to 20 (inclusive). For each prime number found, store it. Return the total count of prime numbers found. Use loops and conditionals in your code to achieve this.',
        tools: [tCheckNumber, tStoreNumber],
        client,
      })

      assertSuccess(result)

      // Should have found the primes: 11, 13, 17, 19
      expect(numbers.sort()).toEqual([11, 13, 17, 19])
      assert(result.is(eResult))
      expect(result.output.primeCount).toBe(4)
    })
  })

  describe('error handling and recovery', () => {
    it('recovers from tool errors by retrying with corrected logic', async () => {
      let attemptCount = 0

      const tDivide = new Tool({
        name: 'divide',
        description: 'Divides two numbers',
        input: z.object({ a: z.number(), b: z.number() }),
        output: z.object({ result: z.number() }),
        handler: async ({ a, b }) => {
          attemptCount++
          if (b === 0) {
            throw new Error('Cannot divide by zero')
          }
          return { result: a / b }
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Return the division results',
        schema: z.object({ results: z.array(z.number()) }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        instructions:
          'Divide the following pairs: (10, 2), (15, 0), (20, 4). Handle any errors gracefully by skipping invalid operations. Return the successful results only.',
        tools: [tDivide],
        client,
      })

      assertSuccess(result)

      // Should have attempted division multiple times
      expect(attemptCount).toBeGreaterThanOrEqual(2)

      // Should return valid results
      assert(result.is(eResult))
      expect(result.output.results).toContain(5) // 10/2
      expect(result.output.results).toContain(5) // 20/4
    })

    it('handles invalid exit data and retries', async () => {
      const eStrict = new Exit({
        name: 'result',
        description: 'Return validated data',
        schema: z.object({
          email: z.string().email(),
          age: z.number().min(0).max(150),
        }),
      })

      const tNoOp = new Tool({
        name: 'noop',
        handler: async () => {},
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eStrict],
        instructions:
          'First try to return invalid data: email="not-an-email", age=200. When that fails, return valid data: email="user@example.com", age=25.',
        tools: [tNoOp],
        client,
      })

      // Should eventually succeed with valid data
      assertSuccess(result)
      assert(result.is(eStrict))
      expect(result.output.email).toContain('@')
      expect(result.output.age).toBeGreaterThanOrEqual(0)
      expect(result.output.age).toBeLessThanOrEqual(150)
    })
  })

  describe('complex workflows', () => {
    it('handles data transformation pipeline', async () => {
      const tFetchData = new Tool({
        name: 'fetchData',
        description: 'Fetches raw data',
        output: z.object({
          items: z.array(z.object({ id: z.number(), value: z.string() })),
        }),
        handler: async () => ({
          items: [
            { id: 1, value: 'apple' },
            { id: 2, value: 'banana' },
            { id: 3, value: 'cherry' },
            { id: 4, value: 'date' },
          ],
        }),
      })

      const tTransform = new Tool({
        name: 'transform',
        description: 'Transforms a single item',
        input: z.object({ value: z.string() }),
        output: z.object({ transformed: z.string() }),
        handler: async ({ value }) => ({
          transformed: value.toUpperCase(),
        }),
      })

      const tFilter = new Tool({
        name: 'filter',
        description: 'Checks if item should be included',
        input: z.object({ value: z.string() }),
        output: z.object({ include: z.boolean() }),
        handler: async ({ value }) => ({
          include: value.length > 5, // Only include items with more than 5 characters
        }),
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Return the processed results',
        schema: z.object({
          processedItems: z.array(z.string()),
          totalProcessed: z.number(),
        }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        instructions:
          'Fetch the data, then for each item: 1) check if it should be filtered, 2) if included, transform it. Return all transformed items and the count.',
        tools: [tFetchData, tTransform, tFilter],
        client,
      })

      assertSuccess(result)
      assert(result.is(eResult))

      // Should only include "banana" and "cherry" (length > 5)
      expect(result.output.processedItems).toContain('BANANA')
      expect(result.output.processedItems).toContain('CHERRY')
      expect(result.output.totalProcessed).toBe(2)
    })

    it('handles accumulation and aggregation', async () => {
      const tGetMetrics = new Tool({
        name: 'getMetrics',
        description: 'Gets metrics for a specific day',
        input: z.object({ day: z.number() }),
        output: z.object({ views: z.number(), clicks: z.number() }),
        handler: async ({ day }) => ({
          views: day * 100,
          clicks: day * 10,
        }),
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Return aggregated metrics',
        schema: z.object({
          totalViews: z.number(),
          totalClicks: z.number(),
          averageViews: z.number(),
          averageClicks: z.number(),
        }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        instructions:
          'Get metrics for days 1 through 5. Calculate total views, total clicks, average views, and average clicks.',
        tools: [tGetMetrics],
        client,
      })

      assertSuccess(result)
      assert(result.is(eResult))

      // Total views: 100 + 200 + 300 + 400 + 500 = 1500
      expect(result.output.totalViews).toBe(1500)
      // Total clicks: 10 + 20 + 30 + 40 + 50 = 150
      expect(result.output.totalClicks).toBe(150)
      // Average views: 1500 / 5 = 300
      expect(result.output.averageViews).toBe(300)
      // Average clicks: 150 / 5 = 30
      expect(result.output.averageClicks).toBe(30)
    })
  })

  describe('objects and state management', () => {
    it('works with objects and mutations', async () => {
      const user = new ObjectInstance({
        name: 'User',
        properties: [
          { name: 'score', value: 0, writable: true, type: z.number() },
          { name: 'level', value: 1, writable: true, type: z.number() },
          { name: 'name', value: 'Player', writable: false },
        ],
      })

      const tAddPoints = new Tool({
        name: 'addPoints',
        description: 'Adds points to the user score',
        input: z.object({ points: z.number() }),
        output: z.object({ newScore: z.number() }),
        handler: async ({ points }) => ({
          newScore: points,
        }),
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Complete the task',
        schema: z.object({ finalScore: z.number(), finalLevel: z.number() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        objects: [user],
        instructions:
          'Add 100 points using the tool, then update User.score with the returned value. If score is >= 100, set User.level to 2. Return the final score and level.',
        tools: [tAddPoints],
        client,
      })

      assertSuccess(result)
      const res = exec(result)

      // Should have mutations
      expect(res.lastIteration?.mutations).toBeDefined()

      assert(result.is(eResult))
      expect(result.output.finalScore).toBe(100)
      expect(result.output.finalLevel).toBe(2)
    })

    it('works with object tools and state', async () => {
      let purchases: string[] = []

      const cart = new ObjectInstance({
        name: 'Cart',
        properties: [{ name: 'total', value: 0, writable: true, type: z.number() }],
        tools: [
          new Tool({
            name: 'addItem',
            description: 'Adds an item to the cart',
            input: z.object({ name: z.string(), price: z.number() }),
            output: z.void(),
            handler: async ({ name, price }) => {
              purchases.push(`${name}: $${price}`)
            },
          }),
        ],
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Complete checkout',
        schema: z.object({ itemCount: z.number(), total: z.number() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 3 },
        exits: [eResult],
        objects: [cart],
        instructions:
          'Add these items to the cart: "Apple" for $2, "Banana" for $3, "Orange" for $4. Update Cart.total to the sum of prices. Return the item count and total.',
        tools: [],
        client,
      })

      assertSuccess(result)

      expect(purchases).toHaveLength(3)
      assert(result.is(eResult))
      expect(result.output.itemCount).toBe(3)
      expect(result.output.total).toBe(9)
    })
  })

  describe('thinking and iteration control', () => {
    it('uses thinking to plan complex tasks', async () => {
      let executionOrder: string[] = []

      const tStep1 = new Tool({
        name: 'initializeDatabase',
        output: z.object({ dbId: z.string() }),
        handler: async () => {
          executionOrder.push('init')
          return { dbId: 'db_123' }
        },
      })

      const tStep2 = new Tool({
        name: 'createTables',
        input: z.object({ dbId: z.string() }),
        output: z.void(),
        handler: async () => {
          executionOrder.push('tables')
        },
      })

      const tStep3 = new Tool({
        name: 'seedData',
        input: z.object({ dbId: z.string() }),
        output: z.void(),
        handler: async () => {
          executionOrder.push('seed')
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Setup complete',
      })

      const result = await llmz.executeContext({
        options: { loop: 5 },
        exits: [eResult],
        instructions:
          'Initialize a database, create tables, then seed data. These steps must be done in order. Think about the dependencies before executing.',
        tools: [tStep1, tStep2, tStep3],
        client,
      })

      assertSuccess(result)

      // Should execute in correct order
      expect(executionOrder).toEqual(['init', 'tables', 'seed'])
    })

    it('handles ThinkSignal from tools', async () => {
      let attempts = 0

      const tRequireThinking = new Tool({
        name: 'complexOperation',
        output: z.object({ result: z.string() }),
        handler: async () => {
          attempts++
          if (attempts === 1) {
            throw new ThinkSignal('This operation requires more context. Please think about the dependencies first.')
          }
          return { result: 'completed' }
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Task complete',
        schema: z.object({ status: z.string() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 4 },
        exits: [eResult],
        instructions: 'Call the complexOperation tool and return its result as status.',
        tools: [tRequireThinking],
        client,
      })

      assertSuccess(result)

      // Should have multiple iterations due to thinking
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(attempts).toBeGreaterThanOrEqual(2)

      assert(result.is(eResult))
      expect(result.output.status).toBe('completed')
    })
  })

  describe('multiple exits', () => {
    it('selects appropriate exit based on computed results', async () => {
      const tAnalyzeNumber = new Tool({
        name: 'analyzeNumber',
        input: z.object({ n: z.number() }),
        output: z.object({ isEven: z.boolean(), isPrime: z.boolean() }),
        handler: async ({ n }) => {
          const isEven = n % 2 === 0
          let isPrime = n > 1
          for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) {
              isPrime = false
              break
            }
          }
          return { isEven, isPrime }
        },
      })

      const eEvenPrime = new Exit({
        name: 'even_prime',
        description: 'The number is both even and prime',
        schema: z.object({ number: z.number() }),
      })

      const eOddPrime = new Exit({
        name: 'odd_prime',
        description: 'The number is odd and prime',
        schema: z.object({ number: z.number() }),
      })

      const eNotPrime = new Exit({
        name: 'not_prime',
        description: 'The number is not prime',
        schema: z.object({ number: z.number(), factors: z.array(z.number()) }),
      })

      // Test with 2 (even prime)
      const result1 = await llmz.executeContext({
        options: { loop: 2 },
        exits: [eEvenPrime, eOddPrime, eNotPrime],
        instructions: 'Analyze the number 2 and return the appropriate result.',
        tools: [tAnalyzeNumber],
        client,
      })

      assertSuccess(result1)
      assert(result1.is(eEvenPrime))
      expect(result1.output.number).toBe(2)

      // Test with 17 (odd prime)
      const result2 = await llmz.executeContext({
        options: { loop: 2 },
        exits: [eEvenPrime, eOddPrime, eNotPrime],
        instructions: 'Analyze the number 17 and return the appropriate result.',
        tools: [tAnalyzeNumber],
        client,
      })

      assertSuccess(result2)
      assert(result2.is(eOddPrime))
      expect(result2.output.number).toBe(17)
    })
  })

  describe('variable persistence across iterations', () => {
    it('maintains variables across iterations', async () => {
      let callCount = 0

      const tGetToken = new Tool({
        name: 'getToken',
        output: z.object({ token: z.string() }),
        handler: async () => {
          callCount++
          if (callCount === 1) {
            throw new ThinkSignal('Token retrieved, now use it')
          }
          return { token: 'abc123' }
        },
      })

      const tUseToken = new Tool({
        name: 'useToken',
        input: z.object({ token: z.string() }),
        output: z.object({ success: z.boolean() }),
        handler: async ({ token }) => ({
          success: token === 'abc123',
        }),
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Task complete',
        schema: z.object({ tokenUsedSuccessfully: z.boolean() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 4 },
        exits: [eResult],
        instructions: 'Get a token, then use it. Make sure to store the token in a variable after getting it.',
        tools: [tGetToken, tUseToken],
        client,
      })

      assertSuccess(result)
      const res = exec(result)

      // Should have variables preserved
      expect(res.lastIteration?.variables).toBeDefined()

      assert(result.is(eResult))
      expect(result.output.tokenUsedSuccessfully).toBe(true)
    })
  })

  describe('multi-step workflow with thinking', () => {
    it('finds and deletes corrupted work files through multi-iteration workflow', async () => {
      // File system state
      const files = [
        'report_2024.txt',
        'vacation_photos.jpg',
        'project_proposal.docx',
        'family_video.mp4',
        'meeting_notes.txt',
        'personal_diary.txt',
        'budget_analysis.xlsx',
        'random_meme.png',
        'quarterly_review.pdf',
        'shopping_list.txt',
      ]

      const fileContents: Record<string, string> = {
        'report_2024.txt': 'Q1 Revenue: $500k\nQ2 Revenue: $600k\nQ3 Revenue: $550k',
        'vacation_photos.jpg': '[binary image data]',
        'project_proposal.docx': 'x9F\u0000\u0000h#@!zQ\u0002\u0003KORRUPTED!\nFk$%mzP\u0001x\u0000\u0000', // Corrupted - random bytes
        'family_video.mp4': '[binary video data]',
        'meeting_notes.txt': 'Team sync - discussed Q4 goals and deliverables',
        'personal_diary.txt': 'Dear diary, today was a good day...',
        'budget_analysis.xlsx': 'Department,Q1,Q2,Q3\nEngineering,100k,120k,110k',
        'random_meme.png': '[binary image data]',
        'quarterly_review.pdf': '\u0001\u0002@#$%^--CORR-UPTE-DD- CORRUPT\u0000\u0000\u0001kL!mN\u0003\u0002pQ', // Corrupted - random bytes
        'shopping_list.txt': 'Milk, eggs, bread, cheese',
      }

      const deletedFiles: string[] = []

      const tListFiles = new Tool({
        name: 'listFiles',
        description: 'Lists all files in the directory',
        output: z.object({ files: z.array(z.string()) }),
        handler: async () => ({ files }),
      })

      const tReadFile = new Tool({
        name: 'readFile',
        description: 'Reads the contents of a file',
        input: z.object({ filename: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ filename }) => {
          if (!fileContents[filename]) {
            throw new Error(`File not found: ${filename}`)
          }
          return { content: fileContents[filename] }
        },
      })

      const tDeleteFile = new Tool({
        name: 'deleteFile',
        description: 'Deletes a file',
        input: z.object({ filename: z.string() }),
        output: z.void(),
        handler: async ({ filename }) => {
          deletedFiles.push(filename)
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Task complete',
        schema: z.object({
          deletedFiles: z.array(z.string()),
          totalWorkFiles: z.number(),
          corruptedCount: z.number(),
        }),
      })

      const result = await llmz.executeContext({
        options: { loop: 5 },
        exits: [eResult],
        instructions:
          'Find and delete work-related files with corrupted data. Return the list of deleted files, total work files found, and count of corrupted files. The only way to identify corrupted files is by reading their contents.',
        tools: [tListFiles, tReadFile, tDeleteFile],
        client,
      })

      assertSuccess(result)
      const res = exec(result)

      // Should complete in 3-4 iterations:
      // 1. List files + think
      // 2. Read work files in parallel + think
      // 3. Delete corrupted files
      expect(result.iterations.length).toBeLessThanOrEqual(5)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)

      // Should have listed files once
      const listCalls = res.allToolCalls.filter((t) => t.tool_name === 'listFiles')
      expect(listCalls).toHaveLength(1)

      // Should have read work-related files (5 work files total)
      const readCalls = res.allToolCalls.filter((t) => t.tool_name === 'readFile')
      expect(readCalls.length).toBe(5)
      const readFilenames = readCalls.map((call) => call.input.filename)
      expect(readFilenames).toContain('report_2024.txt')
      expect(readFilenames).toContain('project_proposal.docx')
      expect(readFilenames).toContain('meeting_notes.txt')
      expect(readFilenames).toContain('budget_analysis.xlsx')
      expect(readFilenames).toContain('quarterly_review.pdf')
      // Should NOT read personal files
      expect(readFilenames).not.toContain('vacation_photos.jpg')
      expect(readFilenames).not.toContain('family_video.mp4')
      expect(readFilenames).not.toContain('personal_diary.txt')
      expect(readFilenames).not.toContain('random_meme.png')
      expect(readFilenames).not.toContain('shopping_list.txt')

      // Should have deleted exactly 2 corrupted files
      const deleteCalls = res.allToolCalls.filter((t) => t.tool_name === 'deleteFile')
      expect(deleteCalls).toHaveLength(2)
      expect(deletedFiles.sort()).toEqual(['project_proposal.docx', 'quarterly_review.pdf'].sort())

      // Verify final result
      assert(result.is(eResult))
      expect(result.output.deletedFiles.sort()).toEqual(['project_proposal.docx', 'quarterly_review.pdf'].sort())
      expect(result.output.totalWorkFiles).toBe(5)
      expect(result.output.corruptedCount).toBe(2)
    })
  })

  describe('error recovery without re-execution', () => {
    it('does not re-execute successful operations after failure, only fixes and continues', async () => {
      // File system state with PIDs locking files
      const fileState: Record<string, number | null> = {
        'old_project.txt': 1234,
        'legacy_data.csv': null,
        'deprecated_config.json': 5678,
      }

      const runningProcesses = new Set([1234, 5678])
      let listFilesCallCount = 0
      let deleteCallCount = 0
      const deleteAttempts: Record<string, number> = {}
      const deletedFiles: string[] = []
      const killedProcesses: number[] = []

      const tListFiles = new Tool({
        name: 'listFiles',
        description: 'Lists all files in the directory',
        output: z.object({ files: z.array(z.string()) }),
        handler: async () => {
          listFilesCallCount++
          return { files: Object.keys(fileState) }
        },
      })

      const tDeleteFile = new Tool({
        name: 'deleteFile',
        description: 'Deletes a file',
        input: z.object({ filename: z.string() }),
        output: z.void(),
        handler: async ({ filename }) => {
          deleteCallCount++
          const pid = fileState[filename]
          deleteAttempts[filename] = (deleteAttempts[filename] || 0) + 1

          if (pid !== undefined && pid !== null && runningProcesses.has(pid)) {
            throw new Error(
              `Cannot delete ${filename}: file currently in use by PID ${pid}, please close application before deleting`
            )
          }

          if (fileState[filename] !== undefined) {
            delete fileState[filename]
            deletedFiles.push(filename)
          }
        },
      })

      const tKillProcess = new Tool({
        name: 'killProcess',
        description: 'Kills a process by PID',
        input: z.object({ pid: z.number() }),
        output: z.void(),
        handler: async ({ pid }) => {
          runningProcesses.delete(pid)
          killedProcesses.push(pid)
        },
      })

      const result = await llmz.executeContext({
        options: { loop: 10 },
        instructions: 'Delete all files in the directory.',
        tools: [tListFiles, tDeleteFile, tKillProcess],
        client,
      })

      assertSuccess(result)

      expect(listFilesCallCount).toBe(1) // List files only once
      expect(deleteCallCount).toBeGreaterThanOrEqual(3) // Multiple attempts due to failures

      // Should have killed both processes
      expect(killedProcesses.sort()).toEqual([1234, 5678].sort())
      expect(deletedFiles.sort()).toEqual(['old_project.txt', 'legacy_data.csv', 'deprecated_config.json'].sort())
      expect(deleteAttempts).toMatchInlineSnapshot(`
        {
          "deprecated_config.json": 2,
          "legacy_data.csv": 1,
          "old_project.txt": 2,
        }
      `)
    })
  })

  describe('hooks in worker mode', () => {
    it('onTrace hook captures all traces', async () => {
      const traces: Traces.Trace[] = []

      const tSimple = new Tool({
        name: 'simple',
        output: z.void(),
        handler: async () => {},
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Complete',
      })

      const result = await llmz.executeContext({
        options: { loop: 1 },
        exits: [eResult],
        instructions: 'Call the simple tool and exit.',
        tools: [tSimple],
        client,

        onTrace: ({ trace }) => {
          traces.push(trace)
        },
      })

      assertSuccess(result)

      // Should have captured all traces
      expect(traces.length).toBeGreaterThan(0)
      expect(traces.some((t) => t.type === 'tool_call')).toBe(true)
      expect(traces.some((t) => t.type === 'code_execution')).toBe(true)
    })

    it('onBeforeExecution can modify code', async () => {
      let codeModified = false

      const tOriginal = new Tool({
        name: 'original',
        output: z.object({ value: z.string() }),
        handler: async () => ({ value: 'original' }),
      })

      const tModified = new Tool({
        name: 'modified',
        output: z.object({ value: z.string() }),
        handler: async () => {
          codeModified = true
          return { value: 'modified' }
        },
      })

      const eResult = new Exit({
        name: 'done',
        description: 'Complete',
        schema: z.object({ value: z.string() }),
      })

      const result = await llmz.executeContext({
        options: { loop: 1 },
        exits: [eResult],
        instructions: 'Call the original tool and return its value.',
        tools: [tOriginal, tModified],
        client,

        onBeforeExecution: async () => {
          // Replace the code to call modified instead
          return { code: 'const res = await modified();\nreturn { action: "done", result: res.value };' }
        },
      })

      assertSuccess(result)

      expect(codeModified).toBe(true)
      assert(result.is(eResult))
      expect(result.output.value).toBe('modified')
    })
  })
})
