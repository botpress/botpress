import parseCsvToJson from 'csv-parse/lib/sync'

const parseFlow = str => {
  const [redirectFlow, redirectNode = ''] = str.split('#')
  return { redirectFlow, redirectNode }
}

export const jsonParse = jsonContent =>
  jsonContent.map(({ questions, answer: instruction, action }) => {
    if (!['text', 'redirect'].includes(action)) {
      throw new Error('Failed to process CSV-row: action should be either "text" or "redirect"')
    }
    const answer = action === 'text' ? instruction : ''
    const flowParams = action === 'redirect' ? parseFlow(instruction) : { redirectFlow: '', redirectNode: '' }
    return { questions, action, answer, ...flowParams }
  })

export const csvParse = csvContent => {
  const mergeRows = (acc, { question, answer, action }) => {
    const [prevRow] = acc.slice(-1)
    if (prevRow && prevRow.answer === answer) {
      return [...acc.slice(0, acc.length - 1), { ...prevRow, questions: [...prevRow.questions, question] }]
    }
    return [...acc, { answer, action, questions: [question] }]
  }
  return jsonParse(parseCsvToJson(csvContent, { columns: ['question', 'action', 'answer'] }).reduce(mergeRows, []))
}
