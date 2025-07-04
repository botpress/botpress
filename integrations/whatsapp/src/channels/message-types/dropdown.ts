import { Text, Interactive, ActionList, ListSection, Row } from 'whatsapp-api-js/messages'
import { convertMarkdownToWhatsApp } from '../../misc/markdown-to-whatsapp-rtf'
import { chunkArray, hasAtleastOne, truncate } from '../../misc/util'
import * as body from './interactive/body'
import * as bp from '.botpress'

type Dropdown = bp.channels.channel.dropdown.Dropdown

const INTERACTIVE_MAX_ACTIONS_COUNT = 10
const ACTION_LABEL_MAX_LENGTH = 24

export function* generateOutgoingMessages({
  payload: { text, options, buttonLabel },
  logger,
}: {
  payload: Dropdown
  logger: bp.Logger
}) {
  if (options.length === 0) {
    yield new Text(convertMarkdownToWhatsApp(text))
  } else {
    const chunks = chunkArray(options, INTERACTIVE_MAX_ACTIONS_COUNT)

    if (options.length > INTERACTIVE_MAX_ACTIONS_COUNT) {
      logger
        .forBot()
        .info(
          `Splitting ${options.length} dropdown options into groups of ${INTERACTIVE_MAX_ACTIONS_COUNT} actions each due to a limitation of WhatsApp.`
        )
    }

    for (const chunk of chunks) {
      const rows: Row[] = chunk.map(
        (o) => new Row(o.value.substring(0, 200), truncate(o.label, ACTION_LABEL_MAX_LENGTH), ' ')
      )
      if (!hasAtleastOne(rows)) {
        logger.debug('No rows in chunk, skipping')
        continue
      }

      const section = new ListSection(
        truncate(text, ACTION_LABEL_MAX_LENGTH),
        ...rows // NOTE: The description parameter is optional as per WhatsApp's documentation, but they have a bug that actually enforces the description to be a non-empty string.
      )
      const actionList = new ActionList(buttonLabel ?? 'Choose...', section)

      yield new Interactive(actionList, body.create(text))
    }
  }
}
