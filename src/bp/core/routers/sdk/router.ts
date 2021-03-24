import { CmsSearchContentElements, KvsGet, KvsSet, ReplyToEvent, SetAttributes } from 'botpress/apiSdk'
import * as sdk from 'botpress/sdk'
import { createForAction } from 'core/app/api'
import { Router } from 'express'
import _ from 'lodash'

import { CustomRouter } from '../customRouter'
import { TypedRequest } from '../util'

import { validateSdkApiPayload } from './utils'

export class SdkApiRouter extends CustomRouter {
  private api!: typeof sdk

  constructor(private logger: sdk.Logger) {
    super('SDK API Router', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  public async initialize() {
    this.api = await createForAction()
  }

  private setupRoutes(): void {
    /**
     * Send a reply in response to a specific event
     *
     * @param event - Can either be the complete event, or only those to identify the destination
     * @param contentId - Optionally render an element and send it to the user
     * @param payloads - Optionally provide the payloads yourself
     * @param args - Arguments passed to the template rendering for elements
     */
    this.router.post(
      '/events/replyToEvent',
      validateSdkApiPayload('events.replyToEvent'),
      this.asyncMiddleware(async (req: TypedRequest<ReplyToEvent>, res) => {
        const { event, contentId, args } = req.body
        let payloads = req.body.payloads

        if (contentId) {
          payloads = await this.api.cms.renderElement(contentId, { ...event, ...(args || {}) }, event)
        }

        if (!payloads?.length) {
          return res.status(400).send('contentId or payloads must be set')
        }

        await this.api.events.replyToEvent(event, payloads, (event as sdk.IO.IncomingEvent).id)
        res.sendStatus(200)
      })
    )

    /**
     * Merge specified attributes to the user's existing attributes
     */
    this.router.post(
      '/users/updateAttributes',
      validateSdkApiPayload('users.updateAttributes'),
      this.asyncMiddleware(async (req: TypedRequest<SetAttributes>, res) => {
        const { channel, userId, attributes } = req.body

        await this.api.users.updateAttributes(channel, userId, attributes)
        res.sendStatus(200)
      })
    )

    /**
     * Overwrite all the attributes of the user with the specified payload
     */
    this.router.post(
      '/users/setAttributes',
      validateSdkApiPayload('users.setAttributes'),
      this.asyncMiddleware(async (req: TypedRequest<SetAttributes>, res) => {
        const { channel, userId, attributes } = req.body

        await this.api.users.setAttributes(channel, userId, attributes)
        res.sendStatus(200)
      })
    )

    /**
     * Saves the specified key as JSON object
     *
     * @param botId - (optional) if not set, it will be stored as a global key
     * @param value - Any valid object (will be stored as json)
     * @param path - (optional) When path is set, the existing object's value is updated at that location
     * @param expiry - (optional) String representation of the expiration date (ex: 10m for 10 minutes) - refer to ms
     */
    this.router.post(
      '/kvs/set',
      validateSdkApiPayload('kvs.set'),
      this.asyncMiddleware(async (req: TypedRequest<KvsSet>, res) => {
        const { botId, key, value, path, expiry } = req.body

        if (botId) {
          await this.api.kvs.forBot(botId).set(key, value, path, expiry)
        } else {
          await this.api.kvs.global().set(key, value, path, expiry)
        }

        res.sendStatus(200)
      })
    )

    /**
     * Fetch the specified key as JSON object
     *
     * @param botId - (optional) if not set, it will be stored as a global key
     * @param key - Name of the key to fetch
     * @param path - (optional) If path is set, it will return that specific value
     */
    this.router.post(
      '/kvs/get',
      validateSdkApiPayload('kvs.get'),
      this.asyncMiddleware(async (req: TypedRequest<KvsGet>, res) => {
        const { botId, key, path } = req.body

        if (botId) {
          res.send(await this.api.kvs.forBot(botId).get(key, path))
        } else {
          res.send(await this.api.kvs.global().get(key, path))
        }
      })
    )

    /**
     * Search for content elements
     *
     * @param botId (required)
     * @param contentTypeId (optional) Filter elements for a specific content type
     * @param searchParams (optional) Additional search parameters
     * @param language (optional) When set, only the specified language is returned. All languages otherwise
     */
    this.router.post(
      '/cms/searchContentElements',
      validateSdkApiPayload('cms.searchContentElements'),
      this.asyncMiddleware(async (req: TypedRequest<CmsSearchContentElements>, res) => {
        const { botId, contentTypeId, searchParams, language } = req.body

        res.send(await this.api.cms.listContentElements(botId, contentTypeId, searchParams, language))
      })
    )

    /**
     * Creates a message signature, which can be used as proof that the message was created on Botpress backend
     * You can call this method twice to verify the authenticity of a message
     *
     * @param message: The message to generate a signature for
     */
    this.router.post(
      '/security/getMessageSignature',
      validateSdkApiPayload('security.getMessageSignature'),
      this.asyncMiddleware(async (req: TypedRequest<{ message: string }>, res) => {
        res.send(await this.api.security.getMessageSignature(req.body.message))
      })
    )
  }
}
