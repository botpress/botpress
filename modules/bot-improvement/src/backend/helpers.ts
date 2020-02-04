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

const topicToGoal = (topic: Topic): Goal => {
  const [t, name] = topic.name.split('/')
  if (!name) {
    throw `No name in topic: ${topic}`
  }

  return { id: topic.name.replace('.flow.json', ''), topic: t, name: name.replace('.flow.json', '') }
}

export const topicsToGoals = (topics: Topic[]): Goal[] => {
  return topics.reduce((result, t) => {
    try {
      const goal = topicToGoal(t)
      result.push(goal)
    } catch (e) {
      // no-op
    }
    return result
  }, [])
}

export const getGoalFromEvent = (event: IO.IncomingEvent): Goal => {
  if (!event.ndu) {
    throw 'No Goal found'
  }

  const [triggerId, trigger] = Object.entries(event.ndu.triggers).find(kv => {
    const [triggerId, trigger] = kv
    return trigger.result.user_intent_is === 1
  })

  if (!triggerId) {
    throw 'No Goal found'
  }

  return topicToGoal({ name: trigger.goal, description: '' })
}
