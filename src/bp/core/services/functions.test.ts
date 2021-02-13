import 'bluebird-global'
import 'jest-extended'
import 'reflect-metadata'

import { CustomFunctionService } from './functions'

describe('Functions', () => {
  const functions = new CustomFunctionService()

  test('Function call', () => {
    functions.forBot('brobot').register('broacts', {
      patsback: () => 'pats bro',
      saybro: () => 'bro'
    })

    const broacts = functions.forBot('brobot').get('broacts')
    expect(broacts.patsback()).toEqual('pats bro')
    expect(broacts.saybro()).toEqual('bro')
  })

  test('Global function call', () => {
    functions.global().register('api', {
      doThing: (number: number) => number + 2
    })

    const api = functions.global().get('api')
    expect(api.doThing(4)).toEqual(6)
  })

  test('Remove function group', () => {
    functions.global().register('api', {
      doThing: (number: number) => number + 2
    })

    expect(functions.global().get('api')).not.toEqual(undefined)

    functions.global().remove('api')

    expect(functions.global().get('api')).toEqual(undefined)
  })

  test('Remove functions for bot', () => {
    functions.forBot('bakugan').register('bakuganAPI', {
      goBankrupt: () => 'yes'
    })

    let bakuganAPI = functions.forBot('bakugan').get('bakuganAPI')
    expect(bakuganAPI.goBankrupt).not.toEqual(undefined)

    functions.removeFunctionsForBot('bakugan')

    bakuganAPI = functions.forBot('bakugan').get('bakuganAPI')
    expect(bakuganAPI).toEqual(undefined)
  })
})
