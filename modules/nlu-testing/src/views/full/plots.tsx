import React, { FC } from 'react'
import Plot from 'react-plotly.js'

// C.F https://plotly.com/javascript/reference/

const Plots: FC<any> = props => {
  return (
    <Plot
      data={props.data}
      config={{ responsive: true }}
      style={{ width: '100%' }}
      layout={{
        autosize: true,
        title: {
          text: props.title,
          font: { family: 'Courier New, monospace', size: 24 },
          xref: 'paper',
          x: 0.05
        },
        xaxis: { automargin: true },
        yaxis: { automargin: true }
      }}
    />
  )
}

export default Plots
