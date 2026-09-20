import { z } from '@bpinternal/zui'
import { cloneDeep } from 'lodash-es'
import type { MessageMetadata } from './chat.js'

const TEXT_NAMES = new Set(['message', 'text', 'markdown', 'md', 'speech', 'speak', 'spoken'])
const RESERVED_METHOD_NAMES = new Set(['then', 'constructor', 'prototype', '__proto__', 'button'])
const renderedComponents = new WeakMap<object, z.ZodType>()

export type ComponentSchema = z.ZodObject<any> | z.ZodArray<any>

export type ComponentHandler<P extends ComponentSchema = any> = (
  props: z.output<P>,
  metadata: MessageMetadata
) => Promise<void> | void

export type ComponentDefinition<P extends ComponentSchema = any> = {
  /** The exact JavaScript method name exposed on chat. */
  name: string
  description: string
  props: P
  handler?: ComponentHandler<P>
}

export type RenderedComponent<TProps = unknown> = {
  readonly type: 'component'
  readonly name: string
  readonly props: TProps
}

export type ComponentRegistry = ReadonlyMap<string, Component>

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function assertValidComponent(component: unknown): asserts component is ComponentDefinition {
  if (!isRecord(component)) {
    throw new Error('Component definition must be an object')
  }

  const unknown = Object.keys(component).find((key) => !['name', 'description', 'props', 'handler'].includes(key))

  if (unknown) {
    throw new Error(`Unknown component option: ${unknown}`)
  }

  const name = component.name

  if (typeof name !== 'string' || !/^[A-Za-z_$][\w$]{0,49}$/.test(name)) {
    throw new Error('Component name must be a JavaScript identifier of 1–50 characters')
  }

  if (TEXT_NAMES.has(name.toLowerCase())) {
    throw new Error(`Component name "${name}" is reserved for native assistant responses`)
  }

  if (RESERVED_METHOD_NAMES.has(name.toLowerCase())) {
    throw new Error(`Component name "${name}" is unavailable; use "buttons" for button messages`)
  }

  if (typeof component.description !== 'string' || !component.description.trim()) {
    throw new Error('Component must have a description')
  }

  if (!z.is.zuiType(component.props) || (!z.is.zuiObject(component.props) && !z.is.zuiArray(component.props))) {
    throw new Error('Component props must be a Zod object or array schema')
  }

  if (component.handler !== undefined && typeof component.handler !== 'function') {
    throw new Error('Component handler must be a function')
  }
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)

    for (const child of Object.values(value)) {
      freeze(child, seen)
    }

    Object.freeze(value)
  }

  return value
}

export class Component<P extends ComponentSchema = any> {
  public readonly definition: Readonly<ComponentDefinition<P>>
  public readonly propsType!: z.output<P>
  public readonly handler: ComponentHandler<P> | undefined

  public constructor(definition: ComponentDefinition<P>) {
    assertValidComponent(definition)
    this.definition = Object.freeze({ ...definition })
    this.handler = definition.handler
  }

  public withHandler(handler: ComponentHandler<P>): Component<P> {
    return new Component({ ...this.definition, handler })
  }

  /** Parse once and retain an immutable delivery value. */
  public render(props: z.input<P>): RenderedComponent<z.output<P>> {
    const rendered = freeze({
      type: 'component' as const,
      name: this.definition.name,
      props: cloneDeep(this.definition.props.parse(props)) as z.output<P>,
    })

    renderedComponents.set(rendered, this.definition.props)
    return rendered
  }
}

/** Resolve the exact methods once and share them between the prompt and runtime. */
export function createComponentRegistry(components: readonly Component[]): ComponentRegistry {
  const registry = new Map<string, Component>()

  for (const component of components) {
    const name = component.definition.name

    if (registry.has(name)) {
      throw new Error(`Duplicate component name: ${name}`)
    }

    registry.set(name, component)
  }

  return registry
}

/** Raw descriptors are parsed; already-rendered values keep their parsed props. */
export function prepareComponentDelivery<P extends ComponentSchema>(
  component: Component<P>,
  value: unknown
): RenderedComponent<z.output<P>> {
  if (!isAnyComponent(value)) {
    throw new Error('A component delivery requires { type: "component", name, props }')
  }

  if (!isComponent(value, component)) {
    throw new Error(`Component "${value.name}" is not registered as "${component.definition.name}"`)
  }

  if (renderedComponents.get(value) === component.definition.props) {
    return value
  }

  return component.render(value.props)
}

export function isComponent<P extends ComponentSchema>(
  rendered: unknown,
  component: Component<P>
): rendered is RenderedComponent<z.output<P>> {
  return isAnyComponent(rendered) && rendered.name === component.definition.name
}

export function isAnyComponent(value: unknown): value is RenderedComponent {
  return (
    isRecord(value) &&
    value.type === 'component' &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    (isRecord(value.props) || Array.isArray(value.props)) &&
    Object.keys(value).every((key) => ['type', 'name', 'props'].includes(key))
  )
}
