---
layout: guide
---

For your bot you may need to use external APIs to fetch/post some data.
General approach for it is that you should use async actions to perform API-calls and save data to the state-variables.

Let's check it on a simple example. Let's say we want to build a simpple bot that accepts repo url and returns number of stars it has. An action could look something like this:

```js
repoStarsByInput: async (state, event) => {
  const endPoint = 'https://api.github.com/repos'
  try {
    const { data: { stargazers_count } } = await axios.get(`${endPoint}/${event.text}`)
    await event.reply('#builtin_text', { text: `This repo has ${stargazers_count} ★` })
  } catch (e) {
    await event.reply('#builtin_text', { text: `Failed to fetch data for this repo` })
  }
}
```

Note that in this example we are using `builtin_text` renderer which has to beregistere properly.
