export interface Config {
  /**
   * When true, actions in the global folder are also accessible
   * @default false
   */
  allowGlobal: boolean
  /**
   * When enabled, actions & hooks created by Botpress will also be available in the UI
   * @default false
   */
  includeBuiltin: boolean
  /**
   * When enabled, bot configurations are also editable on the UI
   * @default false
   */
  includeBotConfig: boolean
}
