import { z } from '@botpress/sdk'

const generateLinePlot = {
  title: 'Line Plot',
  input: {
    schema: z.object({
      xData: z.array(z.string().or(z.number())).catch(() => [1, 2, 3, 4, 5]),
      yData: z.array(z.number()).catch(() => [1, 2, 3, 4, 5]),
      title: z.string().optional(),
      xAxisTitle: z.string().optional(),
      yAxisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generateBarChart = {
  title: 'Bar Chart',
  input: {
    schema: z.object({
      xData: z.array(z.string().or(z.number())).catch(() => [1, 2, 3, 4, 5]),
      yData: z.array(z.number()).catch(() => [1, 2, 3, 4, 5]),
      title: z.string().optional(),
      xAxisTitle: z.string().optional(),
      yAxisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generatePieChart = {
  title: 'Pie Chart',
  input: {
    schema: z.object({
      labels: z.array(z.string()).catch(() => ['Label 1', 'Label 2', 'Label 3']),
      data: z.array(z.number()).catch(() => [10, 20, 30]),
      title: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

export const generateScatterPlot = {
  title: 'Scatter Plot',
  input: {
    schema: z.object({
      data: z.array(z.object({ x: z.number(), y: z.number() })).catch(() => [
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 4 },
      ]),
      title: z.string().optional(),
      xAxisTitle: z.string().optional(),
      yAxisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generateDoughnutChart = {
  title: 'Doughnut Chart',
  input: {
    schema: z.object({
      labels: z.array(z.string()).catch(() => ['Label 1', 'Label 2', 'Label 3']),
      data: z.array(z.number()).catch(() => [10, 20, 30]),
      title: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generateRadarChart = {
  title: 'Radar Chart',
  input: {
    schema: z.object({
      labels: z.array(z.string()).catch(() => ['Label 1', 'Label 2', 'Label 3']),
      data: z.array(z.number()).catch(() => [10, 20, 30]),
      title: z.string().optional(),
      axisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generateBubbleChart = {
  title: 'Bubble Chart',
  input: {
    schema: z.object({
      data: z
        .array(
          z.object({
            x: z.number(),
            y: z.number(),
            r: z.number(),
          })
        )
        .catch(() => [
          { x: 1, y: 2, r: 5 },
          { x: 2, y: 3, r: 10 },
          { x: 3, y: 4, r: 15 },
        ]),
      title: z.string().optional(),
      xAxisTitle: z.string().optional(),
      yAxisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const generateHorizontalBarChart = {
  title: 'Horizontal Bar Chart',
  input: {
    schema: z.object({
      xData: z.array(z.string().or(z.number())).catch(() => [1, 2, 3, 4, 5]),
      yData: z.array(z.number()).catch(() => [1, 2, 3, 4, 5]),
      title: z.string().optional(),
      xAxisTitle: z.string().optional(),
      yAxisTitle: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

export const actionDefinitions = {
  generateLinePlot,
  generateBarChart,
  generatePieChart,
  generateScatterPlot,
  generateDoughnutChart,
  generateRadarChart,
  generateBubbleChart,
  generateHorizontalBarChart,
}
