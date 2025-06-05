import { VitestSnapshotEnvironment } from 'vitest/snapshot'

/**
 * This custom snapshot environment prevents vitest from saving twice the same inline snapshot in the same test
 * This happens if you have a for loop or a map that generates the same inline snapshot multiple times
 * This is a Vitest bug
 */
class PreventDoubleInlineSaves extends VitestSnapshotEnvironment {
  private _trackedStacks = new Set<string>()

  public processStackTrace(stack) {
    const serialized = JSON.stringify(stack)
    if (this._trackedStacks.has(serialized)) {
      return { ...stack, column: stack.column + 1000 }
    }
    this._trackedStacks.add(serialized)
    return stack
  }
}

export default new PreventDoubleInlineSaves()
