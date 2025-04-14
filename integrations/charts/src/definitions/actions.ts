import { z } from '@botpress/sdk'

const generateLinePlot = {
  title: 'Line Plot',
  input: {
    schema: z.object({
      xData: z.array(z.string().or(z.number())),
      yData: z.array(z.number()),
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
      xData: z.array(z.string().or(z.number())),
      yData: z.array(z.number()),
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
      labels: z.array(z.string()),
      data: z.array(z.number()),
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
      data: z.array(z.object({ x: z.number(), y: z.number() })),
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
      labels: z.array(z.string()),
      data: z.array(z.number()),
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
      labels: z.array(z.string()),
      data: z.array(z.number()),
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
      data: z.array(
        z.object({
          x: z.number(),
          y: z.number(),
          r: z.number(),
        })
      ),
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
      xData: z.array(z.string().or(z.number())),
      yData: z.array(z.number()),
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
