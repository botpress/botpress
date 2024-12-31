import { test } from 'vitest'
import * as utils from '../../utils/type-utils'
import { BaseInterface, DefaultInterface } from './generic'

test('DefaultInterface with empty input is a BaseInterface', () => {
  type Actual = DefaultInterface<{}>
  type Expected = BaseInterface
  type _assertion = utils.AssertTrue<utils.IsEqual<Actual, Expected>>
})
