import { expect, it, vi } from 'vitest'
import { createOverwriteTool } from './confirmation.js'

it('requires fresh host approval for each attempt and performs no work on denial', async () => {
  const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
  const overwrite = vi.fn(async () => {})
  const tool = createOverwriteTool(confirm, overwrite)
  const ctx = { callId: 'call', iterationId: 'iteration' }
  await expect(tool.execute(undefined, ctx)).resolves.toEqual({ success: false })
  expect(overwrite).not.toHaveBeenCalled()
  await expect(tool.execute(undefined, ctx)).resolves.toEqual({ success: true })
  await expect(tool.execute(undefined, ctx)).resolves.toEqual({ success: false })
  expect(overwrite).toHaveBeenCalledOnce()
  expect(confirm).toHaveBeenCalledTimes(3)
})
