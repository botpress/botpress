// eslint-disable consistent-type-definitions
import { z } from '@bpinternal/zui'
import pLimit from 'p-limit'

import { ZaiContext } from '../context'
import { Response } from '../response'
import { getTokenizer } from '../tokenizer'
import { stringify } from '../utils'
import { Zai } from '../zai'
import { PROMPT_INPUT_BUFFER } from './constants'

/**
 * Citation referencing a specific line or range of lines in support documents
 */
export type Citation<T> = {
  /** The character offset where this citation appears in the answer */
  offset: number
  /** The support document item(s) used at this offset */
  item: T
  /** The line contents joined together as a snippet */
  snippet: string
}

/**
 * A single answer with citations
 */
export type AnswerWithCitations<T> = {
  /** The answer text */
  answer: string
  /** Citations mapping answer text to support documents */
  citations: Citation<T>[]
}

/**
 * Response type when a clear answer can be provided
 */
export type AnswerResponse<T> = {
  type: 'answer'
} & AnswerWithCitations<T>

/**
 * Response type when the question is ambiguous and multiple interpretations exist
 */
export type AmbiguousResponse<T> = {
  type: 'ambiguous'
  /** What is the ambiguity? What concepts clash or are unclear? */
  ambiguity: string
  /** A follow-up question to clear out the ambiguity */
  follow_up: string
  /** Possible answers for different interpretations (2-3 answers) */
  answers: AnswerWithCitations<T>[]
}

/**
 * Response type when the question is out of topic
 */
export type OutOfTopicResponse = {
  type: 'out_of_topic'
  /** Why is this question considered out of topic? */
  reason: string
}

/**
 * Response type when the question is invalid or malformed
 */
export type InvalidQuestionResponse = {
  type: 'invalid_question'
  /** What makes this an invalid question? */
  reason: string
}

/**
 * Response type when there is insufficient knowledge to answer
 */
export type MissingKnowledgeResponse = {
  type: 'missing_knowledge'
  /** What knowledge is missing to generate a high-quality answer? */
  reason: string
}

/**
 * All possible response types from zai.answer
 */
export type AnswerResult<T> =
  | AnswerResponse<T>
  | AmbiguousResponse<T>
  | OutOfTopicResponse
  | InvalidQuestionResponse
  | MissingKnowledgeResponse

/**
 * Example for few-shot learning
 */
export type AnswerExample<T> = {
  /** Support documents for this example */
  documents: T[]
  /** The question asked */
  question: string
  /** The expected answer result */
  result: AnswerResult<T>
}

export type Options<T> = {
  /** Examples to help guide answer generation */
  examples?: AnswerExample<T>[]
  /** Additional instructions for answer generation */
  instructions?: string
  /** Maximum number of tokens per document chunk */
  chunkLength?: number
  /**
   * Maximum number of refinement iterations when merging chunked results
   * @default 3
   */
  maxRefinementPasses?: number
}

const _Options = z.object({
  examples: z.array(z.any()).default([]).describe('Examples to help guide answer generation'),
  instructions: z.string().optional().describe('Additional instructions for answer generation'),
  chunkLength: z
    .number()
    .min(250)
    .max(100_000)
    .optional()
    .describe('Maximum number of tokens per document chunk')
    .default(16_000),
  maxRefinementPasses: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe('Maximum number of refinement iterations when merging chunked results')
    .default(3),
})

