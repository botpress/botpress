import parseCsvToJson from 'csv-parse/lib/sync'
import get from 'lodash/get'

const parseFlow = str => {
  const [redirectFlow, redirectNode = ''] = str.split('#')
  return { redirectFlow, redirectNode }
}

export const jsonParse = (jsonContent, options) =>
  jsonContent.map(({ questions, answer: instruction, answer2, action, category }, i) => {
    if (!['text', 'redirect', 'text_redirect'].includes(action)) {
      throw new Error(
        `Failed to process CSV-row ${i + 1}: action should be either "text", "redirect" or "text_redirect"`
      )
    }

    let redirectInstruction = undefined
    let textAnswer = ''
    const { hasCategory } = options

    if (action === 'text') {
      textAnswer = instruction
    } else if (action === 'redirect') {
      redirectInstruction = instruction
    } else if (action === 'text_redirect') {
      textAnswer = instruction
      redirectInstruction = answer2
    }

    const flowParams = redirectInstruction ? parseFlow(redirectInstruction) : { redirectFlow: '', redirectNode: '' }
    const categoryWrapper = hasCategory ? { category } : {}
    return { questions, action, answer: textAnswer, ...flowParams, ...categoryWrapper }
  })

export const csvParse = (csvContent, options) => {
  const { hasCategory } = options

  const mergeRows = (acc, { question, answer, answer2, category, action }) => {
    const [prevRow] = acc.slice(-1)
    const isSameAnswer = prevRow && (prevRow.answer === answer && (!answer2 || answer2 === prevRow.answer2))
    if (isSameAnswer) {
      return [...acc.slice(0, acc.length - 1), { ...prevRow, questions: [...prevRow.questions, question] }]
    }
    const categoryWrapper = hasCategory ? { category } : {}
    return [...acc, { answer, answer2, action, ...categoryWrapper, questions: [question] }]
  }
  const categoryWrapper = hasCategory ? ['category'] : []
  const rows = parseCsvToJson(csvContent, {
    columns: ['question', 'action', 'answer', 'answer2', ...categoryWrapper]
  }).reduce(mergeRows, [])

  // We trim the header if detected in the first row
  if (get(rows, '0.action') === 'action') {
    rows.splice(0, 1)
  }

  return jsonParse(rows, options)
}
