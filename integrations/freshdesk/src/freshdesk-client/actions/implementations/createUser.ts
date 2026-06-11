import * as sdk from '@botpress/sdk'
import { FreshdeskClient } from '../../FreshdeskClient'
import { createFreshdeskRuntimeError } from '../errors'
import * as bp from '.botpress'

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ input, client, ctx, logger }) => {
  const log = logger.forBot()
  try {
    const { name, email, pictureUrl } = input

    const freshdeskClient = new FreshdeskClient(ctx.configuration.domain, ctx.configuration.apiKey)

    let freshdeskRequesterId: string | undefined

    if (email) {
      const existing = await freshdeskClient.searchContactsByEmail(email)
      if (existing.length > 0) {
        freshdeskRequesterId = String(existing[0]!.id)
        log.info(`Found existing Freshdesk contact id=${freshdeskRequesterId} for email=${email}`)
      } else {
        const contact = await freshdeskClient.createContact(name, email)
        freshdeskRequesterId = String(contact.id)
        log.info(`Created Freshdesk contact id=${freshdeskRequesterId} for email=${email}`)
      }
    }

    const { user } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: freshdeskRequesterId ? { freshdeskRequesterId } : {},
    })

    if (freshdeskRequesterId && !user.tags.freshdeskRequesterId) {
      await client.updateUser({ id: user.id, tags: { freshdeskRequesterId } })
    }

    return { userId: user.id }
  } catch (thrown) {
    if (thrown instanceof sdk.RuntimeError) throw thrown
    log.warn('createUser failed', { error: thrown instanceof Error ? thrown.message : String(thrown) })
    throw createFreshdeskRuntimeError(thrown)
  }
}
