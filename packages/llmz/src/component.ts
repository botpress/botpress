import { z } from '@bpinternal/zui'
import { createJsxComponent, isAnyJsxComponent, isJsxComponent, JsxComponent } from './jsx.js'
import type { BodyFormat, GenerativeComponentMetadata } from './message-stream/types.js'

/**
 * @deprecated TSX-era examples are no longer shown to the model — llmz
 * generates ■-protocol blocks, not TSX. Use `generation.examples`
 * ({ props?, body? }) instead.
 */
export type ExampleUsage = {
  name: string
  description: string
  code: string
}

/**
 * Optional body configuration for components that accept a message body
 * (`default` and `container` types). Controls how the body is documented to
 * the model in the ■ protocol reference.
 */
export type ComponentBodyOptions = {
  /** How the body should be written: 'markdown' (default), 'text' (plain prose) or 'code'. */
  format?: BodyFormat
  /** Model-facing description of what the body must contain. */
  description?: string
  /** Whether a body is required. Defaults to true. */
  required?: boolean
}

export type ComponentChild = {
  description: string
  component: ComponentDefinition
}

export function assertValidComponent(component: ComponentDefinition): asserts component is ComponentDefinition {
  if (!component.name) {
    throw new Error('Component must have a name')
  }

  const nameRegex = /^[A-Z]{3,50}$/i

  if (!nameRegex.test(component.name)) {
    throw new Error(
      `Component name "${component.name}" must be 3-50 characters long and start with an uppercase letter`
    )
  }

  if (component.aliases) {
    for (const alias of component.aliases) {
      if (!nameRegex.test(alias)) {
        throw new Error(`Alias "${alias}" must be 3-50 characters long and start with an uppercase letter`)
      }
    }
  }

  if (!component.description) {
    throw new Error('Component must have a description')
  }

  if (component.type === 'default' && !component.default) {
    throw new Error('Default component must have default props and children')
  }

  if (component.type === 'leaf' && !component.leaf) {
    throw new Error('Leaf component must have leaf props')
  }

  if (component.type === 'container' && !component.container) {
    throw new Error('Container component must have container props and children')
  }
}

// Component definition types with inferred props
export type DefaultComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
  type: 'default'
  name: string
  aliases: string[]
  description: string
  /** @deprecated Not shown to the model. Use `generation.examples` instead. */
  examples?: ExampleUsage[]
  /** Body configuration for the ■ protocol reference (format, description, required). */
  body?: ComponentBodyOptions
  /** Model-facing generation metadata: usage guidance and ■-protocol examples ({ props?, body? }). */
  generation?: GenerativeComponentMetadata
  default: {
    props: T
    children: Array<ComponentChild>
  }
}

export type LeafComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
  type: 'leaf'
  name: string
  description: string
  aliases?: string[]
  /** @deprecated Not shown to the model. Use `generation.examples` instead. */
  examples?: ExampleUsage[]
  /** Model-facing generation metadata: usage guidance and ■-protocol examples ({ props? }). */
  generation?: GenerativeComponentMetadata
  leaf: {
    props: T
  }
}

export type ContainerComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
  type: 'container'
  name: string
  description: string
  aliases?: string[]
  /** @deprecated Not shown to the model. Use `generation.examples` instead. */
  examples?: ExampleUsage[]
  /** Body configuration for the ■ protocol reference (format, description, required). */
  body?: ComponentBodyOptions
  /** Model-facing generation metadata: usage guidance and ■-protocol examples ({ props?, body? }). */
  generation?: GenerativeComponentMetadata
  container: {
    props: T
    children: Array<ComponentChild>
  }
}

export type ComponentDefinition = DefaultComponentDefinition | LeafComponentDefinition | ContainerComponentDefinition

// Helper type to extract props from any component definition type
type ExtractComponentProps<T extends ComponentDefinition> =
  T extends LeafComponentDefinition<infer P>
    ? z.infer<P>
    : T extends ContainerComponentDefinition<infer P>
      ? z.infer<P>
      : T extends DefaultComponentDefinition<infer P>
        ? z.infer<P>
        : never

// Rendered component type
export type RenderedComponent<TProps extends {} = {}> = JsxComponent<string, TProps>

// Component Class that infers props from component definition
export class Component<T extends ComponentDefinition = ComponentDefinition> {
  public readonly definition: T
  public readonly propsType!: ExtractComponentProps<T> // phantom type for inference

  public constructor(definition: T) {
    assertValidComponent(definition)
    this.definition = definition
  }

  public render<TChildren extends any = any>(
    props: Component['propsType'],
    children: Array<TChildren> = []
  ): RenderedComponent {
    return createJsxComponent({ type: this.definition.name, props, children })
  }
}

// Type guard function that infers props from component
export function isComponent<T extends ComponentDefinition>(
  rendered: RenderedComponent<any>,
  component: Component<T>
): rendered is RenderedComponent<ExtractComponentProps<T>> {
  return isJsxComponent(component.definition.name, rendered)
}

// Type guard function that checks if something is any rendered component
export function isAnyComponent(message: unknown): message is RenderedComponent {
  return isAnyJsxComponent(message)
}
