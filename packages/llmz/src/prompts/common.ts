import Handlebars from 'handlebars'

export const parseAssistantResponse = (response: string) => {
  const raw = response
  let code = response

  const START_TOKEN = '■fn_start'
  const END_TOKEN = '■fn_end'

  if (!code.includes(START_TOKEN)) {
    code = `${START_TOKEN}\n${code.trim()}`
  }

  if (!code.includes(END_TOKEN)) {
    code = `${code.trim()}\n${END_TOKEN}`
  }

  const start = Math.max(code.indexOf(START_TOKEN) + START_TOKEN.length, 0)
  const end = Math.min(code.indexOf(END_TOKEN), code.length)

  code = code
    .slice(start, end)
    .trim()
    .split('\n')
    .filter((line, index, arr) => {
      const isFirstOrLastLine = index === 0 || index === arr.length - 1
      if (isFirstOrLastLine && line.trim().startsWith('```')) {
        return false
      }
      return true
    })
    .join('\n')

  return {
    type: 'code',
    raw,
    code,
  } as const
}

export const replacePlaceholders = (prompt: string, values: Record<string, unknown>) => {
  const regex = new RegExp('■■■([A-Z0-9_\\.-]+)■■■', 'gi')
  const obj = Object.assign({}, values)

  const replaced = prompt.replace(regex, (_match, name) => {
    if (name in values) {
      delete obj[name]
      return typeof values[name] === 'string' ? (values[name] as string) : JSON.stringify(values[name])
    } else {
      throw new Error(`Placeholder not found: ${name}`)
    }
  })

  const remaining = Object.keys(obj).filter(
    (key) => key !== 'is_message_enabled' && key !== 'exits' && key !== 'components'
  )

  if (remaining.length) {
    throw new Error(`Missing placeholders: ${remaining.join(', ')}`)
  }

  const compile = Handlebars.compile(replaced)

  const compiled = compile({
    is_message_enabled: false,
    ...values,
  })

  return compiled.replace(/\n{3,}/g, '\n\n').trim()
}
