import _ from 'lodash'

import { makeApp, makeDependencies, waitForTrainingsToBeDone } from './utils/app.u.test'
import {
  expectEngineToHaveTrained,
  expectMaxSimultaneousTrainings,
  expectTrainingToStartAndComplete
} from './utils/custom-expects.u.test'
import { book_flight, cityEntity, fruitEntity, hello, i_love_hockey } from './utils/data.u.test'
import './utils/sdk.u.test'
import { TrainingSession } from '../typings'
import { Specifications } from '../../stan/typings_v1'

const specs: Specifications = {
  languageServer: {
    dimensions: 300,
    domain: 'lol',
    version: '1.0.0'
  },
  nluVersion: '1.0.0'
}

describe('NLU API integration tests with cluster enabled', () => {
  test('When no model is on fs, 3 multi-lang bots, 2 training per cluster with 2 cluster, training occur in batch of 4', async () => {
    // arrange
    const languages = ['en', 'fr']

    const botId1 = 'myBot1'
    const botId2 = 'myBot2'
    const botId3 = 'myBot3'

    const bot1 = {
      id: botId1,
      defaultLanguage: 'en',
      languages,
      definitions: {
        entityDefs: [],
        intentDefs: [hello(languages)]
      },
      modelsOnFs: []
    }

    const bot2 = {
      id: botId2,
      defaultLanguage: 'en',
      languages,
      definitions: {
        entityDefs: [cityEntity],
        intentDefs: [book_flight(languages)]
      },
      modelsOnFs: []
    }

    const bot3 = {
      id: botId3,
      defaultLanguage: 'en',
      languages: ['en'],
      definitions: {
        entityDefs: [fruitEntity],
        intentDefs: [i_love_hockey(['en'])]
      },
      modelsOnFs: []
    }

    const fileSystem = {
      [botId1]: bot1,
      [botId2]: bot2,
      [botId3]: bot3
    }

    const nProgressCalls = 3
    const core = { languages, specs }
    const engineOptions = { nProgressCalls, trainDelayBetweenProgress: 20 }
    const dependencies = makeDependencies(core, fileSystem, engineOptions)
    const { engine, socket, trainingRepo } = dependencies

    const engineTrainSpy = jest.spyOn(engine, 'startTraining')

    const maxTraining = 2
    const trainingQueueOptions = { maxTraining, jobInterval: 1 }
    const node1 = await makeApp(dependencies, trainingQueueOptions)
    const node2 = await makeApp(dependencies, trainingQueueOptions)

    const nNodes = 2

    // act
    await Promise.all([node1.resumeTrainings(), node2.resumeTrainings()])
    await Promise.all([node1.mountBot(bot1), node2.mountBot(bot1)])
    await Promise.all([node1.mountBot(bot2), node2.mountBot(bot2)])
    await Promise.all([node1.mountBot(bot3), node2.mountBot(bot3)])
    await waitForTrainingsToBeDone(node1)

    // assert
    const nTrainings = 5
    expect(socket).toHaveBeenCalledTimes((nProgressCalls + 2) * nTrainings)

    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId1, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId1, language: 'fr' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId2, language: 'en' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId2, language: 'fr' })
    expectTrainingToStartAndComplete(socket, trainingRepo, { botId: botId3, language: 'en' })

    const ts: TrainingSession[] = socket.mock.calls.map(([ts]) => ts)
    expectMaxSimultaneousTrainings(ts, maxTraining * nNodes)

    expect(engineTrainSpy).toHaveBeenCalledTimes(nTrainings)
    expectEngineToHaveTrained(engineTrainSpy, botId1, 'en')
    expectEngineToHaveTrained(engineTrainSpy, botId1, 'fr')
    expectEngineToHaveTrained(engineTrainSpy, botId2, 'en')
    expectEngineToHaveTrained(engineTrainSpy, botId2, 'fr')
    expectEngineToHaveTrained(engineTrainSpy, botId3, 'en')

    await Promise.all([node1.teardown(), node2.teardown()])
  }, 100000)
})
