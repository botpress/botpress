/**
 * Wait for a bit.
 *
 * @title Wait/Delay
 * @category Utility
 * @author Botpress, Inc.
 * @param {number} delay=1000 - The number of milliseconds to wait
 */
const wait = async delay => {
  return new Promise(resolve => setTimeout(() => resolve(), delay))
}

return wait(args.delay || 1000)
