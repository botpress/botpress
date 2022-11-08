---
id: list-entities
title: List Entities
---

--------------------

List extraction behaves similarly to pattern extraction. However, you'll be able to add different **occurrences** of your entity with corresponding synonyms.

Let's take **Airport Codes** as an example:

Extraction will go like this:

|              User said               |      Type       |     Value      |
| :----------------------------------: | :-------------: | :------------: |
| _"Find a flight from SFO to Mumbai"_ | "Airport Codes" | ["SFO", "BOM"] |

```js
;[
  {
    name: 'Airport Codes',
    type: 'list',
    meta: {
      confidence: 1,
      provider: 'native',
      source: 'SFO',
      start: 19,
      end: 22,
      raw: {}
    },
    data: {
      extras: {},
      value: 'SFO',
      unit: 'string'
    }
  },
  {
    name: 'Airport Codes',
    type: 'list',
    meta: {
      confidence: 1,
      provider: 'native',
      source: 'Mumbai',
      start: 26,
      end: 32,
      raw: {}
    },
    data: {
      extras: {},
      value: 'BOM',
      unit: 'string'
    }
  }
]
```