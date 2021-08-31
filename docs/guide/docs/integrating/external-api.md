---
id: external-api
title: Calling an API in an Action
---

## Overview

A popular use-case for [Actions](../main/code#actions) is to call an API, get some data and use it in your flow. That's what we're going to demonstrate here.

In this tutorial, we're going to fetch the list of Botpress repositories on Github and display the description of the first one. We will show you how to call an API, save the response and use the answer in a content element through templating.

### The Action

We will use `axios` as an HTTP client because it's already a Botpress dependency. See our [Custom Code](../main/code) section to learn more about how dependencies work in Actions.

Start by creating a new javascript file in `/data/global/actions/callApi.js`. Then copy the following code:

```javascript
const axios = require('axios')

/**
 * @title Call the Github API to fetch Botpress repositories
 * @category Turorial
 * @author Botpress, Inc.
 **/
const callApi = async () => {
  // We call the Github API
  const { data } = await axios.get('https://api.github.com/orgs/botpress/repos')

  // We assign the response to the session variable so we can use it later
  session.response = data
}

// Actions are async, so make sure to return a promise
return callApi()
```

> 📖 What is the `session` variable? Learn how to use [Memory](../main/memory) to store data.


### Using the Action

Add an `onEnter` action instruction in your node and select the `callApi` action from the list:

![Action](../assets/tutorial-call-api-action.png)

> 📖 What are `onEnter` instructions? Understand how the node [Lifecycle](../main/dialog#nodes) works.

### Add a text content element

Create another `onEnter` instruction to make your bot say something. Once the first instruction executes, the response is stored in the session variable.

Here we use templating to get the description of the first repository from the list:

![Content](../assets/tutorial-call-api-element.png)

> 📖 What is templating? Take a look at the [Mustache demo](https://mustache.github.io#demo) to understand how templating works in Botpress.

Once everything completes, this is what your node should look like:

![Node Properties](../assets/tutorial-call-api-node-properties.png)

## Try it out!

The next time you chat with the bot, it will reply with the description of the Botpress repository:

![Chat](../assets/tutorial-call-api-chat.png)
