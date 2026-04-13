import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ULID_REGEX = /^[a-zA-Z]+_[0-9A-HJKMNP-TV-Z]{26}$/

export const normalizePath = (path: string): string =>
  path
    .split('?')[0]!
    .split('/')
    .map((part) => (UUID_REGEX.test(part) || ULID_REGEX.test(part) ? ':id' : part))
    .join('/')

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

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation({
        // Suppress DynamoDB HTTP spans (already wrapped by custom dynamodb.* spans in dynamo-db-store.ts)
        ignoreOutgoingRequestHook: (req) => {
          // AWS SDK v3 sets req.host (e.g. "localhost:8000") rather than hostname+port separately
          const hostParts = req.host?.split(':')
          const host = req.hostname ?? hostParts?.[0] ?? ''
          const port = Number(req.port ?? hostParts?.[1] ?? 0)
          // localhost:8000 is assumed to be DynamoDB Local (the standard port used by the AWS DynamoDB local emulator)
          return host.endsWith('.amazonaws.com') || (host === 'localhost' && port === 8000)
        },
        // Rename spans for clarity and add bp.* attributes
        requestHook: (span, request) => {
          if ('complete' in request) {
            // IncomingMessage: use x-bp-operation header for a descriptive name
            const op = request.headers['x-bp-operation']
            if (typeof op === 'string') {
              span.updateName(`webhook:${op}`)
            }
            // Set bp.* attributes from SDK-injected headers
            const botId = request.headers['x-bot-id']
            const integrationId = request.headers['x-integration-id']
            if (typeof botId === 'string') span.setAttribute('bp.botId', botId)
            if (typeof integrationId === 'string') span.setAttribute('bp.integrationId', integrationId)
          } else if ('path' in request && request.path) {
            // ClientRequest (outgoing): rename from "METHOD" to "METHOD /normalized-path"
            span.updateName(`${request.method ?? 'HTTP'} ${normalizePath(request.path)}`)
          }
        },
      }),
    ],
  })

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
  const parentCtx = opts?.traceHeaders ? propagation.extract(context.active(), opts.traceHeaders) : context.active()

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
        } else {
          span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
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
