---
id: skills
title: !!Skills
---

# 📚 Skills

After building a couple of flows/bots, you'll quickly notice that there are some **common patterns** that you find yourself implementing over and over. Skills come to the rescue.

Skills are higher-level abstractions on top of flows. In fact, skills are dynamic flow generators.

They can be seen as reusable components between multiple flows or even multiple bots.

## Installing skills

Skills are implemented under a special kind of Botpress module whose name starts with `skill-`. Many skills are open-source and available for you to install.

### Installing the `choice` skill <a class="toc" id="installing-the-choice-skill" href="#installing-the-choice-skill"></a>

To install a new skill, download the module package and add it to your bot. [Click here for instructions on how to download & install modules](../modules/install)

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

---

# 🔨 Presenting a menu

What we will now do is add a menu to the bot so that users can decide whether they want to play or see the leaderboard. To do that, we will use the **choice** skill that we saw above. So if you haven't already done it, go ahead and [install the `choice` skill](#installing-the-choice-skill).

Once that's done, we will consume this skill to create a new choice menu. On your main flow, click the "Insert Skill" dropdown menu and click on "Choice."

In the "Question" field, type in something like "_Welcome to my Trivia bot, what would you like to do?_". In the "Choices" field, type the two choices your users will have: "Play" and "See leaderboard".

The next step is to provide some additional keywords for detecting the two options. Click the "Edit keywords" button and type some alternatives for both choices.

> **🔬 Notice:** In the "Advanced" panel of the Choice skill, you have the choice to change the **Content Renderer** that will be used by the skill to display the options. Leave it to "#choice" for now.

Click "Insert" when that's done and click somewhere on the diagram to insert the skill.

![Creating the Menu choice](assets/choice.jpg)

## The `#choice` renderer

We need to actually tell our bot what a "choice" looks like. Let's make it display some fancy buttons, which is very similar to a Trivia Question message.

```js
// inside renderers.js
choice: data => ({
  text: data.text,
  quick_replies: data.choices.map(choice => `<${choice.payload}> ${choice.text}`),
  typing: data.typing || '2s'
})
```

## Start node

OK, now you can link the "_User picked 'Play'_" option to the starting node of the flow. This should give you something like this:

![Wiring the 'play' choice](assets/choicePlay.jpg)

What we actually want now is to change the starting node to be that "choice" node we just created. To do that, click on that choice node and then click the Star button in the top toolbar. This will make it the **Start Node**, which means a new flow will start from this node from now on.

![Making the Menu the start node](assets/choiceStar.jpg)

## Refactoring: Sub-flows

We need to make the "See leaderboard" choice show the leaderboard. Although we know _how_ to show the leaderboard (by calling the `render` action), we don't like to duplicate the same logic again and again.

A quick solution would be to create an intermediary node that shows the leaderboard, then re-wire the last two nodes of the flow to this node:

![Refactoring into a node](assets/refactoringNode.jpg)

A better, longer-term solution would be to extract the leaderboard feature as a separate subflow, and then instead of pointing to the leaderboard node, you point to the leaderboard subflow.

### Creating a new flow

To create a new flow, click the folder icon in the top bar. Name it `leaderboard`.

![Refactoring into a separate flow](assets/refactoringFlow.jpg)

The flow is extremely simple, it contains a single instruction: the call to `renderLeaderboard`. This action doesn't exist so let's create it in `actions.js`. You may also get rid of the `render` action as we won't need it anymore:

```diff
+ renderLeaderboard: async (state, event) => {
+   let board = (await event.bp.kvs.get('leaderboard')) || []
+   await event.reply('#leaderboard', { leaderboard: board })
+ },

- render: async (state, event, args) => {
-   if (!args.renderer) {
-     throw new Error('Missing "renderer"')
-   }
-
-   await event.reply(args.renderer, args)
- },
```

Don't forget to "Save" the flows by clicking the save icon at the top.

### Refactoring the transitions

You can now update the three transitions where you show the leaderboard to the following transition:

![Refactoring the transitions](assets/refactoringTransition.jpg)

### Final Result

Here's what your final flow should look like. No more lengthy wires!

![Final result of the refactoring](assets/refactoringResult.jpg)
