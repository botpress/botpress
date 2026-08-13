import * as types from '../types.js'

export default {
  name: 'many-actions-30',
  instantiationThreshold: 42000,
  sourceCode: `
import { z, IntegrationDefinition } from "@botpress/sdk"

export default new IntegrationDefinition({
  name: "many-actions",
  version: "0.0.1",
  configuration: {
    schema: z.object({ apiKey: z.string() }),
  },
  actions: {
    action0: {
      input: {
        schema: z.object({
          action0_in0: z.string(),
          action0_in1: z.number(),
          action0_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action0_out0: z.string(),
          action0_out1: z.number(),
        }),
      },
    },
    action1: {
      input: {
        schema: z.object({
          action1_in0: z.string(),
          action1_in1: z.number(),
          action1_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action1_out0: z.string(),
          action1_out1: z.number(),
        }),
      },
    },
    action2: {
      input: {
        schema: z.object({
          action2_in0: z.string(),
          action2_in1: z.number(),
          action2_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action2_out0: z.string(),
          action2_out1: z.number(),
        }),
      },
    },
    action3: {
      input: {
        schema: z.object({
          action3_in0: z.string(),
          action3_in1: z.number(),
          action3_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action3_out0: z.string(),
          action3_out1: z.number(),
        }),
      },
    },
    action4: {
      input: {
        schema: z.object({
          action4_in0: z.string(),
          action4_in1: z.number(),
          action4_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action4_out0: z.string(),
          action4_out1: z.number(),
        }),
      },
    },
    action5: {
      input: {
        schema: z.object({
          action5_in0: z.string(),
          action5_in1: z.number(),
          action5_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action5_out0: z.string(),
          action5_out1: z.number(),
        }),
      },
    },
    action6: {
      input: {
        schema: z.object({
          action6_in0: z.string(),
          action6_in1: z.number(),
          action6_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action6_out0: z.string(),
          action6_out1: z.number(),
        }),
      },
    },
    action7: {
      input: {
        schema: z.object({
          action7_in0: z.string(),
          action7_in1: z.number(),
          action7_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action7_out0: z.string(),
          action7_out1: z.number(),
        }),
      },
    },
    action8: {
      input: {
        schema: z.object({
          action8_in0: z.string(),
          action8_in1: z.number(),
          action8_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action8_out0: z.string(),
          action8_out1: z.number(),
        }),
      },
    },
    action9: {
      input: {
        schema: z.object({
          action9_in0: z.string(),
          action9_in1: z.number(),
          action9_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action9_out0: z.string(),
          action9_out1: z.number(),
        }),
      },
    },
    action10: {
      input: {
        schema: z.object({
          action10_in0: z.string(),
          action10_in1: z.number(),
          action10_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action10_out0: z.string(),
          action10_out1: z.number(),
        }),
      },
    },
    action11: {
      input: {
        schema: z.object({
          action11_in0: z.string(),
          action11_in1: z.number(),
          action11_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action11_out0: z.string(),
          action11_out1: z.number(),
        }),
      },
    },
    action12: {
      input: {
        schema: z.object({
          action12_in0: z.string(),
          action12_in1: z.number(),
          action12_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action12_out0: z.string(),
          action12_out1: z.number(),
        }),
      },
    },
    action13: {
      input: {
        schema: z.object({
          action13_in0: z.string(),
          action13_in1: z.number(),
          action13_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action13_out0: z.string(),
          action13_out1: z.number(),
        }),
      },
    },
    action14: {
      input: {
        schema: z.object({
          action14_in0: z.string(),
          action14_in1: z.number(),
          action14_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action14_out0: z.string(),
          action14_out1: z.number(),
        }),
      },
    },
    action15: {
      input: {
        schema: z.object({
          action15_in0: z.string(),
          action15_in1: z.number(),
          action15_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action15_out0: z.string(),
          action15_out1: z.number(),
        }),
      },
    },
    action16: {
      input: {
        schema: z.object({
          action16_in0: z.string(),
          action16_in1: z.number(),
          action16_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action16_out0: z.string(),
          action16_out1: z.number(),
        }),
      },
    },
    action17: {
      input: {
        schema: z.object({
          action17_in0: z.string(),
          action17_in1: z.number(),
          action17_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action17_out0: z.string(),
          action17_out1: z.number(),
        }),
      },
    },
    action18: {
      input: {
        schema: z.object({
          action18_in0: z.string(),
          action18_in1: z.number(),
          action18_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action18_out0: z.string(),
          action18_out1: z.number(),
        }),
      },
    },
    action19: {
      input: {
        schema: z.object({
          action19_in0: z.string(),
          action19_in1: z.number(),
          action19_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action19_out0: z.string(),
          action19_out1: z.number(),
        }),
      },
    },
    action20: {
      input: {
        schema: z.object({
          action20_in0: z.string(),
          action20_in1: z.number(),
          action20_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action20_out0: z.string(),
          action20_out1: z.number(),
        }),
      },
    },
    action21: {
      input: {
        schema: z.object({
          action21_in0: z.string(),
          action21_in1: z.number(),
          action21_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action21_out0: z.string(),
          action21_out1: z.number(),
        }),
      },
    },
    action22: {
      input: {
        schema: z.object({
          action22_in0: z.string(),
          action22_in1: z.number(),
          action22_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action22_out0: z.string(),
          action22_out1: z.number(),
        }),
      },
    },
    action23: {
      input: {
        schema: z.object({
          action23_in0: z.string(),
          action23_in1: z.number(),
          action23_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action23_out0: z.string(),
          action23_out1: z.number(),
        }),
      },
    },
    action24: {
      input: {
        schema: z.object({
          action24_in0: z.string(),
          action24_in1: z.number(),
          action24_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action24_out0: z.string(),
          action24_out1: z.number(),
        }),
      },
    },
    action25: {
      input: {
        schema: z.object({
          action25_in0: z.string(),
          action25_in1: z.number(),
          action25_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action25_out0: z.string(),
          action25_out1: z.number(),
        }),
      },
    },
    action26: {
      input: {
        schema: z.object({
          action26_in0: z.string(),
          action26_in1: z.number(),
          action26_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action26_out0: z.string(),
          action26_out1: z.number(),
        }),
      },
    },
    action27: {
      input: {
        schema: z.object({
          action27_in0: z.string(),
          action27_in1: z.number(),
          action27_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action27_out0: z.string(),
          action27_out1: z.number(),
        }),
      },
    },
    action28: {
      input: {
        schema: z.object({
          action28_in0: z.string(),
          action28_in1: z.number(),
          action28_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action28_out0: z.string(),
          action28_out1: z.number(),
        }),
      },
    },
    action29: {
      input: {
        schema: z.object({
          action29_in0: z.string(),
          action29_in1: z.number(),
          action29_in2: z.boolean().optional(),
        }),
      },
      output: {
        schema: z.object({
          action29_out0: z.string(),
          action29_out1: z.number(),
        }),
      },
    },
  },
  events: {
    event0: {
      schema: z.object({
        event0_k0: z.string(),
        event0_k1: z.number(),
      }),
    },
    event1: {
      schema: z.object({
        event1_k0: z.string(),
        event1_k1: z.number(),
      }),
    },
    event2: {
      schema: z.object({
        event2_k0: z.string(),
        event2_k1: z.number(),
      }),
    },
    event3: {
      schema: z.object({
        event3_k0: z.string(),
        event3_k1: z.number(),
      }),
    },
    event4: {
      schema: z.object({
        event4_k0: z.string(),
        event4_k1: z.number(),
      }),
    },
    event5: {
      schema: z.object({
        event5_k0: z.string(),
        event5_k1: z.number(),
      }),
    },
    event6: {
      schema: z.object({
        event6_k0: z.string(),
        event6_k1: z.number(),
      }),
    },
    event7: {
      schema: z.object({
        event7_k0: z.string(),
        event7_k1: z.number(),
      }),
    },
    event8: {
      schema: z.object({
        event8_k0: z.string(),
        event8_k1: z.number(),
      }),
    },
    event9: {
      schema: z.object({
        event9_k0: z.string(),
        event9_k1: z.number(),
      }),
    },
    event10: {
      schema: z.object({
        event10_k0: z.string(),
        event10_k1: z.number(),
      }),
    },
    event11: {
      schema: z.object({
        event11_k0: z.string(),
        event11_k1: z.number(),
      }),
    },
    event12: {
      schema: z.object({
        event12_k0: z.string(),
        event12_k1: z.number(),
      }),
    },
    event13: {
      schema: z.object({
        event13_k0: z.string(),
        event13_k1: z.number(),
      }),
    },
    event14: {
      schema: z.object({
        event14_k0: z.string(),
        event14_k1: z.number(),
      }),
    },
  },
  channels: {
    channel0: {
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
      },
    },
    channel1: {
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
      },
    },
    channel2: {
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
      },
    },
    channel3: {
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
      },
    },
    channel4: {
      messages: {
        text: { schema: z.object({ text: z.string() }) },
        image: { schema: z.object({ imageUrl: z.string() }) },
      },
    },
  },
})
`,
} satisfies types.BenchmarkCase
