import { z } from '@bpinternal/zui'
import { isString, isPlainObject } from 'lodash-es'

export type JsxComponent<TType extends string = string, TProps extends {} = {}, TChildren = any> = {
  __jsx: true
  type: TType
  props: TProps
  children: Array<TChildren>
}

export function isAnyJsxComponent(component: any): component is JsxComponent {
  return (
    typeof component === 'object' &&
    component !== null &&
    '__jsx' in component &&
    component.__jsx === true &&
    typeof component.type === 'string'
  )
}

export function isJsxComponent<T extends JsxComponent>(type: T['type'], component: any): component is T {
  return (
    typeof component === 'object' &&
    component !== null &&
    '__jsx' in component &&
    component.__jsx === true &&
    typeof component.type === 'string' &&
    typeof type === 'string' &&
    component.type.toUpperCase().trim() === type.toUpperCase().trim()
  )
}

export const createJsxComponent = (props: Omit<JsxComponent, '__jsx'>): JsxComponent => ({
  __jsx: true,
  type: isString(props.type) ? props.type.toUpperCase() : '__unknown__',
  children: Array.isArray(props.children) ? props.children : props.children ? [props.children] : [],
  props: isPlainObject(props.props) ? props.props : {}
})

export const Jsx = z.custom<JsxComponent>(
  (value) => isAnyJsxComponent(value),
  (value) => ({
    params: { value },
    message: `Invalid JSX component: ${value}`
  })
)
