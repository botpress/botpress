import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const getTextWithoutEntities = (entities: sdk.NLU.Entity[], text: string) => {
  let noEntitiesText = ''
  let cursor = 0

  _.chain(entities)
    .filter(entity => entity.type === 'pattern' || entity.type === 'list')
    .orderBy(['entity.meta.start', 'entity.meta.confidence'], ['asc', 'desc'])
    .forEach(entity => {
      if (entity.meta.start >= cursor) {
        noEntitiesText += text.substr(cursor, entity.meta.start - cursor) + entity.name
        cursor = entity.meta.end
      }
    })
    .value()

  return noEntitiesText + text.substr(cursor, text.length - cursor)
}
