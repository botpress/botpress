import type * as client from '@botpress/client'
import type * as typeUtils from '../../utils/type-utils'
import type * as commonTypes from '../common'

export type WorkflowProxy<TBot extends commonTypes.BaseBot = commonTypes.BaseBot> = Readonly<{
  [TWorkflowName in typeUtils.StringKeys<TBot['workflows']>]: Readonly<{
    startNewInstance: (
      x: Pick<client.ClientInputs['createWorkflow'], 'conversationId' | 'userId' | 'timeoutAt'> & {
        tags?: typeUtils.AtLeastOneProperty<TBot['workflows'][TWorkflowName]['tags']>
        input: TBot['workflows'][TWorkflowName]['input']
      }
    ) => Promise<
      Readonly<
        Omit<client.ClientOutputs['createWorkflow'], 'workflow'> & {
          workflow: WorkflowWithUtilities<TBot, TWorkflowName>
        }
      >
    >

    listInstances: Readonly<{
      all: _ListInstances<TBot, TWorkflowName>
      running: _ListInstances<TBot, TWorkflowName>
      scheduled: _ListInstances<TBot, TWorkflowName>
      allFinished: _ListInstances<TBot, TWorkflowName>
      succeeded: _ListInstances<TBot, TWorkflowName>
      cancelled: _ListInstances<TBot, TWorkflowName>
      timedOut: _ListInstances<TBot, TWorkflowName>
      failed: _ListInstances<TBot, TWorkflowName>
    }>
  }>
}>

type _ListInstances<TBot extends commonTypes.BaseBot, TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>> = (
  x?: Pick<client.ClientInputs['listWorkflows'], 'nextToken' | 'conversationId' | 'userId'> & {
    tags?: typeUtils.AtLeastOneProperty<TBot['workflows'][TWorkflowName]['tags']>
  }
) => Promise<
  Readonly<
    Omit<client.ClientOutputs['listWorkflows'], 'workflows'> & {
      workflows: WorkflowWithUtilities<TBot, TWorkflowName>[]
    }
  >
>

export type WorkflowWithUtilities<
  TBot extends commonTypes.BaseBot,
  TWorkflowName extends keyof TBot['workflows'],
> = Readonly<
  client.Workflow & {
    name: TWorkflowName
    input: typeUtils.Cast<TBot['workflows'][TWorkflowName], commonTypes.IntegrationInstanceActionDefinition>['input']
    output: Partial<
      typeUtils.Cast<TBot['workflows'][TWorkflowName], commonTypes.IntegrationInstanceActionDefinition>['output']
    >
    tags: Partial<TBot['workflows'][TWorkflowName]['tags']>

    /**
     * Updates the current workflow instance
     */
    update(
      x: typeUtils.AtLeastOneProperty<
        Pick<client.ClientInputs['updateWorkflow'], 'userId' | 'timeoutAt'> & {
          tags?: typeUtils.AtLeastOneProperty<TBot['workflows'][TWorkflowName]['tags']>
          output?: typeUtils.Cast<
            TBot['workflows'][TWorkflowName],
            commonTypes.IntegrationInstanceActionDefinition
          >['output']
        }
      >
    ): Promise<{ workflow: WorkflowWithUtilities<TBot, TWorkflowName> }>

    /**
     * Marks the current workflow instance as failed and stops execution
     */
    setFailed(
      x: Required<Pick<client.ClientInputs['updateWorkflow'], 'failureReason'>>
    ): Promise<{ workflow: WorkflowWithUtilities<TBot, TWorkflowName> }>

    /**
     * Marks the current workflow instance as completed and stops execution
     */
    setCompleted(x?: {
      output?: typeUtils.Cast<
        TBot['workflows'][TWorkflowName],
        commonTypes.IntegrationInstanceActionDefinition
      >['output']
    }): Promise<{ workflow: WorkflowWithUtilities<TBot, TWorkflowName> }>

    /**
     * Discards all output data and cancels the current workflow instance
     */
    cancel(): Promise<{ workflow: WorkflowWithUtilities<TBot, TWorkflowName> }>
  }
>
