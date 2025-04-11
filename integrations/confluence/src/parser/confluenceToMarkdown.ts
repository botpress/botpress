import { IntegrationLogger } from '@botpress/sdk'

type NodeType =
  | 'doc'
  | 'bodiedExtension'
  | 'paragraph'
  | 'text'
  | 'panel'
  | 'heading'
  | 'mention'
  | 'date'
  | 'status'
  | 'placeholder'
  | 'extension'
  | 'hardBreak'
  | 'inlineCard'
  | 'emoji'
  | Table
  | List
  | Task

type Table = 'table' | 'tableRow' | 'tableHeader' | 'tableCell'
type List = 'bulletList' | 'listItem'
type Task = 'taskList' | 'taskItem'

type BaseNode = {
  type: NodeType
  content?: AtlassianNode[]
  attrs?: Record<string, any>
  marks?: { type: string }[]
  text?: string
}

type AtlassianNode = BaseNode

const CHECKBOX_DONE_STATUS = 'DONE'

/**
 * Converts a JSON representation of an Atlassian document into Markdown format.
 *
 * This function takes a JSON object representing an Atlassian document structure
 * and recursively processes its nodes to generate a Markdown string. It supports
 * various node types such as paragraphs, headings, tables, lists, emojis, mentions,
 * and more. Each node type is handled specifically to ensure proper Markdown formatting.
 *
 * @param json - The root AtlassianNode object representing the document to be converted.
 *               The root node is expected to have a type of "doc".
 * @param logger - An optional logger instance for debugging purposes. Logs information
 *                 about the parsing process and any unhandled node types.
 * @returns A string containing the Markdown representation of the input JSON document.
 *          If the input JSON is invalid or not of type "doc", an empty string is returned.
 */
export function convertAtlassianDocumentToMarkdown(json: AtlassianNode, logger?: IntegrationLogger): string {
  logger?.debug('Parsing JSON to Markdown', json)
  if (json.type !== 'doc') {
    logger?.debug('Invalid JSON structure: expected "doc" type')
    return ''
  }

  return json.content?.map(parseNode).join('') ?? ''
}

/**
 * Recursively processes an AtlassianNode and converts it into its Markdown representation.
 *
 * This function handles various node types from an Atlassian document structure and
 * converts them into corresponding Markdown syntax. It supports nodes such as paragraphs,
 * headings, tables, lists, emojis, mentions, and more. Each node type is processed
 * specifically to ensure proper Markdown formatting.
 *
 * For unsupported or unhandled node types, a warning is logged to the console, and
 * an empty string is returned.
 *
 * @param node - The AtlassianNode to be processed. This node contains information
 *               about its type, attributes, content, and other metadata.
 * @returns A string containing the Markdown representation of the input node.
 *          If the node type is unhandled, an empty string is returned.
 */
function handleNode(node: AtlassianNode): string {
  switch (node.type) {
    case 'doc':
    case 'bodiedExtension':
      return (node.content || []).map(handleNode).join('\n\n')
    case 'paragraph':
      return (node.content || []).map(handleNode).join('')
    case 'text':
      return node.marks?.some((mark) => mark.type === 'strong') ? `**${node.text}**` : (node.text ?? '')
    case 'panel':
      return handlePanel(node)
    case 'table':
      return handleTable(node)
    case 'tableRow':
      return '| ' + (node.content || []).map(handleNode).join(' | ') + ' |'
    case 'tableHeader':
    case 'tableCell':
      return (node.content || []).map(handleNode).join(' ')
    case 'heading':
      return `\n${'#'.repeat(node.attrs?.level ?? 1)} ${(node.content || []).map(handleNode).join('') + '\n'}`
    case 'bulletList':
      return (node.content || []).map(handleNode).join('\n')
    case 'listItem':
      return '- ' + (node.content || []).map(handleNode).join(' ')
    case 'emoji':
    case 'mention':
      return node.attrs?.text ?? ''
    case 'date':
      return new Date(Number(node.attrs?.timestamp)).toLocaleDateString()
    case 'status':
      return `**[${node.attrs?.text}]**`
    case 'placeholder':
      return `_${node.attrs?.text}_\n`
    case 'extension':
      return handleExtension(node)
    case 'hardBreak':
      return '  \n'
    case 'inlineCard':
      return `\n[${node.attrs?.url}](${node.attrs?.url})\n`
    case 'taskList':
      return (node.content || []).map(handleNode).join('\n')
    case 'taskItem':
      return (
        `[${node?.attrs?.state === CHECKBOX_DONE_STATUS ? 'x' : ''}]` + (node.content || []).map(handleNode).join('')
      )
    default:
      console.warn(`handleNode :: Unhandled node type: ${node.type}`)
      return ''
  }
}

