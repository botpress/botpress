import { isJsxComponent } from './jsx.js'

export type ComponentProperty = {
  name: string
  type: 'string' | 'boolean' | 'number'
  default?: string | boolean | number
  description?: string
  required: boolean
}

export type ExampleUsage = {
  name: string
  description: string
  code: string
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

  if (!component.examples || component.examples.length === 0) {
    throw new Error('Component must have at least one example')
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

export function getComponentReference(component: ComponentDefinition): string {
  let doc = `### <${component.name}>\n\n`
  doc += `${component.description}\n\n`

  const getPropsDoc = (props: readonly ComponentProperty[]) => {
    if (props.length === 0) return '_No props._\n\n'
    return (
      props
        .map((prop) => {
          const required = prop.required ? '**(required)**' : '(optional)'
          const def = prop.default !== undefined ? ` _Default: \`${prop.default}\`_` : ''
          return `- \`${prop.name}: ${prop.type}\` ${required} — ${prop.description || ''}${def}`
        })
        .join('\n') + '\n\n'
    )
  }

  const getChildrenDoc = (children: ComponentChild[]) => {
    if (children.length === 0) return '_None allowed._\n\n'
    return (
      'Can contain:\n' +
      children.map((child) => `- ${child.description} — \`<${child.component.name}>\``).join('\n') +
      '\n\n'
    )
  }

  const getExamplesDoc = (examples: ExampleUsage[]) => {
    if (!examples.length) return ''
    return (
      '**Examples:**\n\n' +
      examples
        .map((example) => `**${example.name}** — ${example.description}\n\n\`\`\`tsx\n${example.code.trim()}\n\`\`\`\n`)
        .join('\n')
    )
  }

  switch (component.type) {
    case 'leaf':
      doc += '**Props:**\n\n'
      doc += getPropsDoc(component.leaf.props)
      doc += '**Children:**\n\n'
      doc += getChildrenDoc([])
      doc += getExamplesDoc(component.examples)
      break

    case 'container':
      doc += '**Props:**\n\n'
      doc += getPropsDoc(component.container.props)
      doc += '**Children:**\n\n'
      doc += getChildrenDoc(component.container.children)
      doc += getExamplesDoc(component.examples)
      break

    case 'default':
    default:
      doc += '**Props:**\n\n'
      doc += getPropsDoc(component.default.props)
      doc += '**Children:**\n\n'
      doc += getChildrenDoc(component.default.children)
      doc += getExamplesDoc(component.examples)
      break
  }

  return doc.trim()
}

// Helper type to convert ComponentProperty type string to actual TypeScript type
type TypeMap = {
  string: string
  boolean: boolean
  number: number
}

// Extract props type from ComponentProperty array
type ExtractPropsFromProperties<T extends readonly ComponentProperty[]> = {
  [K in T[number] as K['name']]: K['required'] extends true ? TypeMap[K['type']] : TypeMap[K['type']] | undefined
}

// Component definition types with inferred props
export type DefaultComponentDefinition<T extends readonly ComponentProperty[] = readonly ComponentProperty[]> = {
  type: 'default'
  name: string
  aliases: string[]
  description: string
  examples: ExampleUsage[]
  default: {
    props: T
    children: Array<ComponentChild>
  }
}

export type LeafComponentDefinition<T extends readonly ComponentProperty[] = readonly ComponentProperty[]> = {
  type: 'leaf'
  name: string
  description: string
  aliases?: string[]
  examples: ExampleUsage[]
  leaf: {
    props: T
  }
}

export type ContainerComponentDefinition<T extends readonly ComponentProperty[] = readonly ComponentProperty[]> = {
  type: 'container'
  name: string
  description: string
  aliases?: string[]
  examples: ExampleUsage[]
  container: {
    props: T
    children: Array<ComponentChild>
  }
}

export type ComponentDefinition = DefaultComponentDefinition | LeafComponentDefinition | ContainerComponentDefinition

// Helper type to extract props from any component definition type
type ExtractComponentProps<T extends ComponentDefinition> =
  T extends LeafComponentDefinition<infer P>
    ? ExtractPropsFromProperties<P>
    : T extends ContainerComponentDefinition<infer P>
      ? ExtractPropsFromProperties<P>
      : T extends DefaultComponentDefinition<infer P>
        ? ExtractPropsFromProperties<P>
        : never

// Rendered component type
export type RenderedComponent<TProps = Record<string, any>> = {
  __jsx: true
  type: string
  children: any[]
  props: TProps
}

// Component Class that infers props from component definition
export class Component<T extends ComponentDefinition = ComponentDefinition> {
  public readonly definition: T
  public readonly propsType!: ExtractComponentProps<T> // phantom type for inference

  public constructor(definition: T) {
    assertValidComponent(definition)
    this.definition = definition
  }
}

// Type guard function that infers props from component
export function isComponent<T extends ComponentDefinition>(
  rendered: RenderedComponent<any>,
  component: Component<T>
): rendered is RenderedComponent<ExtractComponentProps<T>> {
  return isJsxComponent(component.definition.name, rendered)
}
