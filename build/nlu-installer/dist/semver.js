"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.underscoresToDots = exports.dotsToUnderscores = void 0;
var dotsToUnderscores = function (dots) {
    var _a = dots.split('.'), major = _a[0], minor = _a[1], patch = _a[2];
    return major + "_" + minor + "_" + patch;
};
exports.dotsToUnderscores = dotsToUnderscores;
var underscoresToDots = function (underscores) {
    var _a = underscores.split('_'), major = _a[0], minor = _a[1], patch = _a[2];
    return major + "." + minor + "." + patch;
};
exports.underscoresToDots = underscoresToDots;
