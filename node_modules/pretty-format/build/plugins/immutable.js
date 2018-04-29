'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.test = exports.serialize = undefined;









var _collections = require('../collections');

// SENTINEL constants are from https://github.com/facebook/immutable-js
/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@'; // immutable v4
const IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';const IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

const getImmutableName = name => 'Immutable.' + name;
const printAsLeaf = name => '[' + name + ']';
const SPACE = ' ';
const LAZY = '…'; // Seq is lazy if it calls a method like filter

const printImmutableEntries = (
val,
config,
indentation,
depth,
refs,
printer,
type) =>

++depth > config.maxDepth ?
printAsLeaf(getImmutableName(type)) :
getImmutableName(type) +
SPACE +
'{' +
(0, _collections.printIteratorEntries)(
val.entries(),
config,
indentation,
depth,
refs,
printer) +

'}';

// Return an iterator for Immutable Record in v4 or later.
const getRecordEntries = val => {
  let i = 0;
  return {
    next() {
      if (i < val._keys.length) {
        const key = val._keys[i++];
        return { done: false, value: [key, val.get(key)] };
      }
      return { done: true };
    } };

};

const printImmutableRecord = (
val,
config,
indentation,
depth,
refs,
printer) =>
{
  // _name property is defined only for an Immutable Record instance
  // which was constructed with a second optional descriptive name arg
  const name = getImmutableName(val._name || 'Record');
  const entries = typeof Array.isArray(val._keys) ?
  getRecordEntries(val) // immutable v4
  : val.entries(); // Record is a collection in immutable v3
  return ++depth > config.maxDepth ?
  printAsLeaf(name) :
  name +
  SPACE +
  '{' +
  (0, _collections.printIteratorEntries)(entries, config, indentation, depth, refs, printer) +
  '}';
};

const printImmutableSeq = (
val,
config,
indentation,
depth,
refs,
printer) =>
{
  const name = getImmutableName('Seq');

  if (++depth > config.maxDepth) {
    return printAsLeaf(name);
  }

  if (val[IS_KEYED_SENTINEL]) {
    return (
      name +
      SPACE +
      '{' + (
      // from Immutable collection of entries or from ECMAScript object
      val._iter || val._object ?
      (0, _collections.printIteratorEntries)(
      val.entries(),
      config,
      indentation,
      depth,
      refs,
      printer) :

      LAZY) +
      '}');

  }

  return (
    name +
    SPACE +
    '[' + (
    val._iter || // from Immutable collection of values
    val._array || // from ECMAScript array
    val._collection || // from ECMAScript collection in immutable v4
    val._iterable // from ECMAScript collection in immutable v3
    ? (0, _collections.printIteratorValues)(
    val.values(),
    config,
    indentation,
    depth,
    refs,
    printer) :

    LAZY) +
    ']');

};

const printImmutableValues = (
val,
config,
indentation,
depth,
refs,
printer,
type) =>

++depth > config.maxDepth ?
printAsLeaf(getImmutableName(type)) :
getImmutableName(type) +
SPACE +
'[' +
(0, _collections.printIteratorValues)(
val.values(),
config,
indentation,
depth,
refs,
printer) +

']';

const serialize = exports.serialize = (
val,
config,
indentation,
depth,
refs,
printer) =>
{
  if (val[IS_MAP_SENTINEL]) {
    return printImmutableEntries(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    val[IS_ORDERED_SENTINEL] ? 'OrderedMap' : 'Map');

  }

  if (val[IS_LIST_SENTINEL]) {
    return printImmutableValues(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    'List');

  }
  if (val[IS_SET_SENTINEL]) {
    return printImmutableValues(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    val[IS_ORDERED_SENTINEL] ? 'OrderedSet' : 'Set');

  }
  if (val[IS_STACK_SENTINEL]) {
    return printImmutableValues(
    val,
    config,
    indentation,
    depth,
    refs,
    printer,
    'Stack');

  }

  if (val[IS_SEQ_SENTINEL]) {
    return printImmutableSeq(val, config, indentation, depth, refs, printer);
  }

  // For compatibility with immutable v3 and v4, let record be the default.
  return printImmutableRecord(val, config, indentation, depth, refs, printer);
};

const test = exports.test = val =>
val && (val[IS_ITERABLE_SENTINEL] || val[IS_RECORD_SENTINEL]);exports.default =

{ serialize, test };