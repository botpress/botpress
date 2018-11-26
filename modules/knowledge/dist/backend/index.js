"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _child_process = require("child_process");

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Fuse = require('fuse.js');

const glob = require('glob');

const chokidar = require('chokidar');

const readPdfAsText = async fullPath => {
  const args = [fullPath, '-'];
  const result = (0, _child_process.execFileSync)('/usr/bin/pdftotext', args, {
    encoding: 'utf8'
  });
  const pages = [];
  let current = '';

  for (const c of result) {
    if (Buffer.from(c, 'utf8').toString('hex') == '0c') {
      pages.push(current);
      current = '';
    } else {
      current += c;
    }
  }

  return pages;
};

const indexByBot = {};

const onServerStarted = async bp => {
  bp.events.registerMiddleware({
    name: 'knowledge.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (event.type !== 'text') {
        next();
      }

      const options = {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 10,
        keys: ['content']
      };
      const fuse = new Fuse(indexByBot[event.botId], options);
      const result = fuse.search(event.preview);
      event.files = result || [];
      next();
    },
    order: 15,
    description: 'Finds content from Knowledge base files',
    enabled: true
  });
};

const onServerReady = async bp => {};

const onBotMount = async (bp, botId) => {
  const dir = _path.default.join(process.PROJECT_LOCATION, 'data/bots/', botId, 'knowledge');

  const watcher = chokidar.watch('**/*.pdf', {
    ignored: /(^|[\/\\])\../,
    cwd: dir,
    persistent: true
  });
  indexByBot[botId] = [];

  const indexFile = async name => {
    const filePath = _path.default.join(dir, name);

    const pages = await readPdfAsText(filePath);

    for (let i = 0; i <= pages.length; i++) {
      indexByBot[botId].push({
        page: i + 1,
        content: pages[i],
        filePath,
        fileName: name
      });
    }
  };

  const removeFile = name => {
    if (!indexByBot[botId]) {
      return;
    }

    indexByBot[botId] = indexByBot[botId].filter(entry => {
      return entry.fileName !== name;
    });
  };

  const files = glob.sync('**/*.pdf', {
    cwd: dir
  });
  files.forEach(f => indexFile(f));
  watcher.on('add', path => {
    removeFile(path);
    indexFile(path);
    bp.logger.info(`File ${path} has been indexed`);
  }).on('change', path => {
    removeFile(path);
    indexFile(path);
    bp.logger.info(`File ${path} has been re-indexed`);
  }).on('unlink', path => {
    removeFile(path);
    bp.logger.info(`File ${path} has been removed`);
  });
};

const onBotUnmount = async (bp, botId) => {};

const entryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'knowledge',
    menuIcon: 'question_answer',
    menuText: 'Knowledge',
    fullName: 'knowledge',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: {
      stretched: true
    }
  }
};
var _default = entryPoint;
exports.default = _default;