import util from 'util'
import _ from 'lodash'
import Promise from 'bluebird'
import path from 'path'
import mime from 'mime'

const QUICK_REPLY_PAYLOAD = /\<(.+)\>\s(.+)/i

function getUserId(event) {
  const userId =
    _.get(event, 'user.id') ||
    _.get(event, 'user.userId') ||
    _.get(event, 'userId') ||
    _.get(event, 'raw.from') ||
    _.get(event, 'raw.userId') ||
    _.get(event, 'raw.user.id')

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  return userId
}

// TODO Extract this logic directly to botpress's UMM
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

function loginPrompt(event, instruction, options) {
  const user = getUserId(event)

  const raw = buildObjectRaw(event, instruction, options, user)

  return PromisifyEvent({
    platform: 'webchat',
    type: 'login_prompt',
    user: { id: user },
    raw: raw,
    text: instruction.text
  })
}

// - type: file
//   url: "https://exemple.com"

function uploadFile(event, instruction, options) {
  const user = getUserId(event)
  const url = instruction.url

  // if you are working on the same url
  // you can let absolute path for your image

  const extension = path.extname(url)

  const mimeType = mime.getType(extension)

  const basename = path.basename(url, extension)

  const raw = buildObjectRaw(event, instruction, options, user)

  return PromisifyEvent({
    platform: 'webchat',
    type: 'file',
    user: { id: user },
    raw: raw,
    text: instruction.text || basename,
    data: {
      storage: 'remote',
      url: url,
      name: basename || 'unknown',
      mime: mimeType || 'unknown'
    }
  })
}

function carousel(event, instruction, options) {
  const user = getUserId(event)

  const raw = buildObjectRaw(event, instruction, options, user)

  return PromisifyEvent({
    platform: 'webchat',
    type: 'carousel',
    user: { id: user },
    raw: raw,
    text: instruction.text
  })
}

function customEvent(event, instruction, options) {
  const user = getUserId(event)
  const raw = buildObjectRaw(event, instruction, options, user)

  return PromisifyEvent({
    platform: 'webchat',
    type: 'custom',
    user: { id: user },
    raw: { ...raw, custom_type: instruction.type, custom_data: instruction.data },
    text: instruction.text
  })
}

function defaultText(event, instruction, options) {
  const user = getUserId(event)
  const raw = buildObjectRaw(event, instruction, options, user)

  if (!_.isNil(instruction.text)) {
    return PromisifyEvent({
      platform: 'webchat',
      type: 'text',
      user: { id: user },
      raw: raw,
      text: instruction.text
    })
  }
}

// Build the raw obj to pass to the Promise
function buildObjectRaw(event, instruction, options, user) {
  const raw = Object.assign(
    {
      to: user,
      message: instruction.text || null
    },
    options,
    _.pick(event && event.raw, 'conversationId')
  )

  return raw
}

function processForm(formElement) {
  if (_.isArray(formElement)) {
    throw new Error('Expected `form` to be an object!')
  }
  if (!formElement.hasOwnProperty('id') || formElement.id === null) {
    throw new Error('Expected `form.id` field')
  }
  if (!formElement.hasOwnProperty('elements') || !_.isArray(formElement.elements)) {
    throw new Error('Expected `form.elements` to be an Array!')
  }
  return {
    title: formElement.title,
    id: formElement.id,
    elements: formElement.elements.map(field => {
      if ('input' in field) {
        // Input field
        return {
          label: field.input.label,
          placeholder: field.input.placeholder || '',
          name: field.input.name,
          type: 'input',
          subtype: field.input.subtype || '',
          maxlength: field.input.maxlength || '',
          minlength: field.input.minlength || '',
          required: field.input.required || false
        }
      } else if ('textarea' in field) {
        // Textarea field
        return {
          label: field.textarea.label,
          placeholder: field.textarea.placeholder || '',
          name: field.textarea.name,
          type: 'textarea',
          maxlength: field.textarea.maxlength || '',
          minlength: field.textarea.minlength || '',
          required: field.textarea.required || false
        }
      } else if ('select' in field) {
        // Select field
        return {
          label: field.select.label,
          placeholder: field.select.placeholder || '',
          name: field.select.name,
          options: field.select.options,
          required: field.select.required || false,
          type: 'select'
        }
      } else {
        throw new Error('Cannot recognize element type!')
      }
    })
  }
}

function PromisifyEvent(event) {
  if (!event._promise) {
    event._promise = new Promise((resolve, reject) => {
      event._resolve = resolve
      event._reject = reject
    })
  }

  return event
}

function processOutgoing({ event, blocName, instruction }) {
  const ins = Object.assign({}, instruction) // Create a shallow copy of the instruction

  ////////
  // PRE-PROCESSING
  ////////

  const optionsList = ['typing', 'quick_replies', 'file', 'form', 'elements', 'web-style', 'settings', 'markdown']

  const options = _.pick(instruction, optionsList)

  for (const prop of optionsList) {
    delete ins[prop]
  }

  if (options.quick_replies) {
    options.quick_replies = processQuickReplies(options.quick_replies, blocName)
  }

  // TODO : Make a Quick_replies than handle text and picture.

  if (options.form) {
    options.form = processForm(options.form)
  }
  /////////
  /// Processing
  /////////

  if (instruction.type === 'login_prompt') {
    return loginPrompt(event, instruction, options)
  } else if (instruction.type === 'file') {
    return uploadFile(event, instruction, options)
  } else if (instruction.type === 'carousel') {
    return carousel(event, instruction, options)
  } else if (instruction.type === 'location_picker') {
    // TODO
  } else if (instruction.type && instruction.type.startsWith('@')) {
    return customEvent(event, instruction, options)
  } else {
    return defaultText(event, instruction, options)
  }

  ////////////
  /// POST-PROCESSING
  ////////////

  // Nothing to post-process yet

  ////////////
  /// INVALID INSTRUCTION
  ////////////

  const strRep = util.inspect(instruction, false, 1)
  throw new Error(`Unrecognized instruction on Web in bloc '${blocName}': ${strRep}`)
}

////////////
/// TEMPLATES
////////////

function getTemplates() {
  return []
}

module.exports = bp => {
  const [renderers, registerConnector] = _.at(bp, ['renderers', 'renderers.registerConnector'])

  renderers &&
    registerConnector &&
    registerConnector({
      platform: 'webchat',
      processOutgoing: args => processOutgoing(Object.assign({}, args, { bp })),
      templates: getTemplates()
    })
}
