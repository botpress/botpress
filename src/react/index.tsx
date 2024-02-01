import React, { type FC } from 'react'
import { z } from 'zod'
import { BaseType, GlobalExtensionDefinition, UIExtension } from '../uiextensions'
import { zuiKey } from '../zui'

export type ZUIReactComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = GlobalExtensionDefinition,
> = FC<{
  type: Type
  id: ID
  params: z.infer<UI[Type][ID]['schema']>
}>

type AsBaseType<T> = T extends BaseType ? T : never

export type ZUIReactComponentLibrary<UI extends UIExtension = GlobalExtensionDefinition> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: ZUIReactComponent<AsBaseType<Type>, ID, UI>
  }
}

export const NotImplementedComponent: ZUIReactComponent<any, any> = ({ type, id }) => {
  return (
    <div>
      <p>
        {type} {id} not implemented
      </p>
    </div>
  )
}

export const NotFoundComponent: ZUIReactComponent<any, any> = ({ type, id }) => {
  return (
    <div>
      <p>
        {type || null} {id || null} component not found
      </p>
    </div>
  )
}

export { defaultComponentLibrary } from './defaults'

export interface ZuiFormProps<UI extends UIExtension = GlobalExtensionDefinition> {
  components: ZUIReactComponentLibrary<UI>
  schema: any
}

const getComponent = (components: ZUIReactComponentLibrary<any>, type: BaseType, id: string) => {
  const component = components[type][id]
  if (!component) {
    console.warn(`Component ${type}.${id} not found`)
    return NotImplementedComponent
  }
  return component
}

export const ZuiForm = <T extends UIExtension = GlobalExtensionDefinition>({ schema, components }: ZuiFormProps<T>) => {
  return (
    <>
      {Object.entries(schema.properties).map(([_, propertyObject]: any[]) => {
        const dataType = propertyObject.type
        const [componentID, params] = propertyObject[zuiKey]['displayAs']
        const Component = getComponent(components, dataType, componentID) as ZUIReactComponent<any, any>
        return <Component key={`${dataType}:${componentID}`} type={dataType} id={componentID} params={params} />
      })}
    </>
  )
}
