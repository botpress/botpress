import { describe, expect, test } from 'vitest'
import { TestCase } from '../../tests/types'
import { getImageBufferFromResponse } from './get-image-buffer-from-response'

const BYTES_PER_MB = 1024 * 1024

type GetImageBufferTestCase = TestCase<Response, { ok: boolean; bufferLength?: number }>

const testCases: GetImageBufferTestCase[] = [
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': BYTES_PER_MB.toString(),
      },
    }),
    expects: { ok: true, bufferLength: BYTES_PER_MB },
    description: 'image/png content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
        'content-length': BYTES_PER_MB.toString(),
      },
    }),
    expects: { ok: true, bufferLength: BYTES_PER_MB },
    description: 'image/jpeg content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 200,
      headers: {
        'content-type': 'image/gif',
        'content-length': BYTES_PER_MB.toString(),
      },
    }),
    expects: { ok: true, bufferLength: BYTES_PER_MB },
    description: 'image/gif content-type should be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB * 8), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (BYTES_PER_MB * 8).toString(),
      },
    }),
    expects: { ok: true, bufferLength: BYTES_PER_MB * 8 },
    description: '8MB buffer should be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB * 8 + 1), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': BYTES_PER_MB.toString(),
      },
    }),
    expects: { ok: false },
    description: 'buffer larger than 8MB should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': (BYTES_PER_MB * 8 + 1).toString(),
      },
    }),
    expects: { ok: false },
    description: 'content length larger than 8MB should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'content-length': BYTES_PER_MB.toString(),
      },
    }),
    expects: { ok: false },
    description: 'content type that does not represent an image should not be valid',
  },
  {
    input: new Response(new ArrayBuffer(BYTES_PER_MB), {
      status: 400,
      headers: {
        'content-type': 'image/png',
        'content-length': BYTES_PER_MB.toString(),
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
