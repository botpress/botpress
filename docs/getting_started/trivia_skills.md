---
layout: guide
---

# 📚 Skills

After building a couple of flows/bots, you'll quickly notice that there are some **common patterns** that you find yourself implementing over and over. Skills come to the rescue.

Skills are a higher-level abstractions on top of flows. In fact, skills are dynamic flow generators.

They can be seen as reusable components between multiple flows or even multiple bots.

## Installing skills

Skills are implemented under a special kind of Botpress module whose name starts with `botpress-skills-`. Many skills are open-source and available for you to install.

### Installing the `choice` skill

Installing a skill is as simple as installing a regular npm package. Once installed, retsrat your bot and the skill will be automatically detected and loaded by your bot.

```bash
# using npm
npm install --save botpress-skill-choice

# using yarn
yarn add botpress-skill-choice
```

## Using skills

Skills are meant to be used by the Botpress Flows GUI. After installing a skill module, navigate to a flow in the Graphical Flows Editor, then locate the "Insert Skill" dropdown in the top toolbar:

![Using the skills from the GUI][skillsMenu]

After filling the form, you'll be able to click anywhere in the flow to insert the skill to be consumed by the other nodes.

## Persistence

Skills are stored as flows under the `src/flows/skills` folder.

You can also visualize the generated skills from the GUI:

![Generated skills from GUI][skillsPanel]

## Editing skills

Once a skill node has been generated, you may click on that node and click "Edit" on the left panel to edit that node, which will behind the scene update the generated flow automatically.

![Editing a skill from GUI][skillsEdit]

---



### Presenting a menu

[skillsMenu]: {{site.basedir}}/images/skillsMenu.jpg
[skillsPanel]: {{site.basedir}}/images/skillsPanel.jpg
[skillsEdit]: {{site.basedir}}/images/skillsEdit.jpg
