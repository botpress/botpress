import { Blockquote } from 'mdast'
import { test, expect, vi, beforeEach, beforeAll } from 'vitest'
import { MarkdownHandlers } from './types'

const getMarkDownParser = async () => {
  return await import('./markdown-parser')
}

const parseMock = vi.fn()
vi.doMock('remark', () => ({
  remark: vi.fn(() => ({
    use: vi.fn(() => ({
      parse: parseMock,
    })),
  })),
}))

const visitTreeMock = vi.fn()
vi.doMock('./tree-visitor', () => ({
  visitTree: visitTreeMock,
}))

beforeAll(() => {})

beforeEach(() => {
  vi.restoreAllMocks()
})

test('Assert that the remark parse function gets called with given markdown', async () => {
  const markdown = 'any string'
  const { parseMarkdown } = await getMarkDownParser()

  parseMarkdown(markdown)

  expect(parseMock).toHaveBeenCalledWith(markdown)
})

test('Assert that visitTree gets called with correct parameters', async () => {
  const markdown = 'any string'
  parseMock.mockReturnValue('abc')
  const { parseMarkdown, stripAllHandlers } = await getMarkDownParser()

  parseMarkdown(markdown)

  expect(visitTreeMock).toHaveBeenCalledWith('abc', stripAllHandlers, [])
})

test('Assert that visitTree gets called with custom handlers', async () => {
  const markdown = 'any string'
  parseMock.mockReturnValue('abc')
  const { parseMarkdown, stripAllHandlers } = await getMarkDownParser()

  const customHandlers: MarkdownHandlers = {
    ...stripAllHandlers,
    blockquote: (_node, _visit) => 'custom handler',
  }

  parseMarkdown(markdown, customHandlers)

  expect(visitTreeMock).toHaveBeenCalledWith('abc', customHandlers, [])
})
