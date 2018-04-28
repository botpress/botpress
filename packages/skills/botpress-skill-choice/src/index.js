import _ from 'lodash'

// TODO: Put these in a package call `botpress-sdk`

const genId = () =>
  Math.random()
    .toString()
    .substr(2, 6)

const Flow = data => {
  const obj = Object.assign({}, data)

  if (!obj.version) {
    obj.version = '0.0'
  }

  if (!obj.name || !obj.location) {
    obj.name = obj.location = genId()
  }

  if (!obj.startNode) {
    if (!obj.nodes || obj.nodes.length <= 0) {
      throw new Error('Expected at least one node in `nodes`')
    }

    if (!obj.nodes.filter(n => n.name === 'entry').length) {
      obj.startNode = obj.nodes[0].name
    }

    obj.startNode = 'entry'
  }

  return obj
}

const Node = data => {
  const obj = Object.assign({}, data)

  if (!obj.id) {
    obj.id = genId()
  }

  if (!obj.onEnter) {
    obj.onEnter = []
  }

  if (!obj.onReceive) {
    obj.onReceive = null
  }

  if (!obj.next) {
    obj.next = []
  }

  return obj
}

const _say = (type, args) => {
  if (_.isString(args)) {
    return `say ${type} ${args}`
  } else {
    return `say ${type} ${JSON.stringify(args)}`
  }
}

const say = (...args) => {
  if (args.length === 1) {
    return _say('#text', args[0])
  } else if (args.length === 2) {
    return _say(args[0], args[1])
  } else {
    throw new Error('Can only call say with one or two args')
  }
}

const action = (name, args) => (args ? `${name} ${JSON.stringify(args)}` : name)

// ****

module.exports = {
  config: {},

  init: async function(bp, configurator) {
    // This is called before ready.
    // At this point your module is just being initialized, it is not loaded yet.
  },

  ready: async function(bp, configurator) {
    // Your module's been loaded by Botpress.
    // Serve your APIs here, execute logic, etc.

    const config = await configurator.loadAll()
    // Do fancy stuff here :)

    bp.dialogEngine.registerFunctions({
      'skill-choice-parse': function(state, event, { choices }) {
        const choice = _.find(choices, c =>
          _.some(c.keywords || [], k => _.includes(event.text.toLowerCase(), k.toLowerCase()))
        )

        if (choice) {
          return {
            ...state,
            'skill-choice-valid': true,
            'skill-choice-ret': choice.value
          }
        } else {
          return { ...state, 'skill-choice-valid': false }
        }
      },

      'skill-choice-invalid-inc': function(state) {
        const key = 'skill-choice-invalid-count'
        return { ...state, [key]: (state[key] || 0) + 1 }
      }
    })
  },

  generate: function(data) {
    const ummData = {
      ...data,
      choices: data.choices.map((el, i) => ({
        text: el.value,
        payload: 'CHOICE_PICK_' + el.value
      }))
    }

    const flow = Flow({
      nodes: [
        Node({
          name: 'entry',
          onEnter: [say(data.questionBloc, Object.assign(ummData, { text: data.question }))],
          next: [{ condition: 'true', node: 'parse' }]
        }),
        Node({
          name: 'parse',
          onReceive: [action('skill-choice-parse', data)],
          next: [
            { condition: "state['skill-choice-valid'] === true", node: '#' },
            { condition: 'true', node: 'invalid' }
          ]
        }),
        Node({
          name: 'invalid',
          onEnter: [action('skill-choice-invalid-inc')],
          next: [
            { condition: `state['skill-choice-invalid-count'] <= ${data.maxRetries}`, node: 'sorry' },
            { condition: 'true', node: '#' }
          ]
        }),
        Node({
          name: 'sorry',
          onEnter: [say(data.invalidBloc, Object.assign(ummData, { text: data.invalid }))],
          next: [{ condition: 'true', node: 'parse' }]
        })
      ]
    })

    const transitions = data.choices.map(choice => {
      const choiceShort = choice.value.length > 8 ? choice.value.substr(0, 7) + '...' : choice.value

      return {
        caption: `User picked [${choiceShort}]`,
        condition: `state['skill-choice-ret'] == "${choice.value}"`,
        node: ''
      }
    })

    transitions.push({
      caption: 'On failure',
      condition: 'true',
      node: ''
    })

    return { transitions, flow }
  }
}
