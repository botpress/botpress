import * as sdk from '@botpress/sdk'
const { z } = sdk

export const multiLineString = z.string().displayAs({ id: 'text', params: { multiLine: true, growVertically: true } })
