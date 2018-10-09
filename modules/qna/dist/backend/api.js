"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cluster = require("cluster");

var _iconvLite = _interopRequireDefault(require("iconv-lite"));

var _json2csv = require("json2csv");

var _moment = _interopRequireDefault(require("moment"));

var _multer = _interopRequireDefault(require("multer"));

var _nanoid = _interopRequireDefault(require("nanoid"));

var _yn = _interopRequireDefault(require("yn"));

var _transfer = require("./transfer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = async (bp, botScopedStorage) => {
  const csvUploadStatuses = {};

  const updateUploadStatus = (uploadStatusId, status) => {
    if (!uploadStatusId) {
      return;
    }

    csvUploadStatuses[uploadStatusId] = status;
  };

  const router = bp.http.createRouterForBot('qna');

  const sendToastProgress = action => {
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('toast.qna-save', {
      text: `QnA ${action} In Progress`,
      type: 'info',
      time: 120000
    }));
  };

  const sendToastSuccess = action => {
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('toast.qna-save', {
      text: `QnA ${action} Success`,
      type: 'success'
    }));
  };

  const sendToastError = (action, error) => {
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('toast.qna-save', {
      text: `QnA ${action} Error: ${error}`,
      type: 'error'
    }));
  };

  router.get('/list', async (req, res) => {
    try {
      const {
        query: {
          limit,
          offset
        }
      } = req;
      const storage = botScopedStorage.get(req.params.botId);
      const items = await storage.all({
        start: offset ? parseInt(offset) : undefined,
        count: limit ? parseInt(limit) : undefined
      });
      const overallItemsCount = await storage.count();
      res.send({
        items,
        overallItemsCount
      });
    } catch (e) {
      bp.logger.error('QnA Error', e);
      res.status(500).send(e.message || 'Error');
    }
  });
  router.post('/create', async (req, res) => {
    try {
      sendToastProgress('Save');
      const storage = botScopedStorage.get(req.params.botId);
      const id = await storage.insert(req.body);
      res.send(id);
      sendToastSuccess('Save');
    } catch (e) {
      bp.logger.error('QnA Error', e);
      res.status(500).send(e.message || 'Error');
      sendToastError('Save', e.message);
    }
  });
  router.put('/:question', async (req, res) => {
    try {
      sendToastProgress('Update');
      const storage = botScopedStorage.get(req.params.botId);
      await storage.update(req.body, req.params.question);
      sendToastSuccess('Update');
      res.end();
    } catch (e) {
      bp.logger.error('QnA Error', _cluster.eventNames);
      res.status(500).send(e.message || 'Error');
      sendToastError('Update', e.message);
    }
  });
  router.delete('/:question', async (req, res) => {
    try {
      sendToastProgress('Delete');
      const storage = botScopedStorage.get(req.params.botId);
      await storage.delete(req.params.question);
      sendToastSuccess('Delete');
      res.end();
    } catch (e) {
      bp.logger.error('QnA Error', e);
      res.status(500).send(e.message || 'Error');
      sendToastError('Delete', e.message);
    }
  });
  router.get('/export/:format', async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId);
    const config = await bp.config.getModuleConfigForBot('qna', req.params.botId);
    const data = await (0, _transfer.prepareExport)(storage, {
      flat: true
    });

    if (req.params.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-disposition', `attachment; filename=qna_${(0, _moment.default)().format('DD-MM-YYYY')}.csv`);
      const json2csvParser = new _json2csv.Parser({
        fields: ['question', 'action', 'answer', 'answer2'],
        header: true
      });
      res.end(_iconvLite.default.encode(json2csvParser.parse(data), config.exportCsvEncoding));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-disposition', `attachment; filename=qna_${(0, _moment.default)().format('DD-MM-YYYY')}.json`);
      res.end(JSON.stringify(data));
    }
  });
  const upload = (0, _multer.default)();
  router.post('/import/csv', upload.single('csv'), async (req, res) => {
    const storage = botScopedStorage.get(req.params.botId);
    const config = await bp.config.getModuleConfigForBot('qna', req.params.botId);
    const uploadStatusId = (0, _nanoid.default)();
    res.end(uploadStatusId);
    updateUploadStatus(uploadStatusId, 'Deleting existing questions');

    if ((0, _yn.default)(req.body.isReplace)) {
      const questions = await storage.all();
      await storage.delete(questions.map(({
        id
      }) => id));
    }

    try {
      const questions = _iconvLite.default.decode(req.file.buffer, config.exportCsvEncoding);

      const params = {
        storage,
        config,
        format: 'csv',
        statusCallback: updateUploadStatus,
        uploadStatusId
      };
      await (0, _transfer.importQuestions)(questions, params);
      updateUploadStatus(uploadStatusId, 'Completed');
    } catch (e) {
      bp.logger.error('QnA Error:', e);
      updateUploadStatus(uploadStatusId, `Error: ${e.message}`);
    }
  });
  router.get('/csv-upload-status/:uploadStatusId', async (req, res) => {
    res.end(csvUploadStatuses[req.params.uploadStatusId]);
  });
};

exports.default = _default;