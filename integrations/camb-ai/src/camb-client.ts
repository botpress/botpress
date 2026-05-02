import { CambClient } from '@camb-ai/sdk'

export function createCambClient(apiKey: string): CambClient {
  return new CambClient({ apiKey })
}

interface PollStatus {
  status: string
  run_id?: number | null
}

export async function pollForResult<T>(
  checkStatus: () => Promise<PollStatus>,
  getResult: (runId: number) => Promise<T>,
  opts?: { maxAttempts?: number; intervalMs?: number }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 120
  const intervalMs = opts?.intervalMs ?? 500

  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkStatus()

    if (result.status === 'SUCCESS') {
      if (result.run_id == null) {
        throw new Error('CAMB AI returned SUCCESS but no run_id')
      }
      return getResult(result.run_id)
    }

    if (result.status === 'ERROR') {
      throw new Error('CAMB AI task failed with ERROR status')
    }

    if (result.status === 'TIMEOUT') {
      throw new Error('CAMB AI task timed out')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`CAMB AI task did not complete within ${(maxAttempts * intervalMs) / 1000}s`)
}
