import axios from 'axios'
import sdk from 'botpress/sdk'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { deleteEntity, refreshEntities, setActiveFormItem } from '~/actions'
import { ActiveFormItem } from '~/reducers/flows'

import ComplexForm from './ComplexForm'
import EnumForm from './EnumForm'
import PatternForm from './PatternForm'

interface Props {
  customKey: string
  defaultLang: string
  contentLang: string
  formData: sdk.NLU.EntityDefinition
  variables: Variables
  entities: sdk.NLU.EntityDefinition[]
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

  const allProps = { ...props, updateEntity, deleteEntity, updateFormItem }

  switch (props.formData?.type) {
    case 'pattern':
      return <PatternForm {...allProps} />
    case 'list':
      return <EnumForm allEntities={props.entities.filter(e => e.type === 'list')} {...allProps} />
    case 'complex':
      return <ComplexForm {...allProps} />
  }
}

const mapStateToProps = state => ({
  entities: state.nlu.entities
})

export default connect(mapStateToProps, { refreshEntities, deleteEntity, setActiveFormItem })(VariableForm)
