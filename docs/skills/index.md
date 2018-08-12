---
layout: guide
---
# Skills

After building a couple of flows/bots, you’ll quickly notice that there are some common patterns that you find yourself implementing over and over. This is where skills come to the rescue.

Skills are higher-level abstractions on top of flows. In fact, skills are dynamic flow generators.

They can be seen as reusable components between multiple flows or even multiple bots.

# Installing 

Skill can be installed from the npm registry. They have the naming convention of `@botpress/skill-`

```js
// using npm
npm i @botpress/skill-<skill-name>
// using yarn 
yarn add @botpress/skill-<skill-name>
```

Once installed, restart your bot and the skill will be automatically detected and loaded by your bot.

# Using a skill

Skills are added to the flow of your bot using the Botpress Flows GUI.

You will find a dropdown list in the toolbar to `Insert Skill` 

![Image showing the Skills Menu][skills_Menu]

[skills_Menu]: {{site.baseurl}}/images/skills/choice/skills_Menu.png