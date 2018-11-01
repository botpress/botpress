export const flowsStub = [
  {
    name: 'main.flow.json',
    version: '0.0.1',
    catchAll: {
      onReceive: [],
      next: [
        {
          condition: "event.nlu.intent.is('forget')",
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

export const flowWithTimeoutProp = {
  name: 'main.flow.json',
  startNode: 'entry',
  timeoutNode: 'timeout',
  nodes: [
    {
      id: 'bda0320009',
      name: 'timeout',
      onEnter: [],
      onReceive: [],
      next: []
    }
  ]
}

export const flowWithTimeoutNode = {
  name: 'main.flow.json',
  startNode: 'entry',
  nodes: [
    {
      id: 'bda0320009',
      name: 'timeout',
      onEnter: [],
      onReceive: [],
      next: []
    }
  ]
}

export const timeoutFlow = {
  name: 'timeout.flow.json',
  startNode: 'entry',
  nodes: [
    {
      id: 'bda0320009',
      name: 'entry',
      onEnter: [],
      onReceive: [],
      next: []
    }
  ]
}
