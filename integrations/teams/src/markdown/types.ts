import type { Node, LinkReference, Parent, Nodes, Definition, TableCell } from 'mdast'

export type Merge<T, R> = Omit<T, keyof R> & R

export type DefinitionNodeData = {
  identifier: string
  url: string
  label?: string | null
  title?: string | null
}

export type DefinedLinkReference = LinkReference & { linkDefinition?: DefinitionNodeData }
export type TableCellWithHeaderInfo = TableCell & { isHeader?: boolean }

export type NodeHandler<Type extends Node | Nodes['type'] = Nodes['type']> = (
  node: Type extends Node ? Type : Extract<Nodes, { type: Type }>,
  visit: (node: Parent) => string,
  parents: Parent[],
  handlers: MarkdownHandlers,
  definitions: Record<string, DefinitionNodeData>
) => string

export type MarkdownHandlers = Partial<
  Merge<
    { [Type in Nodes['type']]: NodeHandler<Type> },
    {
      linkReference: NodeHandler<DefinedLinkReference>
      tableCell: NodeHandler<TableCellWithHeaderInfo>
    }
  >
>

type Is<A, B> = A extends B ? (B extends A ? true : false) : false
type HasProperties<T, Assertion> = Is<Required<T>, Required<Pick<Assertion, Extract<keyof Assertion, keyof T>>>>
type Expect<_T extends true> = void

// This builds only if the Definition contains all properties of DefinitionNodeData
type _Test = Expect<HasProperties<DefinitionNodeData, Definition>>
