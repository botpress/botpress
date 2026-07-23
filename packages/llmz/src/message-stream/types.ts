import { type JSONSchema7 } from 'json-schema'

/**
 * Reserved protocol symbol. Every block of an LLM response starts with `■`:
 *
 *   ■send=<component> { props? }
 *   streaming body here
 *
 *   ■run
 *   // code here
 *
 *   ■next=<name> { props? }
 *
 * The model must never emit `■` inside props or body content.
 */
export const MARKER = '■'

/** Component and exit names are normalized to lowercase (kebab or snake case). */
export const NAME_REGEX = /^[a-z][a-z0-9_-]*$/

export type JsonSchema = JSONSchema7

export type ItemKind = 'send' | 'run' | 'next' | 'unknown'

export type ItemStatus = 'pending' | 'streaming' | 'complete' | 'invalid' | 'interrupted'

export type DiagnosticCode =
  // Syntax-level (emitted by the streaming parser)
  | 'invalid-directive'
  | 'invalid-name'
  | 'invalid-props'
  | 'props-too-long'
  | 'unexpected-text'
  | 'interrupted'
  // Validation-level (emitted by the component validator)
  | 'unknown-component'
  | 'missing-required-prop'
  | 'unexpected-prop'
  | 'invalid-prop-value'
  | 'body-not-allowed'
  | 'missing-required-body'

export type Diagnostic = {
  code: DiagnosticCode
  message: string
  itemId?: string
}

/**
 * A parsed protocol item. References handed out through events are live: the
 * parser keeps appending to `body` and updating `status` as the stream advances.
 */
export type ParsedItem = {
  id: string
  kind: ItemKind
  /** Component name for `send`, exit name for `next`, empty string for `run`. */
  name: string
  props: Record<string, unknown>
  body?: string
  status: ItemStatus
  diagnostics: Diagnostic[]
}

export type MessageStreamEvent =
  | {
      /** Emitted once the directive (and name, when applicable) has been parsed. */
      type: 'item-start'
      item: ParsedItem
    }
  | {
      /** Emitted once the header (directive + name + optional props) is complete. Props are immutable from this point on. */
      type: 'item-ready'
      item: ParsedItem
    }
  | {
      type: 'body-start'
      itemId: string
    }
  | {
      type: 'body-delta'
      itemId: string
      delta: string
    }
  | {
      type: 'item-complete'
      item: ParsedItem
    }
  | {
      type: 'diagnostic'
      diagnostic: Diagnostic
    }

export type BodyFormat = 'text' | 'markdown' | 'code'

export type ComponentBodyDefinition = {
  format: BodyFormat
  description?: string
  required: boolean
}

export type GenerativeComponentExample = {
  props?: Record<string, unknown>
  body?: string
}

/** Optional metadata that improves generated instructions without affecting parsing or validation. */
export type GenerativeComponentMetadata = {
  usage?: string
  doNotUseWhen?: string
  examples?: GenerativeComponentExample[]
  priority?: number
}

/**
 * The internal, schema-library-agnostic representation of a component definition.
 * The parser, validator and instruction generator operate exclusively on this shape.
 */
export type NormalizedComponentDefinition = {
  name: string
  description?: string
  propsJsonSchema: JsonSchema
  body?: ComponentBodyDefinition
  generation?: GenerativeComponentMetadata
}

/** Minimal description of an exit, used by the instruction generator to document `■next`. */
export type NormalizedExitDefinition = {
  name: string
  description?: string
  propsJsonSchema?: JsonSchema
}
