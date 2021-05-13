import _ from 'lodash'
import { TrainingSession } from '../../typings'
import { FakeTrainingRepository } from './fake-training-repo.u.test'

const zeros = (len: number) => Array(len).fill(0)

const sum = (arr1: number[], arr2: number[]) => {
  return _.zip(arr1, arr2).map(([x1, x2]) => x1 + x2)
}

export const expectTs = (ts: Partial<TrainingSession>) => expect.objectContaining<Partial<TrainingSession>>(ts)

// TODO: this function is a mess, maybe I should unit test it...
export const expectMaxSimultaneousTrainings = (trainSessions: TrainingSession[], expectedMaxSimultaneous: number) => {
  const progressUpdates = trainSessions.filter(ts => ['training', 'done'].includes(ts.status))

  const key = (ts: TrainingSession) => `${ts.botId}:${ts.language}`
  const allKeys = _(trainSessions)
    .map(ts => key(ts))
    .uniq()
    .value()

  const intervals = allKeys.map(k => {
    const start = _.findIndex(progressUpdates, ts => key(ts) === k)
    const end = _.findLastIndex(progressUpdates, ts => key(ts) === k)
    return { start, end }
  })

  const totalTime = _.maxBy(intervals, i => i.end).end
  const impulses = intervals.map(({ start, end }) => {
    return zeros(totalTime).map((_v, i) => (i >= start && i <= end ? 1 : 0))
  })

  const trainCount = impulses.reduce(sum, zeros(totalTime))

  const axctualMaxSimultaneous = _.max(trainCount)
  expect(axctualMaxSimultaneous).toBe(expectedMaxSimultaneous)
}

export const expectTrainingToStartAndComplete = async (
  socket: jest.Mock,
  trainRepo: FakeTrainingRepository,
  trainId: { botId: string; language: string }
) => {
  const { botId, language } = trainId
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'training-pending', language }))
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'training', language }))
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'done', language }))

  const botTrainings = await trainRepo.query({ botId, language })
  expect(botTrainings).toHaveLength(1)
  expect(botTrainings[0]).toMatchObject(expectTs({ botId, status: 'done' }))
}

export const expectEngineToHaveTrained = (trainMock: jest.SpyInstance, botId: string, languageCode: string) => {
  expect(trainMock).toHaveBeenCalledWith(botId, expect.objectContaining({ language: languageCode }))
}

export const expectEngineToHaveLoaded = (loadMock: jest.SpyInstance, languageCode: string) => {
  expect(loadMock).toHaveBeenCalledWith(expect.objectContaining({ id: expect.objectContaining({ languageCode }) }))
}
