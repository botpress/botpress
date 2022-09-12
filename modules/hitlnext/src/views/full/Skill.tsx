import { FormGroup, NumericInput, Checkbox, MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'
import { Collapsible, EmptyState, isOperationAllowed, lang, PermissionOperation } from 'botpress/shared'

import _ from 'lodash'
import React, { useState, FC, useEffect } from 'react'
import { SkillData, SkillProps } from '../../types'

const TagMultiSelect = MultiSelect.ofType<string>()

const Skill: FC<SkillProps<SkillData>> = ({ bp, onDataChanged, onValidChanged, initialData }) => {
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [timeoutDelay, setTimeoutDelay] = useState(0)
  const [redirectNoAgent, setRedirectNoAgent] = useState(false)

  async function handleSelect(tag: string) {
    if (isSelected(tag)) {
      return
    }

    const updated = [...selectedTags, tag]

    setSelectedTags(updated)
  }

  async function handleRemove(_value: string, index: number) {
    const updated = _.filter(selectedTags, (_, i) => i !== index)

    setSelectedTags(updated)
  }

  function filterTag(query: string, item: string) {
    return item.toLowerCase().indexOf(query.toLowerCase()) >= 0
  }

  function renderTag(tag: string) {
    return tag
  }

  function renderItem(tag: string, { modifiers, handleClick }) {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={isSelected(tag)}
        icon={isSelected(tag) ? 'tick' : 'blank'}
        onClick={handleClick}
        key={tag}
        text={tag}
      />
    )
  }

  function isSelected(tag: string) {
    return selectedTags.includes(tag)
  }

  useEffect(() => {
    if (_.isEmpty(initialData)) {
      return
    }

    setTimeoutDelay(initialData.timeoutDelay)
    setRedirectNoAgent(initialData.redirectNoAgent)
    setSelectedTags(initialData.selectedTags)
  }, [])

  useEffect(() => {
    bp.axios.get('/mod/hitlnext/config').then(({ data: config }) => {
      if (config && config.tags) {
        setTags(config.tags)
      }
    })
  }, [])

  useEffect(() => {
    onDataChanged({
      timeoutDelay,
      redirectNoAgent,	
      selectedTags
    })

    onValidChanged(true)
  }, [timeoutDelay, redirectNoAgent, selectedTags])

  return (
    <div>
      <FormGroup
        label="Delay before the user times out waiting for an agent (in seconds)"
        helperText="Once this delay is exceeded, the agent request is aborted (0 = never timeouts)"
      >
        <NumericInput min={0} max={9999999} onValueChange={value => setTimeoutDelay(value)} value={timeoutDelay} />
      </FormGroup>

      <FormGroup
        label="Auto tag"
        helperText="Automatically assigns the selected tags to the handoff when it is created"
        style={{ maxWidth: '600px' }}
      >
        <TagMultiSelect
          fill={true}
          placeholder={lang.tr('module.hitlnext.tags.placeholder')}
          noResults={<MenuItem disabled={true} text={lang.tr('module.hitlnext.tags.noResults')} />}
          items={tags}
          selectedItems={selectedTags}
          itemRenderer={renderItem}
          itemPredicate={filterTag}
          onItemSelect={handleSelect}
          tagRenderer={renderTag}
          tagInputProps={{ onRemove: handleRemove, disabled: _.isEmpty(tags) }}
        />
      </FormGroup>

      <FormGroup>
        <Checkbox
          label="Send user to another node if no agent is online"
          checked={redirectNoAgent}
          onChange={e => setRedirectNoAgent(e.currentTarget.checked)}
        ></Checkbox>
      </FormGroup>
    </div>
  )
}

export default Skill
