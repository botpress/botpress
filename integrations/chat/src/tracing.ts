import { context, propagation, SpanStatusCode, trace } from '@opentelemetry/api'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { Resource } from '@opentelemetry/resources'
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'

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
  MESSAGE_ID: 'bp.messageId',
  BOT_ID: 'bp.botId',
  INTEGRATION_ID: 'bp.integrationId',
  DB_TABLE: 'db.table',
  DB_KEY: 'db.key',
  DB_COUNT: 'db.count',
} as const

export const initTracing = (): NodeTracerProvider | null => {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.OTEL_CONSOLE_EXPORTER !== 'true') {
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

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    provider.addSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter()))
  }
  if (process.env.OTEL_CONSOLE_EXPORTER === 'true') {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
  }
  provider.register({ propagator: new W3CTraceContextPropagator() })

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation({
        // Rename spans for clarity
        requestHook: (span, request) => {
          if ('complete' in request) {
            // IncomingMessage: use x-bp-operation header for a descriptive name
            const op = request.headers['x-bp-operation']
            if (typeof op === 'string') {
              span.updateName(`bp:${op}`)
            }
          } else if ('path' in request && request.path) {
            // ClientRequest (outgoing): rename from "METHOD" to "-> METHOD /normalized-path"
            span.updateName(`-> ${request.method ?? 'HTTP'} ${normalizePath(request.path)}`)
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

  return context.with(parentCtx, async () =>
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
