import * as verel from '@bpinternal/verel'
import * as errors from '../errors'

export const getStringResult = ({ code, data }: { code: string; data: Record<string, any> }) => {
  const { result } = verel.execute(code, data)

  if (typeof result !== 'string') {
    throw new errors.BotpressCLIError('VRL returned an invalid string result')
  }

  return result
}
