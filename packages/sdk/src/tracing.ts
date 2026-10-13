export const extractTracingHeaders = (headers: Record<string, string | undefined>) => {
  return ['traceparent', 'tracestate'].reduce<Record<string, string>>((acc, header) => {
    if (headers[header]) {
      acc[header] = headers[header]
    }
    return acc
  }, {})
}
