import { JSONSchemaExtended, JsonSchema, Refs } from '../types'
import { parseSchema } from './parseSchema'
import { parseOneOf } from './parseOneOf'

export const parseDiscriminator = (schema: JSONSchemaExtended & { oneOf: JsonSchema[] }, refs: Refs) => {
  if (schema.oneOf.length <= 1 || !schema.discriminator?.propertyName) {
    return parseOneOf(schema, refs)
  }

  const schemas = schema.oneOf.map((schema, i) =>
    parseSchema(schema, {
      ...refs,
      path: [...refs.path, 'oneOf', i],
    }),
  )

  return `z.discriminatedUnion("${schema.discriminator?.propertyName}", [${schemas.join(', ')}])`
}

export const __original = (schema: JSONSchemaExtended & { oneOf: JsonSchema[] }, refs: Refs) => {
  return schema.oneOf.length
    ? schema.oneOf.length === 1
      ? parseSchema(schema.oneOf[0]!, {
          ...refs,
          path: [...refs.path, 'oneOf', 0],
        })
      : `z.any().superRefine((x, ctx) => {
    const schemas = [${schema.oneOf.map((schema, i) =>
      parseSchema(schema, {
        ...refs,
        path: [...refs.path, 'oneOf', i],
      }),
    )}];
    const errors = schemas.reduce(
      (errors: z.ZodError[], schema) =>
        ((result) => ("error" in result ? [...errors, result.error] : errors))(
          schema.safeParse(x)
        ),
      []
    );
    if (schemas.length - errors.length !== 1) {
      ctx.addIssue({
        path: ctx.path,
        code: "invalid_union",
        unionErrors: errors,
        message: "Invalid input: Should pass single schema",
      });
    }
  })`
    : 'z.any()'
}
