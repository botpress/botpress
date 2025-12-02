import { z } from '@botpress/sdk'

export namespace MetricQueryResult {
  export const schema = z
    .object({
      query: z.string().title('Query').describe('The metric query that was executed.'),
      from: z.number().title('From').describe('Start timestamp in seconds.'),
      to: z.number().title('To').describe('End timestamp in seconds.'),
      series: z
        .array(
          z.object({
            metric: z.string().title('Metric').describe('Name of the metric.'),
            displayName: z.string().title('Display Name').optional().describe('Display name of the metric.'),
            unit: z
              .array(
                z.object({
                  family: z.string().title('Family').optional(),
                  scaleFactor: z.number().title('Scale Factor').optional(),
                  name: z.string().title('Name').optional(),
                  shortName: z.string().title('Short Name').optional(),
                })
              )
              .optional(),
            pointlist: z
              .array(z.array(z.number().or(z.string())))
              .title('Point List')
              .describe('Array of [timestamp, value] pairs.'),
            start: z.number().title('Start').describe('Start timestamp in seconds.'),
            end: z.number().title('End').describe('End timestamp in seconds.'),
            interval: z.number().title('Interval').optional().describe('Interval in seconds.'),
            length: z.number().title('Length').describe('Number of data points.'),
            expression: z.string().title('Expression').optional().describe('Metric expression.'),
            scope: z.string().title('Scope').optional().describe('Metric scope.'),
            tagSet: z.array(z.string()).title('Tag Set').optional().describe('Array of tags.'),
          })
        )
        .title('Series')
        .describe('Array of metric series.'),
      message: z.string().title('Message').optional().describe('Error message if query failed.'),
      status: z.string().title('Status').optional().describe('Status of the query.'),
    })
    .title('Metric Query Result')
    .describe('Result from a Datadog metric query.')

  export type inferredType = z.infer<typeof schema>
}

