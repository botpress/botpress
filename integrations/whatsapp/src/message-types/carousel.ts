import * as card from './card'
import type { channels } from '.botpress'

export type Carousel = channels.Channels['channel']['carousel']

export function* generateOutgoingMessages(carousel: Carousel) {
  for (const i of carousel.items) {
    for (const m of card.generateOutgoingMessages(i)) {
      yield m
    }
  }
}
