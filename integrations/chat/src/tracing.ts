import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

export const SPAN_ATTRS = {
  USER_ID: 'bp.userId',
  CONVERSATION_ID: 'bp.conversationId',
} as const

export const initTracing = (): NodeTracerProvider | null => {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return null
  }

  const resourceAttrs: Record<string, string> = {
    'service.name': process.env.OTEL_SERVICE_NAME ?? 'chat-integration',
  }
  if (process.env.OTEL_SERVICE_VERSION) {
    resourceAttrs['service.version'] = process.env.OTEL_SERVICE_VERSION
  }
  if (process.env.OTEL_DEPLOYMENT_ENVIRONMENT) {
    resourceAttrs['deployment.environment'] = process.env.OTEL_DEPLOYMENT_ENVIRONMENT
  }

  const provider = new NodeTracerProvider({
    resource: new Resource(resourceAttrs),
  })

  provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()))
  if (process.env.OTEL_CONSOLE_EXPORTER === 'true') {
    provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()))
  }
  provider.register({ propagator: new W3CTraceContextPropagator() })
  return provider
}

export const runWithSpan = async <T>(
  spanName: string,
  fn: () => Promise<T>,
  opts?: {
    attributes?: Record<string, string>
    traceHeaders?: Record<string, string | string[] | undefined>
  }
): Promise<T> => {
  const tracer = trace.getTracer('chat-integration')
  const parentCtx = opts?.traceHeaders
    ? propagation.extract(context.active(), opts.traceHeaders)
    : context.active()

  return context.with(parentCtx, () =>
    tracer.startActiveSpan(spanName, { attributes: opts?.attributes }, async (span) => {
      try {
        const result = await fn()
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (err: unknown) {
        if (err instanceof Error) {
          span.recordException(err)
          span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
        }
        throw err
      } finally {
        span.end()
      }
    })
  )
}

export const setSpanAttributes = (attrs: Record<string, string | undefined>): void => {
  const span = trace.getActiveSpan()
  if (!span) {
    return
  }
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) {
      span.setAttribute(key, value)
    }
  }
}

export const instrumentAxiosClient = (axiosClient: AxiosInstance): void => {
  axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    propagation.inject(context.active(), config.headers)
    return config
  })
}
