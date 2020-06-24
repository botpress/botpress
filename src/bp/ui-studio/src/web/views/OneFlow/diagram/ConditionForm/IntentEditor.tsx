import React from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'

export default props => {
  const onUpdateParams = params => {
    props.onChange({ ...params })
  }

  return (
    <InjectedModuleView
      moduleName="nlu"
      componentName="LiteEditor"
      extraProps={{ ...props, updateParams: onUpdateParams, params: props.data || {} }}
    />
  )
}
