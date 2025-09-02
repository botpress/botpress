import * as qs from 'qs'
import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {
    sayHello: async ({ input }) => {
      const name = input?.name || 'World'
      return { message: `Hello, ${name}!` }
    },
  },
})

bot.on.message('*', async (props) => {})

export default bot
