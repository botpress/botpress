import { generateBarChart } from './generate-bar-chart'
import { generateBubbleChart } from './generate-bubble-chart'
import { generateDoughnutChart } from './generate-doughnut-chart'
import { generateHorizontalBarChart } from './generate-horizontal-bar-chart'
import { generateLinePlot } from './generate-line-plot'
import { generatePieChart } from './generate-pie-chart'
import { generateRadarChart } from './generate-radar-chart'
import { generateScatterPlot } from './generate-scatter-plot'

export const actionImplementations = {
  generateLinePlot,
  generateBarChart,
  generatePieChart,
  generateScatterPlot,
  generateBubbleChart,
  generateDoughnutChart,
  generateRadarChart,
  generateHorizontalBarChart,
}
