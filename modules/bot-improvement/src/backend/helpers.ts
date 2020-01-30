import assert from 'assert'
import { IO, Topic } from 'botpress/sdk'

import { Goal } from './typings'

export const sortStoredEvents = (a: IO.StoredEvent, b: IO.StoredEvent) => {
  if (a.direction === 'incoming' && b.direction === 'outgoing') {
    return -1
  }
  if (a.direction === 'outgoing' && b.direction === 'incoming') {
    return 1
  }

  assert(a.direction === 'outgoing')
  assert(b.direction === 'outgoing')
  if (a.event.createdOn < b.event.createdOn) {
    return -1
  }
  if (a.event.createdOn > b.event.createdOn) {
    return 1
  }
  return 0
}

export const topicsToGoals = (topics: Topic[]): Goal[] => {
  return topics.reduce((result, t) => {
    const [topic, name] = t.name.split('/')
    if (name) {
      result.push({ id: t.name, topic, name })
    }
    return result
  }, [])
}
