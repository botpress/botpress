import util from 'util'
import _ from 'lodash'

import actions from './actions'

const QUICK_REPLY_PAYLOAD = /\<(.+)\>\s(.+)/i

function processButtons(buttons, blocName) {
  return processQuickReplies(buttons, blocName).map(button => {
    if (button.payload && button.title && _.isNil(button.type)) {
      return Object.assign(button, { type: 'postback' })
    }

    return button
  })
}

function processQuickReplies(qrs, blocName) {
  if (!_.isArray(qrs)) {
    throw new Error('Expected quick_replies to be an array')
  }

  return qrs.map(qr => {
    if (_.isString(qr) && QUICK_REPLY_PAYLOAD.test(qr)) {
      let [, payload, text] = QUICK_REPLY_PAYLOAD.exec(qr)

      // <.HELLO> becomes <BLOCNAME.HELLO>
      if (payload.startsWith('.')) {
        payload = blocName + payload
      }

      return {
        title: text,
        payload: payload.toUpperCase()
      }
    }

    return qr
  })
}

function amendButtons(obj, blocName) {
  if (!_.isPlainObject(obj)) {
    return obj
  }

  return _.mapValues(obj, (value, key) => {
    if (_.isPlainObject(value)) {
      return amendButtons(value, blocName)
    } else if (_.isArray(value)) {
      if (key === 'buttons') {
        return amendButtons(processButtons(value, blocName))
      }
      return value.map(v => amendButtons(v, blocName))
    } else {
      return value
    }
  })
}

function getUserId(event) {
  const userId =
    _.get(event, 'user.userId') ||
    _.get(event, 'raw.userId') ||
    _.get(event, 'userId') ||
    _.get(event, 'raw.from') ||
    _.get(event, 'user.id') ||
    _.get(event, 'raw.user.id')

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  if (userId.startsWith('facebook:')) {
    return userId.substr('facebook:'.length)
  }

  return userId
}

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction) // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = ['quick_replies', 'waitRead', 'waitDelivery', 'typing', 'tag', '__platformSpecific', 'on']

  const options = _.pick(instruction, optionsList)

  for (const prop of optionsList) {
    delete ins[prop]
  }

  if (options.quick_replies) {
    options.quick_replies = processQuickReplies(options.quick_replies, blocName)
  }

  /////////
  /// Processing
  /////////

  if (!_.isNil(instruction.template_type)) {
    const data = amendButtons(ins, blocName)
    return actions.createTemplate(getUserId(event), data, options)
  }

  for (const attr of ['image', 'audio', 'video', 'file']) {
    if (!_.isNil(instruction[attr])) {
      return actions.createAttachment(getUserId(event), attr, ins[attr], options)
    }
  }

  if (!_.isNil(instruction.attachment)) {
    return actions.createAttachment(
      getUserId(event),
      instruction.type || instruction.attachment,
      ins.url || instruction.attachment,
      options
    )
  }

  if (!_.isNil(instruction.text)) {
    return actions.createText(getUserId(event), instruction.text, options)
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(`Unrecognized instruction on Facebook Messenger in bloc '${blocName}': ${strRep}`)
}

////////////
/// TEMPLATES
////////////

function getTemplates() {
  return [
    {
      type: 'Text - Single message',
      template: 'block_name_sm:\n  - Text goes here..'
    },
    {
      type: 'Text - Multiple messages',
      template: 'block_name_mm:\n  - Text goes here..(1)\n  - Text goes here..(2)'
    },
    {
      type: 'Text - Random message',
      template: 'block_name_rm:\n  - text:\n    - Text goes here..(1)\n    - Text goes here..(2)'
    },
    {
      type: 'Typing - Message with typing',
      template: 'block_name_bm:\n  - text: Text goes here..(1)\n    typing: 1000ms'
    },
    {
      type: 'Text - Quick replies',
      template:
        'block_name_qr:\n  - text: Text goes here..\n    quick_replies:\n    - <POSTBACK_1> Button..(1)\n    - <POSTBACK_2> Button..(2)'
    },
    {
      type: 'Attachment - Image',
      template: 'block_image:\n  - on: facebook\n    image: https://botpress.io/static/img/nobg_primary_black.png'
    },
    {
      type: 'Attachment - Video',
      template: 'block_video:\n  - on: facebook\n    video: https://www.youtube.com/watch?v=QIokUU4HAKU'
    },
    {
      type: 'Template - Generic',
      template:
        'block_generic:\n  - on: facebook\n    template_type: generic\n    elements:\n    - title: Welcome to Botpress\n      image_url: https://botpress.io/static/img/grey_bg_primary.png\n      subtitle: This is a great building framework\n      default_action:\n      - type: web_url\n        url: https://botpress.io\n        messenger_extensions: false\n        webview_height_ratio: tall\n        fallback_url: https://botpress.io\n      buttons:\n      - <BTN_RANDOM> Random cat videos\n      - type: postback\n        title: This button gives the same thing\n        payload: BTN_RANDOM\n      - type: web_url\n        url: https://youtube.com/?q=cats\n        title: Cats on Youtube'
    },
    {
      type: 'Template - Carousel',
      template:
        'block_carousel:\n  - on: facebook\n    template_type: generic\n    elements:\n    - title: Welcome to Botpress\n      image_url: https://botpress.io/static/img/grey_bg_primary.png\n      subtitle: This is a great building framework\n      default_action:\n      - type: web_url\n        url: https://botpress.io\n        messenger_extensions: false\n        webview_height_ratio: tall\n        fallback_url: https://botpress.io\n      buttons:\n      - <BTN_RANDOM> Random cat videos\n      - type: postback\n        title: This button gives the same thing\n        payload: BTN_RANDOM\n      - type: web_url\n        url: https://youtube.com/?q=cats\n        title: Cats on Youtube\n    - title: Bienvenido a Botpress\n      image_url: https://botpress.io/static/img/nobg_primary_black.png\n      subtitle: Este es un gran marco de construcción\n      default_action:\n      - type: web_url\n        url: https://botpress.io\n        messenger_extensions: false\n        webview_height_ratio: tall\n        fallback_url: https://botpress.io\n      buttons:\n      - <BTN_RANDOM> Videos de perros al azar\n      - type: postback\n        title: Este botón da lo mismo\n        payload: BTN_RANDOM\n      - type: web_url\n        url: https://youtube.com/?q=cats\n        title: Gatos en Youtube'
    }
  ]
}

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: 'facebook',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
