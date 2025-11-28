import { List, ListItem, Node, TableCell, Nodes, TableRow, Parent } from 'mdast'

export type Merge<T, R> = Omit<T, keyof R> & R

export type NodeHandler<Type extends Node | Nodes['type'] = Nodes['type']> = (
  node: Type extends Node ? Type : Extract<Nodes, { type: Type }>,
  visit: (node: Parent) => string,
  parents: Parent[],
  handlers: MarkdownHandlers,
  state: Record<string, unknown>
) => string

export type MarkdownHandlers = Partial<
  Merge<
    { [Type in Nodes['type']]: NodeHandler<Type> },
    {
      listItem: NodeHandler<ExtendedListItem>
      list: NodeHandler<ExtendedList>
      tableRow: NodeHandler<ExtendedTableRow>
      tableCell: NodeHandler<ExtendedTableCell>
    }
  >
>

// ===== Node Property Extensions ====
export type ExtendedList = Merge<
  List,
  {
    listLevel: number
    children: ExtendedListItem[]
  }
>
export type ExtendedListItem = ListItem & {
  checked: boolean | null
  /** One Based Index */
  itemCount: number
  ownerList: ExtendedList
}
export type ExtendedTableRow = Merge<
  TableRow,
  {
    isHeader?: boolean
    children: ExtendedTableCell[]
  }
>
export type ExtendedTableCell = TableCell & {
  isHeader?: boolean
  /** If it's the first cell in the row */
  isFirst: boolean
  /** If it's the last cell in the row */
  isLast: boolean
}
