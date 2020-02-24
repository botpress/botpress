export interface Config {
  /**
   * Wheter the module is enabled or not.
   * @default true
   */
  enabled: boolean
  /**
   * The interval between each analytics round.
   * @default 30m
   */
  interval: string
}
