import { ZodFirstPartyTypeKind } from '../../z'

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
  ) {
    super(message)
  }
}

// json-schema-to-zui-error
export class JsonSchemaToZuiError extends ZuiTransformError {
  public constructor(message?: string) {
    super('json-schema-to-zui', message)
  }
}

// object-to-zui-error
export class ObjectToZuiError extends ZuiTransformError {
  public constructor(message?: string) {
    super('object-to-zui', message)
  }
}

// zui-to-json-schema-error
export class ZuiToJsonSchemaError extends ZuiTransformError {
  public constructor(message?: string) {
    super('zui-to-json-schema', message)
  }
}
export class UnsupportedZuiToJsonSchemaError extends ZuiToJsonSchemaError {
  public constructor(type: ZodFirstPartyTypeKind) {
    super(`Zod type ${type} cannot be transformed to JSON Schema.`)
  }
}

// zui-to-typescript-schema-error
export class ZuiToTypescriptSchemaError extends ZuiTransformError {
  public constructor(message?: string) {
    super('zui-to-typescript-schema', message)
  }
}
export class UnsupportedZuiToTypescriptSchemaError extends ZuiToTypescriptSchemaError {
  public constructor(type: ZodFirstPartyTypeKind) {
    super(`Zod type ${type} cannot be transformed to TypeScript schema.`)
  }
}

// zui-to-typescript-type-error
export class ZuiToTypescriptTypeError extends ZuiTransformError {
  public constructor(message?: string) {
    super('zui-to-typescript-type', message)
  }
}
export class UnsupportedZuiToTypescriptTypeError extends ZuiToTypescriptTypeError {
  public constructor(type: ZodFirstPartyTypeKind | string) {
    super(`Zod type ${type} cannot be transformed to TypeScript type.`)
  }
}

export class UntitledDeclarationError extends ZuiToTypescriptTypeError {
  public constructor() {
    super('Schema must have a title to be transformed to a TypeScript type with a declaration.')
  }
}

export class UnrepresentableGenericError extends ZuiToTypescriptTypeError {
  public constructor() {
    super(`${ZodFirstPartyTypeKind.ZodRef} can only be transformed to a TypeScript type with a "type" declaration.`)
  }
}
