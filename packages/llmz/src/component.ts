import { z } from '@bpinternal/zui'
import { camelCase, cloneDeep, isEqual } from 'lodash-es'
import type { MessageMetadata } from './chat.js'

const TEXT_NAMES = new Set(['message', 'text', 'markdown', 'md', 'speech', 'speak', 'spoken'])
const RESERVED_METHOD_NAMES = new Set(['then', 'constructor', 'prototype', '__proto__'])
const LEGACY_DEFINITION_FIELDS = ['type', 'default', 'leaf', 'container', 'body', 'children', 'examples']
const renderedComponents = new WeakMap<object, { schema: z.ZodObject<any>; props: Record<string, unknown> }>()

export type GenerativeComponentExample = {
  props: Record<string, unknown>
}

/** Guidance and examples for the component's JavaScript method. */
export type GenerativeComponentMetadata = {
  usage?: string
  doNotUseWhen?: string
  examples?: Array<GenerativeComponentExample | GenerativeComponentExample[]>
  priority?: number
}

export type ComponentHandler<P extends z.ZodObject<any> = z.ZodObject<any>> = (
  props: z.output<P>,
  metadata: MessageMetadata
) => Promise<void> | void

export type ComponentDefinition<P extends z.ZodObject<any> = z.ZodObject<any>> = {
  name: string
  description: string
  props: P
  aliases?: string[]
  generation?: GenerativeComponentMetadata
  handler?: ComponentHandler<P>
}

export type RenderedComponent<TProps extends Record<string, unknown> = Record<string, unknown>> = {
  type: 'component'
  name: string
  props: TProps
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function assertValidName(name: unknown, label: string): asserts name is string {
  if (typeof name !== 'string' || !name) {
    throw new Error(`${label} must be a non-empty string`)
  }

  const method = camelCase(name)

  if (TEXT_NAMES.has(name.toLowerCase()) || TEXT_NAMES.has(method.toLowerCase())) {
    throw new Error(`${label} "${name}" is reserved for native assistant responses`)
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]{2,49}$/.test(name)) {
    throw new Error(
      `${label} "${name}" must contain 3–50 letters, digits, underscores, or hyphens and start with a letter`
    )
  }

  if (!/^[A-Za-z_$][\w$]*$/.test(method) || RESERVED_METHOD_NAMES.has(method.toLowerCase())) {
    throw new Error(`${label} "${name}" produces an unavailable chat method: ${method}`)
  }
}

export function assertValidComponent(component: unknown): asserts component is ComponentDefinition {
  if (!isRecord(component)) {
    throw new Error('Component definition must be an object')
  }

  const legacyField = LEGACY_DEFINITION_FIELDS.find((field) => Object.hasOwn(component, field))

  if (legacyField) {
    throw new Error(`Component definitions use a flat props schema; "${legacyField}" is no longer supported`)
  }

  assertValidName(component.name, 'Component name')

  if (typeof component.description !== 'string' || !component.description.trim()) {
    throw new Error('Component must have a description')
  }

  if (!z.is.zuiType(component.props) || !z.is.zuiObject(component.props)) {
    throw new Error('Component props must be a Zod object schema')
  }

  if (component.handler !== undefined && typeof component.handler !== 'function') {
    throw new Error('Component handler must be a function')
  }

  if (component.aliases !== undefined) {
    if (!Array.isArray(component.aliases)) {
      throw new Error('Component aliases must be an array')
    }

    for (const alias of component.aliases) {
      assertValidName(alias, 'Component alias')
    }
  }

  if (component.generation !== undefined) {
    if (!isRecord(component.generation)) {
      throw new Error('Component generation metadata must be an object')
    }

    const examples = component.generation.examples

    if (examples !== undefined) {
      if (!Array.isArray(examples)) {
        throw new Error('Component generation examples must be an array')
      }

      for (const example of examples.flat()) {
        if (!isRecord(example) || !isRecord(example.props) || Object.keys(example).some((key) => key !== 'props')) {
          throw new Error('Component generation examples must contain only { props }')
        }
      }
    }
  }
}

/** The prompt and VM use the same normalized method name. */
export function getComponentMethodName(definition: ComponentDefinition): string {
  const names = [definition.name, ...(definition.aliases ?? [])]
  return names.some((name) => name.toLowerCase() === 'button') ? 'buttons' : camelCase(definition.name)
}

export class Component<P extends z.ZodObject<any> = any> {
  public readonly definition: ComponentDefinition<P>
  public readonly propsType!: z.infer<P>
  public readonly handler: ComponentHandler<P> | undefined

  public constructor(definition: ComponentDefinition<P>) {
    assertValidComponent(definition)
    this.definition = definition
    this.handler = definition.handler
  }

  public withHandler(handler: ComponentHandler<P>): Component<P> {
    return new Component({ ...this.definition, handler })
  }

  public render(props: z.input<P>): RenderedComponent<z.infer<P>> {
    const rendered: RenderedComponent<z.infer<P>> = {
      type: 'component',
      name: this.definition.name,
      props: this.definition.props.parse(props) as z.infer<P>,
    }

    renderedComponents.set(rendered, { schema: this.definition.props, props: cloneDeep(rendered.props) })
    return rendered
  }
}

/** Validates raw tool yields without transforming an unchanged render a second time. */
export function prepareComponentDelivery<P extends z.ZodObject<any>>(
  component: Component<P>,
  value: unknown
): RenderedComponent<z.infer<P>> {
  if (!isAnyComponent(value)) {
    throw new Error('A component delivery requires { type: "component", name, props }')
  }

  if (!isComponent(value, component)) {
    throw new Error(`Component "${value.name}" is not registered as "${component.definition.name}"`)
  }

  const rendered = renderedComponents.get(value)

  if (rendered?.schema === component.definition.props && isEqual(value.props, rendered.props)) {
    const prepared: RenderedComponent<z.infer<P>> = {
      type: 'component',
      name: component.definition.name,
      props: cloneDeep(rendered.props) as z.infer<P>,
    }

    // Deliver the recorded data, so later edits to the yielded object cannot
    // change the props after validation and before its handler runs.
    renderedComponents.set(prepared, rendered)
    return prepared
  }

  return component.render(value.props as z.input<P>)
}

export function isComponent<P extends z.ZodObject<any>>(
  rendered: unknown,
  component: Component<P>
): rendered is RenderedComponent<z.infer<P>> {
  return isAnyComponent(rendered) && rendered.name.toLowerCase() === component.definition.name.toLowerCase()
}

export function isAnyComponent(value: unknown): value is RenderedComponent {
  return (
    isRecord(value) &&
    value.type === 'component' &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    isRecord(value.props) &&
    !Object.hasOwn(value, '__jsx') &&
    !Object.hasOwn(value, 'children')
  )
}