declare module '@botpress/zai' {
  interface Zai {
    /**
     * Answers questions from documents with citations and intelligent handling of edge cases.
     *
     * This operation provides a production-ready question-answering system that:
     * - Cites sources with precise line references
     * - Handles ambiguous questions with multiple interpretations
     * - Detects out-of-topic or invalid questions
     * - Identifies missing knowledge
     * - Automatically chunks and processes large document sets
     *
     * @param documents - Array of documents to search (strings, objects, or any type)
     * @param question - The question to answer
     * @param options - Configuration for chunking, examples, and instructions
     * @returns Response with answer + citations, or error states (ambiguous, out_of_topic, invalid, missing_knowledge)
     *
     * @example Basic usage with string documents
     * ```typescript
     * const documents = [
     *   'Botpress was founded in 2016.',
     *   'The company is based in Quebec, Canada.',
     *   'Botpress provides an AI agent platform.'
     * ]
     *
     * const result = await zai.answer(documents, 'When was Botpress founded?')
     * if (result.type === 'answer') {
     *   console.log(result.answer) // "Botpress was founded in 2016."
     *   console.log(result.citations) // [{ offset: 30, item: documents[0], snippet: '...' }]
     * }
     * ```
     *
     * @example With object documents
     * ```typescript
     * const products = [
     *   { id: 1, name: 'Pro Plan', price: 99, features: ['AI', 'Analytics'] },
     *   { id: 2, name: 'Enterprise', price: 499, features: ['AI', 'Support', 'SLA'] }
     * ]
     *
     * const result = await zai.answer(products, 'What features does the Pro Plan include?')
     * // Returns answer with citations pointing to the product objects
     * ```
     *
     * @example Handling different response types
     * ```typescript
     * const result = await zai.answer(documents, question)
     *
     * switch (result.type) {
     *   case 'answer':
     *     console.log('Answer:', result.answer)
     *     console.log('Sources:', result.citations)
     *     break
     *
     *   case 'ambiguous':
     *     console.log('Question is ambiguous:', result.ambiguity)
     *     console.log('Clarifying question:', result.follow_up)
     *     console.log('Possible answers:', result.answers)
     *     break
     *
     *   case 'out_of_topic':
     *     console.log('Question unrelated:', result.reason)
     *     break
     *
     *   case 'invalid_question':
     *     console.log('Invalid question:', result.reason)
     *     break
     *
     *   case 'missing_knowledge':
     *     console.log('Insufficient info:', result.reason)
     *     break
     * }
     * ```
     *
     * @example With custom instructions
     * ```typescript
     * const result = await zai.answer(documents, 'What is the pricing?', {
     *   instructions: 'Provide detailed pricing breakdown including all tiers',
     *   chunkLength: 8000 // Process in smaller chunks for accuracy
     * })
     * ```
     *
     * @example Large document sets (auto-chunking)
     * ```typescript
     * // Handles thousands of documents automatically
     * const manyDocs = await loadDocuments() // 1000+ documents
     * const result = await zai.answer(manyDocs, 'What is the refund policy?')
     * // Automatically chunks, processes in parallel, and merges results
     * ```
     *
     * @example Tracking citations
     * ```typescript
     * const result = await zai.answer(documents, question)
     * if (result.type === 'answer') {
     *   result.citations.forEach(citation => {
     *     console.log(`At position ${citation.offset}:`)
     *     console.log(`  Cited: "${citation.snippet}"`)
     *     console.log(`  From document:`, citation.item)
     *   })
     * }
     * ```
     */
    answer<T>(documents: T[], question: string, options?: Options<T>): Response<AnswerResult<T>, AnswerResult<T>>
  }
}

// Markers for parsing LLM output
const ANSWER_START = '■answer'
const AMBIGUOUS_START = '■ambiguous'
const OUT_OF_TOPIC_START = '■out_of_topic'
const INVALID_QUESTION_START = '■invalid_question'
const MISSING_KNOWLEDGE_START = '■missing_knowledge'
const END = '■end■'

/**
 * Maps line numbers to document index and line within that document
 */
type LineMapping<T> = {
  lineNumber: number
  documentIndex: number
  lineInDocument: number
  text: string
  document: T
}

/**
 * Format documents with line numbers and create mappings
 */
const formatDocumentsWithLineNumbers = <T>(documents: T[]): { formatted: string; mappings: LineMapping<T>[] } => {
  const mappings: LineMapping<T>[] = []
  const allLines: string[] = []
  let globalLineNumber = 1

  // First pass: count total lines to determine padding
  let totalLines = 0
  documents.forEach((doc) => {
    const docString = stringify(doc)
    const lines = docString.split('\n')
    totalLines += lines.length
  })

  const padding = Math.max(3, totalLines.toString().length)

  // Second pass: format with padding
  documents.forEach((doc, docIndex) => {
    const docString = stringify(doc)
    const lines = docString.split('\n')

    lines.forEach((line, lineInDoc) => {
      const paddedNumber = globalLineNumber.toString().padStart(padding, '0')
      const formattedLine = `■${paddedNumber} | ${line}`
      allLines.push(formattedLine)

      mappings.push({
        lineNumber: globalLineNumber,
        documentIndex: docIndex,
        lineInDocument: lineInDoc,
        text: line,
        document: doc,
      })

      globalLineNumber++
    })
  })

  return {
    formatted: allLines.join('\n'),
    mappings,
  }
}

