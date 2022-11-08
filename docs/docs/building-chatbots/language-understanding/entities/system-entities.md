---
id: system-entities
title: System Entities
---

--------------------

## Duckling Extraction

Botpress Native NLU offers a handful of system entity extraction thanks to [Facebook/Duckling](https://github.com/facebook/duckling). This engine allows you to extract known entities like Time, Ordinals, Date, and so on. For a complete list of system entities, please head to [Duckling documentation](https://github.com/facebook/duckling).

 By default, Botpress uses an instance of Duckling hosted on our remote servers. If you don't want your data to be sent to our servers, you can either disable this feature by setting `ducklingEnabled` to `false` or host your duckling server and change the `ducklingURL` in the `data/global/config/nlu.json` config file.

Please check the Deployment section for instructions on hosting your Duckling server.

**Example:**

|            User said            |    Type    |  Value  |  Unit   |
| :-----------------------------: | :--------: | :-----: | :-----: |
| `Add 5 lbs of sugar to my cart` | `quantity` |   `5`   | `pound` |

```js
{
  type: 'quantity',
  meta: {
    confidence: 1,
    provider: 'native',
    source: '5 lbs', // text from which the entity was extracted
    start: 4, // beginning character index in original input
    end: 9, // end character index in original input
  },
  data: {
    value : 5,
    unit: 'pound',
    extras: {}
  }
}
```

:::note
Confidence will always be one due to the rule-based implementation of Duckling.
:::