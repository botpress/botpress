import _ from 'lodash'
import { MarkJSON, NodeJSON, TextJSON, Value, ValueJSON } from 'slate'

// this mess i temporary...
import { ParsedSlot, parseUtterance } from '../../../../../../src/bp/nlu-core/utterance/utterance-parser'

export const SLOT_MARK = 'slotName'

const textNode = (text: string, from: number, to: number | undefined = undefined): TextJSON => ({
  object: 'text',
  text: text.slice(from, to),
  marks: []
})

const slotNode = (slot: ParsedSlot, uttIdx: number): TextJSON => ({
  object: 'text',
  text: slot.value,
  marks: [makeSlotMark(slot.name, uttIdx)]
})

export const textNodesFromUtterance = (rawUtterance: string, idx: number = 0): TextJSON[] => {
  const { utterance, parsedSlots } = parseUtterance(rawUtterance)
  return _.chain(parsedSlots)
    .flatMap((pslot, i, all) => {
      const from = _.get(all, `${i - 1}.cleanPosition.end`, 0)
      const to = pslot.cleanPosition.start
      return [textNode(utterance, from, to), slotNode(pslot, idx)]
    })
    .thru(nodes => {
      // append remaining
      const start = _.get(_.last(parsedSlots), 'cleanPosition.end', 0)
      return [...nodes, textNode(utterance, start)]
    })
    .filter(n => n.text)
    .value() as TextJSON[]
}

export const utterancesToValue = (utterances: string[], selection = undefined) => {
  const summary = utterances[0] || ''
  const rest = utterances.length > 1 ? utterances.slice(1) : ['']

  const value: ValueJSON = {
    object: 'value',
    document: {
      object: 'document',
      nodes: [
        {
          object: 'block',
          type: 'title',
          data: {},
          nodes: textNodesFromUtterance(summary, 0)
        },
        ...rest.map((text: string, i: number) => ({
          object: 'block',
          type: 'paragraph',
          data: {},
          nodes: textNodesFromUtterance(text, i + 1)
        }))
      ] as NodeJSON[]
    }
  }
  if (selection) {
    value['selection'] = selection
  }
  return Value.fromJS(value)
}

export const valueToUtterances = value => {
  return value
    .getIn(['document', 'nodes'])
    .map(block =>
      block.nodes.reduce((utt: string, node, idx: number) => {
        let value = node.get('text')
        if (node.marks.size > 0) {
          const slot = node.marks.first().data.get(SLOT_MARK)
          return `${utt}[${value}](${slot})`
        }

        if (idx + 1 >= block.nodes.size) {
          value = value.trimEnd()
        }

        return `${utt}${value}`
      }, '')
    )
    .filter(_.identity)
    .toJS()
}

export const removeSlotFromUtterances = (utterances: string[], slotName: string) => {
  const regex = new RegExp(`\\[([^\\[\\]\\(\\)]+?)\\]\\(${slotName}\\)`, 'gi')

  return utterances.map(u => u.replace(regex, '$1'))
}

export const renameSlotInUtterances = (utterances: string[], prevSlotName: string, newSlotName: string) => {
  const regex = new RegExp(`\\[([^\\(\\)\\[\\]]+?)\\]\\(${prevSlotName}\\)`, 'gi')

  return utterances.map(u => u.replace(regex, `[$1](${newSlotName})`))
}

export const makeSlotMark = (slotName: string, utteranceIdx: number): MarkJSON => ({
  object: 'mark',
  type: 'slot',
  data: { [SLOT_MARK]: slotName, utteranceIdx }
})
