import { JSONSchema7 } from 'json-schema'
import { ZodNativeTypeName } from '../../z'

type Transform =
  | 'json-schema-to-zui'
  | 'object-to-zui'
  | 'zui-to-json-schema'
  | 'zui-to-typescript-schema'
  | 'zui-to-typescript-type'

export abstract class ZuiTransformError extends Error {
  public constructor(
    public readonly transform: Transform,
    message?: string,
    public readonly path?: string
  ) {
    const msg = path ? `${path} : ${message}` : message
    super(msg)
  }
}

// json-schema-to-zui-error
export class JSONSchemaToZuiError extends ZuiTransformError {
  public constructor(message?: string, path?: string) {
    super('json-schema-to-zui', message, path)
  }
}
export class UnsupportedJSONSchemaToZuiError extends JSONSchemaToZuiError {
  public constructor(schema: JSONSchema7, path: string) {
    super(`JSON Schema ${JSON.stringify(schema)} cannot be transformed to ZUI type.`, path)
  }
}

// object-to-zui-error
export class ObjectToZuiError extends ZuiTransformError {
  public constructor(message: string, path: string) {
    super('object-to-zui', message, path)
  }
}

// zui-to-json-schema-error
export class ZuiToJSONSchemaError extends ZuiTransformError {
  public constructor(message: string, path: string) {
    super('zui-to-json-schema', message, path)
  }
}
export class UnsupportedZuiToJSONSchemaError extends ZuiToJSONSchemaError {
  public constructor(
    type: ZodNativeTypeName,
    path: string,
    { suggestedAlternative }: { suggestedAlternative?: string } = {}
  ) {
    const msg = suggestedAlternative
      ? `Zod type ${type} cannot be transformed to JSON Schema. Suggested alternative: ${suggestedAlternative}`
      : `Zod type ${type} cannot be transformed to JSON Schema.`
    super(msg, path)
  }
}
export class UnsupportedZuiCheckToJSONSchemaError extends ZuiToJSONSchemaError {
  public constructor(zodType: ZodNativeTypeName, checkKind: string, path: string) {
    super(`Zod check .${checkKind}() of type ${zodType} cannot be transformed to JSON Schema.`, path)
  }
}

// zui-to-typescript-schema-error
export class ZuiToTypescriptSchemaError extends ZuiTransformError {
  public constructor(message: string, path: string) {
    super('zui-to-typescript-schema', message, path)
  }
}
export class UnsupportedZuiToTypescriptSchemaError extends ZuiToTypescriptSchemaError {
  public constructor(type: ZodNativeTypeName, path: string) {
    super(`Zod type ${type} cannot be transformed to TypeScript schema.`, path)
  }
}
export class CircularZuiToTypescriptSchemaError extends ZuiToTypescriptSchemaError {
  public constructor(path: string) {
    super(
      'Schema is self-referential and cannot be inlined into TypeScript schema source without a name to reference.',
      path
    )
  }
}

// zui-to-typescript-type-error
export class ZuiToTypescriptTypeError extends ZuiTransformError {
  public constructor(message?: string, path?: string) {
    super('zui-to-typescript-type', message, path)
  }
}
export class UnsupportedZuiToTypescriptTypeError extends ZuiToTypescriptTypeError {
  public constructor(type: ZodNativeTypeName, path: string) {
    super(`Zod type ${type} cannot be transformed to TypeScript type.`, path)
  }
}
export class UntitledDeclarationError extends ZuiToTypescriptTypeError {
  public constructor() {
    super('Schema must have a title to be transformed to a TypeScript type with a declaration.')
  }
}
export class UnrepresentableGenericError extends ZuiToTypescriptTypeError {
  public constructor() {
    super('ZodRef can only be transformed to a TypeScript type with a "type" declaration.')
  }
}
export class CircularZuiToTypescriptTypeError extends ZuiToTypescriptTypeError {
  public constructor(path: string) {
    super('Schema is self-referential and cannot be inlined into a TypeScript type without a name to reference.', path)
  }
}
