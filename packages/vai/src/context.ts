import type { Client } from '@botpress/client'
import { onTestFinished } from 'vitest'
import { getCurrentTest } from 'vitest/suite'
import { Model } from './llm'

export type EvaluatorModel = Model['id']

export type TestMetadata = {
  isVaiTest: boolean
  scenario?: string
  evaluatorModel?: EvaluatorModel
}

const getTestMetadata = (): TestMetadata => {
  const test = getCurrentTest()
  return (test?.meta ?? {
    isVaiTest: false,
  }) as TestMetadata
}

class VaiContext {
  #client: Client | null = null
  #wrapError = false

  public get wrapError() {
    return this.#wrapError
  }

  public get client() {
    if (!this.#client) {
      throw new Error('Botpress client is not set')
    }

    return this.#client
  }

  public get evaluatorModel(): EvaluatorModel {
    return getTestMetadata().evaluatorModel ?? 'openai__gpt-4o-mini-2024-07-18'
  }

  public get scenario() {
    return getTestMetadata().scenario
  }

  public get isVaiTest() {
    return getTestMetadata().isVaiTest
  }

  public setClient(cognitive: Client) {
    this.#client = cognitive
  }

  public swallowErrors() {
    if (!getCurrentTest()) {
      throw new Error('cancelBail is a Vitest hook and must be called within a test')
    }

    this.#wrapError = true
    onTestFinished(() => {
      this.#wrapError = false
    })
  }
}

export const Context = new VaiContext()
