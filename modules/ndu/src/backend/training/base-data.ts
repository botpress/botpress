import { Features } from '../typings'

import { ActionType } from './trainer'

export const BASE_DATA: [Partial<Features>, ActionType][] =
  /*
  Online Helper Tool was used to generate this data
  Top menu > Botpress > Generate JSON
  https://docs.google.com/spreadsheets/d/1huaK8xIVFkqNAm8J6cBWCMJU3JKUXMc10xz3v521_MA/edit#gid=0 */

  [
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 1,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 1,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 1,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 1,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'node_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 1,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 1,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 1,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.6,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.6,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.6,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.6,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'node_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.6,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.6,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_inside_wf'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.6,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'wf_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.4,
        conf_faq_trigger_inside_topic: 0.6,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: true,
        last_turn_action_name: 'faq_trigger_inside_topic',
        last_turn_same_highest_ranking_trigger_id: true
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0.6,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0.4,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: true,
        last_turn_action_name: 'faq_trigger_inside_topic',
        last_turn_same_highest_ranking_trigger_id: true
      },
      'wf_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.6,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0.4,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: true,
        last_turn_action_name: 'faq_trigger_outside_topic',
        last_turn_same_highest_ranking_trigger_id: true
      },
      'wf_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.5,
        conf_faq_trigger_inside_topic: 0.5,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: true,
        last_turn_action_name: 'faq_trigger_outside_topic',
        last_turn_same_highest_ranking_trigger_id: true
      },
      'faq_trigger_inside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 1,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: 'faq_trigger_outside_topic',
        last_turn_same_highest_ranking_trigger_id: true
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.66,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0.33,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: 'wf_trigger_outside_topic',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 0,
        conf_faq_trigger_outside_topic: 0.66,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0.33,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: 'wf_trigger_inside_topic',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_contextual_trigger: 1,
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'contextual_trigger'
    ],
    [
      {
        conf_contextual_trigger: 1,
        conf_faq_trigger_outside_topic: 0.3,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0.33,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: '',
        last_turn_same_highest_ranking_trigger_id: false
      },
      'contextual_trigger'
    ]
  ]
