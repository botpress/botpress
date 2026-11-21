// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'
import pLimit from 'p-limit'

import { ZaiContext } from '../context'
import { isJsonFile, jsonKind, validateOrRepairJson } from '../json-utils'
import { Micropatch } from '../micropatch'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify, allOrAbort } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'
import { JsonParsingError } from './errors'

/**
 * Represents a file to be patched
 */
export type File = {
  /** The file path (e.g., 'src/components/Button.tsx') */
  path: string
  /** The file name (e.g., 'Button.tsx') */
  name: string
  /** The file content */
  content: string
  /** The patch operations that were applied (only present in output) */
  patch?: string
}

const _File = z.object({
  path: z.string(),
  name: z.string(),
  content: z.string(),
})

type __Z<T> = { __type__: 'ZuiType'; _output: T }
type OfType<O, T extends __Z<any> = __Z<O>> = T extends __Z<O> ? T : never

export type Options = {
  /**
   * Maximum tokens per chunk when processing large files or many files.
   * If a single file exceeds this limit, it will be split into chunks.
   * If all files together exceed this limit, they will be processed in batches.
   * If not specified, all files must fit in a single prompt.
   */
  maxTokensPerChunk?: number
  /**
   * Optional Zui schema to validate JSON files against after patching.
   * Only applies to files detected as JSON (by .json extension).
   * If the patched JSON doesn't match the schema, the LLM is re-prompted to fix it.
   */
  schema?: OfType<any>
}

/** How far over `maxTokensPerChunk` a chunk cut by average line length may go before it is cut line by line */
const CHUNK_OVERFLOW = 1.5

const INVALID_SCHEMA_ERROR = 'zai.patch only accepts schemas created with @bpinternal/zui'

const Options = z.object({
  maxTokensPerChunk: z.number().int().min(1).optional(),
})

/** Strips a markdown code fence wrapped around the whole content of a <FILE> block */
const unfence = (ops: string): string => {
  const lines = ops.split(/\r?\n/)
  if (lines.length >= 2 && /^\s*```[\w-]*\s*$/.test(lines[0]!) && /^\s*```\s*$/.test(lines[lines.length - 1]!)) {
    return lines.slice(1, -1).join('\n').trim()
  }
  return ops
}

/**
 * Parses the <FILE> blocks of a patch response into ops per file path. Two blocks for the same path are combined.
 * Throws (so the call is made again with the error as feedback) when a block is not closed, targets a file that
 * isn't in the input, has invalid op syntax, or targets lines past the end of its file.
 */
