import { z } from './src'

console.log(z.string().ui)
const schema = z.object({
  name: z.string().title('Name'),
})

console.log(schema.ui)
console.log(schema._def)
console.log(JSON.stringify(schema.toJsonSchema()))
schema.toTypescriptTypings().then((t) => console.log(t))
