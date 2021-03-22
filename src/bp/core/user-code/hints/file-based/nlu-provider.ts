import _ from 'lodash'

import { FileBasedHintProvider, Hint } from '../hints-service'

export default class NLUProvider implements FileBasedHintProvider {
  readonly filePattern = 'bots/*/intents/*.json'
  readonly readFile = true

  indexFile(filePath: string, content: string): Hint[] {
    try {
      const intent = JSON.parse(content)
      return _.flatten(
        intent.slots.map(x =>
          [
            {
              description: 'An extracted slot',
              name: `session.slots.${x.name}`,
              partial: true
            },
            {
              description: 'The value of the extracted slot',
              name: `session.slots.${x.name}.value`,
              partial: false
            },
            {
              description: 'The entity associated to the extracted slot',
              name: `session.slots.${x.name}.entity`,
              partial: true
            },
            {
              description: 'The name of the entity used to extract the slot',
              name: `session.slots.${x.name}.entity.name`,
              partial: false
            },
            {
              description: 'The type of the entity used to extract the slot',
              name: `session.slots.${x.name}.entity.type`,
              partial: false
            }
          ].map(hint => ({
            ...hint,
            category: 'VARIABLES',
            source: 'Extracted from intents',
            location: 'File: ' + filePath,
            parentObject: 'event.state',
            scope: 'inputs'
          }))
        )
      )
    } catch (err) {
      return []
    }
  }
}