const parsePatchOutput = (output: string, files: Array<{ path: string; content: string }>): Map<string, string> => {
  const patchMap = new Map<string, string>()
  const byPath = new Map(files.map((file) => [file.path, file]))

  // Match <FILE path="...">...</FILE> blocks
  const fileBlockRegex = /<FILE[^>]*path="([^"]+)"[^>]*>([\s\S]*?)<\/FILE>/g
  let match
  let blocks = 0

  while ((match = fileBlockRegex.exec(output)) !== null) {
    blocks++
    const filePath = match[1]!
    const patchOps = unfence(match[2]!.trim())
    const existing = patchMap.get(filePath)
    patchMap.set(filePath, existing ? `${existing}\n${patchOps}` : patchOps)
  }

  const opened = output.match(/<FILE\b/g)?.length ?? 0
  if (opened > blocks) {
    throw new Error(
      'A <FILE> block is not closed. Every <FILE path="..."> block must end with </FILE>. If the patch is long, use fewer and larger operations (e.g. replace a range instead of many single lines).'
    )
  }

  if (blocks === 0 && /^[\u25FC\u25A0]/m.test(output)) {
    throw new Error('The patch operations must be inside <FILE path="...">...</FILE> blocks, one per file.')
  }

  const errors: string[] = []
  for (const [filePath, patchOps] of patchMap) {
    const file = byPath.get(filePath)
    if (!file) {
      errors.push(
        `There is no file with path "${filePath}". Use the exact path of one of these files: ${[...byPath.keys()].map((p) => `"${p}"`).join(', ')}.`
      )
      continue
    }
    try {
      const { skipped } = Micropatch.applyWithReport(file.content, patchOps)
      for (const op of skipped) {
        errors.push(
          op.reason === 'out_of_range'
            ? `In "${filePath}": ${op.message}. Use the line numbers shown in the input.`
            : `In "${filePath}": ${op.message}. Each original line can be edited by only one operation; combine overlapping edits into a single operation.`
        )
      }
    } catch (err: unknown) {
      errors.push(`In "${filePath}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (errors.length) {
    throw new Error(`The patch is invalid:\n${errors.map((e) => `- ${e}`).join('\n')}`)
  }

  return patchMap
}

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Patches files based on natural language instructions using the micropatch protocol.
     *
     * This operation takes an array of files and instructions, then returns the modified files.
     * It uses a token-efficient line-based patching protocol (micropatch) that allows precise
     * modifications without regenerating entire files.
     *
     * @param files - Array of files to patch, each with path, name, and content
     * @param instructions - Natural language instructions describing what changes to make
     * @param options - Optional configuration for patch generation
     * @returns Response promise resolving to array of patched files
     *
     * @example Simple text replacement
     * ```typescript
     * const files = [{
     *   path: 'src/hello.ts',
     *   name: 'hello.ts',
     *   content: 'console.log("Hello World")'
     * }]
     *
     * const patched = await zai.patch(
     *   files,
     *   'change the message to say "Hi World"'
     * )
     * // patched[0].content contains: console.log("Hi World")
     * // patched[0].patch contains: ◼︎=1|console.log("Hi World")
     * ```
     *
     * @example Adding documentation
     * ```typescript
     * const files = [{
     *   path: 'src/utils.ts',
     *   name: 'utils.ts',
     *   content: 'export function add(a: number, b: number) {\n  return a + b\n}'
     * }]
     *
     * const patched = await zai.patch(
     *   files,
     *   'add JSDoc comments to all exported functions'
     * )
     * ```
     *
     * @example Patching multiple files
     * ```typescript
     * const files = [
     *   { path: 'package.json', name: 'package.json', content: '...' },
     *   { path: 'config.json', name: 'config.json', content: '...' }
     * ]
     *
     * const patched = await zai.patch(
     *   files,
     *   'update version to 2.0.0 in all config files'
     * )
     * ```
     *
     * @example Refactoring code
     * ```typescript
     * const files = [{
     *   path: 'src/api.ts',
     *   name: 'api.ts',
     *   content: 'function fetchUser() { ... }'
     * }]
     *
     * const patched = await zai.patch(
     *   files,
     *   'convert fetchUser to an async function and add error handling'
     * )
     * ```
     *
     * @example Removing code
     * ```typescript
     * const files = [{
     *   path: 'src/legacy.ts',
     *   name: 'legacy.ts',
     *   content: 'const debug = true\nconsole.log("Debug mode")\nfunction main() {...}'
     * }]
     *
     * const patched = await zai.patch(
     *   files,
     *   'remove all debug-related code'
     * )
     * ```
     *
     * @example Inspecting applied patches
     * ```typescript
     * const patched = await zai.patch(files, 'add error handling')
     *
     * // Check what patches were applied
     * for (const file of patched) {
     *   if (file.patch) {
     *     console.log(`Patches for ${file.path}:`)
     *     console.log(file.patch)
     *   }
     * }
     * ```
     */
    patch(files: Array<File>, instructions: string, options?: Options): Response<Array<File>>
  }
}

/**
 * Represents a chunk of a file (partial file)
 */
type FileChunk = {
  path: string
  name: string
  content: string
  startLine: number // 1-based line number where this chunk starts in the original file
  endLine: number // 1-based line number where this chunk ends in the original file
  totalLines: number // Total lines in the complete file
  isPartial: boolean // True if this is a chunk of a larger file
}

/**
 * Represents a batch of files or file chunks to process together
 */
type ProcessingBatch = {
  items: Array<FileChunk>
  tokenCount: number
}

const patch = async (
  files: Array<File>,
  instructions: string,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<Array<File>> => {
  ctx.controller.signal.throwIfAborted()
  const startedAt = Date.now()

  const options: Options = { ...Options.parse(_options ?? {}), schema: _options?.schema }

  let zSchema: z.ZodTypeAny | null = null
  if (options.schema) {
    if (!z.is.zuiType(options.schema)) {
      throw new Error(INVALID_SCHEMA_ERROR)
    }
    zSchema = options.schema
  }

  if (files.length === 0) {
    return []
  }

  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()

  const taskId = ctx.taskId
  const taskType = 'zai.patch'

  const TOKENS_TOTAL_MAX = model.input.maxTokens - PROMPT_INPUT_BUFFER - PROMPT_OUTPUT_BUFFER
  const TOKENS_INSTRUCTIONS_MAX = Math.floor(TOKENS_TOTAL_MAX * 0.2)
  const TOKENS_FILES_MAX = TOKENS_TOTAL_MAX - TOKENS_INSTRUCTIONS_MAX

  const truncatedInstructions = tokenizer.truncate(instructions, TOKENS_INSTRUCTIONS_MAX)

  // Determine max tokens per chunk
  const maxTokensPerChunk = options.maxTokensPerChunk ?? TOKENS_FILES_MAX

  // Convert files to file chunks (initially full files)
  const fileTokenCounts = files.map((file) => ({
    file,
    tokens: tokenizer.count(file.content),
    lines: file.content.split(/\r?\n/).length,
  }))

  const totalInputTokens = fileTokenCounts.reduce((sum, f) => sum + f.tokens, 0)

  // Files are cut between lines, never inside one: a single line that doesn't fit a call can't be patched
  for (const { file, tokens } of fileTokenCounts) {
    if (tokens <= TOKENS_FILES_MAX) continue
    file.content.split(/\r?\n/).forEach((line, i) => {
      const lineTokens = tokenizer.count(line)
      if (lineTokens > TOKENS_FILES_MAX) {
        throw new Error(
          `Line ${i + 1} of "${file.path}" is ${lineTokens} tokens long, more than the ${TOKENS_FILES_MAX} tokens one call to this model (${model.name}) can take. Files are patched line by line, so break that line into several lines (e.g. pretty-print minified JSON) first.`
        )
      }
    })
  }

  /**
   * Split a file into chunks by line ranges
   */
  const splitFileIntoChunks = (file: File, totalLines: number, fileTokens: number): Array<FileChunk> => {
    const lines = file.content.split(/\r?\n/)
    const tokensPerLine = fileTokens / totalLines
    // At least one line per chunk: a line longer than the budget gets a chunk of its own
    const linesPerChunk = Math.max(1, Math.floor(maxTokensPerChunk / tokensPerLine))

    if (linesPerChunk >= totalLines) {
      // File fits in one chunk
      return [
        {
          path: file.path,
          name: file.name,
          content: file.content,
          startLine: 1,
          endLine: totalLines,
          totalLines,
          isPartial: false,
        },
      ]
    }

    const chunks: Array<FileChunk> = []
    const pushChunk = (start: number, end: number) =>
      chunks.push({
        path: file.path,
        name: file.name,
        content: lines.slice(start, end).join('\n'),
        startLine: start + 1,
        endLine: end,
        totalLines,
        isPartial: true,
      })

    for (let start = 0; start < totalLines; start += linesPerChunk) {
      const end = Math.min(start + linesPerChunk, totalLines)

      // The line count comes from the file's average line length. When the lines are very uneven (e.g. one huge
      // line among short ones), the chunk can be far over budget: cut it again, line by line.
      const chunkTokens = tokenizer.count(lines.slice(start, end).join('\n'))
      if (end - start > 1 && chunkTokens > maxTokensPerChunk * CHUNK_OVERFLOW) {
        let from = start
        let tokens = 0
        for (let i = start; i < end; i++) {
          const lineTokens = tokenizer.count(lines[i]!) + 1
          if (i > from && tokens + lineTokens > maxTokensPerChunk) {
            pushChunk(from, i)
            from = i
            tokens = 0
          }
          tokens += lineTokens
        }
        pushChunk(from, end)
        continue
      }

      pushChunk(start, end)
    }

    return chunks
  }

  /**
   * Create batches of file chunks that fit within token limits
   */
  const createBatches = (chunks: Array<FileChunk>): Array<ProcessingBatch> => {
    const batches: Array<ProcessingBatch> = []
    let currentBatch: ProcessingBatch = { items: [], tokenCount: 0 }

    for (const chunk of chunks) {
      const chunkTokens = tokenizer.count(chunk.content)

      if (currentBatch.tokenCount + chunkTokens > maxTokensPerChunk && currentBatch.items.length > 0) {
        batches.push(currentBatch)
        currentBatch = { items: [], tokenCount: 0 }
      }

      currentBatch.items.push(chunk)
      currentBatch.tokenCount += chunkTokens
    }

    if (currentBatch.items.length > 0) {
      batches.push(currentBatch)
    }

    return batches
  }

  /**
   * Format file chunks using XML tags with numbered lines
   */
  const formatChunksForInput = (chunks: Array<FileChunk>): string => {
    return chunks
      .map((chunk) => {
        const lines = chunk.content.split(/\r?\n/)

        // Render with global line numbers
        const numberedView = lines
          .map((line, idx) => {
            const lineNum = chunk.startLine + idx
            return `${String(lineNum).padStart(3, '0')}|${line}`
          })
          .join('\n')

        const partialNote = chunk.isPartial
          ? ` (PARTIAL: lines ${chunk.startLine}-${chunk.endLine} of ${chunk.totalLines} total lines)`
          : ''

        return `<FILE path="${chunk.path}" name="${chunk.name}"${partialNote}>
${numberedView}
</FILE>`
      })
      .join('\n\n')
  }

  /**
   * For JSON files, validate the patched content is valid JSON.
   * Attempts repair with jsonrepair if invalid.
   * Returns the (possibly repaired) content, or null if unrecoverable.
   */
  const ensureValidJson = (content: string, kind: ReturnType<typeof jsonKind>): string | null => {
    const result = validateOrRepairJson(content, { kind })
    if (result.valid) {
      return result.content
    }
    return null
  }

  /**
   * Apply a patch to a file. If the file is JSON, validate and optionally repair the output.
   * If repair fails, re-prompt the LLM to fix the JSON.
   */
  const applyPatchToFile = async (file: File, patchOps: string | undefined): Promise<File> => {
    if (!patchOps || patchOps.trim().length === 0) {
      return { ...file, patch: '' }
    }

    // The ops were validated when the model's response was parsed, so this does not throw on syntax
    const patchedContent = Micropatch.applyText(file.content, patchOps)

    const jsonMode = isJsonFile(file.path, file.name)

    if (!jsonMode) {
      return { ...file, content: patchedContent, patch: patchOps }
    }

    // JSON mode: validate the original input is actually JSON
    const originalParse = validateOrRepairJson(file.content)
    if (!originalParse.valid) {
      // Original file wasn't valid JSON either, skip JSON validation
      return { ...file, content: patchedContent, patch: patchOps }
    }

    // Validate/repair the patched output. The patch must keep the file's top-level shape (object, array…)
    const kind = jsonKind(originalParse.data)
    const validContent = ensureValidJson(patchedContent, kind)
    if (validContent === null) {
      // Repair failed — give the LLM the broken result and ask it to fix the syntax
      return retryJsonPatch(file, patchedContent, kind)
    }

    // If a schema is provided, validate the JSON against it
    if (zSchema) {
      const parsed = JSON.parse(validContent)
      const safe = zSchema.safeParse(parsed)
      if (!safe.success) {
        return retrySchemaValidation(file, validContent, safe.error, kind)
      }
    }

    return { ...file, content: validContent, patch: patchOps }
  }

  /**
   * Re-prompt the LLM when a JSON file patch produced invalid JSON.
   * Gives the LLM the broken result as a new file to patch, asking it to fix just the JSON syntax errors.
   */
  const retryJsonPatch = async (
    file: File,
    brokenContent: string,
    kind: ReturnType<typeof jsonKind>
  ): Promise<File> => {
    // Get the parse error message
    const parseResult = validateOrRepairJson(brokenContent, { kind })
    const errorMessage = parseResult.valid ? '' : parseResult.error

    // Format the broken content as a numbered file for the LLM to patch
    const brokenChunk: FileChunk = {
      path: file.path,
      name: file.name,
      content: brokenContent,
      startLine: 1,
      endLine: brokenContent.split(/\r?\n/).length,
      totalLines: brokenContent.split(/\r?\n/).length,
      isPartial: false,
    }
    const brokenFileInput = formatChunksForInput([brokenChunk])

    const { extracted } = await ctx.generateContent({
      systemPrompt: getMicropatchSystemPrompt(),
      messages: [
        {
          type: 'text',
          role: 'user',
          content: [
            'The following JSON file has syntax errors. The original instructions were:',
            truncatedInstructions,
            '',
            'Here is the broken result:',
            '',
            brokenFileInput,
            '',
            `JSON parse error: ${errorMessage}`,
            '',
            'Fix ONLY the JSON syntax errors (missing commas, orphaned braces, etc). Do NOT change the data — only fix the syntax to make it valid JSON.',
          ].join('\n'),
        },
      ],
      stopSequences: [],
      transform: (text) => parsePatchOutput((text ?? '').trim(), [{ path: file.path, content: brokenContent }]),
    })

    const retryPatchOps = extracted.get(file.path)

    if (!retryPatchOps || retryPatchOps.trim().length === 0) {
      throw new Error(`JSON patch retry for "${file.path}" produced no patches.\n\n${errorMessage}`)
    }

    try {
      const retryContent = Micropatch.applyText(brokenContent, retryPatchOps)
      const validContent = ensureValidJson(retryContent, kind)
      if (validContent !== null) {
        if (zSchema) {
          const parsed = JSON.parse(validContent)
          const safe = zSchema.safeParse(parsed)
          if (!safe.success) {
            return retrySchemaValidation(file, validContent, safe.error, kind)
          }
        }
        return { ...file, content: validContent, patch: retryPatchOps }
      }
    } catch {
      // Fall through to throw
    }

    throw new Error(`JSON patch retry for "${file.path}" still produced invalid JSON.\n\n${errorMessage}`)
  }

  /**
   * Re-prompt the LLM when a JSON file's content is valid JSON but doesn't match the schema.
   * Gives the LLM the content + the schema validation errors and asks it to fix the data.
   */
  const retrySchemaValidation = async (
    file: File,
    content: string,
    zodError: z.ZodError,
    kind: ReturnType<typeof jsonKind>
  ): Promise<File> => {
    const errorMessage = new JsonParsingError(content, zodError).message

    const contentChunk: FileChunk = {
      path: file.path,
      name: file.name,
      content,
      startLine: 1,
      endLine: content.split(/\r?\n/).length,
      totalLines: content.split(/\r?\n/).length,
      isPartial: false,
    }
    const fileInput = formatChunksForInput([contentChunk])

    const { extracted } = await ctx.generateContent({
      systemPrompt: getMicropatchSystemPrompt(),
      messages: [
        {
          type: 'text',
          role: 'user',
          content: [
            'The following JSON file is valid JSON but does not match the expected schema.',
            '',
            fileInput,
            '',
            errorMessage,
            '',
            "Fix the JSON to match the schema. Only change what's needed to satisfy the validation errors above.",
          ].join('\n'),
        },
      ],
      stopSequences: [],
      transform: (text) => parsePatchOutput((text ?? '').trim(), [{ path: file.path, content }]),
    })

    const retryPatchOps = extracted.get(file.path)

    if (!retryPatchOps || retryPatchOps.trim().length === 0) {
      throw new Error(`Schema validation retry for "${file.path}" produced no patches.\n\n${errorMessage}`)
    }

    try {
      const retryContent = Micropatch.applyText(content, retryPatchOps)
      const validContent = ensureValidJson(retryContent, kind)
      if (validContent !== null) {
        if (zSchema) {
          const parsed = JSON.parse(validContent)
          const safe = zSchema.safeParse(parsed)
          if (safe.success) {
            return { ...file, content: validContent, patch: retryPatchOps }
          }
        } else {
          return { ...file, content: validContent, patch: retryPatchOps }
        }
      }
    } catch {
      // Fall through to throw
    }

    throw new Error(`Schema validation retry for "${file.path}" still failed.\n\n${errorMessage}`)
  }

  /**
   * Process a single batch of file chunks
   */
  const processBatch = async (batch: ProcessingBatch): Promise<Map<string, string>> => {
    const chunksInput = formatChunksForInput(batch.items)
    const { extracted } = await ctx.generateContent({
      systemPrompt: getMicropatchSystemPrompt(),
      messages: [
        {
          type: 'text',
          role: 'user',
          content: `
Instructions: ${truncatedInstructions}

${chunksInput}

Generate patches for each file that needs modification:
`.trim(),
        },
      ],
      stopSequences: [],
      // Invalid output throws here, so the call is made again with the error as feedback
      transform: (text) => parsePatchOutput((text ?? '').trim(), batchFiles(batch)),
    })

    return extracted
  }

  /** The complete files a batch's chunks come from (ops use the original line numbers of the whole file) */
  const batchFiles = (batch: ProcessingBatch) => {
    const paths = new Set(batch.items.map((item) => item.path))
    return files.filter((file) => paths.has(file.path))
  }

  // Check if we need chunking
  const needsChunking =
    totalInputTokens > maxTokensPerChunk || fileTokenCounts.some((f) => f.tokens > maxTokensPerChunk)

  if (!needsChunking) {
    // Simple case: all files fit in one prompt (existing logic)
    // Check for exact match in examples
    const Key = fastHash(
      stringify({
        taskId,
        taskType,
        files: files.map((f) => ({ path: f.path, content: f.content })),
        instructions: truncatedInstructions,
      })
    )

    const tableExamples =
      taskId && ctx.adapter
        ? await ctx.adapter.getExamples<Array<File>, Array<File>>({
            input: files,
            taskId,
            taskType,
          })
        : []

    const exactMatch = tableExamples.find((x) => x.key === Key)
    if (exactMatch) {
      return exactMatch.output as Array<File>
    }

    // Process all files in one batch
    const allChunks: Array<FileChunk> = fileTokenCounts.map(({ file }) => ({
      path: file.path,
      name: file.name,
      content: file.content,
      startLine: 1,
      endLine: file.content.split(/\r?\n/).length,
      totalLines: file.content.split(/\r?\n/).length,
      isPartial: false,
    }))

    const batch: ProcessingBatch = { items: allChunks, tokenCount: totalInputTokens }
    const patchMap = await processBatch(batch)

    // Apply patches to each file (with JSON validation/repair for .json files)
    const patchedFiles = await allOrAbort(
      ctx,
      files.map((file) => applyPatchToFile(file, patchMap.get(file.path)))
    )

    // Save example for active learning
    if (taskId && ctx.adapter && !ctx.controller.signal.aborted) {
      await ctx.adapter.saveExample({
        key: Key,
        taskType,
        taskId,
        input: files,
        output: patchedFiles,
        instructions: truncatedInstructions,
        metadata: {
          cost: {
            input: ctx.usage.cost.input,
            output: ctx.usage.cost.output,
          },
          latency: Date.now() - startedAt,
          model: ctx.modelName,
          tokens: {
            input: ctx.usage.tokens.input,
            output: ctx.usage.tokens.output,
          },
        },
      })
    }

    return patchedFiles
  }

  // Complex case: needs chunking
  // Step 1: Split files that are too large
  const allChunks: Array<FileChunk> = []
  for (const { file, tokens, lines } of fileTokenCounts) {
    const chunks = splitFileIntoChunks(file, lines, tokens)
    allChunks.push(...chunks)
  }

  // Step 2: Create batches that fit within token limits
  const batches = createBatches(allChunks)

  // Step 3: Process batches in parallel
  const limit = pLimit(10)
  const batchResults = await allOrAbort(
    ctx,
    batches.map((batch) => limit(() => processBatch(batch)))
  )

  // Step 4: Merge results - combine patches from all batches per file
  const mergedPatches = new Map<string, string>()
  for (const patchMap of batchResults) {
    for (const [filePath, patchOps] of patchMap.entries()) {
      const existing = mergedPatches.get(filePath) || ''
      const combined = existing ? `${existing}\n${patchOps}` : patchOps
      mergedPatches.set(filePath, combined)
    }
  }

  // Step 5: Apply merged patches to original files (with JSON validation/repair for .json files)
  const patchedFiles = await allOrAbort(
    ctx,
    files.map((file) => applyPatchToFile(file, mergedPatches.get(file.path)))
  )

  return patchedFiles
}

/**
 * Generate the system prompt that explains the micropatch protocol to the LLM
 */
function getMicropatchSystemPrompt(): string {
  return `
You are a code patching assistant. Your task is to generate precise line-based patches using the Micropatch protocol.

## Input Format

You will receive files in this XML format:

\`\`\`
<FILE path="src/hello.ts" name="hello.ts">
001|const x = 1
002|const y = 2
003|console.log(x + y)
</FILE>

<FILE path="src/utils.ts" name="utils.ts">
001|export function add(a, b) {
002|  return a + b
003|}
</FILE>
\`\`\`

Each file has:
- **path**: Full file path
- **name**: File name
- **Numbered lines**: Format is \`NNN|content\` where NNN is the ORIGINAL line number (1-based)

## Output Format

Generate patches for EACH file that needs modification using this EXACT XML format:

\`\`\`
<FILE path="src/hello.ts">
◼︎=1|const a = 1
◼︎=2|const b = 2
◼︎=3|console.log(a + b)
</FILE>

<FILE path="src/utils.ts">
◼︎<1|/**
 * Adds two numbers
 */
</FILE>
\`\`\`

**CRITICAL RULES**:
1. Each \`<FILE>\` tag MUST include the exact \`path\` attribute from the input
2. Put patch operations for EACH file inside its own \`<FILE>...</FILE>\` block
3. If a file doesn't need changes, omit its \`<FILE>\` block entirely
4. DO NOT mix patches from different files
5. DO NOT include line numbers or any text outside the patch operations

## Micropatch Protocol

The Micropatch protocol uses line numbers to reference ORIGINAL lines (before any edits).

### Operations

Each operation starts with the marker \`◼︎\` at the beginning of a line:

1. **Insert BEFORE line**: \`◼︎<NNN|text\`
   - Inserts \`text\` as a new line BEFORE original line NNN
   - Example: \`◼︎<5|console.log('debug')\`

2. **Insert AFTER line**: \`◼︎>NNN|text\`
   - Inserts \`text\` as a new line AFTER original line NNN
   - Example: \`◼︎>10|}\`

3. **Replace single line**: \`◼︎=NNN|new text\`
   - Replaces original line NNN with \`new text\`
   - Can span multiple lines (continue until next ◼︎ or end)
   - Example:
     \`\`\`
     ◼︎=7|function newName() {
       return 42
     }
     \`\`\`

4. **Replace range**: \`◼︎=NNN-MMM|replacement\`
   - Replaces lines NNN through MMM with replacement text
   - Example: \`◼︎=5-8|const combined = a + b + c + d\`

5. **Delete single line**: \`◼︎-NNN\`
   - Deletes original line NNN
   - Example: \`◼︎-12\`

6. **Delete range**: \`◼︎-NNN-MMM\`
   - Deletes lines NNN through MMM inclusive
   - Example: \`◼︎-5-10\`

### Escaping

- To include a literal \`◼︎\` in your text, use \`\\◼︎\`
- No other escape sequences are recognized

### Important Rules

1. **Use ORIGINAL line numbers**: Always reference the line numbers shown in the input (001, 002, etc.)
2. **One operation per line**: Each operation must start on a new line with \`◼︎\`
3. **No explanations**: Output ONLY patch operations inside \`<FILE>\` tags
4. **Precise operations**: Use the minimal set of operations to achieve the goal
5. **Verify line numbers**: Double-check that line numbers match the input

## Example

**Input:**
\`\`\`
<FILE path="src/math.ts" name="math.ts">
001|const x = 1
002|const y = 2
003|console.log(x + y)
004|
005|export { x, y }
</FILE>
\`\`\`

**Task:** Change variable names from x,y to a,b

**Output:**
\`\`\`
<FILE path="src/math.ts">
◼︎=1|const a = 1
◼︎=2|const b = 2
◼︎=3|console.log(a + b)
◼︎=5|export { a, b }
</FILE>
\`\`\`

## Your Task

Generate ONLY the \`<FILE>\` blocks with patch operations. Do not include explanations, comments, or any other text.
`.trim()
}

Zai.prototype.patch = function (
  this: Zai,
  files: Array<File>,
  instructions: string,
  _options?: Options
): Response<Array<File>> {
  const context = this._context('zai.patch')

  return new Response<Array<File>>(context, patch(files, instructions, _options, context), (result) => result)
}
