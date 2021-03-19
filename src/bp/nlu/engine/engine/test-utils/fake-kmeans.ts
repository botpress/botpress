import { MLToolkit } from 'botpress/sdk'

export const fakeKmeans: typeof MLToolkit.KMeans = {
  kmeans: (data: MLToolkit.KMeans.DataPoint[], k: number, options: MLToolkit.KMeans.KMeansOptions) => {
    return {
      clusters: [0],
      centroids: [{ centroid: [0, 0], error: 0, size: 0 }],
      iterations: 1,
      nearest: (data: MLToolkit.KMeans.DataPoint[]) => {
        return [0]
      }
    }
  }
}
