import { describe, expect, it, vi } from 'vitest'
import { BuildContext } from './esbuild-utils'

class TestBuildContext extends BuildContext<{ value: string }> {
  public contexts: Array<{
    dispose: ReturnType<typeof vi.fn>
    rebuild: ReturnType<typeof vi.fn>
  }> = []

  protected async _createContext() {
    const context = {
      dispose: vi.fn().mockResolvedValue(undefined),
      rebuild: vi.fn().mockResolvedValue({ errors: [], warnings: [] }),
    }
    this.contexts.push(context)
    return context as never
  }
}

describe('BuildContext', () => {
  it('recreates the underlying esbuild context after disposal', async () => {
    const context = new TestBuildContext()

    await context.rebuild({ value: 'first' })
    await context.rebuild({ value: 'first' })

    expect(context.contexts).toHaveLength(1)

    await context.dispose()

    expect(context.contexts[0]?.dispose).toHaveBeenCalledTimes(1)

    await context.rebuild({ value: 'first' })

    expect(context.contexts).toHaveLength(2)
  })
})
