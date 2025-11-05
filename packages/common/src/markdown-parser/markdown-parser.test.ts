import { test, expect, vi } from 'vitest'
import { parseMarkdown } from './markdown-parser'

const parseMock = vi.fn()
vi.mock('remark', () => ({
  remark: vi.fn(() => ({
    use: vi.fn(() => ({
      parse: parseMock,
    })),
  })),
}))

vi.mock('./tree-visitor', () => ({
  visitTree: vi.fn(),
}))

test('Assert that the remark parse function gets called with given markdown', () => {
  const markdown = 'any string'

  parseMarkdown(markdown)

  expect(parseMock).toHaveBeenCalledWith(markdown)
})
