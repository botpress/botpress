import { log } from './log'

// Variable indirection prevents esbuild from resolving and bundling OTel packages.
// OTel must monkey-patch require('http') at runtime, which breaks if bundled.
const otelPackages = {
  api: '@opentelemetry/api',
  traceNode: '@opentelemetry/sdk-trace-node',
  traceBase: '@opentelemetry/sdk-trace-base',
  exporterOtlp: '@opentelemetry/exporter-trace-otlp-http',
  autoInstrumentations: '@opentelemetry/auto-instrumentations-node',
  instrumentation: '@opentelemetry/instrumentation',
  resources: '@opentelemetry/resources',
  core: '@opentelemetry/core',
} as const

const loadOtel = () => {
  const api = require(otelPackages.api) as typeof import('@opentelemetry/api')
  const traceNode = require(otelPackages.traceNode) as typeof import('@opentelemetry/sdk-trace-node')
  const traceBase = require(otelPackages.traceBase) as typeof import('@opentelemetry/sdk-trace-base')
  const exporterOtlp = require(otelPackages.exporterOtlp) as typeof import('@opentelemetry/exporter-trace-otlp-http')
  const autoInstrumentations = require(
    otelPackages.autoInstrumentations
  ) as typeof import('@opentelemetry/auto-instrumentations-node')
  const instrumentation = require(otelPackages.instrumentation) as typeof import('@opentelemetry/instrumentation')
  const resources = require(otelPackages.resources) as typeof import('@opentelemetry/resources')
  const core = require(otelPackages.core) as typeof import('@opentelemetry/core')

  return {
    api,
    traceNode,
    traceBase,
    exporterOtlp,
    autoInstrumentations,
    instrumentation,
    resources,
    core,
  }
}

export const getTraceId = (): string | undefined => {
  try {
    const { api } = loadOtel()
    return api.trace.getActiveSpan()?.spanContext().traceId
  } catch {
    return undefined
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i
const BP_ID_REGEX = /^(bot|user|conv|msg|evt|wkf|int|devint|tbl|row)_[0-9A-HJKMNP-TV-Z]+$/i

const normalizePath = (path: string): string =>
  path
    .split('?')[0]!
    .split('/')
    .map((part) => (UUID_REGEX.test(part) || ULID_REGEX.test(part) || BP_ID_REGEX.test(part) ? ':id' : part))
    .join('/')

let _initialized = false

export const setupTracing = () => {
  if (_initialized) {
    return
  }
  _initialized = true

  if (process.env.TRACING_ENABLED !== 'true') {
    return
  }

  log.info('Initializing OTel tracing')

  try {
    const otel = loadOtel()
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'

    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'botpress-integration'
    const resource = new otel.resources.Resource({ 'service.name': serviceName })

    const exporter = new otel.exporterOtlp.OTLPTraceExporter({ timeoutMillis: 10_000 })

    const innerProcessor = new otel.traceBase.BatchSpanProcessor(exporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 256,
      scheduledDelayMillis: 2000,
      exportTimeoutMillis: 10_000,
    })

    const SpanKind = otel.api.SpanKind
    const wrappedProcessor: import('@opentelemetry/sdk-trace-base').SpanProcessor = {
      forceFlush: () => innerProcessor.forceFlush(),
      shutdown: () => innerProcessor.shutdown(),
      onEnd: (span) => innerProcessor.onEnd(span),
      onStart: (span, parentContext) => {
        const method = (span.attributes['http.method'] as string) ?? span.name
        const httpTarget = span.attributes['http.target'] as string

        if (span.kind === SpanKind.CLIENT && httpTarget) {
          span.updateName(`-> ${method} ${normalizePath(httpTarget)}`)
        }

        if (span.kind === SpanKind.SERVER && httpTarget) {
          span.updateName(`${method} ${normalizePath(httpTarget)}`)
        }

        innerProcessor.onStart(span, parentContext)
      },
    }

    const provider = new otel.traceNode.NodeTracerProvider({ resource })

    provider.addSpanProcessor(wrappedProcessor)
    provider.register({ propagator: new otel.core.W3CTraceContextPropagator() })

    otel.api.propagation.setGlobalPropagator(new otel.core.W3CTraceContextPropagator())

    const instrumentations = otel.autoInstrumentations.getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreOutgoingRequestHook: (request) => {
          const target = `${request.hostname ?? request.host ?? ''}:${request.port ?? ''}`
          return otlpEndpoint.includes(target)
        },
      },
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
    })

    otel.instrumentation.registerInstrumentations({ instrumentations })

    log.info('OTel tracing initialized')
  } catch (thrown) {
    log.warn('OTel tracing not available — packages may not be installed')
  }
}
