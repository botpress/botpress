import * as sdk from 'botpress/sdk'
import { UnderstandingEngine } from './ndu-engine'

export interface MountedBots {
  [key: string]: UnderstandingEngine
}

export interface Features {
  current_workflow_id: string
  current_node_id: string
  current_highest_ranking_trigger_id: string
  conf_faq_trigger_outside_topic: number
  conf_faq_trigger_inside_topic: number
  conf_faq_trigger_parameter: number
  conf_wf_trigger_inside_topic: number
  conf_wf_trigger_outside_topic: number
  conf_wf_trigger_inside_wf: number
  conf_node_trigger_inside_wf: number
  last_turn_since: number
  last_turn_action_name: string
  last_turn_same_node: boolean
  last_turn_same_highest_ranking_trigger_id: boolean
}
