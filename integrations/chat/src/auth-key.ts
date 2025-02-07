import { z } from '@botpress/sdk'
import * as jwt from 'jsonwebtoken'
import * as err from './gen/errors'

const keySchema = z.object({
  id: z.string(),
})

const ALGO = 'HS256' as const

export type AuthKey = z.infer<typeof keySchema>
export type EncryptionMode = 'personal' | 'shared'

export class AuthKeyHandler {
  public constructor(
    private _sk: string,
    private _mode: EncryptionMode
  ) {}

  public get mode(): EncryptionMode {
    return this._mode
  }

  public generateKey = (key: AuthKey): string => {
    const signed = jwt.sign(key, this._sk, { algorithm: ALGO })
    return signed
  }

  public parseKey = (key: string): AuthKey => {
    try {
      const verified = jwt.verify(key, this._sk, { algorithms: [ALGO] }) as unknown
      return keySchema.parse(verified)
    } catch {
      throw new err.UnauthorizedError('Invalid user key')
    }
  }
}
