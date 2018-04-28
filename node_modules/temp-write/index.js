'use strict';
const path = require('path');
const fs = require('graceful-fs');
const isStream = require('is-stream');
const makeDir = require('make-dir');
const uuid = require('uuid');
const pify = require('pify');
const tempDir = require('temp-dir');

const tempfile = filepath => path.join(tempDir, uuid.v4(), (filepath || ''));

const writeStream = (filepath, input) => new Promise((resolve, reject) => {
	const writable = fs.createWriteStream(filepath);

	input
		.on('error', err => {
			// Be careful to reject before writable.end(), otherwise the writable's
			// 'finish' event will fire first and we will resolve the promise
			// before we reject it.
			reject(err);
			input.unpipe(writable);
			writable.end();
		})
		.pipe(writable)
		.on('error', reject)
		.on('finish', resolve);
});

module.exports = (input, filepath) => {
	const tempPath = tempfile(filepath);
	const write = isStream(input) ? writeStream : pify(fs.writeFile);

	return makeDir(path.dirname(tempPath))
		.then(() => write(tempPath, input))
		.then(() => tempPath);
};

module.exports.sync = (input, filepath) => {
	const tempPath = tempfile(filepath);

	makeDir.sync(path.dirname(tempPath));
	fs.writeFileSync(tempPath, input);

	return tempPath;
};
