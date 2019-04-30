# Conversation Scenarios

## Overview

Scenarios can be related to automated testing in programming languages. In fact the purpose of scenarios can is that it can be both used as a testing and conversation design tool. Note that this proposal includes some features that are not existing in the emulator that will be discussed in another (quite big) proposal. Anything else that is proposed here can be done without those changes.
As this feature will probably be experimental for a while, I suggest we ship this as a module at first and bring it to the core when stable. I also suggest we do this for most of features we bring that are experimental this will ensure we don't bring stuff in the LTS version for nothing (a bit like programming languages do)

## Goals

- Make it natural to record and replay a scenario within the interface
- Make it simple enough so that a user could define a scenario without even having a botpress instance running
- Bring this feature with the least amount of code

## Backend

### Storage

Scenarios Definitions and results are stored as simple json files under the bot data directory (data/bots/{botId}/scenarios). I'd start with the following structure to keep it simple.

```ts
{
  name?: string, //for readability purposes
  id: string, //nanoId
  initialState : any,
  interactions: [
    {
      userMessage: string,
      responses: [
        {
          type: string,
          payload: any // raw message payload before being rendered (we want scenarios to be channel agnostic)
        },
        {...}
      ]
    }
  ],
  finalState?: any
}
```

ScenarioResult is another json file that a timestamp as name an that contains an array of results (passed or failed for each scenario).

- The **initialState** property makes it easy to mock the state so scenarios can be parts of the conversations, making scenarios run a little faster than having to fo through the whole coinversation.

- **interactions** are simply a group of message inputs along with expected responses that will be asserted

- **finalState** is an expected state after running a scenario. If this is defined, it'll be asserted

We might want to add a starting point (flow + node) ?

### Running a scenario

Here is some pseudo code, this obviously need to be changed along the implementation

```
runScenario(id):boolean => {

  passed = true

  scenario = getScenario(id)
  userId = createNewUser()
  threadId = createNewThread(userId)

  setState(scenario.initialState)

  for interaction in scenario.interactions:
    bp.sendEvent({
      type:'text',
      channel:"scenario"
      payload: interaction.message
    })
    <!-- Find a way to assert all responses>-->
    <!-- using converse : not fully featured -->
    <!-- using hooks : hard to get & display assertion results + breaks the control flow -->
    passed = assertResponses()
    if !passed
      break

  if passed && scenario.finalState:
    endState = getState(threadId)
    <!-- Find a way to get & assert the finalState>-->
    passed = checkDeepEqual(scenario.finalState, endState)

  return passed
}
```

### Create scenario

Although scenarios are simple enough to be created by hand, writing json files, it would be handy to have a UI for this. I suggest a simple record sceranio button that will essentially pop a modal with a basic state editor (simple text area) ??? should we add flow and node dropdown for staring point ???. When this steps done, it pops the chat emulator with a new session with the mocked state. The user will simply chat with bot and each messages will be added to the scenario with an api call to the scenario module in a `after_event_processed` hook.

When the user hits the stop recording button, the state is saved in the scenario. The original users state needs to be reset to what it was.

## UI

We need to keep this UI as simple and dumb as possible as it will be changed a lot and might move into core.

## Challenges

- Response assertion can become tricky when it comes to randomly selected answers (i.e QNA), we might need to introduce the notion of seeds for random across the app
