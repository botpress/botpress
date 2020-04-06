import { Features } from './typings'

export const BASE_DATA: [Partial<Features>, string][] =
  /*
  Online Helper Tool was used to generate this data
  Top menu > Botpress > Generate JSON
  https://docs.google.com/spreadsheets/d/1huaK8xIVFkqNAm8J6cBWCMJU3JKUXMc10xz3v521_MA/edit#gid=0 */

  [
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 1,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_inside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 1,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 1,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 1,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'node_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 1,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_inside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 0,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 1,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0,
        conf_faq_trigger_inside_topic: 0,
        conf_faq_trigger_parameter: 0,
        conf_wf_trigger_outside_topic: 1,
        conf_wf_trigger_inside_topic: 0,
        conf_wf_trigger_inside_wf: 0,
        conf_node_trigger_inside_wf: 0,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_outside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.6,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_inside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.6,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.6,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'faq_trigger_outside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.6,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'node_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.6,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_inside_topic'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.2,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.6,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_inside_wf'
    ],
    [
      {
        conf_faq_trigger_outside_topic: 0.2,
        conf_faq_trigger_inside_topic: 0.2,
        conf_faq_trigger_parameter: 0.2,
        conf_wf_trigger_outside_topic: 0.6,
        conf_wf_trigger_inside_topic: 0.2,
        conf_wf_trigger_inside_wf: 0.2,
        conf_node_trigger_inside_wf: 0.2,
        last_turn_since: 0,
        last_turn_same_node: false,
        last_turn_action_name: ''
      },
      'wf_trigger_outside_topic'
    ]
  ]