/**
 * Handles the conversion of a "panel" node from an Atlassian document to Markdown format.
 *
 * This function processes a "panel" node, extracting its content and formatting it
 * as a Markdown code block if the panel type is specified. The panel type is used
 * as the language identifier for the code block. If no panel type is provided, the
 * content is simply concatenated and returned without additional formatting.
 *
 * @param node - The AtlassianNode representing the "panel" to be converted.
 *               It may contain attributes such as `panelType` and child nodes in `content`.
 * @returns A string containing the Markdown representation of the "panel" node.
 */
function handlePanel(node: AtlassianNode): string {
  let content = ''
  if (node?.attrs?.panelType) {
    content += `\`\`\`${node.attrs.panelType}\n`
  }

  content += (node.content || []).map(handleNode).join(' ')

  if (node?.attrs?.panelType) {
    content += '\n\`\`\`\n'
  }

  return content
}

/**
 * Handles the conversion of a "table" node from an Atlassian document to Markdown format.
 *
 * This function processes a "table" node, extracting its rows and formatting them
 * into a Markdown table representation. The first row is treated as the header row,
 * and a separator row is added below it to define the table structure. Each subsequent
 * row is treated as a data row. The function ensures proper alignment and formatting
 * for Markdown tables.
 *
 * @param node - The AtlassianNode representing the "table" to be converted.
 *               It contains child nodes representing rows and cells.
 * @returns A string containing the Markdown representation of the "table" node,
 *          including headers, separators, and data rows.
 */
function handleTable(node: AtlassianNode): string {
  const rows = (node.content || []).map(handleNode)
  const columnCount = node.content?.[0]?.content?.length || 0
  const headerSeparator = '| ' + Array(columnCount).fill('---').join(' | ') + ' |'
  return [rows[0], headerSeparator, ...rows.slice(1)].join('\n')
}

/**
 * Handles the conversion of an "extension" node from an Atlassian document to Markdown format.
 *
 * This function processes an "extension" node, currently only handling cases where the extension
 * key is "roadmap". It extracts relevant data such as the roadmap title, timeline, lanes, bars,
 * and milestones, and formats them into a structured Markdown representation. If the extension
 * key is not recognized or unsupported, a default "Unhandled extension" message is returned.
 *
 * For "roadmap" extensions:
 * - The title of the roadmap is included as a top-level heading.
 * - The timeline is displayed with start and end dates.
 * - Each lane is represented as a subheading, with its title, color, and description.
 * - Bars within lanes are detailed with their title, description, start date, and duration.
 * - Milestones are listed with their titles and dates.
 *
 * For XXX extensions:
 * - More extensions to come...
 * @param node - The AtlassianNode representing the "extension" to be converted.
 *               It may contain attributes such as `extensionKey` and `parameters`.
 * @returns A string containing the Markdown representation of the "extension" node.
 *          If the extension key is unhandled, a default message is returned.
 */
function handleExtension(node: AtlassianNode): string {
  if (node.attrs?.extensionKey.toLowerCase() === 'roadmap') {
    const source = node.attrs?.parameters?.macroParams?.source.value
    const data = JSON.parse(decodeURIComponent(source))
    let markdown = `# ${data.title}\n\n`

    markdown += `**Timeline**: From ${data.timeline.startDate} to ${data.timeline.endDate}\n\n`

    data.lanes.forEach((lane: any) => {
      markdown += `## ${lane.title} (Color: ${lane.color.lane})\n`
      markdown += 'Description: \n\n'

      lane.bars.forEach((bar: any) => {
        markdown += `### ${bar.title}\n`
        markdown += `- **Description**: ${bar.description}\n`
        markdown += `- **Start Date**: ${bar.startDate}\n`
        markdown += `- **Duration**: ${Math.round(bar.duration)} months\n\n`
      })
    })

    markdown += '## Milestones\n'
    data.markers.forEach((marker: any) => {
      markdown += `- **${marker.title}**: ${marker.markerDate}\n`
    })

    return markdown
  }

  // const source = node.attrs?.parameters?.source
  // const title = source ? JSON.parse(decodeURIComponent(source)).title : 'Extension'
  // return `\n> 📅 **${title}** (roadmap intégrée)\n`
  console.warn('Unhandled extension')
  return ''
}

function parseNode(node: AtlassianNode): string {
  const handler = handleNode(node)
  if (!handler && node.type !== 'paragraph') {
    // paragraph type without content are used like <br />
    console.warn(`parseNode :: Unhandled node type: ${node.type}`)
    return ''
  }
  return handler
}
