import { Client } from '@botpress/client'
import { CitationsManager, executeContext, ThinkSignal, Tool } from 'llmz'

import chalk from 'chalk'

import { CLIChat } from '../utils/cli-chat'
import { RAG_TAG, uploadToRAG, waitUntilIndexed } from './rag'
import { z } from '@bpinternal/zui'
import { loading } from '../utils/spinner'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

await uploadToRAG(client, ['hr.md', 'it.md', 'sales.md'])
console.log(chalk.green('✓') + ' Documents uploaded')

await waitUntilIndexed(client, 600)
console.log(chalk.green('✓') + ' Documents indexed for RAG')

const citations = new CitationsManager()

const rag = new Tool({
  name: 'search',
  description: 'Searches in the knowledge base for relevant information.',
  input: z.string().describe('The query to search in the knowledge base.'),
  async handler(query) {
    loading(true, '🔍 Searching ...')
    const { passages } = await client.searchFiles({
      query,
      tags: { purpose: RAG_TAG },
      limit: 20,
      contextDepth: 3,
      consolidate: true,
    })
    loading(false)

    if (!passages.length) {
      throw new ThinkSignal(
        'No results were found',
        'No results were found in the knowledge bases. You can try rephrasing your question or asking something else. Do NOT answer the question as no results were found.'
      )
    }

    let message: string[] = ['Here are the search results from the knowledge base:']
    let { tag: example } = citations.registerSource({})

    for (const p of passages) {
      const { tag } = citations.registerSource({ file: p.file.key })
      message.push(`\n<${tag} file="${p.file.key}">\n`)
      message.push(`**${p.file.tags}**\n  ${p.context}\n  ${p.content}`)
      message.push(`\n</${tag}>\n`)
    }

    throw new ThinkSignal(
      `We got the search results. When answering the question, you MUST add inline the citations used (eg: "Yes, the price is $10${example} ...")`,
      message.join('\n').trim()
    )
  },
})

const chat = new CLIChat({
  client,
  instructions:
    'You are a helpful assistant that can answer questions based on the provided knowledge base. Use the search tool to find relevant information.',
  tools: [rag],
  citations,
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
