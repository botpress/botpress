import chalk from 'chalk'
import type { Trace } from 'llmz'

const indentLines = (str: string, length: number) => {
  const indent = ' '.repeat(length)
  return str
    .split('\n')
    .map((line) => (line.trim() ? `${indent}${line}` : line))
    .join('\n')
}

export const lightToolTrace = (trace: Trace) => {
  if (trace.type === 'tool_call' && trace.tool_name !== 'Message') {
    console.log(chalk.bold('🔧 Tool Call: ') + (trace.success ? '✅' : '❌') + ' ' + chalk.underline(trace.tool_name))
  }
}

export const printTrace = (
  trace: Trace,
  types: Trace['type'][] = [
    'abort_signal',
    'comment',
    'llm_call_success',
    'property',
    'think_signal',
    'tool_call',
    'yield',
    'log',
  ]
) => {
  if (!types.includes(trace.type)) {
    return
  }

  if (trace.type === 'tool_call' && trace.tool_name !== 'Message') {
    if (trace.success) {
      let input = trace.input ? JSON.stringify(trace.input, null, 2) : ''
      let output = trace.output ? JSON.stringify(trace.output, null, 2) : ''

      if (input.length + output.length <= 200) {
        input = input.replace(/(\n|\s){1,}/g, ' ')
        output = output.replace(/(\n|\s){1,}/g, ' ')

        console.log(
          `${chalk.green('🔨 Tool Call:')} ${chalk.bold(trace.tool_name)} ${chalk.white(input)} ${chalk.gray('=>')} ${chalk.white(output || '<void>')}`
        )
      } else {
        if (input.length) {
          console.log(chalk.white(indentLines('Input: ' + input, 4)))
        }

        if (output.length) {
          console.log(chalk.white(indentLines('Output: ' + output, 4)))
        }
      }
    } else {
      console.log(`${chalk.red('🔨 Tool Call:')} ${trace.tool_name}`)
      console.log(chalk.white(indentLines(`Input: ${JSON.stringify(trace.input, null, 2)}`, 4)))
      console.log(chalk.red(indentLines(`Error: ${trace.error}`, 4)))
    }
  }

  if (trace.type === 'think_signal') {
    console.log(`${chalk.white('💭 Thinking...')}`)
  }

  if (trace.type === 'comment') {
    console.log(`${chalk.white('💬 Comment:')} ${chalk.dim(trace.comment)}`)
  }

  if (trace.type === 'llm_call_success') {
    console.log(`${chalk.green('🤖 LLM Call:')} ${trace.model}`)
    console.log(chalk.white(indentLines(trace.code, 4)))
  }

  if (trace.type === 'property') {
    console.log(`${chalk.white('🔍 Property:')} ${trace.property}`)
    console.log(
      chalk.white(indentLines(`${trace.object}.${trace.property} => ${JSON.stringify(trace.value, null, 2)}`, 4))
    )
  }

  if (trace.type === 'log') {
    console.log(`${chalk.white('⌨️ Log:')} ${chalk.dim(trace.message)}`, ...trace.args)
  }
}
