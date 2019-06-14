'use strict';

var assert = require('assert');
var _a = require('mout/array');
var numeric = require('numeric');

module.exports = function(arr){
    var n = numeric.dim(arr)[0] || 0;
    assert(n > 0,'array cannot be empty');
    return _a.reduce(arr, function(sum, v){ return sum + v; }, 0) / n;
};
