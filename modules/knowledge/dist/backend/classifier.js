"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DocumentClassifier = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _lodash = _interopRequireDefault(require("lodash"));

var _os = require("os");

var _tmp = _interopRequireWildcard(require("tmp"));

var _fastText = _interopRequireDefault(require("./tools/fastText"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class DocumentClassifier {
  constructor(botId) {
    this.botId = botId;

    _defineProperty(this, "_index", {});

    _defineProperty(this, "_modelPath", void 0);

    _defineProperty(this, "_ft", void 0);
  }

  loadFromBuffer(indexedSnippets, modelBuffer) {
    this._index = indexedSnippets;
    this._modelPath = (0, _tmp.tmpNameSync)({
      postfix: '.bin'
    });

    _fs.default.writeFileSync(this._modelPath, modelBuffer);

    this._ft = new _fastText.default(this._modelPath);
  }

  async loadMostRecent() {
    const ghost = DocumentClassifier.ghostProvider(this.botId);
    const files = await ghost.directoryListing('./models', '*.bin');

    const mostRecent = _lodash.default.last(files.filter(f => f.startsWith('knowledge_')).sort());

    if (mostRecent && mostRecent.length) {
      const index = await ghost.readFileAsObject('./models', mostRecent.replace('knowledge_', 'knowledge_meta').replace('.bin', '.json'));
      const buff = await ghost.readFileAsBuffer('./models', mostRecent);
      await this.loadFromBuffer(index, buff);
    }
  }

  async train(indexedSnippets, fullModelPath) {
    const trainFile = _tmp.default.tmpNameSync({
      postfix: '.txt'
    });

    for (const idx in indexedSnippets) {
      const content = this._sanitize(indexedSnippets[idx].content);

      _fs.default.appendFileSync(trainFile, `${idx} ${content}${_os.EOL}`);
    }

    const ft = new _fastText.default(fullModelPath);
    ft.train(trainFile, {
      method: 'supervised'
    });
    this._ft = ft;
    this._index = indexedSnippets;
    this._modelPath = fullModelPath;
  }

  _sanitize(content) {
    return content.replace(/[^\w -]/gi, '').trim();
  }

  async predict(text) {
    text = this._sanitize(text);

    if (!this._ft) {
      return [];
    }

    const results = await this._ft.predict(text, 5);
    return results.map(c => ({
      snippet: this._index[c.name],
      confidence: c.confidence
    })).filter(c => !!c.snippet);
  }

}

exports.DocumentClassifier = DocumentClassifier;

_defineProperty(DocumentClassifier, "ghostProvider", void 0);