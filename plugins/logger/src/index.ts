import util from 'util'
import * as bp from '.botpress'

const plugin = new bp.Plugin({})

const format = (obj: any): string => util.inspect(obj, { depth: null, colors: true })
const log =
  (message: string) =>
  async <T extends { data: any }>(x: T): Promise<T> => {
    console.info(message, format(x.data))
    return x
  }

plugin.on.before_incoming_event('*', log('Start Incoming event:'))
plugin.on.before_incoming_message('*', log('Start Incoming message:'))
plugin.on.before_outgoing_message('*', log('Start Outgoing message:'))
plugin.on.before_call_action('*', log('Start Call action:'))
plugin.on.after_incoming_event('*', log('End Incoming event:'))
plugin.on.after_incoming_message('*', log('End Incoming message:'))
plugin.on.after_outgoing_message('*', log('End Outgoing message:'))
plugin.on.after_call_action('*', log('End Call action:'))

export default plugin
