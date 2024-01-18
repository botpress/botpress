## BETA Version

API is subject to breaking changes.

## How to use

```js
import { zui, getZuiSchemas, jsonSchemaToZod } from '@bpinternal/zui'

const objectSchema = zui.object({
  name: zui.string().title('Name').describe('Name of the user'),
  age: zui.number().min(0).max(100).title('Age').describe('Age in years'),
  hobby: zui.string().title('Hobby').examples(['Skiing', 'Hiking', 'Swimming', 'Coding'])
})

// schema: JSON Schema containing the additional properties under `x-zui`
// uischema: Can be provided to jsonform to show the UI
const { schema, uischema } = getZuiSchemas(objectSchema)

// Or get a zod schema from json
const zodSchema = jsonSchemaToZod(schema)
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.
