"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DefaultFastTextQueryArgs = exports.DefaultFastTextTrainArgs = void 0;

var _child_process = require("child_process");

var _fs = _interopRequireDefault(require("fs"));

var _os = require("os");

var _path = require("path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let bin = 'ft_linux';

if (process.platform === 'win32') {
  bin = 'ft_win.exe';
} else if (process.platform === 'darwin') {
  bin = 'ft_osx';
}

const DefaultFastTextTrainArgs = {
  method: 'supervised',
  learningRate: 0.8,
  epoch: 1000,
  bucket: 25000,
  dim: 15,
  wordGram: 3,
  minCount: 1,
  minn: 3,
  maxn: 6
};
exports.DefaultFastTextTrainArgs = DefaultFastTextTrainArgs;
const DefaultFastTextQueryArgs = {
  method: 'predict-prob',
  k: 5
};
exports.DefaultFastTextQueryArgs = DefaultFastTextQueryArgs;

class FastTextWrapper {
  static configure(newPath) {
    if (_fs.default.existsSync(newPath)) {
      this.BINPATH = newPath;
    } else {
      throw new Error(`FastText not found at path "${newPath}"`);
    }
  }

  constructor(modelPath) {
    this.modelPath = modelPath;
  }

  async train(trainingSetPath, args = DefaultFastTextTrainArgs) {
    const fArgs = { ...DefaultFastTextTrainArgs,
      ...(args || {})
    };

    try {
      (0, _child_process.execFileSync)(FastTextWrapper.BINPATH, [fArgs.method, '-input', trainingSetPath, '-output', this.modelPath.replace(/\.bin$/i, ''), '-lr', fArgs.learningRate, '-epoch', fArgs.epoch, '-loss', 'hs', '-dim', fArgs.dim, '-bucket', fArgs.bucket, '-wordNgrams', fArgs.wordGram, '-minCount', fArgs.minCount, '-minn', fArgs.minn, '-maxn', fArgs.maxn].map(x => x.toString()), {
        stdio: 'ignore'
      });
    } catch (err) {
      throw new Error(`Error training the NLU model.
stdout: ${err.stdout && err.stdout.toString()}
stderr: ${err.stderr && err.stderr.toString()}
message: ${err.message}
status: ${err.status}
pid: ${err.pid}
signal: ${err.signal}
`);
    }
  }

  async predict(sentence, k = DefaultFastTextQueryArgs.k) {
    const result = await FastTextWrapper._query(this.modelPath, sentence, {
      method: 'predict-prob',
      k
    });
    const parts = result.split(/\s|\n|\r/gi).filter(x => x.trim().length);
    const parsed = [];

    if (parts.length <= 1) {
      return [];
    }

    for (let i = 0; i < parts.length - 1; i += 2) {
      parsed.push({
        name: parts[i].replace(FastTextWrapper.LABEL_PREFIX, '').trim(),
        confidence: parseFloat(parts[i + 1])
      });
    }

    return parsed;
  }

  async wordVectors(word) {
    const result = await FastTextWrapper._query(this.modelPath, word, {
      method: 'print-word-vectors'
    });
    return result.split(/\s|\n|\r/gi).filter(x => x.trim().length).map(x => parseFloat(x)).filter(x => !isNaN(x));
  }

  static async _query(modelPath, input, args = DefaultFastTextQueryArgs) {
    const fArgs = { ...DefaultFastTextQueryArgs,
      ...(args || {})
    };
    const binArgs = [fArgs.method, modelPath];

    if (fArgs.method === 'predict-prob') {
      binArgs.push('-');
      binArgs.push(fArgs.k.toString());
    } else if (fArgs.method === 'nn') {
      binArgs.push(fArgs.k.toString());
    }

    try {
      const process = await this._acquireProcess(modelPath, binArgs);
      return new Promise(resolve => {
        process.stdin.write(`${input}${_os.EOL}`);
        process.stdout.once('data', resolve);
      });
    } finally {
      this._releaseProcess(modelPath);
    }
  }

  static _scheduleProcessCleanup(modelPath) {
    if (this.process_cache_expiry[modelPath]) {
      clearTimeout(this.process_cache_expiry[modelPath]);
    }

    this.process_cache_expiry[modelPath] = setTimeout(async () => {
      while (this.process_cache_lock[modelPath]) {
        await Promise.delay(50); // wait until the lock is released
      }

      if (this.process_cache[modelPath]) {
        this.process_cache[modelPath].kill();
      }

      delete this.process_cache[modelPath];
      delete this.process_cache_expiry[modelPath];
      delete this.process_cache_lock[modelPath];
    }, 5000); // kill the process if not called after a while
  }
  /** @description Spins a fastText process for the model in the background
   * and keep it running until it's not used anymore. When used, the process i/o is locked so that
   * there's only one producer and consumer of the streams at any given time.
   */


  static async _acquireProcess(modelPath, args) {
    if (this.process_cache_lock[modelPath] === true) {
      await Promise.delay(1); // re-queue async task

      return this._acquireProcess(modelPath, args);
    } else {
      this.process_cache_lock[modelPath] = true;
    }

    try {
      if (!this.process_cache[modelPath]) {
        this.process_cache[modelPath] = (0, _child_process.execFile)(this.BINPATH, args, {
          encoding: 'utf8',
          stdio: ['pipe', 'ignore', 'ignore']
        });
        this.process_cache[modelPath].stdout.on('close', () => {
          delete this.process_cache[modelPath];
          delete this.process_cache_expiry[modelPath];
          delete this.process_cache_lock[modelPath];
        });
      } // Schedule expiry of the process


      this._scheduleProcessCleanup(modelPath);

      return this.process_cache[modelPath];
    } catch (_unused) {
      this._releaseProcess(modelPath);
    }
  }

  static _releaseProcess(modelPath) {
    delete this.process_cache_lock[modelPath];
  }

}

exports.default = FastTextWrapper;

_defineProperty(FastTextWrapper, "LABEL_PREFIX", '__label__');

_defineProperty(FastTextWrapper, "BINPATH", (0, _path.join)(__dirname, 'bin', bin));

_defineProperty(FastTextWrapper, "process_cache", {});

_defineProperty(FastTextWrapper, "process_cache_lock", {});

_defineProperty(FastTextWrapper, "process_cache_expiry", {});