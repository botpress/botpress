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
  async sendContent(contentId: string, args: string, state, event) {
    process.ASSERT_LICENSED()
    contentId = contentId.replace(/^#?/i, '')

    const { botId, channel, target, threadId } = event

    let renderedElements

    if (contentId.startsWith('!')) {
      const content = await this.cms.getContentElement(botId, contentId.substr(1)) // TODO handle errors

      if (!content) {
        throw new Error(`Content element "${contentId}" not found`)
      }

      const view = { state, event }

      _.set(content, 'previewPath', Mustache.render(content.previewText, view))

      const text = _.get(content.formData, 'text')
      const variations = _.get(content.formData, 'variations')

      const message = _.sample([text, ...(variations || [])])
      if (message) {
        _.set(content, 'formData.text', Mustache.render(message, view))
      }

      renderedElements = await this.cms.renderElement(content.contentType, content.formData, channel)
    } else {
      renderedElements = await this.cms.renderElement(contentId, args, channel)
    }

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
