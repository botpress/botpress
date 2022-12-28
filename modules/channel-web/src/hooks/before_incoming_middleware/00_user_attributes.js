const _ = require('lodash')

async function visitEvent() {
  if (event.type === 'visit') {
    const user = await bp.users.getOrCreateUser('web', event.target, event.botId)

    const { timezone, language } = event.payload
    const isValidTimezone = _.isNumber(timezone) && timezone >= -12 && timezone <= 14 && timezone % 0.5 === 0
    const isValidLanguage = language.length < 4 && !_.get(user, 'result.attributes.language')

    const newAttributes = {
      ...(isValidTimezone && { timezone }),
      ...(isValidLanguage && { language })
    }

    if (Object.getOwnPropertyNames(newAttributes).length) {
      event.state.user = { ...event.state.user, ...newAttributes }
    }
  }
}

return visitEvent()
