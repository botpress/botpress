import { injectable } from 'inversify'
import _ from 'lodash'

export type Aggregation = 'avg' | 'sum' | 'min' | 'max' | 'last' | 'count'
export type Operand = 'equalOrLessThan' | 'equalOrMoreThan'

export interface IncidentRule {
  /**
   * @title Name
   */
  name: string
  /**
   * @title Field
   */
  field: string
  aggregation: Aggregation
  operand: Operand
  value: number
  /**
   * @title Time Frame
   * @description This is the timeframe used for the calculation of the selected value
   */
  timeframe: string
  /**
   * @title Cooldown Period
   * @description When an incident is resolved, this delay must be elapsed before a new incident is triggered for the same rule/host
   */
  cooldown?: string
}

export interface AlertingService {
  getIncidents(dateFrom, dateTo)
  start(): void
  stop(): void
}

@injectable()
export class CEAlertingService implements AlertingService {
  async getIncidents(dateFrom, dateTo) {}
  start(): void {}
  stop(): void {}
}
