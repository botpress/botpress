"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeConfusionMatrix = computeConfusionMatrix;
exports.computeEmbeddingSimilarity = computeEmbeddingSimilarity;
exports.computeScatterEmbeddings = computeScatterEmbeddings;
exports.computeTsneScatterEmbeddings = computeTsneScatterEmbeddings;
exports.computeIntentSimilarity = computeIntentSimilarity;
exports.computeOutliers = computeOutliers;

var _lodash = _interopRequireDefault(require("lodash"));

var _mlConfusionMatrix = _interopRequireDefault(require("ml-confusion-matrix"));

var _mlDistance = require("ml-distance");

var _mlMatrix = require("ml-matrix");

var _mlPca = require("ml-pca");

var _tsneJs = _interopRequireDefault(require("tsne-js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const clustering = require('density-clustering');

async function computeConfusionMatrix(state, glob_res) {
  const results = [];

  for (const entry of state.testDatas) {
    const pred = await state.predictor.predict(entry.utt);
    results.push({
      utt: entry.utt,
      acc: pred.label === entry.intent,
      conf: pred.confidence,
      pred: pred.label,
      gt: entry.intent
    });
    glob_res.push({
      utt: entry.utt,
      acc: pred.label === entry.intent,
      conf: pred.confidence,
      pred: pred.label,
      gt: entry.intent
    });
  }

  const CM2 = _mlConfusionMatrix.default.fromLabels(results.map(o => o.gt), results.map(o => o.pred));

  console.log('sdffsdfsdfsdfsd', `\n\n ${results.filter(o => o.acc).length}/${results.length} : ${results.filter(o => o.acc).length / results.length}  \n\n`);
  await state.ghost.upsertFile(`./datas/${state.embedder.model_name}/results`, 'confusion_matrix.json', JSON.stringify(results, undefined, 2));
  return CM2;
}

async function computeEmbeddingSimilarity(state) {
  const intentDatas = _lodash.default.groupBy(state.trainDatas, 'intent');

  const intentEmb = {};

  for (const key in intentDatas) {
    if (Object.prototype.hasOwnProperty.call(intentDatas, key)) {
      const meanEmb = intentDatas[key].map(o => o.utt_emb).reduce((tot, cur) => {
        return _mlMatrix.Matrix.add(tot, new _mlMatrix.Matrix([cur]));
      }, _mlMatrix.Matrix.zeros(1, intentDatas[key][0].utt_emb.length));
      intentEmb[key] = _mlMatrix.Matrix.div(meanEmb, intentDatas[key].length).to1DArray();
    }
  } // console.log(intentEmb)


  const indexAndIntent = Array.from(Object.keys(intentEmb).entries());
  const simMat = {
    matrix: [],
    labels: []
  };
  debugger;

  for (const [index, key] of indexAndIntent) {
    debugger;
    const row = [];

    for (const [indexTodo, keyTodo] of indexAndIntent) {
      if (index === indexTodo) {
        row.push(1);
      } else {
        row.push(_lodash.default.round(_mlDistance.similarity.cosine(intentEmb[key], intentEmb[keyTodo]), 2));
      }
    }

    simMat.labels.push(key);
    simMat.matrix.push(row);
  }

  const plotlyMatrixData = [{
    x: simMat.labels,
    y: simMat.labels,
    z: simMat.matrix,
    type: 'heatmap'
  }];
  await state.ghost.upsertFile(`./datas/${state.embedder.model_name}/results`, 'similarity_matrix.json', JSON.stringify(simMat, undefined, 2));
  return plotlyMatrixData;
}

async function computeScatterEmbeddings(state) {
  const pca = new _mlPca.PCA(state.trainDatas.map(o => o.utt_emb));
  const variance = pca.getExplainedVariance();
  console.log(`Top 3 variance ${variance.slice(0, 3).map(o => _lodash.default.round(o, 2))}`);
  console.log(`Accounting for ${_lodash.default.round(_lodash.default.sum(variance.slice(0, 3)), 2)}%`);

  const grouped_intents = _lodash.default.groupBy(state.trainDatas, 'intent');

  const traces = [];
  Object.entries(grouped_intents).map(([k, v], i) => traces.push({
    x: v.map(o => pca.predict([o.utt_emb]).get(0, 0)),
    y: v.map(o => pca.predict([o.utt_emb]).get(0, 1)),
    z: v.map(o => pca.predict([o.utt_emb]).get(0, 2)),
    mode: 'markers',
    type: 'scatter3d',
    name: k,
    text: v.map(o => o.utt),
    marker: {
      size: 8,
      color: i
    }
  }));
  return traces;
}

async function computeTsneScatterEmbeddings(state) {
  let output = [];

  if (await state.ghost.fileExists('./datas', 'tsne.json')) {
    const outputString = await state.ghost.readFileAsString('./datas', 'tsne.json');
    output = JSON.parse(outputString);
  } else {
    const model = new _tsneJs.default({
      dim: 3,
      perplexity: 10.0,
      earlyExaggeration: 4.0,
      learningRate: 100.0,
      nIter: 1000,
      metric: 'euclidean'
    });
    model.init({
      data: state.trainDatas.map(o => o.utt_emb),
      type: 'dense'
    });
    const [error, iter] = model.run();
    output = model.getOutput();
    await state.ghost.upsertFile('./datas', 'tsne.json', JSON.stringify(output, undefined, 2));
  }

  const traces = [];
  let c = 0;

  for (const intent of Object.keys(_lodash.default.groupBy(state.trainDatas, 'intent'))) {
    traces.push({
      x: state.trainDatas.map((o, i) => {
        if (o.intent === intent) {
          return output[i][0];
        }
      }),
      y: state.trainDatas.map((o, i) => {
        if (o.intent === intent) {
          return output[i][1];
        }
      }),
      z: state.trainDatas.map((o, i) => {
        if (o.intent === intent) {
          return output[i][2];
        }
      }),
      mode: 'markers',
      type: 'scatter3d',
      name: intent,
      text: state.trainDatas.filter(o => o.intent === intent).map(o => o.utt),
      marker: {
        size: 8,
        color: c
      }
    });
    c += 1;
  }

  return traces;
}

async function computeIntentSimilarity(state) {
  const grouped_intents = _lodash.default.groupBy(state.trainDatas, 'intent');

  const simMat = {
    matrix: [],
    labels: [],
    text: []
  };
  debugger;

  for (const [intent, o] of Object.entries(grouped_intents)) {
    const rowMat = [];
    const rowText = [];

    for (const [intentTodo, oTodo] of Object.entries(grouped_intents)) {
      if (intent === intentTodo) {
        rowMat.push(0);
        rowText.push('');
      } else {
        let bestBadUttsText = [];
        let bestBadUttsNb = 10000;

        for (let i = 0; i < 10; i++) {
          const kmeans = new clustering.KMEANS();
          const [cluster1, cluster2] = kmeans.run(o.concat(oTodo).map(o => o.utt_emb), 2);
          const clusterO = _lodash.default.mean(cluster1) < _lodash.default.mean(cluster2) ? cluster1 : cluster2; // debugger

          const badUttsText = [];
          let badUttsNb = 0;
          o.map((p, i) => {
            if (!clusterO.includes(i)) {
              badUttsText.push(p.utt);
              badUttsNb += 1;
            }
          });

          if (badUttsNb < bestBadUttsNb) {
            bestBadUttsNb = badUttsNb;
            bestBadUttsText = badUttsText;
          }
        }

        rowMat.push(bestBadUttsNb);
        rowText.push(bestBadUttsText.join('<br>'));
      }
    }

    simMat.labels.push(intent);
    simMat.matrix.push(rowMat);
    simMat.text.push(rowText);
  }

  const plotlyMatrixData = [{
    x: simMat.labels,
    y: simMat.labels,
    z: simMat.matrix,
    text: simMat.text,
    type: 'heatmap'
  }];
  console.log('Done testing intents');
  return plotlyMatrixData;
}

function arraySum(a, b) {
  return a.map((elt, i) => elt + b[i]);
}

function arrayDiv(a, b) {
  return a.map(elt => elt / b);
}

function closest(a, b, index) {
  let minIndex = undefined;
  let minDistance = 100000;
  b.map((point, i) => {
    const dist = _mlDistance.distance.euclidean(a, point);

    if (dist < minDistance && i !== index) {
      minIndex = i;
      minDistance = dist;
    }
  });
  return minDistance;
}

function computeOutliers(state) {
  // const embedLen = state.trainDatas[0].utt_emb.length
  // const intentsData = _.groupBy(state.trainDatas, 'intent')
  // // const embedPerIntent = _.mapValues(intentsData, o => o.map(p => p.utt_emb))
  // const centroidPerIntent = _.mapValues(intentsData, o =>
  //   arrayDiv(
  //     o.reduce((sum, elt) => arraySum(elt.utt_emb, sum), new Array(embedLen).fill(0)),
  //     o.length
  //   )
  // )
  // const deviationToCenterPerIntent = _.mapValues(intentsData, (v, k) =>
  //   Math.sqrt(v.reduce((sum, elt) => distance.euclidean(elt.utt_emb, centroidPerIntent[k]), 0) / v.length)
  // )
  // const outliersPerIntent = _.mapValues(intentsData, (v, k) =>
  //   v
  //     .map(elt => {
  //       return { ...elt, dist: distance.euclidean(elt.utt_emb, centroidPerIntent[k]) }
  //     })
  //     .filter(elt => elt.dist > 3 * deviationToCenterPerIntent[k])
  // )
  // return { out: outliersPerIntent, dev: deviationToCenterPerIntent }
  const intentsData = _lodash.default.groupBy(state.trainDatas, 'intent'); // console.log('PLop')


  const dbPerIntent = _lodash.default.mapValues(intentsData, o => {
    const embedArray = o.map(e => e.utt_emb);
    const meanDist = o.reduce((sum, curr, index) => {
      if (index < o.length - 1) {
        return sum + closest(curr.utt_emb, embedArray, index);
      }

      return sum / o.length;
    }, 0); // console.log(meanDist)

    const dbscan = new clustering.DBSCAN(); // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster

    const clusters = dbscan.run(embedArray, meanDist + 0.5 * meanDist, _lodash.default.floor(o.length / 3)); // console.log('Clusters', clusters, 'Noise', dbscan.noise)

    return {
      outliers: dbscan.noise.map(i => o[i].utt),
      clusters: clusters.map(indexList => indexList.map(i => o[i].utt))
    };
  });

  console.log(dbPerIntent);
  return dbPerIntent;
}
//# sourceMappingURL=visualisation.js.map