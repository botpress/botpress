import * as card from './card'
import { channels } from '.botpress'

export type Carousel = channels.channel.carousel.Carousel

export function* generateOutgoingMessages(carousel: Carousel) {
  for (const i of carousel.items) {
    for (const m of card.generateOutgoingMessages(i)) {
      yield m
    }
  }
}
