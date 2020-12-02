export interface Config {
    /**
     * Security configurations
     */
  security: {
    /**
     * Weather or not to escape plain html payload
     * @default false
     */
    escapeHTML: boolean
  }
}
