// expose this as a service or maybe run this in a browser webworker to give hints
//////////////////////////////
// split with k-means here
//////////////////////////////

// const data = l1Points.map(x => _.dropRight(x.coordinates, 1))
// const nLabels = _.uniq(l1Points.map(x => x.label)).length

// let bestScore = 0
// let bestCluster: { [clusterId: number]: { [label: string]: number[][] } } = {}

// // TODO refine this logic here, maybe use a density based clustering or at least cluster step should be a func of our data
// for (
//   let i = Math.min(Math.floor(nLabels / 3), l1Points.length) || 1;
//   i < Math.min(nLabels, l1Points.length);
//   i += 5
// ) {
//   const km = kmeans(data, i)
//   const clusters: { [clusterId: number]: { [label: string]: number[][] } } = {}

//   l1Points.forEach(pts => {
//     const r = km.nearest([_.dropRight(pts.coordinates, 1)])[0] as number
//     clusters[r] = clusters[r] || {}
//     clusters[r][pts.label] = clusters[r][pts.label] || []
//     clusters[r][pts.label].push(pts.coordinates)
//   })

//   const total = _.sum(
//     _.map(clusters, c => {
//       const things = _.map(c, y => y.length)
//       return _.max(things) / _.sum(things)
//     })
//   )
//   // const total = _.sum(_.map(clusters, c => _.max(_.map(c, y => y.length)))) / l1Points.length
//   const score = total / Math.sqrt(i)

//   if (score >= bestScore) {
//     bestScore = score
//     bestCluster = clusters
//   }
// }

// const labelIncCluster: { [label: string]: number } = {}

// for (const pairs of _.values(bestCluster)) {
//   const labels = Object.keys(pairs)
//   for (const label of labels) {
//     const samples = pairs[label]
//     if (samples.length >= MIN_CLUSTER_SAMPLES) {
//       labelIncCluster[label] = (labelIncCluster[label] || 0) + 1
//       const newLabel = label + '__k__' + labelIncCluster[label]
//       l1Points.filter(x => samples.includes(x.coordinates)).forEach(x => {
//         x.label = newLabel
//       })
//     }
//   }
// }

//////////////////////////////
//////////////////////////////
