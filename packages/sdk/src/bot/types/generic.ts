import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/types/generic'
import * as utils from '../../utils/type-utils'

export * from '../../integration/types/generic'

export type BaseAction = {
  input: any
  output: any
}

export type BaseTable = {
  // This type is equivalent to Exclude<Client.Table, 'id' | 'createdAt' | 'updatedAt'>

  /**
   * Required. This name is used to identify your table.
   */
  name: string
  /**
   * The 'factor' multiplies the row's data storage limit by 4KB and its quota count, but can only be set at table creation and not modified later. For instance, a factor of 2 increases storage to 8KB but counts as 2 rows in your quota. The default factor is 1.
   */
  factor?: number
  /**
   * A table designated as "frozen" is immutable in terms of its name and schema structure; modifications to its schema or a renaming operation are not permitted. The only action that can be taken on such a table is deletion. The schema established at the time of creation is locked in as the final structure. To implement any changes, the table must be duplicated with the desired alterations.
   */
  frozen?: boolean
  schema: {
    $schema?: string
    /**
     * List of keys/columns in the table.
     */
    properties: {
      [k: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
        format?: 'date-time'
        description?: string
        /**
         * String properties must match this pattern
         */
        pattern?: string
        /**
         * String properties must be one of these values
         */
        enum?: string[]
        /**
         * Defines the shape of items in an array
         */
        items?: {
          type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
          [k: string]: any
        }
        nullable?: boolean
        properties?: {
          [k: string]: {
            type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
            [k: string]: any
          }
        }
        'x-zui': {
          index: number
          /**
           * Indicates if the column is vectorized and searchable.
           */
          searchable?: boolean
          /**
           * Indicates if the field is hidden in the UI
           */
          hidden?: boolean
          /**
           * Order of the column in the UI
           */
          order?: number
          /**
           * Width of the column in the UI
           */
          width?: number
          computed?: {
            action: 'ai' | 'code' | 'workflow'
            dependencies?: string[]
            /**
             * Prompt when action is "ai"
             */
            prompt?: string
            /**
             * Code to execute when action is "code"
             */
            code?: string
            /**
             * Model to use when action is "ai"
             */
            model?: string
            /**
             * ID of Workflow to execute when action is "workflow"
             */
            workflowId?: string
            enabled?: boolean
          }
        }
      }
    }
    /**
     * Additional properties can be provided, but they will be ignored if no column matches.
     */
    additionalProperties: true
    /**
     * Array of required properties.
     */
    required?: string[]
    type: 'object'
  }
  /**
   * Optional tags to help organize your tables. These should be passed here as an object representing key/value pairs.
   */
  tags?: {
    [k: string]: string
  }
  /**
   * Indicates if the table is enabled for computation.
   */
  isComputeEnabled?: boolean
}

export type BaseBot = {
  integrations: Record<string, BaseIntegration>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>
  tables: Record<string, BaseTable>
}

export type InputBaseBot = utils.DeepPartial<BaseBot>
export type DefaultBot<B extends InputBaseBot> = {
  events: utils.Default<B['events'], BaseBot['events']>
  states: utils.Default<B['states'], BaseBot['states']>
  actions: utils.Default<B['actions'], BaseBot['actions']>
  integrations: undefined extends B['integrations']
    ? BaseBot['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
  tables: utils.Default<B['tables'], BaseBot['tables']>
}
