import * as types from '../types.js'

export default {
  name: 'bot-handlers-scale-30',
  instantiationThreshold: 26000,
  sourceCode: `
// Found while investigating whether fixtures.ts's DefaultBot shapes were a good bench
// target (they're not — see fixture-style-bot). EnumerateActions/EnumerateEvents/
// EnumerateStates (bot/common/types.ts) aren't exported by name, but their cost is baked
// into InjectedBotHandlers/BotHandlers, which ARE public and are what BotImplementation
// ("Bot") and PluginImplementation both implement. So any real bot/plugin author touching
// action/event/message handlers pays this cost through the public API. Measured growth is
// roughly linear in the number of integrations/actions/events/states (not combinatorial),
// but the per-item cost is far higher than plain DefaultBot construction (~750/integration
// here vs ~0 for fixture-style-bot), so it's worth guarding on its own.
import { DefaultBot, InjectedBotHandlers } from "@botpress/sdk"

type BigBot = DefaultBot<{
  integrations: {
      integration0: {
        name: "integration0"
        actions: { act0: { input: { in0: string }; output: { out0: string } } }
        events: { event0: { k0: string } }
        channels: { channel0: { messages: { text: { text: string } } } }
      }
      integration1: {
        name: "integration1"
        actions: { act1: { input: { in1: string }; output: { out1: string } } }
        events: { event1: { k1: string } }
        channels: { channel1: { messages: { text: { text: string } } } }
      }
      integration2: {
        name: "integration2"
        actions: { act2: { input: { in2: string }; output: { out2: string } } }
        events: { event2: { k2: string } }
        channels: { channel2: { messages: { text: { text: string } } } }
      }
      integration3: {
        name: "integration3"
        actions: { act3: { input: { in3: string }; output: { out3: string } } }
        events: { event3: { k3: string } }
        channels: { channel3: { messages: { text: { text: string } } } }
      }
      integration4: {
        name: "integration4"
        actions: { act4: { input: { in4: string }; output: { out4: string } } }
        events: { event4: { k4: string } }
        channels: { channel4: { messages: { text: { text: string } } } }
      }
      integration5: {
        name: "integration5"
        actions: { act5: { input: { in5: string }; output: { out5: string } } }
        events: { event5: { k5: string } }
        channels: { channel5: { messages: { text: { text: string } } } }
      }
      integration6: {
        name: "integration6"
        actions: { act6: { input: { in6: string }; output: { out6: string } } }
        events: { event6: { k6: string } }
        channels: { channel6: { messages: { text: { text: string } } } }
      }
      integration7: {
        name: "integration7"
        actions: { act7: { input: { in7: string }; output: { out7: string } } }
        events: { event7: { k7: string } }
        channels: { channel7: { messages: { text: { text: string } } } }
      }
      integration8: {
        name: "integration8"
        actions: { act8: { input: { in8: string }; output: { out8: string } } }
        events: { event8: { k8: string } }
        channels: { channel8: { messages: { text: { text: string } } } }
      }
      integration9: {
        name: "integration9"
        actions: { act9: { input: { in9: string }; output: { out9: string } } }
        events: { event9: { k9: string } }
        channels: { channel9: { messages: { text: { text: string } } } }
      }
      integration10: {
        name: "integration10"
        actions: { act10: { input: { in10: string }; output: { out10: string } } }
        events: { event10: { k10: string } }
        channels: { channel10: { messages: { text: { text: string } } } }
      }
      integration11: {
        name: "integration11"
        actions: { act11: { input: { in11: string }; output: { out11: string } } }
        events: { event11: { k11: string } }
        channels: { channel11: { messages: { text: { text: string } } } }
      }
      integration12: {
        name: "integration12"
        actions: { act12: { input: { in12: string }; output: { out12: string } } }
        events: { event12: { k12: string } }
        channels: { channel12: { messages: { text: { text: string } } } }
      }
      integration13: {
        name: "integration13"
        actions: { act13: { input: { in13: string }; output: { out13: string } } }
        events: { event13: { k13: string } }
        channels: { channel13: { messages: { text: { text: string } } } }
      }
      integration14: {
        name: "integration14"
        actions: { act14: { input: { in14: string }; output: { out14: string } } }
        events: { event14: { k14: string } }
        channels: { channel14: { messages: { text: { text: string } } } }
      }
      integration15: {
        name: "integration15"
        actions: { act15: { input: { in15: string }; output: { out15: string } } }
        events: { event15: { k15: string } }
        channels: { channel15: { messages: { text: { text: string } } } }
      }
      integration16: {
        name: "integration16"
        actions: { act16: { input: { in16: string }; output: { out16: string } } }
        events: { event16: { k16: string } }
        channels: { channel16: { messages: { text: { text: string } } } }
      }
      integration17: {
        name: "integration17"
        actions: { act17: { input: { in17: string }; output: { out17: string } } }
        events: { event17: { k17: string } }
        channels: { channel17: { messages: { text: { text: string } } } }
      }
      integration18: {
        name: "integration18"
        actions: { act18: { input: { in18: string }; output: { out18: string } } }
        events: { event18: { k18: string } }
        channels: { channel18: { messages: { text: { text: string } } } }
      }
      integration19: {
        name: "integration19"
        actions: { act19: { input: { in19: string }; output: { out19: string } } }
        events: { event19: { k19: string } }
        channels: { channel19: { messages: { text: { text: string } } } }
      }
      integration20: {
        name: "integration20"
        actions: { act20: { input: { in20: string }; output: { out20: string } } }
        events: { event20: { k20: string } }
        channels: { channel20: { messages: { text: { text: string } } } }
      }
      integration21: {
        name: "integration21"
        actions: { act21: { input: { in21: string }; output: { out21: string } } }
        events: { event21: { k21: string } }
        channels: { channel21: { messages: { text: { text: string } } } }
      }
      integration22: {
        name: "integration22"
        actions: { act22: { input: { in22: string }; output: { out22: string } } }
        events: { event22: { k22: string } }
        channels: { channel22: { messages: { text: { text: string } } } }
      }
      integration23: {
        name: "integration23"
        actions: { act23: { input: { in23: string }; output: { out23: string } } }
        events: { event23: { k23: string } }
        channels: { channel23: { messages: { text: { text: string } } } }
      }
      integration24: {
        name: "integration24"
        actions: { act24: { input: { in24: string }; output: { out24: string } } }
        events: { event24: { k24: string } }
        channels: { channel24: { messages: { text: { text: string } } } }
      }
      integration25: {
        name: "integration25"
        actions: { act25: { input: { in25: string }; output: { out25: string } } }
        events: { event25: { k25: string } }
        channels: { channel25: { messages: { text: { text: string } } } }
      }
      integration26: {
        name: "integration26"
        actions: { act26: { input: { in26: string }; output: { out26: string } } }
        events: { event26: { k26: string } }
        channels: { channel26: { messages: { text: { text: string } } } }
      }
      integration27: {
        name: "integration27"
        actions: { act27: { input: { in27: string }; output: { out27: string } } }
        events: { event27: { k27: string } }
        channels: { channel27: { messages: { text: { text: string } } } }
      }
      integration28: {
        name: "integration28"
        actions: { act28: { input: { in28: string }; output: { out28: string } } }
        events: { event28: { k28: string } }
        channels: { channel28: { messages: { text: { text: string } } } }
      }
      integration29: {
        name: "integration29"
        actions: { act29: { input: { in29: string }; output: { out29: string } } }
        events: { event29: { k29: string } }
        channels: { channel29: { messages: { text: { text: string } } } }
      }
  }
  actions: {
      act0: { input: { in0: string }; output: { out0: string } }
      act1: { input: { in1: string }; output: { out1: string } }
      act2: { input: { in2: string }; output: { out2: string } }
      act3: { input: { in3: string }; output: { out3: string } }
      act4: { input: { in4: string }; output: { out4: string } }
      act5: { input: { in5: string }; output: { out5: string } }
      act6: { input: { in6: string }; output: { out6: string } }
      act7: { input: { in7: string }; output: { out7: string } }
      act8: { input: { in8: string }; output: { out8: string } }
      act9: { input: { in9: string }; output: { out9: string } }
      act10: { input: { in10: string }; output: { out10: string } }
      act11: { input: { in11: string }; output: { out11: string } }
      act12: { input: { in12: string }; output: { out12: string } }
      act13: { input: { in13: string }; output: { out13: string } }
      act14: { input: { in14: string }; output: { out14: string } }
      act15: { input: { in15: string }; output: { out15: string } }
      act16: { input: { in16: string }; output: { out16: string } }
      act17: { input: { in17: string }; output: { out17: string } }
      act18: { input: { in18: string }; output: { out18: string } }
      act19: { input: { in19: string }; output: { out19: string } }
      act20: { input: { in20: string }; output: { out20: string } }
      act21: { input: { in21: string }; output: { out21: string } }
      act22: { input: { in22: string }; output: { out22: string } }
      act23: { input: { in23: string }; output: { out23: string } }
      act24: { input: { in24: string }; output: { out24: string } }
      act25: { input: { in25: string }; output: { out25: string } }
      act26: { input: { in26: string }; output: { out26: string } }
      act27: { input: { in27: string }; output: { out27: string } }
      act28: { input: { in28: string }; output: { out28: string } }
      act29: { input: { in29: string }; output: { out29: string } }
  }
  events: {
      event0: { k0: string }
      event1: { k1: string }
      event2: { k2: string }
      event3: { k3: string }
      event4: { k4: string }
      event5: { k5: string }
      event6: { k6: string }
      event7: { k7: string }
      event8: { k8: string }
      event9: { k9: string }
      event10: { k10: string }
      event11: { k11: string }
      event12: { k12: string }
      event13: { k13: string }
      event14: { k14: string }
      event15: { k15: string }
      event16: { k16: string }
      event17: { k17: string }
      event18: { k18: string }
      event19: { k19: string }
      event20: { k20: string }
      event21: { k21: string }
      event22: { k22: string }
      event23: { k23: string }
      event24: { k24: string }
      event25: { k25: string }
      event26: { k26: string }
      event27: { k27: string }
      event28: { k28: string }
      event29: { k29: string }
  }
  states: {
      state0: { type: "conversation"; payload: { value0: string } }
      state1: { type: "conversation"; payload: { value1: string } }
      state2: { type: "conversation"; payload: { value2: string } }
      state3: { type: "conversation"; payload: { value3: string } }
      state4: { type: "conversation"; payload: { value4: string } }
      state5: { type: "conversation"; payload: { value5: string } }
      state6: { type: "conversation"; payload: { value6: string } }
      state7: { type: "conversation"; payload: { value7: string } }
      state8: { type: "conversation"; payload: { value8: string } }
      state9: { type: "conversation"; payload: { value9: string } }
      state10: { type: "conversation"; payload: { value10: string } }
      state11: { type: "conversation"; payload: { value11: string } }
      state12: { type: "conversation"; payload: { value12: string } }
      state13: { type: "conversation"; payload: { value13: string } }
      state14: { type: "conversation"; payload: { value14: string } }
      state15: { type: "conversation"; payload: { value15: string } }
      state16: { type: "conversation"; payload: { value16: string } }
      state17: { type: "conversation"; payload: { value17: string } }
      state18: { type: "conversation"; payload: { value18: string } }
      state19: { type: "conversation"; payload: { value19: string } }
      state20: { type: "conversation"; payload: { value20: string } }
      state21: { type: "conversation"; payload: { value21: string } }
      state22: { type: "conversation"; payload: { value22: string } }
      state23: { type: "conversation"; payload: { value23: string } }
      state24: { type: "conversation"; payload: { value24: string } }
      state25: { type: "conversation"; payload: { value25: string } }
      state26: { type: "conversation"; payload: { value26: string } }
      state27: { type: "conversation"; payload: { value27: string } }
      state28: { type: "conversation"; payload: { value28: string } }
      state29: { type: "conversation"; payload: { value29: string } }
  }
  workflows: {
      workflow0: { input: { in0: string }; output: { out0: string } }
      workflow1: { input: { in1: string }; output: { out1: string } }
      workflow2: { input: { in2: string }; output: { out2: string } }
      workflow3: { input: { in3: string }; output: { out3: string } }
      workflow4: { input: { in4: string }; output: { out4: string } }
  }
}>

declare const handlers: InjectedBotHandlers<BigBot>
const { actionHandlers, messageHandlers, eventHandlers, stateExpiredHandlers, hookHandlers, workflowHandlers } =
  handlers
export { actionHandlers, messageHandlers, eventHandlers, stateExpiredHandlers, hookHandlers, workflowHandlers }
`,
} satisfies types.BenchmarkCase
