/**
 * Example 20: Retrieval-Augmented Generation (RAG)
 *
 * This example demonstrates a complete RAG (Retrieval-Augmented Generation) system.
 * It shows how to:
 * - Upload and index documents for semantic search
 * - Implement intelligent document retrieval with citations
 * - Use ThinkSignal for providing context to the LLM
 * - Handle search failures with graceful fallbacks
 * - Build a knowledge-based question answering system
 *
 * Key concepts:
 * - Document upload and indexing workflow
 * - Semantic search with Botpress file search
 * - Citation tracking and source attribution
 * - ThinkSignal for providing retrieved context
 * - RAG pattern implementation with LLMz
 */

import { Client } from '@botpress/client'
import { execute, ThinkSignal, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import chalk from 'chalk'

import { CLIChat } from '../utils/cli-chat'
import { RAG_TAG, uploadToRAG, waitUntilIndexed } from './rag'
import { loading } from '../utils/spinner'

// Initialize Botpress client for LLM and file operations
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Upload knowledge base documents for RAG
// This uploads HR, IT, and Sales documentation to the search index
await uploadToRAG(client, ['hr.md', 'it.md', 'sales.md'])
console.log(chalk.green('✓') + ' Documents uploaded')

// Wait for documents to be processed and indexed
// Indexing is required for semantic search functionality
await waitUntilIndexed(client, 600)
console.log(chalk.green('✓') + ' Documents indexed for RAG')

const chat = new CLIChat()

// RAG search tool for retrieving relevant information
// This implements the "Retrieval" part of Retrieval-Augmented Generation
const rag = new Tool({
  name: 'search',
  description: 'Searches in the knowledge base for relevant information.',
  input: z.string().describe('The query to search in the knowledge base.'),
  async handler(query) {
    // Show search progress to user
    loading(true, '🔍 Searching ...')

    // Perform semantic search across uploaded documents
    const { passages } = await client.searchFiles({
      query, // User's search query
      tags: { purpose: RAG_TAG }, // Filter to only RAG documents
      limit: 20, // Maximum number of results
      contextDepth: 3, // Include surrounding context
      consolidate: true, // Merge similar passages
    })
    loading(false)

    // Handle case where no relevant documents are found
    if (!passages.length) {
      throw new ThinkSignal(
        'No results were found',
        'No results were found in the knowledge bases. You can try rephrasing your question or asking something else. Do NOT answer the question as no results were found.'
      )
    }

    // Build formatted response with citations
    let message: string[] = ['Here are the search results from the knowledge base:']
    let { tag: example } = chat.citations.registerSource({})

    // Process each retrieved passage with proper citation tracking
    for (const p of passages) {
      const { tag } = chat.citations.registerSource({ file: p.file.key })
      message.push(`<${tag} file="${p.file.key}">`)
      message.push(`**${p.file.tags.title}**`)
      message.push(p.content)
      message.push(`</${tag}>`)
    }

    // Use ThinkSignal to provide retrieved context to the LLM
    // This is the "Augmented Generation" part - the LLM will use this context
    throw new ThinkSignal(
      `We got the search results. When answering the question, you MUST add inline the citations used (eg: "Yes, the price is $10${example} ...")`,
      message.join('\n').trim()
    )
  },
})

// Main conversation loop with RAG-enhanced responses
while (await chat.iterate()) {
  await execute({
    instructions:
      'You are a helpful assistant that can answer questions based on the provided knowledge base. Use the search tool to find relevant information.',

    // Provide the RAG search tool for knowledge retrieval
    tools: [rag],
    client,
    chat,
  })
}
