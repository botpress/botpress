/**
 * Component Snippet is a piece of flow you can integrate into your flow.
 */
export default interface ComponentSnippet {
  /** An identifier for the skill. Use only a-z_- characters. */
  id: string
  /** The name that will be displayed in the toolbar for the skill */
  name: string
  flowGenerator: () => Promise<any>
}
