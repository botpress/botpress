import { z } from '@botpress/sdk'

const generateLinePlot = {
  title: 'Line Plot',
  description: 'Generate a line plot',
  input: {
    schema: z.object({
      xData: z
        .array(z.string().or(z.number()))
        .catch(() => [1, 2, 3, 4, 5])
        .describe('The data for the x axis')
        .title('X Data'),
      yData: z
        .array(z.number())
        .catch(() => [1, 2, 3, 4, 5])
        .describe('the data for the y axis')
        .title('Y Data'),
      title: z.string().optional().describe('The title of the plot').title('Line Plot Title'),
      xAxisTitle: z.string().optional().describe('The title of the x axis').title('X Axis Title'),
      yAxisTitle: z.string().optional().describe('The title of the y axis').title('Y Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generateBarChart = {
  title: 'Bar Chart',
  description: 'Generate a Bar chart',
  input: {
    schema: z.object({
      xData: z
        .array(z.string().or(z.number()))
        .catch(() => [1, 2, 3, 4, 5])
        .describe('The data for the x axis')
        .title('X Data'),
      yData: z
        .array(z.number())
        .catch(() => [1, 2, 3, 4, 5])
        .describe('The data for the y axis')
        .title('Y Data'),
      title: z.string().optional().describe('The title of the Bar Chart').title('Bar Chart Title'),
      xAxisTitle: z.string().optional().describe('The title of the x axis').title('X Axis Title'),
      yAxisTitle: z.string().optional().describe('The title of the y axis').title('Y Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generatePieChart = {
  title: 'Pie Chart',
  description: 'Generate a pie chart',
  input: {
    schema: z.object({
      labels: z
        .array(z.string())
        .catch(() => ['Label 1', 'Label 2', 'Label 3'])
        .describe('The labels for the data')
        .title('Labels'),
      data: z
        .array(z.number())
        .catch(() => [10, 20, 30])
        .describe('The data to plot')
        .title('Data'),
      title: z.string().optional().describe('The title of the pie chart').title('Pie Chart Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

export const generateScatterPlot = {
  title: 'Scatter Plot',
  description: 'Generate a scatter plot',
  input: {
    schema: z.object({
      data: z
        .array(z.object({ x: z.number(), y: z.number() }))
        .catch(() => [
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          { x: 3, y: 4 },
        ])
        .describe('The data to plot')
        .title('Data'),
      title: z.string().optional().describe('The title of the scatter plot').title('Scatter Plot Title'),
      xAxisTitle: z.string().optional().describe('The title of the x axis').title('X Axis Title'),
      yAxisTitle: z.string().optional().describe('The title of the y axis').title('Y Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generateDoughnutChart = {
  title: 'Doughnut Chart',
  description: 'Generate a Doughnut Chart',
  input: {
    schema: z.object({
      labels: z
        .array(z.string())
        .catch(() => ['Label 1', 'Label 2', 'Label 3'])
        .describe('The labels for the data')
        .title('Labels'),
      data: z
        .array(z.number())
        .catch(() => [10, 20, 30])
        .describe('The data to plot')
        .title('Data'),
      title: z.string().optional().describe('The title of the doughnut chart').title('Doughnut Chart Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generateRadarChart = {
  title: 'Radar Chart',
  description: 'Generate a radar Chart',
  input: {
    schema: z.object({
      labels: z
        .array(z.string())
        .catch(() => ['Label 1', 'Label 2', 'Label 3'])
        .describe('The labels for the data')
        .title('Labels'),
      data: z
        .array(z.number())
        .catch(() => [10, 20, 30])
        .describe('The data to plot')
        .title('Data'),
      title: z.string().optional().describe('The title of the radar chart').title('Radar Chart Title'),
      axisTitle: z.string().optional().describe('The title of the axis').title('Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generateBubbleChart = {
  title: 'Bubble Chart',
  description: 'Generate a bubble Chart',
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
        ])
        .describe('The data to plot')
        .title('Data'),
      title: z.string().optional().describe('The title of the bubble chart').title('Bubble Chart Title'),
      xAxisTitle: z.string().optional().describe('The title of the x axis').title('X Axis Title'),
      yAxisTitle: z.string().optional().describe('The title of the y axis').title('Y Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
    }),
  },
}

const generateHorizontalBarChart = {
  title: 'Horizontal Bar Chart',
  description: 'Generate a horizontal Chart',
  input: {
    schema: z.object({
      xData: z
        .array(z.string().or(z.number()))
        .catch(() => [1, 2, 3, 4, 5])
        .describe('The data for the x axis')
        .title('X Data'),
      yData: z
        .array(z.number())
        .catch(() => [1, 2, 3, 4, 5])
        .describe('The data for the y axis')
        .title('Y Data'),
      title: z.string().optional().describe('The title of the bar chart').title('Bar Chart Title'),
      xAxisTitle: z.string().optional().describe('The title of the x axis').title('X Axis Title'),
      yAxisTitle: z.string().optional().describe('The title of the y axis').title('Y Axis Title'),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string().describe('The url of the generated image').title('Image Url'),
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
