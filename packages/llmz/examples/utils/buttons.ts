import chalk from 'chalk'
import * as readline from 'readline'

export async function prompt(message: string = '', quickReplies: string[] = []): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin
    const stdout = process.stdout

    // Enable raw mode and keypress events
    stdin.setRawMode(true)
    readline.emitKeypressEvents(stdin)

    let buffer = ''
    let selIndex = -1
    const reservedLines = quickReplies.length + (quickReplies.length > 0 ? 2 : 1) // +1 for hint line if we have replies

    // Reserve lines by printing newlines
    for (let i = 0; i < reservedLines - 1; i++) {
      // Changed from reservedLines to reservedLines - 1
      stdout.write('\n')
    }

    function drawChoices() {
      // Move cursor up to start of our reserved block
      readline.moveCursor(stdout, 0, -reservedLines + 1)
      readline.cursorTo(stdout, 0)

      // Clear and redraw each choice line
      for (let i = 0; i < quickReplies.length; i++) {
        readline.clearLine(stdout, 0)
        if (i === selIndex && buffer === quickReplies[i]) {
          // Highlighted selection - looks like a selected button
          stdout.write(chalk.cyan.bold('❯ ') + chalk.cyan.inverse(`  ${quickReplies[i]}  `))
        } else {
          // Normal button style
          stdout.write(chalk.gray('  ') + chalk.bgBlack.gray(`[ ${quickReplies[i]} ]`))
        }
        if (i < quickReplies.length - 1) {
          stdout.write('\n')
        }
      }

      // Move cursor back to input line
      if (quickReplies.length > 0) {
        stdout.write('\n')
        readline.clearLine(stdout, 0)
        stdout.write(chalk.gray.dim('  ↑↓ Navigate'))
        stdout.write('\n')
      }

      // Position cursor at input line
      readline.clearLine(stdout, 0)
      stdout.write(chalk.bold('> ') + message + buffer + chalk.inverse(' '))
    }

    function updateInputOnly() {
      // Just update the input line
      readline.cursorTo(stdout, 0)
      readline.clearLine(stdout, 0)
      stdout.write(chalk.bold('> ') + message + buffer + chalk.inverse(' '))
    }

    function cleanup() {
      stdin.setRawMode(false)
      stdin.removeListener('keypress', onKeypress)
    }

    function onKeypress(str: string, key: readline.Key) {
      if (!key) return

      // Handle Ctrl+C
      if (key.ctrl && key.name === 'c') {
        cleanup()
        process.exit()
      }

      // Handle Enter
      if (key.name === 'return' || key.name === 'enter') {
        cleanup()
        // Clear all reserved lines (buttons + hint + input)
        readline.moveCursor(stdout, 0, -reservedLines + 1)
        readline.cursorTo(stdout, 0)
        for (let i = 0; i < reservedLines; i++) {
          readline.clearLine(stdout, 0)
          if (i < reservedLines - 1) {
            readline.moveCursor(stdout, 0, 1)
          }
        }
        // Move cursor back up to eliminate blank lines
        readline.moveCursor(stdout, 0, -(reservedLines - 1))
        resolve(buffer)
        return
      }

      // Handle Up/Down arrows - FULL REDRAW (button states change)
      if (key.name === 'up') {
        if (quickReplies.length === 0) return

        if (selIndex === -1) {
          selIndex = quickReplies.length - 1
        } else {
          selIndex = (selIndex - 1 + quickReplies.length) % quickReplies.length
        }
        buffer = quickReplies[selIndex]
        drawChoices() // Full redraw because button highlighting changed
        return
      }

      if (key.name === 'down') {
        if (quickReplies.length === 0) return

        if (selIndex === -1) {
          selIndex = 0
        } else {
          selIndex = (selIndex + 1) % quickReplies.length
        }
        buffer = quickReplies[selIndex]
        drawChoices() // Full redraw because button highlighting changed
        return
      }

      // Handle Backspace - check if we need to redraw choices
      if (key.name === 'backspace') {
        if (buffer.length > 0) {
          const oldBuffer = buffer
          buffer = buffer.slice(0, -1)

          // Check if button states need to change
          const wasSelected = quickReplies.includes(oldBuffer)
          const nowSelected = quickReplies.includes(buffer)

          if (wasSelected || nowSelected) {
            selIndex = -1
            drawChoices() // Full redraw because button states changed
          } else {
            selIndex = -1
            updateInputOnly() // Just update input
          }
        }
        return
      }

      // Handle normal character input
      if (str && str.length === 1 && !key.ctrl && !key.meta) {
        const oldBuffer = buffer
        buffer += str

        // Check if button states need to change
        const wasSelected = quickReplies.includes(oldBuffer)
        const nowSelected = quickReplies.includes(buffer)

        if (wasSelected || nowSelected) {
          selIndex = -1
          drawChoices() // Full redraw because button states changed
        } else {
          selIndex = -1
          updateInputOnly() // Just update input - much faster!
        }
        return
      }
    }

    // Set up keypress listener
    stdin.on('keypress', onKeypress)

    // Initial render
    drawChoices()
  })
}
