import { FormMoreInfo } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { Fragment } from 'react'

import { lang } from '../../translations'
import style from '../style.scss'

import { createEmptyDataFromSchema } from './fields'

export const printMoreInfo = (moreInfo: FormMoreInfo, isCheckbox = false): JSX.Element | undefined => {
  if (!moreInfo) {
    return
  }

  const { url, label } = moreInfo
  if (url) {
    return (
      <a className={cx(style.moreInfo, { [style.isCheckbox]: isCheckbox })} href={url} target="_blank">
        {lang(label)}
      </a>
    )
  }

  return <p className={cx(style.moreInfo, { [style.isCheckbox]: isCheckbox })}>{lang(label)}</p>
}

export const changeEmptyStrToNull = data => {
  return (data && loopThroughData(data)) || {}
}

const loopThroughData = data => {
  return Object.keys(data).reduce((acc, key) => {
    const currentData = data[key]
    let newValue = currentData === '' ? null : currentData

    if (_.isArray(currentData)) {
      newValue = currentData.map(item => {
        if (_.isObject(item)) {
          return loopThroughData(item)
        } else {
          return item
        }
      })
    } else if (_.isObject(currentData)) {
      newValue = loopThroughData(currentData)
    }

    return { ...acc, [key]: newValue }
  }, {})
}

const VARIABLES_REGEX = /(\$[^(\s|\$|\{{)]+)/im
const EVENT_REGEX = /\{\{(.*?)\}\}/im

export const formReducer = (state, action) => {
  if (action.type === 'add') {
    const { field, parent, currentLang, onUpdate } = action.data
    const newData = createEmptyDataFromSchema([...(field.fields || [])], currentLang)

    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field.key] = [...(updatedItem[index][field.key] || []), newData]

      const newState = {
        ...state,
        [key]: updatedItem
      }
      onUpdate?.(newState)
      return newState
    }

    const newState = {
      ...state,
      [field.key]: [...(state[field.key] || []), newData]
    }

    onUpdate?.(newState)
    return newState
  } else if (action.type === 'deleteGroupItem') {
    const { deleteIndex, field, onUpdate, parent } = action.data

    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field] = [...updatedItem[index][field]?.filter((item, index) => index !== deleteIndex)]

      return {
        ...state,
        [key]: updatedItem
      }
    }

    const newState = {
      ...state,
      [field]: [...state[field].filter((item, index) => index !== deleteIndex)]
    }
    onUpdate?.(newState)
    return newState
  } else if (action.type === 'updateField') {
    const { field, type, parent, onUpdate, lang, newFormData } = action.data
    let { value } = action.data

    if (type === 'number') {
      value = value !== '' ? Number(value) : undefined
    }

    if (parent) {
      const { key, index } = parent
      const getArray = [key, index, field]

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        getArray.unshift(parent.parent.key, parent.parent.index)
      }

      if (lang) {
        value = { ..._.get(state, getArray), [lang]: value }
      }

      _.set(state, getArray, value)

      const newState = {
        ...newFormData,
        ...state
      }

      onUpdate?.(changeEmptyStrToNull(newState))
      return newState
    }

    if (lang) {
      value = { ...(state[field] || {}), [lang]: value }
    }

    const newState = {
      ...newFormData,
      ...state,
      [field]: value
    }

    onUpdate?.(changeEmptyStrToNull(newState))
    return { ...newState }
  } else if (action.type === 'updateOverridableField') {
    const { value, field, parent, onUpdate, newFormData } = action.data
    if (parent) {
      const { index } = parent
      const getArray = [index, field]

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        getArray.unshift(parent.parent.key, parent.parent.index)
      }

      _.set(state, getArray, value)

      const newState = {
        ...newFormData,
        ...state
      }

      onUpdate?.(changeEmptyStrToNull(newState))
      return newState
    }

    const newState = {
      ...newFormData,
      ...state,
      ...value
    }

    onUpdate?.(changeEmptyStrToNull(newState))
    return { ...newState }
  } else if (action.type === 'setData') {
    return {
      ...state,
      ...action.data
    }
  } else {
    throw new Error("That action type isn't supported.")
  }
}
