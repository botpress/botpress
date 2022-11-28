module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "Getting Started",
    items: [
      "building-chatbots/creating-a-new-bot",
      "building-chatbots/studio-interface"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Flow Editor",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Flow Lifecycle",
        link: {
          type: "doc",
          id: "building-chatbots/flow-editor/flow-lifecycle/flow-lifecycle"
        },
        items: [
          "building-chatbots/flow-editor/flow-lifecycle/flow-wide-transitions"
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Content Elements",
        link: {
          type: "doc",
          id: "building-chatbots/flow-editor/content-elements/content-elements"
        },
        items: [
          "building-chatbots/flow-editor/content-elements/content-text",
          "building-chatbots/flow-editor/content-elements/content-image",
          "building-chatbots/flow-editor/content-elements/content-video",
          "building-chatbots/flow-editor/content-elements/content-card",
          "building-chatbots/flow-editor/content-elements/content-carousel",
          "building-chatbots/flow-editor/content-elements/custom-content-elements"
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Actions",
        link: {
          type: "doc",
          id: "building-chatbots/flow-editor/actions/actions"
        },
        items: [
          "building-chatbots/flow-editor/actions/built-in-actions",
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Skill Nodes",
        items: [
          "building-chatbots/flow-editor/skill-nodes/single-choice",
          "building-chatbots/flow-editor/skill-nodes/api-call",
          "building-chatbots/flow-editor/skill-nodes/slot-filling",
          "building-chatbots/flow-editor/skill-nodes/send-email",
          "building-chatbots/flow-editor/skill-nodes/custom-skills"
        ]
      }
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Language Understanding",
    items: [
      "building-chatbots/language-understanding/supported-languages",
      {
        type: "category",
        collapsible: true,
        label: "Questions & Answers",
        link: {
          type: "doc",
          id: "building-chatbots/language-understanding/questions-&-answers/questions-&-answers"
        },
        items: [
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Intents",
        link: {
          type: "doc",
          id: "building-chatbots/language-understanding/intents/intents"
        },
        items: [
          "building-chatbots/language-understanding/intents/slots",
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Entities",
        link: {
          type: "doc",
          id: "building-chatbots/language-understanding/entities/entities"
        },
        items: [
          "building-chatbots/language-understanding/entities/system-entities",
          "building-chatbots/language-understanding/entities/list-entities",
          "building-chatbots/language-understanding/entities/pattern-entities"
        ]
      },
      "building-chatbots/language-understanding/external-nlu-engines",
      "building-chatbots/language-understanding/hosting"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Testing & Debugging",
    items: [
      "building-chatbots/testing-&-debugging/emulator",
      "building-chatbots/testing-&-debugging/debugger",
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Memory & Data Persistence",
    items: [
      "building-chatbots/memory-&-data-persistence/flow-memory",
      "building-chatbots/memory-&-data-persistence/user-memory",
      "building-chatbots/memory-&-data-persistence/session-memory",
      "building-chatbots/memory-&-data-persistence/general-purpose-storage"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "QnA",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Questions & Answers",
        link: {
          type: "doc",
          id: "building-chatbots/qna/qna-item/qna-item"
        },
        items: [
          "building-chatbots/qna/qna-item/question-variations",
          "building-chatbots/qna/qna-item/answer-and-alternate",
          "building-chatbots/qna/qna-item/context",
        ]
      }
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Developers",
    items: [
      "building-chatbots/developers/hooks/hooks",
      "building-chatbots/developers/database",
      "building-chatbots/developers/custom-modules",
      "building-chatbots/developers/inter-bot-communication-delegation"
    ]
  }
]
