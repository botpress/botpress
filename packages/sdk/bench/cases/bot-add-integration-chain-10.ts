import * as types from '../types.js'

export default {
  name: 'bot-add-integration-chain-10',
  instantiationThreshold: 36000,
  sourceCode: `
import { z, BotDefinition, IntegrationPackage } from "@botpress/sdk"

const integration0: IntegrationPackage = {
  name: "integration0",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration0",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey0: z.string() }),
    },
    actions: {
      act0: {
        input: { schema: z.object({ in0: z.string() }) },
        output: { schema: z.object({ out0: z.string() }) },
      },
    },
    events: {
      event0: {
        schema: z.object({ payload0: z.string() }),
      },
    },
    channels: {
      channel0: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration1: IntegrationPackage = {
  name: "integration1",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration1",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey1: z.string() }),
    },
    actions: {
      act1: {
        input: { schema: z.object({ in1: z.string() }) },
        output: { schema: z.object({ out1: z.string() }) },
      },
    },
    events: {
      event1: {
        schema: z.object({ payload1: z.string() }),
      },
    },
    channels: {
      channel1: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration2: IntegrationPackage = {
  name: "integration2",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration2",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey2: z.string() }),
    },
    actions: {
      act2: {
        input: { schema: z.object({ in2: z.string() }) },
        output: { schema: z.object({ out2: z.string() }) },
      },
    },
    events: {
      event2: {
        schema: z.object({ payload2: z.string() }),
      },
    },
    channels: {
      channel2: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration3: IntegrationPackage = {
  name: "integration3",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration3",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey3: z.string() }),
    },
    actions: {
      act3: {
        input: { schema: z.object({ in3: z.string() }) },
        output: { schema: z.object({ out3: z.string() }) },
      },
    },
    events: {
      event3: {
        schema: z.object({ payload3: z.string() }),
      },
    },
    channels: {
      channel3: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration4: IntegrationPackage = {
  name: "integration4",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration4",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey4: z.string() }),
    },
    actions: {
      act4: {
        input: { schema: z.object({ in4: z.string() }) },
        output: { schema: z.object({ out4: z.string() }) },
      },
    },
    events: {
      event4: {
        schema: z.object({ payload4: z.string() }),
      },
    },
    channels: {
      channel4: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration5: IntegrationPackage = {
  name: "integration5",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration5",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey5: z.string() }),
    },
    actions: {
      act5: {
        input: { schema: z.object({ in5: z.string() }) },
        output: { schema: z.object({ out5: z.string() }) },
      },
    },
    events: {
      event5: {
        schema: z.object({ payload5: z.string() }),
      },
    },
    channels: {
      channel5: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration6: IntegrationPackage = {
  name: "integration6",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration6",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey6: z.string() }),
    },
    actions: {
      act6: {
        input: { schema: z.object({ in6: z.string() }) },
        output: { schema: z.object({ out6: z.string() }) },
      },
    },
    events: {
      event6: {
        schema: z.object({ payload6: z.string() }),
      },
    },
    channels: {
      channel6: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration7: IntegrationPackage = {
  name: "integration7",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration7",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey7: z.string() }),
    },
    actions: {
      act7: {
        input: { schema: z.object({ in7: z.string() }) },
        output: { schema: z.object({ out7: z.string() }) },
      },
    },
    events: {
      event7: {
        schema: z.object({ payload7: z.string() }),
      },
    },
    channels: {
      channel7: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration8: IntegrationPackage = {
  name: "integration8",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration8",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey8: z.string() }),
    },
    actions: {
      act8: {
        input: { schema: z.object({ in8: z.string() }) },
        output: { schema: z.object({ out8: z.string() }) },
      },
    },
    events: {
      event8: {
        schema: z.object({ payload8: z.string() }),
      },
    },
    channels: {
      channel8: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

const integration9: IntegrationPackage = {
  name: "integration9",
  version: "0.0.1",
  type: "integration",
  definition: {
    name: "integration9",
    version: "0.0.1",
    configuration: {
      schema: z.object({ apiKey9: z.string() }),
    },
    actions: {
      act9: {
        input: { schema: z.object({ in9: z.string() }) },
        output: { schema: z.object({ out9: z.string() }) },
      },
    },
    events: {
      event9: {
        schema: z.object({ payload9: z.string() }),
      },
    },
    channels: {
      channel9: {
        messages: {
          text: { schema: z.object({ text: z.string() }) },
        },
      },
    },
  },
}

export default new BotDefinition({})
  .addIntegration(integration0, { configuration: { apiKey0: "key" } })
  .addIntegration(integration1, { configuration: { apiKey1: "key" } })
  .addIntegration(integration2, { configuration: { apiKey2: "key" } })
  .addIntegration(integration3, { configuration: { apiKey3: "key" } })
  .addIntegration(integration4, { configuration: { apiKey4: "key" } })
  .addIntegration(integration5, { configuration: { apiKey5: "key" } })
  .addIntegration(integration6, { configuration: { apiKey6: "key" } })
  .addIntegration(integration7, { configuration: { apiKey7: "key" } })
  .addIntegration(integration8, { configuration: { apiKey8: "key" } })
  .addIntegration(integration9, { configuration: { apiKey9: "key" } })
`,
} satisfies types.BenchmarkCase
