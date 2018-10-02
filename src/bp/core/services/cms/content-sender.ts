import { reduce } from 'bluebird'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import Mustache from 'mustache'

import { Event } from '../../sdk/impl'
import { TYPES } from '../../types'
import { EventEngine } from '../middleware/event-engine'

import { CMSService } from './cms-service'

@injectable()
export class ContentElementSender {
  constructor(
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine
  ) {}

  // TODO: Test if the payload is parsing its template properly
  async sendContent(contentId: string, state, event) {
    contentId = contentId.replace(/^#!?/i, '')

    const { botId, channel, target, threadId } = event
    const content = await this.cms.getContentElement(botId, contentId) // TODO handle errors

    if (!content) {
      throw new Error(`Content element "${contentId}" not found`)
    }

    const view = { state, event }

    // FIXME: Add variations
    _.set(content, 'previewPath', Mustache.render(content.previewText, view))
    _.set(content, 'computedData.text', Mustache.render(_.get(content.computedData, 'text'), view))

    const additionnalData = { BOT_URL: 'http://localhost:3000' }

    const contentType = await this.cms.getContentType(content.contentType)
    let renderedElements = await contentType.renderElement({ ...additionnalData, ...content.computedData }, channel)

    if (!_.isArray(renderedElements)) {
      renderedElements = [renderedElements]
    }

    for (const element of renderedElements) {
      const event = Event({
        direction: 'outgoing',
        payload: element,
        type: _.get(element, 'type', 'default'),
        botId,
        channel,
        target,
        threadId
      })

      await this.eventEngine.sendEvent(event)
    }
  }
}
