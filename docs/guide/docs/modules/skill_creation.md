---
id: skill_creation
title: Skill creation
---

There are a couple of steps required to create a new skill. Basically, a skill consist of a GUI to input values and a flow generator to create the interactions.

## Creating the GUI

The first step is to create the GUI that will be displayed to the user. Create a `.jsx` file with the name

```jsx
import React from 'react'

export default class TemplateModule extends React.Component {
  render() {
    return null
  }
}
```

## Preparing the GUI bundle

Once your `.jsx` file is ready, we need to tell Botpress what bundle it should create, and how to serve it.

Open the file `package.json` of your module, and add this snippet of code. Change the variables with the values from your particular case. You can add any number of skills.

```js
"botpress": {
    "liteViews": {
      "$ID_OF_SKILL": "./src/views/$ID_OF_SKILL.jsx",
      "$ID_OF_SKILL2": "./src/views/$ID_OF_SKILL2.jsx"
    }
  },
```

This tells the `module-builder` to create a bundle with your interface. The bundles will be available at `/assets/modules/$YOUR_MODULE/web/$ID_OF_SKILL.bundle.js`

## Creating the flow generator

The flow generator will create all the transitions and conditions based on the data that was feeded by the GUI. That method will be called by the Studio when the user has finished inputting all his data. Your method will receive a `data` object. and must return a partial flow.

Example:

```js
const generateFlow = (data): sdk.FlowGenerationResult => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [],
      next: [{ condition: 'true', node: '...' }]
    }
  ]

  return {
    transitions: createTransitions(data),
    flow: {
      nodes: nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = data => {
  const transitions: sdk.NodeTransition[] = []
  return transitions
}

export default { generateFlow }
```

## Connecting all those

All the required parts are done, the only thing left is to register the skills. Provide an array of your skills in the same variable in the module entry point.

Example:

```js
const skillsToRegister: sdk.Skill[] = [
  {
    id: '$ID_OF_SKILL',
    name: '$DISPLAYED_NAME',
    flowGenerator: generateFlow
  }
]
```

```js
const entryPoint: sdk.ModuleEntryPoint = {
  ...,
  skills: skillsToRegister
}
```
