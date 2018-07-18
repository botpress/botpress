import Carousel from './builtin_carousel'

export default ({ BOT_URL, ...item }) =>
  Carousel({
    items: [item],
    BOT_URL
  })
