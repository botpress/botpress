"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _mlConfusionMatrix = _interopRequireDefault(require("ml-confusion-matrix"));

var _mlMatrix = require("ml-matrix");

var _nanoid = _interopRequireDefault(require("nanoid"));

var _data_loader = require("../tools/data_loader");

var _visualisation = require("../tools/visualisation");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = async (bp, state) => {
  const longJobsPool = {};
  const router = bp.http.createRouterForBot('new_qna');
  const glob_res = [];
  router.get('/confusionMatrix', async (req, res) => {
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, {
      localUrl: true
    });
    state.predictor.axiosConfig = newAxiosConfig;
    state.axiosConfig = newAxiosConfig;
    const jobId = (0, _nanoid.default)();
    res.send(jobId);
    longJobsPool[jobId] = {
      status: 'computing',
      data: undefined,
      error: undefined,
      cm: true
    };

    try {
      longJobsPool[jobId].data = await (0, _visualisation.computeConfusionMatrix)(state, glob_res);
      longJobsPool[jobId].status = 'done';
    } catch (e) {
      console.log('Erreur test paris: ', e);
      longJobsPool[jobId].status = 'crashed';
      longJobsPool[jobId].error = e.data;
    }
  });
  router.get('/loadDatas', async (req, res) => {
    res.send((await (0, _data_loader.getTrainTestDatas)(state)));
  });
  router.get('/similarityEmbeddings', async (req, res) => {
    res.send((await (0, _visualisation.computeEmbeddingSimilarity)(state)));
  });
  router.get('/similarityIntents', async (req, res) => {
    res.send((await (0, _visualisation.computeIntentSimilarity)(state)));
  });
  router.get('/scatterTsneEmbeddings', async (req, res) => {
    res.send((await (0, _visualisation.computeTsneScatterEmbeddings)(state)));
  });
  router.get('/scatterEmbeddings', async (req, res) => {
    res.send((await (0, _visualisation.computeScatterEmbeddings)(state)));
  });
  router.get('/computeOutliers', async (req, res) => {
    res.send((0, _visualisation.computeOutliers)(state));
  });
  router.get('/long-jobs-status/:jobId', async (req, res) => {
    const newAxiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, {
      localUrl: true
    });
    state.predictor.axiosConfig = newAxiosConfig;
    state.axiosConfig = newAxiosConfig;

    if (longJobsPool[req.params.jobId].cm) {
      const CM2 = _mlConfusionMatrix.default.fromLabels(glob_res.map(o => o.gt), glob_res.map(o => o.pred)); // Normalize the confusion matrix


      const CM = new _mlMatrix.Matrix(CM2.matrix);
      CM2.matrix = CM.divColumnVector(CM2.matrix.map(row => _lodash.default.sum(row) + 0.01)).to2DArray();
      const plotlyMatrixData = [{
        x: CM2.labels,
        y: CM2.labels,
        z: CM2.matrix,
        type: 'heatmap'
      }];
      const layout = {
        title: 'ConfusionMatrix',
        annotations: [],
        xaxis: {
          ticks: '',
          side: 'top'
        },
        yaxis: {
          tickangle: -90,
          ticks: '',
          ticksuffix: ' ',
          width: 700,
          height: 700,
          autosize: false
        }
      };

      for (let i = 0; i < CM2.labels.length; i++) {
        for (let j = 0; j < CM2.labels.length; j++) {
          const result = {
            xref: 'x1',
            yref: 'y1',
            x: CM2.labels[j],
            y: CM2.labels[i],
            text: CM2.matrix[i][j],
            font: {
              family: 'Arial',
              size: 12,
              color: 'rgb(50, 171, 96)'
            },
            showarrow: false
          };
          layout.annotations.push(result);
        }
      }

      longJobsPool[req.params.jobId].data = {
        data: plotlyMatrixData,
        layout: layout
      };
    }

    res.send(longJobsPool[req.params.jobId]);
  });
};

exports.default = _default;
//# sourceMappingURL=api.js.map