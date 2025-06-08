import { Client } from '@botpress/client'
import { execute, ThinkSignal, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import chalk from 'chalk'

import { CLIChat } from '../utils/cli-chat'
import { RAG_TAG, uploadToRAG, waitUntilIndexed } from './rag'
import { loading } from '../utils/spinner'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

await uploadToRAG(client, ['hr.md', 'it.md', 'sales.md'])
console.log(chalk.green('✓') + ' Documents uploaded')

await waitUntilIndexed(client, 600)
console.log(chalk.green('✓') + ' Documents indexed for RAG')

const chat = new CLIChat()

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
    let { tag: example } = chat.citations.registerSource({})

    for (const p of passages) {
      const { tag } = chat.citations.registerSource({ file: p.file.key })
      message.push(`<${tag} file="${p.file.key}">`)
      message.push(`**${p.file.tags.title}**`)
      message.push(p.content)
      message.push(`</${tag}>`)
    }

    throw new ThinkSignal(
      `We got the search results. When answering the question, you MUST add inline the citations used (eg: "Yes, the price is $10${example} ...")`,
      message.join('\n').trim()
    )
  },
})

while (await chat.iterate()) {
  await execute({
    instructions:
      'You are a helpful assistant that can answer questions based on the provided knowledge base. Use the search tool to find relevant information.',
    tools: [rag],
    client,
    chat,
  })
}
