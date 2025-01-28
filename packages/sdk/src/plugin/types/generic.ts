import { BaseIntegration, DefaultIntegration, InputBaseIntegration } from '../../integration/types/generic'
import { BaseInterface, InputBaseInterface, DefaultInterface } from '../../interface/types/generic'
import * as utils from '../../utils/type-utils'

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

export type BasePlugin = {
  configuration: any
  integrations: Record<string, BaseIntegration>
  interfaces: Record<string, BaseInterface>
  events: Record<string, any>
  states: Record<string, any>
  actions: Record<string, BaseAction>
  tables: Record<string, BaseTable>
}

export type InputBasePlugin = utils.DeepPartial<BasePlugin>
export type DefaultPlugin<B extends utils.DeepPartial<BasePlugin>> = {
  configuration: utils.Default<B['configuration'], BasePlugin['configuration']>
  events: utils.Default<B['events'], BasePlugin['events']>
  states: utils.Default<B['states'], BasePlugin['states']>
  actions: utils.Default<B['actions'], BasePlugin['actions']>
  tables: utils.Default<B['tables'], BasePlugin['tables']>
  integrations: undefined extends B['integrations']
    ? BasePlugin['integrations']
    : {
        [K in keyof B['integrations']]: DefaultIntegration<utils.Cast<B['integrations'][K], InputBaseIntegration>>
      }
  interfaces: undefined extends B['interfaces']
    ? BasePlugin['interfaces']
    : {
        [K in keyof B['interfaces']]: DefaultInterface<utils.Cast<B['interfaces'][K], InputBaseInterface>>
      }
}
