import ActionVariables from './action-vars-provider'
import ExecuteVariables from './execute-vars-provider'
import NLUProvider from './nlu-provider'

export default [new ActionVariables(), new NLUProvider(), new ExecuteVariables()]
