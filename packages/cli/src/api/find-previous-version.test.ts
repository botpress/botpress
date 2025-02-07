import * as uuid from 'uuid'
import * as client from '@botpress/client'
import { test, expect } from 'vitest'
import { findPreviousIntegrationVersion } from './find-previous-version'
import { IntegrationSummary } from './types'

class IntegrationFixtureCreator {
  private t0 = Date.now()

  public constructor(private name: string) {}

  public create = (version: string): IntegrationSummary => {
    return {
      id: uuid.v4(),
      name: this.name,
      version,
      public: true,
      createdAt: new Date(this.t0++).toISOString(),
      updatedAt: new Date(this.t0++).toISOString(),
      description: 'description',
      title: 'title',
      iconUrl: 'iconUrl',
      verificationStatus: 'approved',
    }
  }
}

test('find previous integration version', async () => {
  const client: Partial<client.Client> = {
    listIntegrations: async ({ name }: { name?: string; version?: string }) => {
      const creator = new IntegrationFixtureCreator(name!)

      const integrations: IntegrationSummary[] = [
        creator.create('9.2.0'),
        creator.create('9.2.1'),
        creator.create('9.3.0'),
        creator.create('9.2.2'),
        creator.create('10.0.0'),
      ].reverse() // reverse creation order just like the real API

      return { integrations, meta: {} }
    },
  }

  const getPrevious = async (version: string) => {
    const integration = await findPreviousIntegrationVersion(client as client.Client, {
      type: 'name',
      name: 'slack',
      version,
    })
    return integration?.version
  }

  expect(await getPrevious('10.0.1')).toEqual('10.0.0')
  expect(await getPrevious('10.0.0')).toEqual('9.3.0')
  expect(await getPrevious('9.3.0')).toEqual('9.2.2')
  expect(await getPrevious('9.2.2')).toEqual('9.2.1')
  expect(await getPrevious('9.2.1')).toEqual('9.2.0')
  expect(await getPrevious('9.2.0')).toEqual(undefined)
})
