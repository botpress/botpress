import * as sdk from 'botpress/sdk'

import 'jest'
import { addQnA, addNLU, removeNLU } from './applyChanges'
import { FLAG_REASON } from '../types'

const makeMockGhost = (fileData: any = {}, directories: string[] = []) => {
  return {
    upsertFile: jest.fn(
      (rootFolder: string, file: string, content: string | Buffer, options?: sdk.UpsertOptions): Promise<void> => {
        return
      }
    ),
    readFileAsObject: jest.fn(
      async <T>(rootFolder: string, file: string): Promise<T> => {
        // Do a deep copy
        return JSON.parse(JSON.stringify(fileData)) as T
      }
    ),
    directoryListing: jest.fn(
      async (
        rootFolder: string,
        fileEndingPattern: string,
        exclude?: string | string[],
        includeDotFiles?: boolean,
        options?: sdk.DirectoryListingOptions
      ): Promise<string[]> => {
        return directories
      }
    )
  }
}

describe('applyChanges', () => {
  it('addQnA', async () => {
    const newQuestion = 'Is an orchestra a compiler?'
    const fileData = {
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

    const ghost = makeMockGhost(fileData)
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
    fileData.data.questions.en.push(newQuestion)
    expect(ghost.readFileAsObject).toHaveBeenCalledTimes(1)
    expect(ghost.readFileAsObject).toHaveBeenLastCalledWith('qna', 'qnaID.json')
    expect(ghost.upsertFile).toHaveBeenCalledTimes(1)
    expect(ghost.upsertFile).toHaveBeenLastCalledWith('qna', 'qnaID.json', JSON.stringify(fileData, null, 2))
  })

  it('addNLU', async () => {
    const ghost = makeMockGhost({ utterances: { en: ['hi', 'hello'] } }, ['intent1.json', 'intent2.json'])
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
    expect(ghost.upsertFile).toHaveBeenLastCalledWith(
      'intents',
      'intent1.json',
      JSON.stringify({ utterances: { en: ['hi', 'hello'] }, contexts: ['123', '234'] }, null, 2)
    )
  })

  it('removeNLU', async () => {
    const ghost = makeMockGhost({ utterances: { en: ['hi', 'hello'] } })
    await removeNLU('en', 'hi', ghost)('filename')
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
