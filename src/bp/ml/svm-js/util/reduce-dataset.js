'use strict';

var assert = require('assert');
var _a = require('mout/array');
var numeric = require('numeric');

module.exports = function(dataset, retainedVariance){
    retainedVariance = retainedVariance || 0.99;
    var dims = numeric.dim(dataset);

    assert(dims[0]>0 && dims[1] === 2 && dims[2]>0 , 'dataset must be an list of [X,y] tuples');
    var inputs =  dataset.map(function(ex){ return ex[0]; });
    var covMatrix  = numeric.dot(numeric.transpose(inputs),inputs);
    covMatrix = numeric.mul(covMatrix, numeric.rep(numeric.dim(covMatrix), 1 / inputs.length));
    var usv = numeric.svd(covMatrix);

    var getFirstColumns = function(matrix, nbColumns){
        return matrix.map(function(line) {
            return _a.take(nbColumns, function(i){ return line[i]; });
        });
    };
    var n = dims[2],
        k = dims[2],
        j = 0, retain = 1;

    while (true){
        // decrease k while retain variance is acceptable
        var num = 0;
        var den = 0;
        for (j = 0; j<n; j++){
            if (j < k){
                num += usv.S[j];
            }
            den += usv.S[j];
        }
        var newRetain = num / den;
        if (newRetain < retainedVariance || k === 0){
            k++;
            break;
        }
        retain = newRetain;
        k--;
    }
    var reducedU = getFirstColumns(usv.U, k);

    return {
        U: reducedU,
        oldDimension: n,
        newDimension: k,
        dataset: dataset.map(function(ex){ return [numeric.dot(ex[0], reducedU), ex[1]]; }),
        retainedVariance: retain
    };
};