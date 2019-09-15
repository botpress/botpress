'use strict';

var assert = require('assert');
var numeric = require('numeric');

module.exports = function(params){
    var n = numeric.dim(params)[0] || 0,
        m = numeric.dim(params)[1] || 0;
    assert(n>0 && m>=0, 'params must be a 2d array');

    var nbCombs = 1;
    params.forEach(function(values){
        nbCombs *= values.length > 0? values.length : 1;
    });
    var result = numeric.rep([nbCombs, params.length], 0);

    var i = 0, j = 0, k = 0, l = 0;
    var duration = 1;
    for (i = 0; i < params.length; i++){
        var input = params[i];
        k = 0;

        while ( k < nbCombs){
            if (input.length > 0) {
                for (j = 0; j < input.length; j++) {
                    for (l = 0; l < duration; l++) {
                        result[k][i] = input[j];
                        k++;
                    }
                }
            }
            else {
                for (l = 0; l < duration; l++) {
                    result[k][i] = null;
                    k++;
                }
            }
        }
        duration *= input.length || 1 ;

    }
    return result;
};