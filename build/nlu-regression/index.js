const axios = require('axios')

// export interface IntentDefinition {
//   name: string
//   contexts: string[]
//   utterances: string[]
//   slots: SlotDefinition[]
// }

const ds = {
  language: 'en',
  contexts: ['global'],
  intents: [
    {
      name: 'bill-inquiry',
      contexts: ['global'],
      utterances: [
        "I don't understand something on my bill",
        'I have questions regarding my invoice',
        'My statement does not make sense'
      ]
    },
    {
      name: 'cancellation',
      contexts: ['global'],
      utterances: [
        'How can I cancel my contract?',
        'I want to stop my contract',
        'I need to terminate my agreement with you'
      ]
    },
    {
      name: 'contact-details',
      contexts: ['global'],
      utterances: ['What is the contact number?', 'How to reach your help line?', 'What are your contact informations']
    },
    {
      name: 'problem',
      contexts: ['global'],
      utterances: ['I have a problem', 'Something is not working right on my computer', "I've got a technical issue"]
    }
  ]
}

axios
  .post('http://localhost:3200/v1/train', ds)
  .then(res => {
    console.log('resulltss :: ', res.data)
  })
  .catch(err => console.error('errroor', err.response.data.error))
