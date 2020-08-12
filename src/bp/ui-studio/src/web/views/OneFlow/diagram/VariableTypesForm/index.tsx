import axios from 'axios'
import sdk from 'botpress/sdk'
import { RightSidebar } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { deleteEntity, refreshEntities, setActiveFormItem } from '~/actions'
import { ActiveFormItem } from '~/reducers/flows'

import style from '../PromptForm/style.scss'

import EnumForm from './EnumForm'
import PatternForm from './PatternForm'

interface Props {
  customKey: string
  contentLang: string
  formData: sdk.NLU.EntityDefinition
  close: () => void
  deleteEntity: (entityId: string) => void
  refreshEntities: () => void
  setActiveFormItem: (data: ActiveFormItem) => void
}

export const getEntityId = (entityName: string) =>
  entityName
    .trim()
    .toLowerCase()
    .replace(/[\t\s]/g, '-')

const VariableForm: FC<Props> = props => {
  const updateEntity = _.debounce(async (originalId: string, entity) => {
    if (entity.name) {
      await axios.post(`${window.BOT_API_PATH}/nlu/entities/${originalId}`, entity)
      props.refreshEntities()
    }
  }, 100)

  const deleteEntity = async (entityId: string) => {
    props.deleteEntity(entityId)
    props.refreshEntities()
    props.close()
  }

  const updateFormItem = (data: sdk.NLU.EntityDefinition) => {
    props.setActiveFormItem({ type: 'variableType', data })
  }
  const defaultProps = { updateEntity, deleteEntity, updateFormItem }
  if (props.formData.type === 'pattern') {
    const patternProps = { ...props, ...defaultProps }
    return <PatternForm {...patternProps} />
  } else {
    // @ts-ignore
    const listEntities = props.entities.filter(e => e.type === 'list')
    const enumProps = { ...props, ...defaultProps }
    // @ts-ignore
    return <EnumForm allEntities={listEntities} {...enumProps} />
  }
}

const mapStateToProps = state => ({
  entities: state.nlu.entities
})

export default connect(mapStateToProps, { refreshEntities, deleteEntity, setActiveFormItem })(VariableForm)
