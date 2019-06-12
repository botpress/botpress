import getTypeByTrigger from './utils/getTypeByTrigger'

const findMentionEntities = trigger => (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity()
    return entityKey !== null && contentState.getEntity(entityKey).getType() === getTypeByTrigger(trigger)
  }, callback)
}

export default findMentionEntities
