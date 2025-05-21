export type ComponentProperty = {
  name: string
  type: 'string' | 'boolean' | 'number'
  default?: string | boolean | number
  description?: string
  required: boolean
}

export type Component = DefaultComponent | LeafComponent | ContainerComponent

export type ExampleUsage = {
  name: string
  description: string
  code: string
}

export type ComponentChild = {
  description: string
  component: Component
}

export type DefaultComponent = {
  type: 'default'
  name: string
  aliases: string[]
  description: string
  examples: ExampleUsage[]
  default: {
    props: ComponentProperty[]
    children: Array<ComponentChild>
  }
}

export type LeafComponent = {
  type: 'leaf'
  name: string
  description: string
  aliases?: string[]
  examples: ExampleUsage[]
  leaf: {
    props: ComponentProperty[]
  }
}

export type ContainerComponent = {
  type: 'container'
  name: string
  description: string
  aliases?: string[]
  examples: ExampleUsage[]
  container: {
    props: ComponentProperty[]
    children: Array<ComponentChild>
  }
}

export function assertValidComponent(component: Component): asserts component is Component {
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

export function getComponentReference(component: Component): string {
  let doc = `### <${component.name}>\n\n`
  doc += `${component.description}\n\n`

  const getPropsDoc = (props: ComponentProperty[]) => {
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