/**
 * Parse citations from answer text
 * Format: ■001, ■001-005, ■001■003■005
 */
const parseCitations = <T>(
  answerText: string,
  mappings: LineMapping<T>[]
): { cleanAnswer: string; citations: Citation<T>[] } => {
  const citations: Citation<T>[] = []
  const citationPattern = /■(\d+)(?:-(\d+))?/g
  let match: RegExpExecArray | null
  const processedRanges = new Set<string>()

  // Find all citation markers and replace them
  let cleanAnswer = answerText
  let offsetAdjustment = 0

  while ((match = citationPattern.exec(answerText)) !== null) {
    const fullMatch = match[0]
    const offset = match.index - offsetAdjustment
    const startLine = parseInt(match[1], 10)
    const endLine = match[2] ? parseInt(match[2], 10) : startLine

    // Generate range key to avoid duplicates
    const rangeKey = `${offset}:${startLine}-${endLine}`
    if (processedRanges.has(rangeKey)) {
      continue
    }
    processedRanges.add(rangeKey)

    // Collect all line numbers in this citation
    const lineNumbers: number[] = []
    for (let i = startLine; i <= endLine; i++) {
      lineNumbers.push(i)
    }

    // Find the corresponding documents
    const relevantMappings = mappings.filter((m) => lineNumbers.includes(m.lineNumber))
    if (relevantMappings.length > 0) {
      // Group by document to create citations
      const documentMap = new Map<T, string[]>()
      relevantMappings.forEach((mapping) => {
        const existing = documentMap.get(mapping.document) || []
        existing.push(mapping.text)
        documentMap.set(mapping.document, existing)
      })

      documentMap.forEach((lines, document) => {
        citations.push({
          offset,
          item: document,
          snippet: lines.join('\n'),
        })
      })
    }

    // Remove citation marker from answer text
    cleanAnswer = cleanAnswer.slice(0, offset) + cleanAnswer.slice(offset + fullMatch.length)
    offsetAdjustment += fullMatch.length
  }

  return {
    cleanAnswer: cleanAnswer.trim(),
    citations: citations.sort((a, b) => a.offset - b.offset),
  }
}

/**
 * Process a single chunk of documents (all fit in one LLM call)
 */
const processSingleChunk = async <T>(
  formattedDocs: string,
  mappings: LineMapping<T>[],
  question: string,
  options: Options<T>,
  ctx: ZaiContext
): Promise<AnswerResult<T>> => {
  ctx.controller.signal.throwIfAborted()
  const result = await callLLM(formattedDocs, question, options, mappings, ctx)
  ctx.controller.signal.throwIfAborted()
  return result
}

/**
 * Process multiple chunks and merge results
 */
