const _ = require('lodash')

module.exports = {
  id: 'trivia',
  title: 'Trivia Questions',
  ummBloc: '#trivia-question',

  jsonSchema: {
    title: 'Trivia Questions',
    description: 'Create a new Trivia question with up to 5 choices and only one correct answer',
    type: 'object',
    required: ['question', 'good', 'bad'],
    properties: {
      question: {
        type: 'string',
        title: 'Question'
      },
      good: {
        type: 'string',
        title: 'Good answer'
      },
      bad: {
        title: 'Bad Answers',
        type: 'array',
        items: {
          type: 'string',
          default: ''
        }
      }
    }
  },

  uiSchema: {
    bad: {
      'ui:options': {
        orderable: false
      }
    }
  },

  computeFormData: formData => {
    const good = { payload: 'TRIVIA_GOOD', text: formData.good }
    const bad = formData.bad.map(i => ({ payload: 'TRIVIA_BAD', text: i }))
    const choices = [good, ...bad]

    return {
      question: formData.question,
      choices: _.shuffle(choices)
    }
  },

  computePreviewText: formData => 'Q: ' + formData.question,
  computeMetadata: null
}
