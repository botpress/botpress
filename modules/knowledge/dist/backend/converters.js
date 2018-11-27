"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Text = exports.Pdf = void 0;

var _child_process = require("child_process");

var _fs = require("fs");

var _os = _interopRequireDefault(require("os"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function pdf(fullPath) {
  const binExt = {
    darwin: 'osx',
    linux: 'linux',
    win32: 'win'
  }[_os.default.platform()];

  const args = [fullPath, '-'];
  return (0, _child_process.execFileSync)(_path.default.resolve(__dirname, './tools/bin/pdftotext_' + binExt), args, {
    encoding: 'utf8'
  });
}

pdf.fileExtensions = ['.pdf'];
const Pdf = pdf;
exports.Pdf = Pdf;

async function text(fullPath) {
  return (0, _fs.readFileSync)(fullPath, 'utf8');
}

text.fileExtensions = ['.txt', '.text', '.rtf'];
const Text = text;
exports.Text = Text;