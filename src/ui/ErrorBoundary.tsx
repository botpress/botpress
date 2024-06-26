import React, { Component, ErrorInfo, FC, ReactNode } from 'react'
import { JSONSchema, Path } from './types'

export type BoundaryFallbackComponent = FC<{ error: Error; schema: JSONSchema }>

export type ErrorBoundaryProps = {
  children?: ReactNode
  fallback?: BoundaryFallbackComponent
  fieldSchema: JSONSchema
  path: Path
}
type State =
  | {
      hasError: true
      error: Error
    }
  | {
      hasError: false
      error: null
    }

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError && this.props.fallback) {
      return <this.props.fallback error={this.state.error} schema={this.props.fieldSchema} />
    }

    return this.props.children
  }
}

export function withErrorBoundary<P = any>(Component: FC<P>, fallback?: BoundaryFallbackComponent) {
  return (props: P & ErrorBoundaryProps) => (
    <ErrorBoundary fallback={fallback} fieldSchema={props.fieldSchema} path={props.path}>
      <Component {...props} />
    </ErrorBoundary>
  )
}
