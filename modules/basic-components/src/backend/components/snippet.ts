/**
 * Component Snippet is piece of flow you can integrate into your Flow.
 */
export default interface ComponentSnippet {
  /** An identifier for the skill. Use only a-z_- characters. */
  id: string
  /** The name that will be displayed in the toolbar for the skill */
  name: string
  /**
   * cat main.flow.json | jq '.nodes | .[] | select(has("skill") | not)'
   * cat main.flow.json | jq ".nodes[].name"
   * cat main.flow.json | jq ".nodes[].skill"
   * cat skills/* | jq ".skillData"
   *
   * @param skillData Provided by the skill view, those are fields edited by the user on the Flow Editor
   * @param metadata Some metadata automatically provided, like the bot id
   * @return The method should return
   */
  flowGenerator: () => Promise<any>
}
