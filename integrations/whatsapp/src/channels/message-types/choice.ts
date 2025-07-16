import { Text, Interactive, ActionButtons, Button } from 'whatsapp-api-js/messages'
import { WHATSAPP } from '../../misc/constants'
import { convertMarkdownToWhatsApp } from '../../misc/markdown-to-whatsapp-rtf'
import { chunkArray, hasAtleastOne, truncate } from '../../misc/util'
import * as body from './interactive/body'
import * as button from './interactive/button'
import * as bp from '.botpress'

type Choice = bp.channels.channel.choice.Choice
type Option = Choice['options'][number]

export function* generateOutgoingMessages({
  payload: { text, options },
  logger,
}: {
  payload: Choice
  logger: bp.Logger
}) {
  if (options.length === 0) {
    yield new Text(convertMarkdownToWhatsApp(text))
  } else {
    const chunks = chunkArray(options, WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT)

    if (options.length > WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT) {
      logger
        .forBot()
        .info(
          `Splitting ${options.length} choices into groups of ${WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT} buttons each due to a limitation of WhatsApp.`
        )
    }

    for (const chunk of chunks) {
      const buttons: Button[] = chunk.map(_createButton)
      const actionButtons = hasAtleastOne(buttons) ? new ActionButtons(...buttons) : undefined
      if (!actionButtons) {
        logger.debug('No buttons in chunk, skipping')
        continue
      }
      yield new Interactive(actionButtons, body.create(text))
    }
  }
}

function _createButton(option: Option) {
  const safeValue = option.value.trim() // WhatsApp doesn't allow trailing spaces in button IDs
  return button.create({ id: safeValue, title: truncate(option.label, WHATSAPP.BUTTON_LABEL_MAX_LENGTH) })
}
