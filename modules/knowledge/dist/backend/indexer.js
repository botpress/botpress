"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Indexer = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _lodash = _interopRequireDefault(require("lodash"));

var _path = _interopRequireDefault(require("path"));

var _tmp = require("tmp");

var Converters = _interopRequireWildcard(require("./converters"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _awaitAsyncGenerator(value) { return new _AwaitValue(value); }

function _wrapAsyncGenerator(fn) { return function () { return new _AsyncGenerator(fn.apply(this, arguments)); }; }

function _AsyncGenerator(gen) { var front, back; function send(key, arg) { return new Promise(function (resolve, reject) { var request = { key: key, arg: arg, resolve: resolve, reject: reject, next: null }; if (back) { back = back.next = request; } else { front = back = request; resume(key, arg); } }); } function resume(key, arg) { try { var result = gen[key](arg); var value = result.value; var wrappedAwait = value instanceof _AwaitValue; Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) { if (wrappedAwait) { resume("next", arg); return; } settle(result.done ? "return" : "normal", arg); }, function (err) { resume("throw", err); }); } catch (err) { settle("throw", err); } } function settle(type, value) { switch (type) { case "return": front.resolve({ value: value, done: true }); break; case "throw": front.reject(value); break; default: front.resolve({ value: value, done: false }); break; } front = front.next; if (front) { resume(front.key, front.arg); } else { back = null; } } this._invoke = send; if (typeof gen.return !== "function") { this.return = undefined; } }

if (typeof Symbol === "function" && Symbol.asyncIterator) { _AsyncGenerator.prototype[Symbol.asyncIterator] = function () { return this; }; }

_AsyncGenerator.prototype.next = function (arg) { return this._invoke("next", arg); };

_AsyncGenerator.prototype.throw = function (arg) { return this._invoke("throw", arg); };

_AsyncGenerator.prototype.return = function (arg) { return this._invoke("return", arg); };

function _AwaitValue(value) { this.wrapped = value; }

function _asyncIterator(iterable) { var method; if (typeof Symbol === "function") { if (Symbol.asyncIterator) { method = iterable[Symbol.asyncIterator]; if (method != null) return method.call(iterable); } if (Symbol.iterator) { method = iterable[Symbol.iterator]; if (method != null) return method.call(iterable); } } throw new TypeError("Object is not async iterable"); }

class Indexer {
  constructor(botId, classifier) {
    this.botId = botId;
    this.classifier = classifier;

    _defineProperty(this, "_forceSyncDebounce", void 0);

    this._forceSyncDebounce = _lodash.default.debounce(this._forceSync, 500);
  }

  async forceSync(skipDebounce = false) {
    if (skipDebounce) {
      this._forceSyncDebounce.cancel();

      return this._forceSync();
    }

    return this._forceSyncDebounce();
  }

  async _forceSync() {
    const modelName = Date.now();
    const metadataFile = `knowledge_meta_${modelName}.json`;
    const modelFile = `knowledge_${modelName}.bin`;
    const tmpModelLoc = (0, _tmp.tmpNameSync)({
      postfix: '.bin'
    });
    const snippetIndex = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;

    var _iteratorError;

    try {
      for (var _iterator = _asyncIterator(this._pullDocuments()), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
        const snippets = _value;

        for (const snippet of snippets) {
          const label = this._snippetToCanonical(snippet);

          snippetIndex[label] = snippet;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          await _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    Indexer.ghostProvider(this.botId).upsertFile('./models', metadataFile, JSON.stringify(snippetIndex, undefined, 2));
    await this.classifier.train(snippetIndex, tmpModelLoc);

    const modelBuff = _fs.default.readFileSync(tmpModelLoc);

    await Indexer.ghostProvider(this.botId).upsertFile('./models', modelFile, modelBuff);
    await this.classifier.loadFromBuffer(snippetIndex, modelBuff);
  }

  _snippetToCanonical(snippet) {
    return `__label__${snippet.source}___${snippet.name}___${snippet.page}___${snippet.paragraph}`;
  }

  _pullDocuments() {
    var _this = this;

    return _wrapAsyncGenerator(function* () {
      const ghost = Indexer.ghostProvider(_this.botId);
      const files = yield _awaitAsyncGenerator(ghost.directoryListing('./knowledge', '*.*'));

      for (const file of files) {
        const converter = Indexer.converters.find(c => c.fileExtensions.includes(_path.default.extname(file)));

        if (!converter) {
          continue;
        }

        const tmpFile = (0, _tmp.tmpNameSync)();
        const fileBuff = yield _awaitAsyncGenerator(ghost.readFileAsBuffer('./knowledge', tmpFile));

        _fs.default.writeFileSync(tmpFile, fileBuff);

        const content = yield _awaitAsyncGenerator(converter(tmpFile));
        yield _this._splitDocument(file, content);
      }
    })();
  }

  async _splitDocument(name, content) {
    const snippets = [];
    const pages = content.split(String.fromCharCode(0x0c));
    pages.forEach((page, pageidx) => {
      page.split(/\r\n|\n/gi).forEach((p, pidx) => {
        // TODO Split paragraphs smarter here
        // i.e. if small line, check if Question
        // if empty ... etc
        snippets.push({
          name,
          source: 'doc',
          page: pageidx.toString(),
          paragraph: pidx.toString(),
          content: p
        });
      });
    });
    return snippets;
  }

}

exports.Indexer = Indexer;

_defineProperty(Indexer, "ghostProvider", void 0);

_defineProperty(Indexer, "converters", [Converters.Pdf]);