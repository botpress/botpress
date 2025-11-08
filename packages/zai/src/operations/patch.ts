// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'

import { ZaiContext } from '../context'
import { Micropatch } from '../micropatch'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { fastHash, stringify } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER, PROMPT_OUTPUT_BUFFER } from './constants'

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

export type Options = {
  /** Reserved for future options */
  _unused?: boolean
}

const Options = z.object({
  _unused: z.boolean().optional(),
})

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

const patch = async (
  files: Array<File>,
  instructions: string,
  _options: Options | undefined,
  ctx: ZaiContext
): Promise<Array<File>> => {
  ctx.controller.signal.throwIfAborted()

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

  // Check if all files fit in one prompt
  const totalInputTokens = files.reduce((sum, file) => sum + tokenizer.count(file.content), 0)
  if (totalInputTokens > TOKENS_FILES_MAX) {
    throw new Error(
      `The total size of all files is ${totalInputTokens} tokens, which exceeds the maximum of ${TOKENS_FILES_MAX} tokens for this model (${model.name})`
    )
  }

  /**
   * Format files using XML tags with numbered lines
   */
  const formatFilesForInput = (files: Array<File>): string => {
    return files
      .map((file) => {
        const mp = new Micropatch(file.content)
        const numberedView = mp.renderNumberedView()

        return `<FILE path="${file.path}" name="${file.name}">
${numberedView}
</FILE>`
      })
      .join('\n\n')
  }

  /**
   * Parse XML output to extract patches per file
   */
  const parsePatchOutput = (output: string): Map<string, string> => {
    const patchMap = new Map<string, string>()

    // Match <FILE path="...">...</FILE> blocks
    const fileBlockRegex = /<FILE[^>]*path="([^"]+)"[^>]*>([\s\S]*?)<\/FILE>/g
    let match

    while ((match = fileBlockRegex.exec(output)) !== null) {
      const filePath = match[1]
      const patchOps = match[2].trim()
      patchMap.set(filePath, patchOps)
    }

    return patchMap
  }

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

  // Format all files for input
  const filesInput = formatFilesForInput(files)

  // Generate patches
  const { extracted, meta } = await ctx.generateContent({
    systemPrompt: getMicropatchSystemPrompt(),
    messages: [
      {
        type: 'text',
        role: 'user',
        content: `
Instructions: ${truncatedInstructions}

${filesInput}

Generate patches for each file that needs modification:
`.trim(),
      },
    ],
    stopSequences: [],
    transform: (text) => {
      return text.trim()
    },
  })

  // Parse the output to get patches per file
  const patchMap = parsePatchOutput(extracted)

  // Apply patches to each file
  const patchedFiles: Array<File> = files.map((file) => {
    const patchOps = patchMap.get(file.path)

    if (!patchOps || patchOps.trim().length === 0) {
      // No patches for this file, return original
      return {
        ...file,
        patch: '', // No patches applied
      }
    }

    try {
      const patchedContent = Micropatch.applyText(file.content, patchOps)
      return {
        ...file,
        content: patchedContent,
        patch: patchOps, // Include the patch operations that were applied
      }
    } catch (error) {
      // If patch fails, return original file
      console.error(`Failed to apply patch to ${file.path}:`, error)
      return {
        ...file,
        patch: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  })

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
          input: meta.cost.input,
          output: meta.cost.output,
        },
        latency: meta.latency,
        model: ctx.modelId,
        tokens: {
          input: meta.tokens.input,
          output: meta.tokens.output,
        },
      },
    })
  }

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
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.patch',
    adapter: this.adapter,
  })

  return new Response<Array<File>>(context, patch(files, instructions, _options, context), (result) => result)
}
