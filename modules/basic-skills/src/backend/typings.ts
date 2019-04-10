export interface Transition {
  /**
   * The description of the skill transition
   */
  caption: string
  /**
   * The transition condition to evaluate
   */
  condition: string
  /**
   * The target node to transition to
   */
  node: string
}
