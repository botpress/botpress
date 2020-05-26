export interface TreeViewProps<T> {
  /** List of elements to display in the tree view */
  elements?: T[]
  /** Name of the property to use on elements to get the full path. Defaults to "path" */
  pathProps?: string
  /** Custom renderer to choose the label and the icon for the leaf node. Defaults to "label" */
  nodeRenderer?: ElementRenderer<T>
  /** Each / segments will be passed through this renderer to customize the display */
  folderRenderer?: ElementRenderer<string>
  /** Called after the tree has been built. Can be used to reorder elements before display */
  postProcessing?: PostProcessing<T>
  /** You can also parse nodes manually and provide them to the view */
  nodes?: TreeNode<T>[]
  /** Filters the displayed nodes (expands all folders when filtering) */
  filterText?: string
  /** The name of the property where to check the filter (Defaults to "path") */
  filterProps?: string
  /** The full paths of nodes which should be expanded */
  expandedPaths?: string[]
  /** Ensure that elements having "field" set to "value" are displayed (their parent will be expanded) */
  visibleElements?: { value: string; field: string }[]
  /** Whether or not to highlight the folder's name on click */
  highlightFolders?: boolean
  /** Node having "field" set to "value" to select programmatically */
  forceSelect?: { value: string; field: string }

  waitDoubleClick?: (element: T | string, elementType: ElementType) => number
  onDoubleClick?: (element: T | string, elementType: ElementType) => void
  onClick?: (element: T | string, elementType: ElementType) => undefined | boolean
  onContextMenu?: (element: T | string, elementType: ElementType) => JSX.Element | undefined
  onExpandToggle?: (path: string, isExpanded: boolean) => void
}

/** These are the default properties required if you want to avoid providing any renderers */
interface SampleElement {
  /** Text displayed on the child node */
  label: string
  /** The complete path of the element (including all folders) */
  path: string
}

type ElementType = 'document' | 'folder'

export type TreeNode<T> = ITreeNode<T> & {
  id: string
  type: string
  parent?: TreeNode<T>
  fullPath: string
  childNodes?: TreeNode<T>[]
}

type ElementRenderer<T> = (element: T) => { label: JSX.Element | string; icon?: any; name?: string }
type PostProcessing<T> = (nodes: TreeNode<T>[]) => TreeNode<T>[]

interface BuildTreeParams<T> {
  elements: T[]
  filterText?: string
  filterProps?: string
  nodeRenderer?: ElementRenderer<T>
  folderRenderer?: ElementRenderer<string>
  postProcessing?: PostProcessing<T>
  pathProps?: string
}
