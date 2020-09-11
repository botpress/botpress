import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

const Outliers: FC<any> = props => {
  const [clusterScore, setClusterScore] = useState({})

  useEffect(() => {
    async function computeOutliers() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/computeOutliers')
      setClusterScore(data)
    }
    computeOutliers()
      .then()
      .catch()
  }, [props.dataLoaded])

  if (!props.dataLoaded) {
    return <h3>Please wait for the data to be embeded</h3>
  }
  return (
    <div>
      {_.toPairs(clusterScore).map(([k, v]: [string, { outliers: string[]; clusters: string[][] }]) => {
        return (
          <div>
            <h4>{k}</h4>
            <p> Outliers </p>
            <ul>
              {v.outliers.map(s => (
                <li>{s}</li>
              ))}
            </ul>
            <p> Clusters </p>
            <ul>
              {v.clusters.map((c, i) => (
                <li>
                  <h6>{i}</h6>
                  <ul>
                    {c.map(s => (
                      <li>{s}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default Outliers
