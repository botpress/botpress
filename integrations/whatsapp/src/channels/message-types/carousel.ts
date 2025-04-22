import * as card from './card'
import { channels } from '.botpress'
import * as bp from '.botpress'

export type Carousel = channels.channel.carousel.Carousel

export function* generateOutgoingMessages(carousel: Carousel, logger: bp.Logger) {
  for (const i of carousel.items) {
    for (const m of card.generateOutgoingMessages(i, logger)) {
      yield m
    }
  }
}
