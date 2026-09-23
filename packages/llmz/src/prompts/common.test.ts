import { describe, it, expect } from 'vitest'

import { parseAssistantResponse, replacePlaceholders } from './common.js'

describe('message-stream prompt', { timeout: 60_000 }, () => {
  describe('parseAssistantResponse', () => {
    it('parses sends, run and next blocks', async () => {
      const input = `
■send=md
Let me check that for you.
■run
// Fetch the user data
const data = await fetchUserData({ id: 'usr_1' })
return data
`.trim()

      const response = parseAssistantResponse(`■start\n${input}\n■end`)

      expect(response.sends).toEqual([{ name: 'md', props: {}, body: 'Let me check that for you.' }])
      expect(response.code).toMatchInlineSnapshot(`
        "// Fetch the user data
        const data = await fetchUserData({ id: 'usr_1' })
        return data"
      `)
      expect(response.next).toBeUndefined()
    })

    it('parses a next exit with props', async () => {
      const response = parseAssistantResponse(
        '■start\n■send=md\nTransferring you now!\n■next=book_meeting { reason: "demo", email: "a@b.com" }\n■end'
      )

      expect(response.code).toBeUndefined()
      expect(response.next).toEqual({ name: 'book_meeting', props: { reason: 'demo', email: 'a@b.com' } })
    })

    it('discards wrapper fences outside a valid response envelope', () => {
      const response = parseAssistantResponse('```\n■start\n■send=md\nHello!\n■next=listen\n■end\n```')
      expect(response.sends).toEqual([{ name: 'md', props: {}, body: 'Hello!' }])
      expect(response.next).toEqual({ name: 'listen', props: {} })
      expect(response.diagnostics).toEqual([
        { code: 'unexpected-text', message: 'Discarded text before ■start' },
        { code: 'unexpected-text', message: 'Discarded content after ■end' },
      ])
    })

    it('retains plain text for debugging without creating an implicit send', async () => {
      const raw = 'Hello! How can I help you today?'
      const response = parseAssistantResponse(raw)

      expect(response.raw).toBe(raw)
      expect(response.items).toEqual([])
      expect(response.sends).toEqual([])
      expect(response.diagnostics).toContainEqual({ code: 'invalid-envelope', message: expect.any(String) })
      expect(response.code).toBeUndefined()
      expect(response.next).toBeUndefined()
    })

    it('keeps code fences inside message bodies', async () => {
      const input = '■send=md\nHere is an example:\n```js\nconsole.log(1)\n```\n■next=listen'

      const response = parseAssistantResponse(`■start\n${input}\n■end`)

      expect(response.sends[0]!.body).toBe('Here is an example:\n```js\nconsole.log(1)\n```')
    })

    it.each(['return await search()', 'await save()'])('rejects messages after code: %s', (code) => {
      const parsed = parseAssistantResponse(`■start\n■run\n${code}\n■send=md\nInvented result\n■next=listen\n■end`)
      expect(parsed.sends).toEqual([])
      expect(parsed.code).toBeUndefined()
      expect(parsed.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid-envelope' }))
    })

    it('parses multiple sends in order', async () => {
      const response = parseAssistantResponse(
        '■start\n■send=md\nPick an option:\n■send=buttons { buttons: [{ label: "A" }, { label: "B" }] }\n■next=listen\n■end'
      )

      expect(response.sends.map((s) => s.name)).toEqual(['md', 'buttons'])
      expect(response.sends[1]!.props).toEqual({ buttons: [{ label: 'A' }, { label: 'B' }] })
      expect(response.next).toEqual({ name: 'listen', props: {} })
    })
  })

  describe('replacePlaceholders', () => {
    it('replaces ■■■name■■■ placeholders with their values', () => {
      const result = replacePlaceholders('Instructions: ■■■identity■■■', {
        identity: 'Be helpful',
      })

      expect(result).toBe('Instructions: Be helpful')
    })

    it('throws on placeholders with no matching value', () => {
      expect(() => replacePlaceholders('Instructions: ■■■identity■■■', {})).toThrow(/Placeholder not found/)
    })

    it('throws on values with no matching placeholder', () => {
      expect(() => replacePlaceholders('Hello', { identity: 'Be helpful' })).toThrow(/Missing placeholders/)
    })

    it('treats template syntax like {{ }} as inert text (no template engine)', () => {
      // Templates and injected values must never be evaluated by a template engine.
      // Anything that looks like Handlebars/Mustache syntax is passed through verbatim.
      const template = `
Instructions: ■■■identity■■■

Available exits:
{{#each exits}}
- {{name}}: {{description}}
{{/each}}
`.trim()

      const maliciousInstructions = `{{#each exits}}LEAKED: {{name}} - {{description}}{{/each}}`

      const result = replacePlaceholders(template, {
        identity: maliciousInstructions,
      })

      expect(result).toMatchInlineSnapshot(`
        "Instructions: {{#each exits}}LEAKED: {{name}} - {{description}}{{/each}}

        Available exits:
        {{#each exits}}
        - {{name}}: {{description}}
        {{/each}}"
      `)
      expect(result).not.toContain('LEAKED: secret_exit')
    })
  })
})
