import { z } from '@botpress/sdk'

/** A string that must contain at least 1 non-whitespace character.
 *
 *  @remark This can still be an optional field */
export const NonBlankString = z.string().trim().min(1)

/** A common description that should apply to all Email Address Fields.
 *
 *  @remark Using this constant so it can be re-used in multiple other schemas.
 *   This is because the linter doesn't detect the "describe" if I were to bind
 *   it to the "EmailAddressSchema" definition */
export const EMAIL_ADDRESS_DESCRIPTION = 'The email address of the correspondent (e.g. example@example.com)'

/** A string that represents an email address.
 *
 *  @remark "correspondent" can refer to both the sender and the receiver of an email. */
export const EmailAddressSchema = NonBlankString.email().brand('Email')
