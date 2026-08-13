import * as types from '../types.js'

export default {
  name: 'extend-chain-10',
  instantiationThreshold: 36000,
  sourceCode: `
import { z, IntegrationDefinition, InterfacePackage } from "@botpress/sdk"

const interface0: InterfacePackage = {
  name: "interface0",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface0",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label0: z.string() }) },
    },
    actions: {
      doThing0: {
        input: { schema: z.object({ input0: z.string() }) },
        output: { schema: z.object({ output0: z.string() }) },
      },
    },
    events: {
      thingHappened0: { schema: z.object({ event0: z.string() }) },
    },
  },
}

const interface1: InterfacePackage = {
  name: "interface1",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface1",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label1: z.string() }) },
    },
    actions: {
      doThing1: {
        input: { schema: z.object({ input1: z.string() }) },
        output: { schema: z.object({ output1: z.string() }) },
      },
    },
    events: {
      thingHappened1: { schema: z.object({ event1: z.string() }) },
    },
  },
}

const interface2: InterfacePackage = {
  name: "interface2",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface2",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label2: z.string() }) },
    },
    actions: {
      doThing2: {
        input: { schema: z.object({ input2: z.string() }) },
        output: { schema: z.object({ output2: z.string() }) },
      },
    },
    events: {
      thingHappened2: { schema: z.object({ event2: z.string() }) },
    },
  },
}

const interface3: InterfacePackage = {
  name: "interface3",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface3",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label3: z.string() }) },
    },
    actions: {
      doThing3: {
        input: { schema: z.object({ input3: z.string() }) },
        output: { schema: z.object({ output3: z.string() }) },
      },
    },
    events: {
      thingHappened3: { schema: z.object({ event3: z.string() }) },
    },
  },
}

const interface4: InterfacePackage = {
  name: "interface4",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface4",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label4: z.string() }) },
    },
    actions: {
      doThing4: {
        input: { schema: z.object({ input4: z.string() }) },
        output: { schema: z.object({ output4: z.string() }) },
      },
    },
    events: {
      thingHappened4: { schema: z.object({ event4: z.string() }) },
    },
  },
}

const interface5: InterfacePackage = {
  name: "interface5",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface5",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label5: z.string() }) },
    },
    actions: {
      doThing5: {
        input: { schema: z.object({ input5: z.string() }) },
        output: { schema: z.object({ output5: z.string() }) },
      },
    },
    events: {
      thingHappened5: { schema: z.object({ event5: z.string() }) },
    },
  },
}

const interface6: InterfacePackage = {
  name: "interface6",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface6",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label6: z.string() }) },
    },
    actions: {
      doThing6: {
        input: { schema: z.object({ input6: z.string() }) },
        output: { schema: z.object({ output6: z.string() }) },
      },
    },
    events: {
      thingHappened6: { schema: z.object({ event6: z.string() }) },
    },
  },
}

const interface7: InterfacePackage = {
  name: "interface7",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface7",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label7: z.string() }) },
    },
    actions: {
      doThing7: {
        input: { schema: z.object({ input7: z.string() }) },
        output: { schema: z.object({ output7: z.string() }) },
      },
    },
    events: {
      thingHappened7: { schema: z.object({ event7: z.string() }) },
    },
  },
}

const interface8: InterfacePackage = {
  name: "interface8",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface8",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label8: z.string() }) },
    },
    actions: {
      doThing8: {
        input: { schema: z.object({ input8: z.string() }) },
        output: { schema: z.object({ output8: z.string() }) },
      },
    },
    events: {
      thingHappened8: { schema: z.object({ event8: z.string() }) },
    },
  },
}

const interface9: InterfacePackage = {
  name: "interface9",
  version: "0.0.1",
  type: "interface",
  definition: {
    name: "interface9",
    version: "0.0.1",
    entities: {
      thing: { schema: z.object({ id: z.string(), label9: z.string() }) },
    },
    actions: {
      doThing9: {
        input: { schema: z.object({ input9: z.string() }) },
        output: { schema: z.object({ output9: z.string() }) },
      },
    },
    events: {
      thingHappened9: { schema: z.object({ event9: z.string() }) },
    },
  },
}

export default new IntegrationDefinition({
  name: "extend-chain",
  version: "0.0.1",
  entities: {
    entity0: { schema: z.object({ id: z.string(), label0: z.string() }) },
    entity1: { schema: z.object({ id: z.string(), label1: z.string() }) },
    entity2: { schema: z.object({ id: z.string(), label2: z.string() }) },
    entity3: { schema: z.object({ id: z.string(), label3: z.string() }) },
    entity4: { schema: z.object({ id: z.string(), label4: z.string() }) },
    entity5: { schema: z.object({ id: z.string(), label5: z.string() }) },
    entity6: { schema: z.object({ id: z.string(), label6: z.string() }) },
    entity7: { schema: z.object({ id: z.string(), label7: z.string() }) },
    entity8: { schema: z.object({ id: z.string(), label8: z.string() }) },
    entity9: { schema: z.object({ id: z.string(), label9: z.string() }) },
  },
})
  .extend(interface0, ({ entities }) => ({ entities: { thing: entities.entity0 } }))
  .extend(interface1, ({ entities }) => ({ entities: { thing: entities.entity1 } }))
  .extend(interface2, ({ entities }) => ({ entities: { thing: entities.entity2 } }))
  .extend(interface3, ({ entities }) => ({ entities: { thing: entities.entity3 } }))
  .extend(interface4, ({ entities }) => ({ entities: { thing: entities.entity4 } }))
  .extend(interface5, ({ entities }) => ({ entities: { thing: entities.entity5 } }))
  .extend(interface6, ({ entities }) => ({ entities: { thing: entities.entity6 } }))
  .extend(interface7, ({ entities }) => ({ entities: { thing: entities.entity7 } }))
  .extend(interface8, ({ entities }) => ({ entities: { thing: entities.entity8 } }))
  .extend(interface9, ({ entities }) => ({ entities: { thing: entities.entity9 } }))
`,
} satisfies types.BenchmarkCase
