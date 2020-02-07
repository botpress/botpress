import { DialogflowConfig } from './backend/typings'

export interface Config {
  /**
   * Specify the primary NLU engine that will be used by Botpress.
   *
   * NOTE: Botpress NLU always run and can't be disabled. If another NLU is specified as primary,
   * it will run after Botpress and will overwrite the prediction results.
   * @default 'botpress-nlu'
   */
  primary: 'botpress-nlu' | 'dialogflow-nlu'

  /**
   * Configuration of the Dialogflow NLU engine
   * @default null
   */
  dialogflow?: DialogflowConfig
}
