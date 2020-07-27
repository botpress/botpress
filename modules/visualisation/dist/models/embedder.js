"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PythonEmbedder = exports.BotpressEmbedder = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _crypto = _interopRequireDefault(require("crypto"));

var _lruCache = _interopRequireDefault(require("lru-cache"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class BotpressEmbedder {
  constructor(botName, ghost) {
    this.botName = botName;
    this.ghost = ghost;

    _defineProperty(this, "cache_root", void 0);

    _defineProperty(this, "cache", void 0);

    _defineProperty(this, "model_name", void 0);

    _defineProperty(this, "axiosConfig", void 0);

    this.model_name = 'BotpressEmbedder';
    this.cache_root = './cache/BotpressEmbedder';
  }

  async load(axiosConfig) {
    axiosConfig.timeout = 1000000;
    this.axiosConfig = axiosConfig;
    this.cache = new _lruCache.default({
      length: arr => {
        if (arr && arr.BYTES_PER_ELEMENT) {
          return arr.length * arr.BYTES_PER_ELEMENT;
        } else {
          return 300
          /* dim */
          * Float32Array.BYTES_PER_ELEMENT;
        }
      },
      max: 300
      /* dim */
      * Float32Array.BYTES_PER_ELEMENT
      /* bytes */
      * 10000000
      /* 10M sentences */

    });

    if (await this.ghost.fileExists(this.cache_root, 'embedder_cache.json')) {
      const stringDump = await this.ghost.readFileAsString(this.cache_root, 'embedder_cache.json');
      const dump = JSON.parse(stringDump);

      if (dump) {
        const kve = dump.map(x => ({
          e: x.e,
          k: x.k,
          v: Float32Array.from(Object.values(x.v))
        }));
        this.cache.load(kve);
      }
    }
  }

  async save() {
    await this.ghost.upsertFile(this.cache_root, 'embedder_cache.json', JSON.stringify(this.cache.dump()));
  }

  async embed(sentence) {
    this.axiosConfig.timeout = 8000;

    const cache_key = _crypto.default.createHash('md5').update(sentence).digest('hex');

    if (this.cache.has(cache_key)) {
      return Array.from(this.cache.get(cache_key).values());
    } else {
      const {
        data
      } = await _axios.default.post(`http://localhost:3000/api/v1/bots/${this.botName}/mod/nlu/embed`, {
        utterances: [sentence.trim()]
      }, this.axiosConfig);
      this.cache.set(cache_key, Float32Array.from(data[0]));
      return data[0];
    }
  }

}

exports.BotpressEmbedder = BotpressEmbedder;

class PythonEmbedder {
  constructor(ghost) {
    this.ghost = ghost;

    _defineProperty(this, "cache_root", void 0);

    _defineProperty(this, "cache", void 0);

    _defineProperty(this, "model_name", void 0);

    _defineProperty(this, "axiosConfig", void 0);

    this.model_name = 'PythonEmbedder';
    this.cache_root = './cache/PythonEmbedder';
  }

  async load(axiosConfig) {
    axiosConfig.timeout = 1000000;
    this.axiosConfig = axiosConfig;
    this.cache = new _lruCache.default({
      length: arr => {
        if (arr && arr.BYTES_PER_ELEMENT) {
          return arr.length * arr.BYTES_PER_ELEMENT;
        } else {
          return 512
          /* dim */
          * Float32Array.BYTES_PER_ELEMENT;
        }
      },
      max: 512
      /* dim */
      * Float32Array.BYTES_PER_ELEMENT
      /* bytes */
      * 10000000
      /* 10M sentences */

    });

    if (await this.ghost.fileExists(this.cache_root, 'embedder_cache.json')) {
      const stringDump = await this.ghost.readFileAsString(this.cache_root, 'embedder_cache.json');
      const dump = JSON.parse(stringDump);

      if (dump) {
        const kve = dump.map(x => ({
          e: x.e,
          k: x.k,
          v: Float32Array.from(Object.values(x.v))
        }));
        this.cache.load(kve);
      }
    }
  }

  async save() {
    await this.ghost.upsertFile(this.cache_root, 'embedder_cache.json', JSON.stringify(this.cache.dump()));
  }

  async embed(sentence) {
    const cache_key = _crypto.default.createHash('md5').update(sentence).digest('hex');

    if (this.cache.has(cache_key)) {
      return Array.from(this.cache.get(cache_key).values());
    } else {
      const {
        data
      } = await _axios.default.post('http://localhost:8000/embeddings', {
        documents: [sentence]
      });
      const embedding = data.data[0];
      this.cache.set(cache_key, Float32Array.from(embedding));
      return embedding;
    }
  }

}

exports.PythonEmbedder = PythonEmbedder;
//# sourceMappingURL=embedder.js.map