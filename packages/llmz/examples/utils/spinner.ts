import chalk from 'chalk'
import { clearLine, cursorTo } from 'node:readline'

// Spinner frames
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

interface LoadingState {
  intervalId: ReturnType<typeof setInterval> | null
  frameIndex: number
  message: string
  isActive: boolean
}

const state: LoadingState = {
  intervalId: null,
  frameIndex: 0,
  message: '',
  isActive: false,
}

function updateSpinner(): void {
  if (!state.isActive) return

  // Clear the current line
  clearLine(process.stdout, 0)
  cursorTo(process.stdout, 0)

  // Display the spinner with message
  const frame = chalk.cyan(spinnerFrames[state.frameIndex])
  const message = state.message ? ` ${state.message}` : ''
  process.stdout.write(`${frame}${message}`)

  // Update frame index
  state.frameIndex = (state.frameIndex + 1) % spinnerFrames.length
}

function startSpinner(message: string): void {
  // If already running, just update the message
  if (state.isActive) {
    state.message = message
    return
  }

  state.isActive = true
  state.message = message
  state.frameIndex = 0

  // Hide cursor
  process.stdout.write('\x1b[?25l')

  // Start the animation
  updateSpinner()
  state.intervalId = setInterval(updateSpinner, 80)
}

function stopSpinner(): void {
  if (!state.isActive) return

  state.isActive = false

  // Clear the interval
  if (state.intervalId) {
    clearInterval(state.intervalId)
    state.intervalId = null
  }

  // Clear the line
  clearLine(process.stdout, 0)
  cursorTo(process.stdout, 0)

  // Show cursor
  process.stdout.write('\x1b[?25h')
}

/**
 * Control the loading spinner
 * @param show - true to show/update spinner, false to hide it
 * @param message - message to display with the spinner (optional)
 */
export function loading(show: boolean, message?: string): void {
  if (show) {
    startSpinner(message || 'Loading...')
  } else {
    stopSpinner()
  }
}

// Cleanup on process exit
process.on('exit', () => {
  stopSpinner()
})

process.on('SIGINT', () => {
  stopSpinner()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopSpinner()
  process.exit(0)
})
