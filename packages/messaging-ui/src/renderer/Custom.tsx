import React, { useMemo } from 'react'
import { pick } from 'utils'
import Keyboard from '../Keyboard'
import { CustomComponentPayload, MessageTypeHandlerProps } from '../typings'

const checkError = (moduleInjector: Function, payload: CustomComponentPayload): Error | null => {
  const errorPrepend = 'Custom component error: '
  if (!moduleInjector) {
    return new Error(`${errorPrepend} could not get module injector`)
  }
  if (!payload.module) {
    return new Error(`${errorPrepend} "module" is not defined in the payload`)
  }
  if (!payload.component) {
    return new Error(`${errorPrepend} "component" is not defined in the payload`)
  }
  return null
}

export const CustomComponent: React.FC<MessageTypeHandlerProps<'custom'>> = ({ config, payload }) => {
  const InjectedModuleView = config.bp?.getModuleInjector()
  const error = useMemo(() => checkError(InjectedModuleView, payload), [InjectedModuleView, payload])
  if (error) {
    throw error
  }

  const sanitizedProps = useMemo(() => {
    return pick(config, [
      'messageId',
      'isLastGroup',
      'isLastOfGroup',
      'isBotMessage',
      'onSendData',
      'onFileUpload',
      'sentOn',
      'store',
      'intl'
    ])
  }, [config])

  const extraProps = {
    ...sanitizedProps,
    messageDataProps: { ...payload },
    keyboard: Keyboard,
    children: payload.wrapped && <CustomComponent config={config} payload={payload.wrapped} />
  }

  return (
    <InjectedModuleView moduleName={payload.module} componentName={payload.component} lite extraProps={extraProps} />
  )
}
