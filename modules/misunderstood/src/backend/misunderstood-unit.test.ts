import 'jest'
import { addQnA, addNLU, removeUtteranceFromIntent } from './applyChanges'
import { makeMockGhost } from './mockGhost'
import { FLAG_REASON } from '../types'

describe('applyChanges', () => {
  it('addQnA', async () => {
    const newQuestion = 'Is an orchestra a compiler?'
    const fileData = {
      qna: {
        'qnaID.json': {
          data: {
            action: 'text',
            contexts: ['asd'],
            enabled: true,
            questions: {
              en: ['is the sun technically a compiler?']
            },
            answers: {
              en: ['yes']
            },
            redirectFlow: 'flow1',
            redirectNode: 'node1'
          }
        }
      }
    }

    const ghost = makeMockGhost(fileData)
    const expectedResult = JSON.parse(JSON.stringify(fileData.qna['qnaID.json']))
    expectedResult.data.questions.en.push(newQuestion)

    await addQnA(
      {
        eventId: '123',
        botId: '234',
        language: 'en',
        preview: newQuestion,
        reason: FLAG_REASON.action,
        id: 1,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        resolution: 'qnaID',
        resolutionParams: JSON.stringify({ contexts: ['123', '234'] })
      },
      ghost
    )
    expect(ghost.readFileAsObject).toHaveBeenCalledTimes(1)
    expect(ghost.readFileAsObject).toHaveBeenLastCalledWith('qna', 'qnaID.json')
    expect(ghost.upsertFile).toHaveBeenCalledTimes(1)
    expect(ghost.upsertFile).toHaveBeenLastCalledWith('qna', 'qnaID.json', JSON.stringify(expectedResult, null, 2))
  })

  it('addNLU', async () => {
    const intentData = { utterances: { en: ['hi'] } }
    const ghost = makeMockGhost({ intents: { 'intent1.json': intentData, 'intent2.json': intentData } })
    await addNLU(
      {
        eventId: '123',
        botId: '234',
        language: 'en',
        preview: 'hello',
        reason: FLAG_REASON.action,
        id: 1,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        resolution: 'intent1',
        resolutionParams: JSON.stringify({ contexts: ['123', '234'] })
      },
      ghost
    )
    expect(ghost.directoryListing).toHaveBeenCalledTimes(1)
    expect(ghost.readFileAsObject).toHaveBeenLastCalledWith('intents', 'intent1.json')
    expect(ghost.upsertFile).toHaveBeenCalledTimes(2)
    expect(ghost.upsertFile).toHaveBeenNthCalledWith(
      1,
      'intents',
      'intent2.json',
      JSON.stringify({ utterances: { en: ['hi'] } }, null, 2)
    )
    expect(ghost.upsertFile).toHaveBeenLastCalledWith(
      'intents',
      'intent1.json',
      JSON.stringify({ utterances: { en: ['hi', 'hello'] }, contexts: ['123', '234'] }, null, 2)
    )
  })

  it('removeUtteranceFromIntent', async () => {
    const ghost = makeMockGhost({ intents: { filename: { utterances: { en: ['hi', 'hello'] } } } })
    await removeUtteranceFromIntent('en', 'hi', ghost)('filename')
    expect(ghost.readFileAsObject).toHaveBeenCalledTimes(1)
    expect(ghost.readFileAsObject).toHaveBeenCalledWith('intents', 'filename')
    expect(ghost.upsertFile).toHaveBeenCalledTimes(1)
    expect(ghost.upsertFile).toHaveBeenCalledWith(
      'intents',
      'filename',
      JSON.stringify({ utterances: { en: ['hello'] } }, null, 2)
    )
  })
})
