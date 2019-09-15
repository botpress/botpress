'use strict'

var Q = require('q')
var assert = require('assert')
var numeric = require('numeric')
var _o = require('mout/object')
var _a = require('mout/array')

var addon = require('../addon')
var svmTypes = require('./svm-types')
var kernelTypes = require('./kernel-types')

function BaseSVM(clf) {
  if (clf) {
    this._clf = clf
  }
}

BaseSVM.restore = function(model) {
  var clf = new addon.NodeSvm()
  clf.loadFromModel(model)
  return new BaseSVM(clf)
}

BaseSVM.prototype.train = function(dataset, config) {
  var dims = numeric.dim(dataset)
  assert(dims[0] > 0 && dims[1] === 2 && dims[2] > 0, 'dataset must be a list of [X,y] tuples')

  var params = _o.merge(
    {
      svmType: svmTypes.C_SVC,
      kernelType: kernelTypes.RBF,
      degree: 3,
      gamma: 1,
      r: 0,
      c: 1,
      nu: 0.5,
      epsilon: 0.1,
      cacheSize: 100,
      eps: 1e-3,
      shrinking: true,
      probability: false
    },
    config || {}
  )

  var self = this
  var deferred = Q.defer()
  this._clf = new addon.NodeSvm()
  var err = this._clf.setParameters(params)
  if (err) {
    return Q.reject(new Error('Bad parameters'))
  }
  this._clf.trainAsync(dataset, function() {
    var model = self._clf.getModel()
    deferred.resolve(model)
  })
  return deferred.promise
}

BaseSVM.prototype.predictSync = function(inputs) {
  assert(!!this._clf, 'train classifier first')
  var dims = numeric.dim(inputs)
  assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
  return this._clf.predict(inputs)
}
BaseSVM.prototype.predict = function(inputs) {
  assert(!!this._clf, 'train classifier first')
  var dims = numeric.dim(inputs)
  assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
  var deferred = Q.defer()

  this._clf.predictAsync(inputs, function(prediction) {
    deferred.resolve(prediction)
  })
  return deferred.promise
}

/*
 WARNING : Seems not to work very well.
 see : http://stats.stackexchange.com/questions/64403/libsvm-probability-estimates-in-multi-class-problems
 */
BaseSVM.prototype.predictProbabilitiesSync = function(inputs) {
  assert(!!this._clf, 'train classifier first')
  var dims = numeric.dim(inputs)
  assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')

  var probs = this._clf.predictProbabilities(inputs)
  return _a.zip(this._clf.getLabels(), probs).reduce(function(res, tuple) {
    res[tuple[0]] = tuple[1]
    return res
  }, {})
}
BaseSVM.prototype.predictProbabilities = function(inputs) {
  assert(!!this._clf, 'train classifier first')
  var dims = numeric.dim(inputs)
  assert((dims[0] || 0) > 0 && (dims[1] || 0) === 0, 'input must be a 1d array')
  var self = this
  var deferred = Q.defer()
  this._clf.predictProbabilitiesAsync(inputs, function(probs) {
    var result = _a.zip(self._clf.getLabels(), probs).reduce(function(res, tuple) {
      res[tuple[0]] = tuple[1]
      return res
    }, {})
    deferred.resolve(result)
  })
  return deferred.promise
}

BaseSVM.prototype.isTrained = function() {
  return !!this._clf ? this._clf.isTrained() : false
}

module.exports = BaseSVM
