import { z } from '@bpinternal/zui'
import { isAnyJsxComponent, isJsxComponent } from './jsx.js'

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

const getDefaultValue = (schema: z.ZodTypeAny): string => {
  if (schema._def.defaultValue !== undefined) {
    if (typeof schema._def.defaultValue === 'function') {
      return String(schema._def.defaultValue()).toString()
    } else {
      return String(schema._def.defaultValue)
    }
  }
  return ''
}

export function getComponentReference(component: ComponentDefinition): string {
  let doc = `### <${component.name}>\n\n`
  doc += `${component.description}\n\n`

  const getPropsDoc = (props: z.ZodObject<any>) => {
    const shape = props.shape as Record<string, z.ZodTypeAny>
    if (Object.keys(shape).length === 0) return '_No props._\n\n'

    const zodTypeToTsType: Record<string, string> = {
      ZodString: 'string',
      ZodNumber: 'number',
      ZodBoolean: 'boolean',
      ZodEnum: 'enum',
      ZodArray: 'array',
      ZodObject: 'object',
      ZodDate: 'date',
      ZodBigInt: 'bigint',
      ZodSymbol: 'symbol',
      ZodUndefined: 'undefined',
      ZodNull: 'null',
      ZodVoid: 'void',
      ZodNever: 'never',
      ZodUnknown: 'unknown',
      ZodAny: 'any',
    }

    return (
      Object.entries(shape)
        .map(([name, schema]) => {
          const naked = schema.naked()
          const zodType = naked._def.typeName
          const defValue = getDefaultValue(schema)
          const typings =
            naked instanceof z.ZodEnum
              ? naked._def.values.map((x: string) => `"${x}"`).join(' | ')
              : zodTypeToTsType[zodType] || zodType
          const required = !schema.isOptional() ? '**(required)**' : '(optional)'
          const def = defValue ? ` _Default: \`${defValue}\`_` : ''
          const description = schema.description || schema.naked().description || schema?._def.description || ''

          return `- \`${name}: ${typings}\` ${required} — ${description}${def}`
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

// Component definition types with inferred props
export type DefaultComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
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

export type LeafComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
  type: 'leaf'
  name: string
  description: string
  aliases?: string[]
  examples: ExampleUsage[]
  leaf: {
    props: T
  }
}

export type ContainerComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> = {
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
    ? z.infer<P>
    : T extends ContainerComponentDefinition<infer P>
      ? z.infer<P>
      : T extends DefaultComponentDefinition<infer P>
        ? z.infer<P>
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

// Type guard function that checks if something is any rendered component
export function isAnyComponent(message: unknown): message is RenderedComponent {
  return isAnyJsxComponent(message)
}

/**
 * Converts a RenderedComponent back to TSX code
 * @param component The rendered component to convert
 * @returns A string containing the TSX representation of the component
 */
export function renderToTsx(component: RenderedComponent): string {
  const props = Object.entries(component.props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`
      }
      if (typeof value === 'boolean') {
        return value ? key : ''
      }
      if (typeof value === 'number') {
        return `${key}={${value}}`
      }
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'object') {
        return `${key}={${JSON.stringify(value)}}`
      }
      return `${key}={${String(value)}}`
    })
    .filter(Boolean)
    .join(' ')

  const children = component.children
    .map((child) => {
      if (typeof child === 'string') {
        return child
      }
      if (isAnyComponent(child)) {
        return renderToTsx(child)
      }
      return String(child)
    })
    .join('')

  return `<${component.type}${props ? ' ' + props : ''}>${children}</${component.type}>`
}
