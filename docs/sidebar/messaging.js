module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "Overview",
    items: [
      "messaging-channels/supported-channels",
      "messaging-channels/supported-content-types"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Botpress Webchat",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Website Embedding",
        link: {
          type: "doc",
          id: "messaging-channels/botpress-webchat/website-embedding/website-embedding"
        },
        items: [
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Customizations",
        items: [
          "messaging-channels/botpress-webchat/customizations/custom-css",
        ]
      }
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Direct Integrations",
    items: [
      "messaging-channels/direct-integrations/facebook-messenger",
      "messaging-channels/direct-integrations/microsoft-teams",
      "messaging-channels/direct-integrations/slack",
      "messaging-channels/direct-integrations/telegram"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Broker Integrations",
    items: [
      "messaging-channels/broker-integrations/twilio",
      "messaging-channels/broker-integrations/vonage",
      "messaging-channels/broker-integrations/smooch-sunshine-conversations"
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Custom Channels",
    items: ["messaging-channels/custom-channels/converse-api"]
  }
]
