export const flows = [
  {
    name: 'main.flow.json',
    version: '0.0.1',
    catchAll: {
      onReceive: [],
      next: [
        {
          condition: 'event.nlu.intent.is(\'forget\')',
          node: 'forget-my-name'
        }
      ]
    },
    startNode: 'entry',
    nodes: [
      {
        id: 'bda0320009',
        name: 'welcome',
        onEnter: ['say #!builtin_text-pSsHWg', 'getTotalNumberOfConversations {}'],
        onReceive: undefined,
        next: [
          {
            condition: 'state.$r === 0',
            node: 'first-time'
          },
          {
            condition: 'state.$r > 0',
            node: 'many-times'
          }
        ]
      },
      {
        id: 'a54a82eb7c',
        name: 'entry',
        onEnter: ['tagUser {"tag":"Joe"}', 'debug {}'],
        onReceive: undefined,
        next: [
          {
            condition: 'state.$r !== null',
            node: 'welcome'
          },
          {
            condition: 'true',
            node: 'ask-name'
          }
        ]
      },
      {
        id: 'd29fc6b771',
        name: 'ask-name',
        next: [
          {
            condition: 'true',
            node: 'welcome'
          }
        ],
        onEnter: ['say #!builtin_text-z0J9qh'],
        onReceive: [
          'setUserVariable {"name":"nickname","value":"{{event.text}}","expiry":"never"}',
          'getUserVariable {"name":"nickname","output":"$r"}'
        ]
      }
    ]
  },
  {
    name: 'other.flow.json',
    version: '0.0.1',
    startNode: 'entry',
    nodes: [
      {
        id: 'a54a82eb7c',
        name: 'entry',
        onEnter: ['debug {}'],
        onReceive: undefined,
        next: undefined
      }
    ]
  }
]

const node = {
  id: 'a54a82eb7c',
  name: 'entry',
  onEnter: ['tagUser {"tag":"Joe"}', 'debug {}'],
  onReceive: undefined,
  next: [
    {
      condition: 'state.$r !== null',
      node: 'welcome'
    },
    {
      condition: 'true',
      node: 'ask-name'
    }
  ]
}

export const session = {
  id: '',
  event: '',
  context: {
    currentFlow: flows[0],
    currentNode: node
  },
  state: {}
}

export const context = {
  currentFlow: {
    name: 'main.flow.json',
    location: 'main.flow.json',
    nodes: [
      {
        id: 'bda0320009',
        name: 'welcome',
        onEnter: ['say #!builtin_text-pSsHWg', 'getTotalNumberOfConversations {}'],
        onReceive: undefined,
        next: [{ condition: 'state.$r === 0', node: 'first-time' }, { condition: 'state.$r > 0', node: 'many-times' }],
        x: 100,
        y: 80
      },
      {
        id: '7099199f90',
        name: 'first-time',
        next: [],
        onEnter: ['say #!builtin_text-AY5SSW', 'say #!builtin_text-X069Le'],
        onReceive: undefined,
        x: 410,
        y: 125
      },
      {
        id: 'c69ee2d71f',
        name: 'many-times',
        next: [],
        onEnter: ['say #!builtin_text-bFsOmf'],
        onReceive: undefined,
        x: 410,
        y: 300
      },
      {
        id: '4f50a2e9fd',
        name: 'forget-my-name',
        next: [],
        onEnter: ['say #!builtin_text-TtzrCV', 'resetUserVariable {"name":"nickname"}', 'say #!builtin_text-kKQ8C3'],
        onReceive: undefined,
        x: 100,
        y: 290
      },
      {
        id: 'a54a82eb7c',
        name: 'entry',
        onEnter: ['tagUser {"tag":"Joe"}', 'debug {}'],
        onReceive: undefined,
        next: [{ condition: 'state.$r !== null', node: 'welcome' }, { condition: 'true', node: 'ask-name' }],
        x: 100,
        y: -100
      },
      {
        id: 'd29fc6b771',
        name: 'ask-name',
        next: [{ condition: 'true', node: 'welcome' }],
        onEnter: ['say #!builtin_text-z0J9qh'],
        onReceive: [
          'setUserVariable {"name":"nickname","value":"{{event.text}}","expiry":"never"}',
          'getUserVariable {"name":"nickname","output":"$r"}'
        ],
        x: 410,
        y: -65
      },
      {
        id: '562598f0e2',
        name: 'random-fact',
        next: [{ condition: 'true', node: 'welcome' }],
        onEnter: ['say #!builtin_text-KRrMLo'],
        onReceive: undefined,
        x: 655,
        y: 75
      }
    ],
    links: [
      {
        source: 'bda0320009',
        sourcePort: 'out0',
        target: '7099199f90',
        points: [{ x: 307, y: 183 }, { x: 510, y: 119 }]
      },
      {
        source: 'bda0320009',
        sourcePort: 'out1',
        target: 'c69ee2d71f',
        points: [{ x: 307, y: 208 }, { x: 510, y: 294 }]
      },
      {
        source: 'a54a82eb7c',
        sourcePort: 'out0',
        target: 'bda0320009',
        points: [{ x: 307, y: -40 }, { x: 200, y: 74 }]
      },
      {
        source: 'a54a82eb7c',
        sourcePort: 'out1',
        target: 'd29fc6b771',
        points: [{ x: 307, y: -15 }, { x: 510, y: -71 }]
      },
      {
        source: 'd29fc6b771',
        sourcePort: 'out0',
        target: 'bda0320009',
        points: [{ x: 617, y: 62 }, { x: 200, y: 74 }]
      },
      {
        source: '562598f0e2',
        sourcePort: 'out0',
        target: 'bda0320009',
        points: [{ x: 862, y: 135 }, { x: 200, y: 74 }]
      }
    ],
    version: '0.0.1',
    catchAll: { onReceive: [], next: [{ condition: 'event.nlu.intent.is(\'forget\')', node: 'forget-my-name' }] },
    startNode: 'entry'
  },
  currentNode: {
    id: 'a54a82eb7c',
    name: 'entry',
    onEnter: ['debug {}'],
    onReceive: undefined,
    next: [{ condition: 'state.$r !== null', node: 'welcome' }, { condition: 'true', node: 'ask-name' }],
    x: 100,
    y: -100
  }
}
