import { Button, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import React, { Fragment } from 'react'

import ToolTip from '../../../../ui-shared-lite/ToolTip'
import { lang } from '../../translations'
import Dropdown from '../../Dropdown'
import Icons from '../../Icons'

import style from './style.scss'
import { convertToTags } from './utils'

const isValidJson = value => {
  try {
    JSON.parse(value)
    return true
  } catch (err) {
    return false
  }
}

const SingleSuperInput = ({
  canPickEvents,
  canPickVariables,
  events,
  variables,
  onAddVariable,
  eventsDesc,
  value,
  onBlur
}) => {
  const getTagHtml = () => {
    let tag
    const strValue = value?.toString() || ''
    const processedValue =
      strValue &&
      convertToTags(strValue)
        .replace('[[', '')
        .replace(']]', '')

    if (isValidJson(processedValue)) {
      tag = value && JSON.parse(processedValue)
    }

    return (
      tag?.prefix && (
        <span contentEditable={false} title={tag.value} tabIndex={-1} className="tagify__tag">
          <span>
            <Icon icon={tag.prefix === '$' ? 'dollar' : <Icons.Brackets iconSize={10} />} iconSize={10} />
            <span className="tagify__tag-text">{tag.value}</span>
          </span>
        </span>
      )
    )
  }

  const onKeyDown = e => {
    e.preventDefault()

    if (e.key === 'Backspace') {
      onBlur?.('')
    }
  }

  const filterDropdown = (query, options) => {
    const addOption = [] as any[]
    if (
      query &&
      !options.find(option => {
        return query.toLowerCase() === option.label.toLowerCase() || query.toLowerCase() === option.value
      })
    ) {
      addOption.push({
        label: query,
        type: 'add',
        value: query
      })
    }

    return [
      ...addOption,
      ...options.filter(option => `${option.label.toLowerCase()} ${option.value}`.indexOf(query.toLowerCase()) > -1)
    ]
  }

  const customItemRenderer = (option, { handleClick, modifiers }) => {
    const isAdding = option.type === 'add'

    if (!modifiers.matchesPredicate) {
      return null
    }

    const label = isAdding ? (
      <Fragment>
        <Icon icon="plus" iconSize={12} />
        {lang('create')} "{option.label}"
      </Fragment>
    ) : (
      option.label
    )

    return (
      <div
        key={option.value}
        onClick={handleClick}
        className={cx('tagify__dropdown__item', {
          [style.addingItem]: isAdding,
          ['tagify__dropdown__item--active']: modifiers.active
        })}
      >
        {label}
        <span className="description">{eventsDesc?.[option.value] || ''}</span>
      </div>
    )
  }

  return (
    <div className={style.superInputWrapper}>
      <div className={style.singularTagBtnWrapper}>
        {canPickEvents && (
          <Dropdown
            items={events.map(name => ({ value: name, label: name }))}
            filterPlaceholder={lang('search')}
            customItemRenderer={customItemRenderer}
            onChange={({ value }) => {
              onBlur?.(`{{${value}}}`)
            }}
          >
            <ToolTip content={lang('superInput.insertValueFromEvent')} hoverOpenDelay={300}>
              <Button className={style.btn} icon={<Icons.Brackets />} />
            </ToolTip>
          </Dropdown>
        )}
        {canPickVariables && (
          <Dropdown
            items={variables.map(name => ({ value: name, label: name }))}
            filterPlaceholder={lang('search')}
            filterList={filterDropdown}
            customItemRenderer={customItemRenderer}
            onChange={({ value }) => {
              onAddVariable(value, variables)
              onBlur?.(`$${value}`)
            }}
          >
            <ToolTip content={lang('superInput.insertValueFromVariables')} hoverOpenDelay={300}>
              <Button className={style.btn} icon="dollar" />
            </ToolTip>
          </Dropdown>
        )}
      </div>
      <div className={style.superInput} onKeyDown={onKeyDown} contentEditable suppressContentEditableWarning>
        {getTagHtml()}
      </div>
    </div>
  )
}

export default SingleSuperInput
