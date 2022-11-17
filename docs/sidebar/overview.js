module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "Getting Started",
    items: [
      "overview/home",
      "overview/what-is-botpress",
      {
        type: "category",
        collapsible: true,
        label: "Quickstart",
        items: [
          "overview/quickstart/installation",
          "overview/quickstart/building-a-bot",
          "overview/quickstart/admin-dashboard",
          "overview/quickstart/conversation-studio",
        ],
      },
      "overview/features",
    ],
  },
  {
    type: 'category',
    label: 'Cloud',
    collapsible: true,
    items:[]
  }
]
