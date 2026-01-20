import { describe, expect, test } from 'vitest'
import { TestCase } from '../../tests/types'
import { getImageBufferFromResponse } from './get-image-buffer-from-response'

type GetImageBufferTestCase = TestCase<Response, { ok: boolean; bufferLength?: number }>

const testCases: GetImageBufferTestCase[] = [
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: true, bufferLength: 1024 * 1024 },
    description: 'image/png content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: true, bufferLength: 1024 * 1024 },
    description: 'image/jpeg content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 200,
      headers: {
        'content-type': 'image/gif',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: true, bufferLength: 1024 * 1024 },
    description: 'image/gif content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024 * 8), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (1024 * 1024 * 8).toString(),
      },
    }),
    expects: { ok: true, bufferLength: 1024 * 1024 * 8 },
    description: '8MB buffer should be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024 * 8 + 1), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: false },
    description: 'buffer larger than 8MB should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (1024 * 1024 * 8 + 1).toString(),
      },
    }),
    expects: { ok: false },
    description: 'content length larger than 8MB should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: false },
    description: 'content type that does not represent an image should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(1024 * 1024), {
      status: 400,
      headers: {
        'content-type': 'image/png',
        'content-length': (1024 * 1024).toString(),
      },
    }),
    expects: { ok: false },
    description: 'error status should not be valid',
  },
]

describe('Markdown to Telegram HTML Conversion with Extracted Images', () => {
  test.each(testCases)('$description', async ({ input, expects }) => {
    const response = await getImageBufferFromResponse(input)

    expect(response.success).toEqual(expects.ok)
    if (response.success) {
      expect(response.buffer.byteLength).toEqual(expects.bufferLength)
    }
  })
})
