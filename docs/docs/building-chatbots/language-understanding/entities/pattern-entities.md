---
id: pattern-entities
title: Pattern Entities
---

--------------------

Pattern or Regular Expression Extraction allows you to extract information presented in a format that can be described using Regular Expression (RegEx). Once you've created a pattern entity, Botpress Native NLU will perform a regex extraction on each incoming message and add it to `event.nlu.entities`.

**Example:**

Given a Pattern Entity definition with `[A-Z]{3}-[0-9]{4}-[A-Z]{3}` as pattern:

Extraction will go like this:

|          User said          | Type  |     Value      |
| :-------------------------: | :---: | :------------: |
| `Find product BHZ-1234-UYT` | `SKU` | `BHZ-1234-UYT` |

```js
{ name: 'SKU',
  type: 'pattern',
  meta:
   { confidence: 1,
     provider: 'native',
     source: 'BHZ-1234-UYT',
     start: 13,
     end: 25,
     raw: {} },
  data: {
    extras: {},
    value: 'BHZ-1234-UYT',
    unit: 'string'
    }
}
```