const processMultipleChunks = async <T>(
  documents: T[],
  question: string,
  chunkTokenLimit: number,
  options: Options<T>,
  ctx: ZaiContext
): Promise<AnswerResult<T>> => {
  const tokenizer = await getTokenizer()

  // Split documents into chunks
  const chunks: T[][] = []
  let currentChunk: T[] = []
  let currentTokens = 0

  for (const doc of documents) {
    const docString = stringify(doc)
    const docTokens = tokenizer.count(docString)

    if (currentTokens + docTokens > chunkTokenLimit && currentChunk.length > 0) {
      chunks.push([...currentChunk])
      currentChunk = [doc]
      currentTokens = docTokens
    } else {
      currentChunk.push(doc)
      currentTokens += docTokens
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  // Process a single chunk
  const processChunk = async (chunk: T[]): Promise<AnswerResult<T>> => {
    ctx.controller.signal.throwIfAborted()
    const { formatted, mappings } = formatDocumentsWithLineNumbers(chunk)
    const result = await callLLM(formatted, question, options, mappings, ctx)
    ctx.controller.signal.throwIfAborted()
    return result
  }

  // Process all chunks in parallel
  const limit = pLimit(10) // Limit to 10 concurrent operations
  const chunkResults = await Promise.all(chunks.map((chunk) => limit(() => processChunk(chunk))))

  ctx.controller.signal.throwIfAborted()

  // Merge results
  return mergeChunkResults(chunkResults, question, chunkTokenLimit, options, ctx)
}

/**
 * Merge results from multiple chunks
 */
const mergeChunkResults = async <T>(
  results: AnswerResult<T>[],
  question: string,
  chunkTokenLimit: number,
  options: Options<T>,
  ctx: ZaiContext
): Promise<AnswerResult<T>> => {
  ctx.controller.signal.throwIfAborted()
  // Filter out non-answer results
  const answers = results.filter((r): r is AnswerResponse<T> => r.type === 'answer')

  if (answers.length === 0) {
    // No answers found, return first non-answer result
    const nonAnswer = results.find((r) => r.type !== 'answer')
    return nonAnswer || { type: 'missing_knowledge', reason: 'No relevant information found in documents.' }
  }

  if (answers.length === 1) {
    return answers[0]
  }

  // Collect all cited documents
  const citedDocs = new Set<T>()
  answers.forEach((answer) => {
    answer.citations.forEach((citation) => {
      citedDocs.add(citation.item)
    })
  })

  const citedDocsArray = Array.from(citedDocs)

  // Try to merge by re-running with only cited documents
  const tokenizer = await getTokenizer()
  const { formatted, mappings } = formatDocumentsWithLineNumbers(citedDocsArray)

  if (tokenizer.count(formatted) <= chunkTokenLimit) {
    // Cited docs fit in one chunk, get unified answer
    return await callLLM(formatted, question, options, mappings, ctx)
  }

  // Still too large, return best answer from chunks
  // Prefer the answer with most citations
  return answers.reduce((best, current) => (current.citations.length > best.citations.length ? current : best))
}

/**
 * Call LLM to generate answer with automatic retry on citation errors
 */
const callLLM = async <T>(
  formattedDocs: string,
  question: string,
  options: Options<T>,
  mappings: LineMapping<T>[],
  ctx: ZaiContext
): Promise<AnswerResult<T>> => {
  const systemPrompt = `You are an expert research assistant specialized in answering questions using only the information provided in documents.

# Task
Answer the user's question based ONLY on the information in the provided documents. You MUST cite your sources using line numbers.

# Document Format
Documents are provided with line numbers:
■001 | First line of text
■002 | Second line of text
■003 | Third line of text

# Citation Format
You MUST include citations immediately after statements. Use these formats:
- Single line: ■035
- Range: ■005-010
- Multiple: ■035■046■094

# Response Format

Choose ONE of these response types:

**TYPE 1 - ANSWER** (Use this when you can answer the question)
■answer
[Your answer with inline citations■001-003. Make sure each part is cited correctly■013. More text. ■015]
■end■

**TYPE 2 - AMBIGUOUS** (Use when the question has multiple valid interpretations)
■ambiguous
[Explain the ambiguity]
■follow_up
[Ask a clarifying question]
■answer
[First interpretation with citations ■001 and part 2 as well.■002]
■answer
[Second interpretation with citations ■005 and part 2 of the answer.■006]
■end■

**TYPE 3 - OUT OF TOPIC** (Use when question is completely unrelated to documents)
■out_of_topic
[Explain why it's unrelated]
■end■

**TYPE 4 - INVALID QUESTION** (Use when input is not a proper question, e.g., gibberish, malformed or nonsensical)
■invalid_question
[Explain why it's invalid, e.g., "The question is incomplete" or "The question contains nonsensical terms", or "Received gibberish"]
■end■

**TYPE 5 - MISSING KNOWLEDGE** (Use ONLY when documents lack specific details needed)
■missing_knowledge
[Explain what specific information is missing]
■end■

# Important Rules
- PREFER answering when possible - only use missing_knowledge if truly no relevant info exists
- ALWAYS cite sources with line numbers
- Use ONLY information from the documents
- Be precise and factual
- Do NOT fabricate information
- Do NOT mention "According to the documents" or similar phrases – just provide a high-quality answer with citations
- Do not be too strict on the question format; assume high-level answers are acceptable unless the question clearly asks for very specific details or requests depth beyond the documents

# Additional Instructions
Here are some additional instructions to follow about how to answer the question:
${options.instructions || 'Provide a clear and concise answer based on the documents.'}`

  const userPrompt = `<documents>
${formattedDocs}
</documents>

Please answer the below question using the format specified above.
Question to answer: "${question}"`

  const { extracted } = await ctx.generateContent({
    reasoningEffort: 'none',
    systemPrompt,
    stopSequences: [END],
    messages: [
      {
        type: 'text',
        role: 'user',
        content: userPrompt,
      },
    ],
    transform: (text) => {
      text = text.slice(0, text.lastIndexOf(END.slice(0, -1))) // Remove anything after END
      // Parse and validate response - errors will be caught and retried
      return parseResponse(text || '', mappings)
    },
  })

  return extracted
}

/**
 * Parse LLM response into structured result
 * @internal - Exported for testing purposes only
 */
export const parseResponse = <T>(response: string, mappings: LineMapping<T>[]): AnswerResult<T> => {
  const text = response.trim()

  const answersCount = (text.match(new RegExp(ANSWER_START, 'g')) || []).length

  // Check response type
  if (text.includes(AMBIGUOUS_START) || answersCount >= 2) {
    return parseAmbiguousResponse(text, mappings)
  } else if (text.includes(ANSWER_START)) {
    return parseAnswerResponse(text, mappings)
  } else if (text.includes(OUT_OF_TOPIC_START)) {
    return parseOutOfTopicResponse(text)
  } else if (text.includes(INVALID_QUESTION_START)) {
    return parseInvalidQuestionResponse(text)
  } else if (text.includes(MISSING_KNOWLEDGE_START)) {
    return parseMissingKnowledgeResponse(text)
  }

  // Default to missing knowledge if format not recognized
  return {
    type: 'missing_knowledge',
    reason: 'Unable to determine response type from the model output.',
  }
}

/**
 * Parse answer response
 */
const parseAnswerResponse = <T>(text: string, mappings: LineMapping<T>[]): AnswerResponse<T> => {
  // Match from answer start to end of string (END is a stop sequence and never appears)
  const answerMatch = text.match(new RegExp(`${ANSWER_START}(.+)$`, 's'))
  if (!answerMatch) {
    return {
      type: 'missing_knowledge',
      reason: 'Could not extract answer from response.',
    } as any
  }

  const answerText = answerMatch[1].trim()
  const { cleanAnswer, citations } = parseCitations(answerText, mappings)

  // Validate that citations are present
  if (citations.length === 0) {
    throw new Error(
      'Answer must include citations using the ■XXX format (e.g., ■001, ■001-005). Every statement should be backed by a citation to the source documents.'
    )
  }

  return {
    type: 'answer',
    answer: cleanAnswer,
    citations,
  }
}

/**
 * Parse ambiguous response
 */
const parseAmbiguousResponse = <T>(text: string, mappings: LineMapping<T>[]): AmbiguousResponse<T> => {
  // Extract ambiguity explanation
  const ambiguityMatch = text.match(new RegExp(`${AMBIGUOUS_START}(.+?)■follow_up`, 's'))
  const ambiguity = ambiguityMatch ? ambiguityMatch[1].trim() : 'The question has multiple interpretations.'

  // Extract follow-up question
  const followUpMatch = text.match(/■follow_up(.+?)■answer/s)
  const follow_up = followUpMatch ? followUpMatch[1].trim() : 'Please clarify your question.'

  // Extract all possible answers (match until next ■answer or end of string)
  const answerPattern = /■answer(.+?)(?=■answer|$)/gs
  const answers: AnswerWithCitations<T>[] = []
  let match: RegExpExecArray | null

  while ((match = answerPattern.exec(text)) !== null) {
    const answerText = match[1].trim()
    const { cleanAnswer, citations } = parseCitations(answerText, mappings)
    answers.push({ answer: cleanAnswer, citations })
  }

  // Validate that each answer has citations
  const answersWithoutCitations = answers.filter((a) => a.citations.length === 0)
  if (answersWithoutCitations.length > 0) {
    throw new Error(
      'Each answer in an ambiguous response must include citations using the ■XXX format (e.g., ■001, ■001-005). Every statement should be backed by a citation to the source documents.'
    )
  }

  return {
    type: 'ambiguous',
    ambiguity,
    follow_up,
    answers: answers.length >= 2 ? answers.slice(0, 3) : answers,
  }
}

/**
 * Parse out of topic response
 */
const parseOutOfTopicResponse = (text: string): OutOfTopicResponse => {
  const reasonMatch = text.match(new RegExp(`${OUT_OF_TOPIC_START}(.+)$`, 's'))
  const reason = reasonMatch ? reasonMatch[1].trim() : 'The question is not related to the provided documents.'

  return {
    type: 'out_of_topic',
    reason,
  }
}

/**
 * Parse invalid question response
 */
const parseInvalidQuestionResponse = (text: string): InvalidQuestionResponse => {
  const reasonMatch = text.match(new RegExp(`${INVALID_QUESTION_START}(.+)$`, 's'))
  const reason = reasonMatch ? reasonMatch[1].trim() : 'The question is invalid or malformed.'

  return {
    type: 'invalid_question',
    reason,
  }
}

/**
 * Parse missing knowledge response
 */
const parseMissingKnowledgeResponse = (text: string): MissingKnowledgeResponse => {
  const reasonMatch = text.match(new RegExp(`${MISSING_KNOWLEDGE_START}(.+)$`, 's'))
  const reason = reasonMatch
    ? reasonMatch[1].trim()
    : 'The documents do not contain sufficient information to answer the question.'

  return {
    type: 'missing_knowledge',
    reason,
  }
}

/**
 * Answer generation with intelligent chunking and merging strategy
 *
 * Strategy for handling large document sets:
 *
 * 1. **Single-pass case**: If all documents fit in one LLM call, process directly
 *
 * 2. **Multi-pass case**: If documents exceed token limit:
 *    a. Split documents into chunks that fit in token budget
 *    b. Run question over EVERY chunk (ensures every document is considered at least once)
 *    c. Collect all partial answers with their citations
 *    d. If citations span multiple chunks:
 *       - Extract only the cited lines from each chunk
 *       - Create a new, smaller document set with just cited content
 *       - Re-run the question with this refined set
 *       - Merge into a unified answer
 *    e. Repeat refinement until:
 *       - All citations fit in one call (unified answer achieved), OR
 *       - Max refinement passes reached (default: 3)
 *
 * This approach ensures:
 * - Every document is evaluated at least once
 * - Progressive refinement focuses on most relevant content
 * - Typical convergence in 1-3 LLM calls total
 * - Coherent final answer even from scattered information
 */
const answer = async <T>(
  documents: T[],
  question: string,
  options: Options<T>,
  ctx: ZaiContext
): Promise<AnswerResult<T>> => {
  ctx.controller.signal.throwIfAborted()

  if (documents.length === 0) {
    return {
      type: 'missing_knowledge',
      reason: 'No documents provided to answer the question.',
    }
  }

  if (!question || question.trim().length === 0) {
    return {
      type: 'invalid_question',
      reason: 'The question is empty or contains no content.',
    }
  }

  const tokenizer = await getTokenizer()
  const model = await ctx.getModel()
  const TOTAL_MAX_TOKENS = Math.min(options.chunkLength, model.input.maxTokens - PROMPT_INPUT_BUFFER)

  // Format all documents with line numbers
  const { formatted: allFormattedDocs, mappings: allMappings } = formatDocumentsWithLineNumbers(documents)

  const CHUNK_DOC_TOKENS = Math.floor(TOTAL_MAX_TOKENS * 0.6)
  const totalDocTokens = tokenizer.count(allFormattedDocs)

  // Check if we need to chunk
  if (totalDocTokens <= CHUNK_DOC_TOKENS) {
    // Single pass - all documents fit
    return await processSingleChunk(allFormattedDocs, allMappings, question, options, ctx)
  } else {
    // Multi-pass chunking required
    return await processMultipleChunks(documents, question, CHUNK_DOC_TOKENS, options, ctx)
  }
}

Zai.prototype.answer = function <T>(
  this: Zai,
  documents: T[],
  question: string,
  _options?: Options<T>
): Response<AnswerResult<T>, AnswerResult<T>> {
  const parse = _Options.safeParse(_options ?? {})

  if (!parse.success) {
    return Promise.reject(new Error(`Invalid options: ${parse.error.message}`)) as any
  }

  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.answer',
    adapter: this.adapter,
  })

  return new Response<AnswerResult<T>, AnswerResult<T>>(
    context,
    answer(documents, question, parse.data, context),
    (result) => result // No simplification - return full result
  )
}
