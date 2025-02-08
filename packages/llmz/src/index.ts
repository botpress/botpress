// export { llmz } from './llmz.js'
export * as Messages from './jsx.js'
export * from './tool.js'

import { type llmz } from './llmz.js'
export type { ExecutionProps, ExecutionHooks } from './llmz.js'

export const executeContext: typeof llmz.executeContext = async (...props) => {
  // Code splitting to improve import performance
  const { executeContext } = (await import('./llmz.js')).llmz
  return executeContext(...props)
}

/**
 * Loads the necessary dependencies for the library to work
 * Calling this function is optional, but it will improve the performance of the first call to `executeContext`
 * It's recommended to call this function at the beginning of your application without awaiting it (void init())
 */
export const init = async () => {
  await import('./llmz.js')
  await import('./tool.js')
  await import('./jsx.js')
  await import('./vm.js')
  await import('./utils.js')
  await import('./truncator.js')
  await import('./typings.js')
  await import('./prompts/oct-2024.js')
}
