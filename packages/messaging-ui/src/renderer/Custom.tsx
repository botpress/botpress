import React from 'react'
import { MessageRendererProps } from 'typings'

export const CustomComponent: React.FC<MessageRendererProps<'custom'>> = ({ config, payload, children }) => {
  const InjectedModuleView = config.bp?.getModuleInjector()
  if (!InjectedModuleView || !payload.module || !payload.component) {
    return <>An error occured while rendering the component</>
  }
  return (
    <div>
      <div>{config.title}</div>
      <div>{payload.message}</div>
    </div>
  )
}
