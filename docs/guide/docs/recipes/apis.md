---
id: apis
title: Using external APIs
---

For your bot, you may need to use external APIs to fetch/post some data.
The general approach to this is that you use an async action to perform the API call and save the response data to a state variable.

Below is an example action that returns the number of stars for the provided GitHub repository.
[Axios](https://www.npmjs.com/package/axios) is used to get the requested endpoint and as it is promise based we can `await` the response.

```js
repoStarsByInput: async (state, event) => {
  const endPoint = 'https://api.github.com/repos'
  try {
    const {
      data: { stargazers_count }
    } = await axios.get(`${endPoint}/${event.payload.text}`)

    const payloads = await bp.cms.renderElement(
      'builtin_text',
      {
        text: `This repo has ${stargazers_count} ★`
      },
      event.channel
    )
    await bp.events.replyToEvent(event, payloads)
  } catch (e) {
    const payloads = await bp.cms.renderElement(
      'builtin_text',
      {
        text: `Failed to fetch data for this repo`
      },
      event.channel
    )
    await bp.events.replyToEvent(event, payloads)
  }
}
```

Note that in this example we are using `builtin_text` renderer which has to be registered properly.
