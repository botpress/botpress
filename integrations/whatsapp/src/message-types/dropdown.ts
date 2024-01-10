import { Types } from 'whatsapp-api-js'
import { IntegrationLogger } from '..'
import * as body from '../interactive/body'
import { chunkArray, truncate } from '../util'
import type { channels } from '.botpress'

const { Text } = Types
const { Interactive, ActionList, ListSection, Row } = Types.Interactive

type Dropdown = channels.channel.dropdown.Dropdown

const INTERACTIVE_MAX_ACTIONS_COUNT = 10
const ACTION_LABEL_MAX_LENGTH = 24

export function* generateOutgoingMessages({
  payload: { text, options },
  logger,
}: {
  payload: Dropdown
  logger: IntegrationLogger
}) {
  if (options.length === 0) {
    yield new Text(text)
  } else {
    const chunks = chunkArray(options, INTERACTIVE_MAX_ACTIONS_COUNT)

    if (options.length > INTERACTIVE_MAX_ACTIONS_COUNT) {
      logger
        .forBot()
        .info(
          `Splitting ${options.length} dropdown options into groups of ${INTERACTIVE_MAX_ACTIONS_COUNT} actions each due to a limitation of Whatsapp.`
        )
    }

    for (const chunk of chunks) {
      const section = new ListSection(
        truncate(text, ACTION_LABEL_MAX_LENGTH),
        ...chunk.map((o) => new Row(o.value.substring(0, 200), truncate(o.label, ACTION_LABEL_MAX_LENGTH), ' ')) // NOTE: The description parameter is optional as per Whatsapp's documentation, but they have a bug that actually enforces the description to be a non-empty string.
      )
      const actionList = new ActionList('Choose...', section)

      yield new Interactive(actionList, body.create(text))
    }
  }
}
