import { z } from '@botpress/sdk'

/** A string that must contain at least 1 non-whitespace character.
 *
 *  @remark This can still be an optional field */
export const NonBlankString = z.string().trim().min(1)

/** A string that represents an email address.
 *
 *  @remark "correspondent" can refer to both the sender and the receiver of an email. */
export const EmailAddressSchema = NonBlankString.email()
  .describe('The email address of the correspondent (e.g. example@example.com)')
  .brand('Email')
