module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "Language Understanding",
    items: ["chatbot-management/language-understanding/misunderstood"],
  },
  {
    type: "category",
    collapsible: false,
    label: "Agent Handover",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Human in the Loop (HITL)",
        items: [
          "chatbot-management/agent-handover/human-in-the-loop/hitl",
          "chatbot-management/agent-handover/human-in-the-loop/hitlnext",
        ],
      },
    ],
  },
  {
    type: "category",
    collapsible: false,
    label: "Broadcast",
    items: ["chatbot-management/broadcast"],
  },
]
