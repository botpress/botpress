import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

type AsyncMethod = (...args: unknown[]) => Promise<unknown>

export const handleErrorsDecorator =
  (errorMessage: string) =>
  (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void => {
    const _originalMethod: AsyncMethod = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      return wrapAsyncFnWithTryCatch(_originalMethod.bind(this), errorMessage).apply(this, args)
    }
  }
