'use strict';
const path = require('path');
const globalDirs = require('global-dirs');

module.exports = moduleId => {
	try {
		return require.resolve(path.join(globalDirs.yarn.packages, moduleId));
	} catch (err) {
		return require.resolve(path.join(globalDirs.npm.packages, moduleId));
	}
};

module.exports.silent = moduleId => {
	try {
		return module.exports(moduleId);
	} catch (err) {
		return null;
	}
};
