import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { ListenExit } from '../context.js'
import { Exit } from '../exit.js'
import { Tool } from '../tool.js'
import { TranscriptArray } from '../transcript.js'
import { DualModePrompt } from './dual-modes.js'

const chatSections = [
  'PROTOCOL SPECIFICATIONS',
  'AVAILABLE MESSAGE TYPES (■send)',
  'AVAILABLE TOOLS & VARIABLES (■run)',
  'AVAILABLE EXITS (■next)',
  'SYSTEM INSTRUCTIONS',
  'CHAT CONVERSATION HISTORY',
  'SUMMARY / WHAT YOU NEED TO DO NEXT',
]

const workerSections = chatSections
  .filter((section) => section !== 'AVAILABLE MESSAGE TYPES (■send)')
  .map((section) => section.replace('CHAT CONVERSATION HISTORY', 'TASK HISTORY'))

describe('system prompt sections', () => {
  it.each(['chat', 'worker', 'props-only chat'] as const)(
    'groups definitions before task instructions for %s',
    async (mode) => {
      const components =
        mode === 'worker' ? [] : mode === 'chat' ? [DefaultComponents.Text] : [DefaultComponents.Button]
      const { message } = await DualModePrompt.getSystemMessage({
        instructions: 'Follow the Cedar support policy.',
        components,
        exits: [mode === 'worker' ? new Exit({ name: 'done', description: 'Finish the assigned task.' }) : ListenExit],
        globalTools: [
          new Tool({
            name: 'lookupPolicy',
            description: 'Retrieve the Cedar policy.',
            input: z.string(),
            output: z.string(),
            handler: async () => 'Policy found',
          }),
        ],
        objects: [],
        transcript: new TranscriptArray([{ role: 'user', content: 'What is the Cedar refund window?' }]),
      })
      const text = String(message.content)
      const titles = mode === 'worker' ? workerSections : chatSections
      const headings = titles.map((title, i) => `SECTION ${i + 1}: ${title}`)
      expect(text.match(/^SECTION \d: .+$/gm)).toEqual(headings)
      const sections = Object.fromEntries(
        titles.map((title, i) => [
          title,
          text.slice(
            text.indexOf(headings[i]!),
            i === headings.length - 1 ? undefined : text.indexOf(headings[i + 1]!)
          ),
        ])
      )
      expect(sections['PROTOCOL SPECIFICATIONS']).toContain('■start')
      expect(sections['PROTOCOL SPECIFICATIONS']).not.toContain('### listen')
      expect(sections['SYSTEM INSTRUCTIONS']).toContain('Follow the Cedar support policy.')
      expect(sections['AVAILABLE TOOLS & VARIABLES (■run)']).toContain('Retrieve the Cedar policy.')
      expect(sections['AVAILABLE EXITS (■next)']).toContain(mode === 'worker' ? '### done' : '### listen')
      expect(sections[mode === 'worker' ? 'TASK HISTORY' : 'CHAT CONVERSATION HISTORY']).toContain(
        'What is the Cedar refund window?'
      )
      expect(sections['SUMMARY / WHAT YOU NEED TO DO NEXT']).toContain('# Response format')
      expect(text.trim().endsWith('Begin with ■start. End with ■end.')).toBe(true)
      if (mode !== 'worker')
        expect(sections['AVAILABLE MESSAGE TYPES (■send)']).toContain(mode === 'chat' ? '### message' : '### button')
      for (const reference of text.matchAll(/see SECTION (\d+)/gi))
        expect(Number(reference[1])).toBeLessThanOrEqual(headings.length)
    }
  )
})
