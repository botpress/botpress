import { test } from 'vitest'
import { EmptyPlugin, FooBarBazPlugin } from '../../fixtures'
import { ActionProxy } from './types'

type Tmp = ActionProxy<FooBarBazPlugin>
const proxy: Tmp = {} as any

test('tmp', async () => {
  const { outputBaz } = await proxy.fooBarBaz.doBaz({ inputBaz: true })
  outputBaz
})
