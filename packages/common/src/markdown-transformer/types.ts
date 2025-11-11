import {
  Blockquote,
  Break,
  Code,
  Delete,
  Emphasis,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Node,
  Paragraph,
  Root,
  Strong,
  Table,
  TableCell,
  Text,
  ThematicBreak,
} from 'mdast'

export type NodeHandler<N extends Node> = (
  node: N,
  visit: (node: RootNodes) => string,
  parents: RootNodes[],
  handlers: MarkdownHandlers
) => string

export type MarkdownHandlers = {
  blockquote: NodeHandler<Blockquote>
  break: NodeHandler<Break>
  code: NodeHandler<Code>
  delete: NodeHandler<Delete>
  emphasis: NodeHandler<Emphasis>
  footnoteDefinition: NodeHandler<FootnoteDefinition>
  footnoteReference: NodeHandler<FootnoteReference>
  heading: NodeHandler<Heading>
  html: NodeHandler<Html>
  image: NodeHandler<Image>
  inlineCode: NodeHandler<InlineCode>
  link: NodeHandler<Link>
  list: NodeHandler<List>
  paragraph: NodeHandler<Paragraph>
  strong: NodeHandler<Strong>
  table: NodeHandler<Table>
  text: NodeHandler<Text>
  thematicBreak: NodeHandler<ThematicBreak>
}

export type RootNodes =
  | Blockquote
  | Delete
  | Emphasis
  | FootnoteDefinition
  | Heading
  | List
  | ListItem
  | Paragraph
  | Root
  | Strong
  | Table
  | TableCell
