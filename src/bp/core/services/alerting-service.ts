import { injectable } from 'inversify'
import _ from 'lodash'

export interface Incident {
  id: string
  ruleName: string
  hostName: string
  startTime: Date
  endTime?: Date
  triggerValue: number
}

export type Aggregation = 'avg' | 'sum' | 'min' | 'max' | 'last' | 'count'
export type Operand = 'equalOrLessThan' | 'equalOrMoreThan'

export interface IncidentRule {
  name: string
  field: string
  aggregation: Aggregation
  operand: Operand
  value: number
  /** This is the timeframe used for the calculation of the selected value */
  timeframe: string
  /**
   * When an incident is resolved, this delay must be elapsed before a new incident is triggered for the same rule/host
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
