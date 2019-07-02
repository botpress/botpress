'use strict';

var assert = require('assert');
var _a = require('mout/array');
var numeric = require('numeric');
var average = require('./average');

module.exports = function(arr){
    var n = numeric.dim(arr)[0] || 0;
    var m = numeric.dim(arr)[1] || 0;
    assert(n > 0,'array cannot be empty');
    assert(m === 0 ,'array must be 1d');
    var avg = average(arr);
    var variance = _a.reduce(arr, function(sum, v){ return sum + Math.pow(v - avg, 2); }, 0) / n;
    return Math.pow(variance, 0.5);
};
