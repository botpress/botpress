---
id: version-11.0.0-skills
title: Skills
original_id: skills
---

# 📚 Skills

After building a couple of flows/bots, you'll quickly notice that there are some **common patterns** that you find yourself implementing over and over. Skills come to the rescue.

Skills are higher-level abstractions on top of flows. In fact, skills are dynamic flow generators.

They can be seen as reusable components between multiple flows or even multiple bots.

## Installing skills

Every skills must be exposed by a module. Modules can host any number of skills. All you need to do is install the required module and you will have access to its skills.

## Using skills

Skills are meant to be used by the Botpress Flows GUI. After installing a skill module, navigate to a flow in the Graphical Flows Editor, then locate the "Insert Skill" dropdown in the top toolbar:

![Using the skills from the GUI](assets/skillsMenu.jpg)

After filling in the form, you'll be able to click anywhere in the flow to insert the skill to be consumed by the other nodes.

## Persistence

Skills are stored as flows under the `data/bots/your-bot/flows/skills` folder.

You can also visualize the generated skills from the GUI:

![Generated skills from GUI](assets/skillsPanel.jpg)

## Editing skills

Once a skill node has been generated, you may click on that node and click "Edit" on the left panel to edit that node, which will update the generated flow automatically behind the scenes.

![Editing a skill from GUI](assets/skillsEdit.jpg)

## Creating a new skill

To create a skill, you must first create a module. Please check the [advanced section](../modules/skill_creation) for all the details.
