botpress = typeof botpress === "object" ? botpress : {}; botpress["channel-web"] =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/js/lite-modules/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds/index.js":
/*!****************************************************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds/index.js ***!
  \****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var MILLISECONDS_IN_MINUTE = 60000

/**
 * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
 * They usually appear for dates that denote time before the timezones were introduced
 * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
 * and GMT+01:00:00 after that date)
 *
 * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
 * which would lead to incorrect calculations.
 *
 * This function returns the timezone offset in milliseconds that takes seconds in account.
 */
module.exports = function getTimezoneOffsetInMilliseconds (dirtyDate) {
  var date = new Date(dirtyDate.getTime())
  var baseTimezoneOffset = date.getTimezoneOffset()
  date.setSeconds(0, 0)
  var millisecondsPartOfTimezoneOffset = date.getTime() % MILLISECONDS_IN_MINUTE

  return baseTimezoneOffset * MILLISECONDS_IN_MINUTE + millisecondsPartOfTimezoneOffset
}


/***/ }),

/***/ "../../node_modules/date-fns/difference_in_milliseconds/index.js":
/*!******************************************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/difference_in_milliseconds/index.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(/*! ../parse/index.js */ "../../node_modules/date-fns/parse/index.js")

/**
 * @category Millisecond Helpers
 * @summary Get the number of milliseconds between the given dates.
 *
 * @description
 * Get the number of milliseconds between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of milliseconds
 *
 * @example
 * // How many milliseconds are between
 * // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
 * var result = differenceInMilliseconds(
 *   new Date(2014, 6, 2, 12, 30, 21, 700),
 *   new Date(2014, 6, 2, 12, 30, 20, 600)
 * )
 * //=> 1100
 */
function differenceInMilliseconds (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)
  return dateLeft.getTime() - dateRight.getTime()
}

module.exports = differenceInMilliseconds


/***/ }),

/***/ "../../node_modules/date-fns/difference_in_minutes/index.js":
/*!*************************************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/difference_in_minutes/index.js ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var differenceInMilliseconds = __webpack_require__(/*! ../difference_in_milliseconds/index.js */ "../../node_modules/date-fns/difference_in_milliseconds/index.js")

var MILLISECONDS_IN_MINUTE = 60000

/**
 * @category Minute Helpers
 * @summary Get the number of minutes between the given dates.
 *
 * @description
 * Get the number of minutes between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of minutes
 *
 * @example
 * // How many minutes are between 2 July 2014 12:07:59 and 2 July 2014 12:20:00?
 * var result = differenceInMinutes(
 *   new Date(2014, 6, 2, 12, 20, 0),
 *   new Date(2014, 6, 2, 12, 7, 59)
 * )
 * //=> 12
 */
function differenceInMinutes (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / MILLISECONDS_IN_MINUTE
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInMinutes


/***/ }),

/***/ "../../node_modules/date-fns/is_before/index.js":
/*!*************************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/is_before/index.js ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(/*! ../parse/index.js */ "../../node_modules/date-fns/parse/index.js")

/**
 * @category Common Helpers
 * @summary Is the first date before the second one?
 *
 * @description
 * Is the first date before the second one?
 *
 * @param {Date|String|Number} date - the date that should be before the other one to return true
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @returns {Boolean} the first date is before the second date
 *
 * @example
 * // Is 10 July 1989 before 11 February 1987?
 * var result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
 * //=> false
 */
function isBefore (dirtyDate, dirtyDateToCompare) {
  var date = parse(dirtyDate)
  var dateToCompare = parse(dirtyDateToCompare)
  return date.getTime() < dateToCompare.getTime()
}

module.exports = isBefore


/***/ }),

/***/ "../../node_modules/date-fns/is_date/index.js":
/*!***********************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/is_date/index.js ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * @category Common Helpers
 * @summary Is the given argument an instance of Date?
 *
 * @description
 * Is the given argument an instance of Date?
 *
 * @param {*} argument - the argument to check
 * @returns {Boolean} the given argument is an instance of Date
 *
 * @example
 * // Is 'mayonnaise' a Date?
 * var result = isDate('mayonnaise')
 * //=> false
 */
function isDate (argument) {
  return argument instanceof Date
}

module.exports = isDate


/***/ }),

/***/ "../../node_modules/date-fns/parse/index.js":
/*!*********************************************************************************!*\
  !*** /Users/renaud/Code/Botpress/botpress/node_modules/date-fns/parse/index.js ***!
  \*********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var getTimezoneOffsetInMilliseconds = __webpack_require__(/*! ../_lib/getTimezoneOffsetInMilliseconds/index.js */ "../../node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds/index.js")
var isDate = __webpack_require__(/*! ../is_date/index.js */ "../../node_modules/date-fns/is_date/index.js")

var MILLISECONDS_IN_HOUR = 3600000
var MILLISECONDS_IN_MINUTE = 60000
var DEFAULT_ADDITIONAL_DIGITS = 2

var parseTokenDateTimeDelimeter = /[T ]/
var parseTokenPlainTime = /:/

// year tokens
var parseTokenYY = /^(\d{2})$/
var parseTokensYYY = [
  /^([+-]\d{2})$/, // 0 additional digits
  /^([+-]\d{3})$/, // 1 additional digit
  /^([+-]\d{4})$/ // 2 additional digits
]

var parseTokenYYYY = /^(\d{4})/
var parseTokensYYYYY = [
  /^([+-]\d{4})/, // 0 additional digits
  /^([+-]\d{5})/, // 1 additional digit
  /^([+-]\d{6})/ // 2 additional digits
]

// date tokens
var parseTokenMM = /^-(\d{2})$/
var parseTokenDDD = /^-?(\d{3})$/
var parseTokenMMDD = /^-?(\d{2})-?(\d{2})$/
var parseTokenWww = /^-?W(\d{2})$/
var parseTokenWwwD = /^-?W(\d{2})-?(\d{1})$/

// time tokens
var parseTokenHH = /^(\d{2}([.,]\d*)?)$/
var parseTokenHHMM = /^(\d{2}):?(\d{2}([.,]\d*)?)$/
var parseTokenHHMMSS = /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/

// timezone tokens
var parseTokenTimezone = /([Z+-].*)$/
var parseTokenTimezoneZ = /^(Z)$/
var parseTokenTimezoneHH = /^([+-])(\d{2})$/
var parseTokenTimezoneHHMM = /^([+-])(\d{2}):?(\d{2})$/

/**
 * @category Common Helpers
 * @summary Convert the given argument to an instance of Date.
 *
 * @description
 * Convert the given argument to an instance of Date.
 *
 * If the argument is an instance of Date, the function returns its clone.
 *
 * If the argument is a number, it is treated as a timestamp.
 *
 * If an argument is a string, the function tries to parse it.
 * Function accepts complete ISO 8601 formats as well as partial implementations.
 * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
 *
 * If all above fails, the function passes the given argument to Date constructor.
 *
 * @param {Date|String|Number} argument - the value to convert
 * @param {Object} [options] - the object with options
 * @param {0 | 1 | 2} [options.additionalDigits=2] - the additional number of digits in the extended year format
 * @returns {Date} the parsed date in the local time zone
 *
 * @example
 * // Convert string '2014-02-11T11:30:30' to date:
 * var result = parse('2014-02-11T11:30:30')
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Parse string '+02014101',
 * // if the additional number of digits in the extended year format is 1:
 * var result = parse('+02014101', {additionalDigits: 1})
 * //=> Fri Apr 11 2014 00:00:00
 */
function parse (argument, dirtyOptions) {
  if (isDate(argument)) {
    // Prevent the date to lose the milliseconds when passed to new Date() in IE10
    return new Date(argument.getTime())
  } else if (typeof argument !== 'string') {
    return new Date(argument)
  }

  var options = dirtyOptions || {}
  var additionalDigits = options.additionalDigits
  if (additionalDigits == null) {
    additionalDigits = DEFAULT_ADDITIONAL_DIGITS
  } else {
    additionalDigits = Number(additionalDigits)
  }

  var dateStrings = splitDateString(argument)

  var parseYearResult = parseYear(dateStrings.date, additionalDigits)
  var year = parseYearResult.year
  var restDateString = parseYearResult.restDateString

  var date = parseDate(restDateString, year)

  if (date) {
    var timestamp = date.getTime()
    var time = 0
    var offset

    if (dateStrings.time) {
      time = parseTime(dateStrings.time)
    }

    if (dateStrings.timezone) {
      offset = parseTimezone(dateStrings.timezone) * MILLISECONDS_IN_MINUTE
    } else {
      var fullTime = timestamp + time
      var fullTimeDate = new Date(fullTime)

      offset = getTimezoneOffsetInMilliseconds(fullTimeDate)

      // Adjust time when it's coming from DST
      var fullTimeDateNextDay = new Date(fullTime)
      fullTimeDateNextDay.setDate(fullTimeDate.getDate() + 1)
      var offsetDiff =
        getTimezoneOffsetInMilliseconds(fullTimeDateNextDay) -
        getTimezoneOffsetInMilliseconds(fullTimeDate)
      if (offsetDiff > 0) {
        offset += offsetDiff
      }
    }

    return new Date(timestamp + time + offset)
  } else {
    return new Date(argument)
  }
}

function splitDateString (dateString) {
  var dateStrings = {}
  var array = dateString.split(parseTokenDateTimeDelimeter)
  var timeString

  if (parseTokenPlainTime.test(array[0])) {
    dateStrings.date = null
    timeString = array[0]
  } else {
    dateStrings.date = array[0]
    timeString = array[1]
  }

  if (timeString) {
    var token = parseTokenTimezone.exec(timeString)
    if (token) {
      dateStrings.time = timeString.replace(token[1], '')
      dateStrings.timezone = token[1]
    } else {
      dateStrings.time = timeString
    }
  }

  return dateStrings
}

function parseYear (dateString, additionalDigits) {
  var parseTokenYYY = parseTokensYYY[additionalDigits]
  var parseTokenYYYYY = parseTokensYYYYY[additionalDigits]

  var token

  // YYYY or ±YYYYY
  token = parseTokenYYYY.exec(dateString) || parseTokenYYYYY.exec(dateString)
  if (token) {
    var yearString = token[1]
    return {
      year: parseInt(yearString, 10),
      restDateString: dateString.slice(yearString.length)
    }
  }

  // YY or ±YYY
  token = parseTokenYY.exec(dateString) || parseTokenYYY.exec(dateString)
  if (token) {
    var centuryString = token[1]
    return {
      year: parseInt(centuryString, 10) * 100,
      restDateString: dateString.slice(centuryString.length)
    }
  }

  // Invalid ISO-formatted year
  return {
    year: null
  }
}

function parseDate (dateString, year) {
  // Invalid ISO-formatted year
  if (year === null) {
    return null
  }

  var token
  var date
  var month
  var week

  // YYYY
  if (dateString.length === 0) {
    date = new Date(0)
    date.setUTCFullYear(year)
    return date
  }

  // YYYY-MM
  token = parseTokenMM.exec(dateString)
  if (token) {
    date = new Date(0)
    month = parseInt(token[1], 10) - 1
    date.setUTCFullYear(year, month)
    return date
  }

  // YYYY-DDD or YYYYDDD
  token = parseTokenDDD.exec(dateString)
  if (token) {
    date = new Date(0)
    var dayOfYear = parseInt(token[1], 10)
    date.setUTCFullYear(year, 0, dayOfYear)
    return date
  }

  // YYYY-MM-DD or YYYYMMDD
  token = parseTokenMMDD.exec(dateString)
  if (token) {
    date = new Date(0)
    month = parseInt(token[1], 10) - 1
    var day = parseInt(token[2], 10)
    date.setUTCFullYear(year, month, day)
    return date
  }

  // YYYY-Www or YYYYWww
  token = parseTokenWww.exec(dateString)
  if (token) {
    week = parseInt(token[1], 10) - 1
    return dayOfISOYear(year, week)
  }

  // YYYY-Www-D or YYYYWwwD
  token = parseTokenWwwD.exec(dateString)
  if (token) {
    week = parseInt(token[1], 10) - 1
    var dayOfWeek = parseInt(token[2], 10) - 1
    return dayOfISOYear(year, week, dayOfWeek)
  }

  // Invalid ISO-formatted date
  return null
}

function parseTime (timeString) {
  var token
  var hours
  var minutes

  // hh
  token = parseTokenHH.exec(timeString)
  if (token) {
    hours = parseFloat(token[1].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR
  }

  // hh:mm or hhmm
  token = parseTokenHHMM.exec(timeString)
  if (token) {
    hours = parseInt(token[1], 10)
    minutes = parseFloat(token[2].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR +
      minutes * MILLISECONDS_IN_MINUTE
  }

  // hh:mm:ss or hhmmss
  token = parseTokenHHMMSS.exec(timeString)
  if (token) {
    hours = parseInt(token[1], 10)
    minutes = parseInt(token[2], 10)
    var seconds = parseFloat(token[3].replace(',', '.'))
    return (hours % 24) * MILLISECONDS_IN_HOUR +
      minutes * MILLISECONDS_IN_MINUTE +
      seconds * 1000
  }

  // Invalid ISO-formatted time
  return null
}

function parseTimezone (timezoneString) {
  var token
  var absoluteOffset

  // Z
  token = parseTokenTimezoneZ.exec(timezoneString)
  if (token) {
    return 0
  }

  // ±hh
  token = parseTokenTimezoneHH.exec(timezoneString)
  if (token) {
    absoluteOffset = parseInt(token[2], 10) * 60
    return (token[1] === '+') ? -absoluteOffset : absoluteOffset
  }

  // ±hh:mm or ±hhmm
  token = parseTokenTimezoneHHMM.exec(timezoneString)
  if (token) {
    absoluteOffset = parseInt(token[2], 10) * 60 + parseInt(token[3], 10)
    return (token[1] === '+') ? -absoluteOffset : absoluteOffset
  }

  return 0
}

function dayOfISOYear (isoYear, week, day) {
  week = week || 0
  day = day || 0
  var date = new Date(0)
  date.setUTCFullYear(isoYear, 0, 4)
  var fourthOfJanuaryDay = date.getUTCDay() || 7
  var diff = week * 7 + day + 1 - fourthOfJanuaryDay
  date.setUTCDate(date.getUTCDate() + diff)
  return date
}

module.exports = parse


/***/ }),

/***/ "./assets/slick/slick-theme.css":
/*!**************************************!*\
  !*** ./assets/slick/slick-theme.css ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(/*! !../../node_modules/css-loader!./slick-theme.css */ "./node_modules/css-loader/index.js!./assets/slick/slick-theme.css");

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! ../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./assets/slick/slick.css":
/*!********************************!*\
  !*** ./assets/slick/slick.css ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {


var content = __webpack_require__(/*! !../../node_modules/css-loader!./slick.css */ "./node_modules/css-loader/index.js!./assets/slick/slick.css");

if(typeof content === 'string') content = [[module.i, content, '']];

var transform;
var insertInto;



var options = {"hmr":true}

options.transform = transform
options.insertInto = undefined;

var update = __webpack_require__(/*! ../../node_modules/style-loader/lib/addStyles.js */ "./node_modules/style-loader/lib/addStyles.js")(content, options);

if(content.locals) module.exports = content.locals;

if(false) {}

/***/ }),

/***/ "./node_modules/can-use-dom/index.js":
/*!*******************************************!*\
  !*** ./node_modules/can-use-dom/index.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

module.exports = canUseDOM;

/***/ }),

/***/ "./node_modules/classnames/index.js":
/*!******************************************!*\
  !*** ./node_modules/classnames/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
  Copyright (c) 2017 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg) && arg.length) {
				var inner = classNames.apply(null, arg);
				if (inner) {
					classes.push(inner);
				}
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		classNames.default = classNames;
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
			return classNames;
		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {}
}());


/***/ }),

/***/ "./node_modules/create-react-class/factory.js":
/*!****************************************************!*\
  !*** ./node_modules/create-react-class/factory.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var _assign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var emptyObject = __webpack_require__(/*! fbjs/lib/emptyObject */ "./node_modules/fbjs/lib/emptyObject.js");
var _invariant = __webpack_require__(/*! fbjs/lib/invariant */ "./node_modules/fbjs/lib/invariant.js");

if (true) {
  var warning = __webpack_require__(/*! fbjs/lib/warning */ "./node_modules/fbjs/lib/warning.js");
}

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

var ReactPropTypeLocationNames;
if (true) {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
} else {}

function factory(ReactComponent, isValidElement, ReactNoopUpdateQueue) {
  /**
   * Policies that describe methods in `ReactClassInterface`.
   */

  var injectedMixins = [];

  /**
   * Composite components are higher-level components that compose other composite
   * or host components.
   *
   * To create a new type of `ReactClass`, pass a specification of
   * your new class to `React.createClass`. The only requirement of your class
   * specification is that you implement a `render` method.
   *
   *   var MyComponent = React.createClass({
   *     render: function() {
   *       return <div>Hello World</div>;
   *     }
   *   });
   *
   * The class specification supports a specific protocol of methods that have
   * special meaning (e.g. `render`). See `ReactClassInterface` for
   * more the comprehensive protocol. Any other properties and methods in the
   * class specification will be available on the prototype.
   *
   * @interface ReactClassInterface
   * @internal
   */
  var ReactClassInterface = {
    /**
     * An array of Mixin objects to include when defining your component.
     *
     * @type {array}
     * @optional
     */
    mixins: 'DEFINE_MANY',

    /**
     * An object containing properties and methods that should be defined on
     * the component's constructor instead of its prototype (static methods).
     *
     * @type {object}
     * @optional
     */
    statics: 'DEFINE_MANY',

    /**
     * Definition of prop types for this component.
     *
     * @type {object}
     * @optional
     */
    propTypes: 'DEFINE_MANY',

    /**
     * Definition of context types for this component.
     *
     * @type {object}
     * @optional
     */
    contextTypes: 'DEFINE_MANY',

    /**
     * Definition of context types this component sets for its children.
     *
     * @type {object}
     * @optional
     */
    childContextTypes: 'DEFINE_MANY',

    // ==== Definition methods ====

    /**
     * Invoked when the component is mounted. Values in the mapping will be set on
     * `this.props` if that prop is not specified (i.e. using an `in` check).
     *
     * This method is invoked before `getInitialState` and therefore cannot rely
     * on `this.state` or use `this.setState`.
     *
     * @return {object}
     * @optional
     */
    getDefaultProps: 'DEFINE_MANY_MERGED',

    /**
     * Invoked once before the component is mounted. The return value will be used
     * as the initial value of `this.state`.
     *
     *   getInitialState: function() {
     *     return {
     *       isOn: false,
     *       fooBaz: new BazFoo()
     *     }
     *   }
     *
     * @return {object}
     * @optional
     */
    getInitialState: 'DEFINE_MANY_MERGED',

    /**
     * @return {object}
     * @optional
     */
    getChildContext: 'DEFINE_MANY_MERGED',

    /**
     * Uses props from `this.props` and state from `this.state` to render the
     * structure of the component.
     *
     * No guarantees are made about when or how often this method is invoked, so
     * it must not have side effects.
     *
     *   render: function() {
     *     var name = this.props.name;
     *     return <div>Hello, {name}!</div>;
     *   }
     *
     * @return {ReactComponent}
     * @required
     */
    render: 'DEFINE_ONCE',

    // ==== Delegate methods ====

    /**
     * Invoked when the component is initially created and about to be mounted.
     * This may have side effects, but any external subscriptions or data created
     * by this method must be cleaned up in `componentWillUnmount`.
     *
     * @optional
     */
    componentWillMount: 'DEFINE_MANY',

    /**
     * Invoked when the component has been mounted and has a DOM representation.
     * However, there is no guarantee that the DOM node is in the document.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been mounted (initialized and rendered) for the first time.
     *
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidMount: 'DEFINE_MANY',

    /**
     * Invoked before the component receives new props.
     *
     * Use this as an opportunity to react to a prop transition by updating the
     * state using `this.setState`. Current props are accessed via `this.props`.
     *
     *   componentWillReceiveProps: function(nextProps, nextContext) {
     *     this.setState({
     *       likesIncreasing: nextProps.likeCount > this.props.likeCount
     *     });
     *   }
     *
     * NOTE: There is no equivalent `componentWillReceiveState`. An incoming prop
     * transition may cause a state change, but the opposite is not true. If you
     * need it, you are probably looking for `componentWillUpdate`.
     *
     * @param {object} nextProps
     * @optional
     */
    componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Invoked while deciding if the component should be updated as a result of
     * receiving new props, state and/or context.
     *
     * Use this as an opportunity to `return false` when you're certain that the
     * transition to the new props/state/context will not require a component
     * update.
     *
     *   shouldComponentUpdate: function(nextProps, nextState, nextContext) {
     *     return !equal(nextProps, this.props) ||
     *       !equal(nextState, this.state) ||
     *       !equal(nextContext, this.context);
     *   }
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @return {boolean} True if the component should update.
     * @optional
     */
    shouldComponentUpdate: 'DEFINE_ONCE',

    /**
     * Invoked when the component is about to update due to a transition from
     * `this.props`, `this.state` and `this.context` to `nextProps`, `nextState`
     * and `nextContext`.
     *
     * Use this as an opportunity to perform preparation before an update occurs.
     *
     * NOTE: You **cannot** use `this.setState()` in this method.
     *
     * @param {object} nextProps
     * @param {?object} nextState
     * @param {?object} nextContext
     * @param {ReactReconcileTransaction} transaction
     * @optional
     */
    componentWillUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component's DOM representation has been updated.
     *
     * Use this as an opportunity to operate on the DOM when the component has
     * been updated.
     *
     * @param {object} prevProps
     * @param {?object} prevState
     * @param {?object} prevContext
     * @param {DOMElement} rootNode DOM element representing the component.
     * @optional
     */
    componentDidUpdate: 'DEFINE_MANY',

    /**
     * Invoked when the component is about to be removed from its parent and have
     * its DOM representation destroyed.
     *
     * Use this as an opportunity to deallocate any external resources.
     *
     * NOTE: There is no `componentDidUnmount` since your component will have been
     * destroyed by that point.
     *
     * @optional
     */
    componentWillUnmount: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillMount`.
     *
     * @optional
     */
    UNSAFE_componentWillMount: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillReceiveProps`.
     *
     * @optional
     */
    UNSAFE_componentWillReceiveProps: 'DEFINE_MANY',

    /**
     * Replacement for (deprecated) `componentWillUpdate`.
     *
     * @optional
     */
    UNSAFE_componentWillUpdate: 'DEFINE_MANY',

    // ==== Advanced methods ====

    /**
     * Updates the component's currently mounted DOM representation.
     *
     * By default, this implements React's rendering and reconciliation algorithm.
     * Sophisticated clients may wish to override this.
     *
     * @param {ReactReconcileTransaction} transaction
     * @internal
     * @overridable
     */
    updateComponent: 'OVERRIDE_BASE'
  };

  /**
   * Similar to ReactClassInterface but for static methods.
   */
  var ReactClassStaticInterface = {
    /**
     * This method is invoked after a component is instantiated and when it
     * receives new props. Return an object to update state in response to
     * prop changes. Return null to indicate no change to state.
     *
     * If an object is returned, its keys will be merged into the existing state.
     *
     * @return {object || null}
     * @optional
     */
    getDerivedStateFromProps: 'DEFINE_MANY_MERGED'
  };

  /**
   * Mapping from class specification keys to special processing functions.
   *
   * Although these are declared like instance properties in the specification
   * when defining classes using `React.createClass`, they are actually static
   * and are accessible on the constructor instead of the prototype. Despite
   * being static, they must be defined outside of the "statics" key under
   * which all other static methods are defined.
   */
  var RESERVED_SPEC_KEYS = {
    displayName: function(Constructor, displayName) {
      Constructor.displayName = displayName;
    },
    mixins: function(Constructor, mixins) {
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          mixSpecIntoComponent(Constructor, mixins[i]);
        }
      }
    },
    childContextTypes: function(Constructor, childContextTypes) {
      if (true) {
        validateTypeDef(Constructor, childContextTypes, 'childContext');
      }
      Constructor.childContextTypes = _assign(
        {},
        Constructor.childContextTypes,
        childContextTypes
      );
    },
    contextTypes: function(Constructor, contextTypes) {
      if (true) {
        validateTypeDef(Constructor, contextTypes, 'context');
      }
      Constructor.contextTypes = _assign(
        {},
        Constructor.contextTypes,
        contextTypes
      );
    },
    /**
     * Special case getDefaultProps which should move into statics but requires
     * automatic merging.
     */
    getDefaultProps: function(Constructor, getDefaultProps) {
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps = createMergedResultFunction(
          Constructor.getDefaultProps,
          getDefaultProps
        );
      } else {
        Constructor.getDefaultProps = getDefaultProps;
      }
    },
    propTypes: function(Constructor, propTypes) {
      if (true) {
        validateTypeDef(Constructor, propTypes, 'prop');
      }
      Constructor.propTypes = _assign({}, Constructor.propTypes, propTypes);
    },
    statics: function(Constructor, statics) {
      mixStaticSpecIntoComponent(Constructor, statics);
    },
    autobind: function() {}
  };

  function validateTypeDef(Constructor, typeDef, location) {
    for (var propName in typeDef) {
      if (typeDef.hasOwnProperty(propName)) {
        // use a warning instead of an _invariant so components
        // don't show up in prod but only in __DEV__
        if (true) {
          warning(
            typeof typeDef[propName] === 'function',
            '%s: %s type `%s` is invalid; it must be a function, usually from ' +
              'React.PropTypes.',
            Constructor.displayName || 'ReactClass',
            ReactPropTypeLocationNames[location],
            propName
          );
        }
      }
    }
  }

  function validateMethodOverride(isAlreadyDefined, name) {
    var specPolicy = ReactClassInterface.hasOwnProperty(name)
      ? ReactClassInterface[name]
      : null;

    // Disallow overriding of base class methods unless explicitly allowed.
    if (ReactClassMixin.hasOwnProperty(name)) {
      _invariant(
        specPolicy === 'OVERRIDE_BASE',
        'ReactClassInterface: You are attempting to override ' +
          '`%s` from your class specification. Ensure that your method names ' +
          'do not overlap with React methods.',
        name
      );
    }

    // Disallow defining methods more than once unless explicitly allowed.
    if (isAlreadyDefined) {
      _invariant(
        specPolicy === 'DEFINE_MANY' || specPolicy === 'DEFINE_MANY_MERGED',
        'ReactClassInterface: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be due ' +
          'to a mixin.',
        name
      );
    }
  }

  /**
   * Mixin helper which handles policy validation and reserved
   * specification keys when building React classes.
   */
  function mixSpecIntoComponent(Constructor, spec) {
    if (!spec) {
      if (true) {
        var typeofSpec = typeof spec;
        var isMixinValid = typeofSpec === 'object' && spec !== null;

        if (true) {
          warning(
            isMixinValid,
            "%s: You're attempting to include a mixin that is either null " +
              'or not an object. Check the mixins included by the component, ' +
              'as well as any mixins they include themselves. ' +
              'Expected object but got %s.',
            Constructor.displayName || 'ReactClass',
            spec === null ? null : typeofSpec
          );
        }
      }

      return;
    }

    _invariant(
      typeof spec !== 'function',
      "ReactClass: You're attempting to " +
        'use a component class or function as a mixin. Instead, just use a ' +
        'regular object.'
    );
    _invariant(
      !isValidElement(spec),
      "ReactClass: You're attempting to " +
        'use a component as a mixin. Instead, just use a regular object.'
    );

    var proto = Constructor.prototype;
    var autoBindPairs = proto.__reactAutoBindPairs;

    // By handling mixins before any other properties, we ensure the same
    // chaining order is applied to methods with DEFINE_MANY policy, whether
    // mixins are listed before or after these methods in the spec.
    if (spec.hasOwnProperty(MIXINS_KEY)) {
      RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
    }

    for (var name in spec) {
      if (!spec.hasOwnProperty(name)) {
        continue;
      }

      if (name === MIXINS_KEY) {
        // We have already handled mixins in a special case above.
        continue;
      }

      var property = spec[name];
      var isAlreadyDefined = proto.hasOwnProperty(name);
      validateMethodOverride(isAlreadyDefined, name);

      if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
        RESERVED_SPEC_KEYS[name](Constructor, property);
      } else {
        // Setup methods on prototype:
        // The following member methods should not be automatically bound:
        // 1. Expected ReactClass methods (in the "interface").
        // 2. Overridden methods (that were mixed in).
        var isReactClassMethod = ReactClassInterface.hasOwnProperty(name);
        var isFunction = typeof property === 'function';
        var shouldAutoBind =
          isFunction &&
          !isReactClassMethod &&
          !isAlreadyDefined &&
          spec.autobind !== false;

        if (shouldAutoBind) {
          autoBindPairs.push(name, property);
          proto[name] = property;
        } else {
          if (isAlreadyDefined) {
            var specPolicy = ReactClassInterface[name];

            // These cases should already be caught by validateMethodOverride.
            _invariant(
              isReactClassMethod &&
                (specPolicy === 'DEFINE_MANY_MERGED' ||
                  specPolicy === 'DEFINE_MANY'),
              'ReactClass: Unexpected spec policy %s for key %s ' +
                'when mixing in component specs.',
              specPolicy,
              name
            );

            // For methods which are defined more than once, call the existing
            // methods before calling the new property, merging if appropriate.
            if (specPolicy === 'DEFINE_MANY_MERGED') {
              proto[name] = createMergedResultFunction(proto[name], property);
            } else if (specPolicy === 'DEFINE_MANY') {
              proto[name] = createChainedFunction(proto[name], property);
            }
          } else {
            proto[name] = property;
            if (true) {
              // Add verbose displayName to the function, which helps when looking
              // at profiling tools.
              if (typeof property === 'function' && spec.displayName) {
                proto[name].displayName = spec.displayName + '_' + name;
              }
            }
          }
        }
      }
    }
  }

  function mixStaticSpecIntoComponent(Constructor, statics) {
    if (!statics) {
      return;
    }

    for (var name in statics) {
      var property = statics[name];
      if (!statics.hasOwnProperty(name)) {
        continue;
      }

      var isReserved = name in RESERVED_SPEC_KEYS;
      _invariant(
        !isReserved,
        'ReactClass: You are attempting to define a reserved ' +
          'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' +
          'as an instance property instead; it will still be accessible on the ' +
          'constructor.',
        name
      );

      var isAlreadyDefined = name in Constructor;
      if (isAlreadyDefined) {
        var specPolicy = ReactClassStaticInterface.hasOwnProperty(name)
          ? ReactClassStaticInterface[name]
          : null;

        _invariant(
          specPolicy === 'DEFINE_MANY_MERGED',
          'ReactClass: You are attempting to define ' +
            '`%s` on your component more than once. This conflict may be ' +
            'due to a mixin.',
          name
        );

        Constructor[name] = createMergedResultFunction(Constructor[name], property);

        return;
      }

      Constructor[name] = property;
    }
  }

  /**
   * Merge two objects, but throw if both contain the same key.
   *
   * @param {object} one The first object, which is mutated.
   * @param {object} two The second object
   * @return {object} one after it has been mutated to contain everything in two.
   */
  function mergeIntoWithNoDuplicateKeys(one, two) {
    _invariant(
      one && two && typeof one === 'object' && typeof two === 'object',
      'mergeIntoWithNoDuplicateKeys(): Cannot merge non-objects.'
    );

    for (var key in two) {
      if (two.hasOwnProperty(key)) {
        _invariant(
          one[key] === undefined,
          'mergeIntoWithNoDuplicateKeys(): ' +
            'Tried to merge two objects with the same key: `%s`. This conflict ' +
            'may be due to a mixin; in particular, this may be caused by two ' +
            'getInitialState() or getDefaultProps() methods returning objects ' +
            'with clashing keys.',
          key
        );
        one[key] = two[key];
      }
    }
    return one;
  }

  /**
   * Creates a function that invokes two functions and merges their return values.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createMergedResultFunction(one, two) {
    return function mergedResult() {
      var a = one.apply(this, arguments);
      var b = two.apply(this, arguments);
      if (a == null) {
        return b;
      } else if (b == null) {
        return a;
      }
      var c = {};
      mergeIntoWithNoDuplicateKeys(c, a);
      mergeIntoWithNoDuplicateKeys(c, b);
      return c;
    };
  }

  /**
   * Creates a function that invokes two functions and ignores their return vales.
   *
   * @param {function} one Function to invoke first.
   * @param {function} two Function to invoke second.
   * @return {function} Function that invokes the two argument functions.
   * @private
   */
  function createChainedFunction(one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  }

  /**
   * Binds a method to the component.
   *
   * @param {object} component Component whose method is going to be bound.
   * @param {function} method Method to be bound.
   * @return {function} The bound method.
   */
  function bindAutoBindMethod(component, method) {
    var boundMethod = method.bind(component);
    if (true) {
      boundMethod.__reactBoundContext = component;
      boundMethod.__reactBoundMethod = method;
      boundMethod.__reactBoundArguments = null;
      var componentName = component.constructor.displayName;
      var _bind = boundMethod.bind;
      boundMethod.bind = function(newThis) {
        for (
          var _len = arguments.length,
            args = Array(_len > 1 ? _len - 1 : 0),
            _key = 1;
          _key < _len;
          _key++
        ) {
          args[_key - 1] = arguments[_key];
        }

        // User is trying to bind() an autobound method; we effectively will
        // ignore the value of "this" that the user is trying to use, so
        // let's warn.
        if (newThis !== component && newThis !== null) {
          if (true) {
            warning(
              false,
              'bind(): React component methods may only be bound to the ' +
                'component instance. See %s',
              componentName
            );
          }
        } else if (!args.length) {
          if (true) {
            warning(
              false,
              'bind(): You are binding a component method to the component. ' +
                'React does this for you automatically in a high-performance ' +
                'way, so you can safely remove this call. See %s',
              componentName
            );
          }
          return boundMethod;
        }
        var reboundMethod = _bind.apply(boundMethod, arguments);
        reboundMethod.__reactBoundContext = component;
        reboundMethod.__reactBoundMethod = method;
        reboundMethod.__reactBoundArguments = args;
        return reboundMethod;
      };
    }
    return boundMethod;
  }

  /**
   * Binds all auto-bound methods in a component.
   *
   * @param {object} component Component whose method is going to be bound.
   */
  function bindAutoBindMethods(component) {
    var pairs = component.__reactAutoBindPairs;
    for (var i = 0; i < pairs.length; i += 2) {
      var autoBindKey = pairs[i];
      var method = pairs[i + 1];
      component[autoBindKey] = bindAutoBindMethod(component, method);
    }
  }

  var IsMountedPreMixin = {
    componentDidMount: function() {
      this.__isMounted = true;
    }
  };

  var IsMountedPostMixin = {
    componentWillUnmount: function() {
      this.__isMounted = false;
    }
  };

  /**
   * Add more to the ReactClass base class. These are all legacy features and
   * therefore not already part of the modern ReactComponent.
   */
  var ReactClassMixin = {
    /**
     * TODO: This will be deprecated because state should always keep a consistent
     * type signature and the only use case for this, is to avoid that.
     */
    replaceState: function(newState, callback) {
      this.updater.enqueueReplaceState(this, newState, callback);
    },

    /**
     * Checks whether or not this composite component is mounted.
     * @return {boolean} True if mounted, false otherwise.
     * @protected
     * @final
     */
    isMounted: function() {
      if (true) {
        warning(
          this.__didWarnIsMounted,
          '%s: isMounted is deprecated. Instead, make sure to clean up ' +
            'subscriptions and pending requests in componentWillUnmount to ' +
            'prevent memory leaks.',
          (this.constructor && this.constructor.displayName) ||
            this.name ||
            'Component'
        );
        this.__didWarnIsMounted = true;
      }
      return !!this.__isMounted;
    }
  };

  var ReactClassComponent = function() {};
  _assign(
    ReactClassComponent.prototype,
    ReactComponent.prototype,
    ReactClassMixin
  );

  /**
   * Creates a composite component class given a class specification.
   * See https://facebook.github.io/react/docs/top-level-api.html#react.createclass
   *
   * @param {object} spec Class specification (which must define `render`).
   * @return {function} Component constructor function.
   * @public
   */
  function createClass(spec) {
    // To keep our warnings more understandable, we'll use a little hack here to
    // ensure that Constructor.name !== 'Constructor'. This makes sure we don't
    // unnecessarily identify a class without displayName as 'Constructor'.
    var Constructor = identity(function(props, context, updater) {
      // This constructor gets overridden by mocks. The argument is used
      // by mocks to assert on what gets mounted.

      if (true) {
        warning(
          this instanceof Constructor,
          'Something is calling a React component directly. Use a factory or ' +
            'JSX instead. See: https://fb.me/react-legacyfactory'
        );
      }

      // Wire up auto-binding
      if (this.__reactAutoBindPairs.length) {
        bindAutoBindMethods(this);
      }

      this.props = props;
      this.context = context;
      this.refs = emptyObject;
      this.updater = updater || ReactNoopUpdateQueue;

      this.state = null;

      // ReactClasses doesn't have constructors. Instead, they use the
      // getInitialState and componentWillMount methods for initialization.

      var initialState = this.getInitialState ? this.getInitialState() : null;
      if (true) {
        // We allow auto-mocks to proceed as if they're returning null.
        if (
          initialState === undefined &&
          this.getInitialState._isMockFunction
        ) {
          // This is probably bad practice. Consider warning here and
          // deprecating this convenience.
          initialState = null;
        }
      }
      _invariant(
        typeof initialState === 'object' && !Array.isArray(initialState),
        '%s.getInitialState(): must return an object or null',
        Constructor.displayName || 'ReactCompositeComponent'
      );

      this.state = initialState;
    });
    Constructor.prototype = new ReactClassComponent();
    Constructor.prototype.constructor = Constructor;
    Constructor.prototype.__reactAutoBindPairs = [];

    injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));

    mixSpecIntoComponent(Constructor, IsMountedPreMixin);
    mixSpecIntoComponent(Constructor, spec);
    mixSpecIntoComponent(Constructor, IsMountedPostMixin);

    // Initialize the defaultProps property after all mixins have been merged.
    if (Constructor.getDefaultProps) {
      Constructor.defaultProps = Constructor.getDefaultProps();
    }

    if (true) {
      // This is a tag to indicate that the use of these method names is ok,
      // since it's used with createClass. If it's not, then it's likely a
      // mistake so we'll warn you to use the static property, property
      // initializer or constructor respectively.
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps.isReactClassApproved = {};
      }
      if (Constructor.prototype.getInitialState) {
        Constructor.prototype.getInitialState.isReactClassApproved = {};
      }
    }

    _invariant(
      Constructor.prototype.render,
      'createClass(...): Class specification must implement a `render` method.'
    );

    if (true) {
      warning(
        !Constructor.prototype.componentShouldUpdate,
        '%s has a method called ' +
          'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' +
          'The name is phrased as a question because the function is ' +
          'expected to return a value.',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.componentWillRecieveProps,
        '%s has a method called ' +
          'componentWillRecieveProps(). Did you mean componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
      warning(
        !Constructor.prototype.UNSAFE_componentWillRecieveProps,
        '%s has a method called UNSAFE_componentWillRecieveProps(). ' +
          'Did you mean UNSAFE_componentWillReceiveProps()?',
        spec.displayName || 'A component'
      );
    }

    // Reduce time spent doing lookups by setting these on the prototype.
    for (var methodName in ReactClassInterface) {
      if (!Constructor.prototype[methodName]) {
        Constructor.prototype[methodName] = null;
      }
    }

    return Constructor;
  }

  return createClass;
}

module.exports = factory;


/***/ }),

/***/ "./node_modules/create-react-class/index.js":
/*!**************************************************!*\
  !*** ./node_modules/create-react-class/index.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var React = __webpack_require__(/*! react */ "react");
var factory = __webpack_require__(/*! ./factory */ "./node_modules/create-react-class/factory.js");

if (typeof React === 'undefined') {
  throw Error(
    'create-react-class could not find the React object. If you are using script tags, ' +
      'make sure that React is being loaded before create-react-class.'
  );
}

// Hack to grab NoopUpdateQueue from isomorphic React
var ReactNoopUpdateQueue = new React.Component().updater;

module.exports = factory(
  React.Component,
  React.isValidElement,
  ReactNoopUpdateQueue
);


/***/ }),

/***/ "./node_modules/css-loader/index.js!./assets/slick/slick-theme.css":
/*!****************************************************************!*\
  !*** ./node_modules/css-loader!./assets/slick/slick-theme.css ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "@charset 'UTF-8';\n\n/* Arrows */\n.slick-prev,\n.slick-next {\n  font-size: 0;\n  line-height: 0;\n\n  position: absolute;\n  top: 50%;\n\n  display: block;\n\n  width: 20px;\n  height: 20px;\n  padding: 0;\n  -webkit-transform: translate(0, -50%);\n  -ms-transform: translate(0, -50%);\n  transform: translate(0, -50%);\n\n  cursor: pointer;\n\n  color: transparent;\n  border: none;\n  outline: none;\n  background: transparent;\n}\n.slick-prev:hover,\n.slick-prev:focus,\n.slick-next:hover,\n.slick-next:focus {\n  color: transparent;\n  outline: none;\n  background: transparent;\n}\n.slick-prev:hover:before,\n.slick-prev:focus:before,\n.slick-next:hover:before,\n.slick-next:focus:before {\n  opacity: 1;\n}\n.slick-prev.slick-disabled:before,\n.slick-next.slick-disabled:before {\n  opacity: 0.25;\n}\n\n.slick-prev:before,\n.slick-next:before {\n  font-family: 'slick';\n  font-size: 20px;\n  line-height: 1;\n\n  opacity: 0.75;\n  color: white;\n\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.slick-prev {\n  left: -25px;\n}\n[dir='rtl'] .slick-prev {\n  right: -25px;\n  left: auto;\n}\n.slick-prev:before {\n  content: '\\2190';\n}\n[dir='rtl'] .slick-prev:before {\n  content: '\\2192';\n}\n\n.slick-next {\n  right: -25px;\n}\n[dir='rtl'] .slick-next {\n  right: auto;\n  left: -25px;\n}\n.slick-next:before {\n  content: '\\2192';\n}\n[dir='rtl'] .slick-next:before {\n  content: '\\2190';\n}\n\n/* Dots */\n.slick-dotted.slick-slider {\n  margin-bottom: 30px;\n}\n\n.slick-dots {\n  position: absolute;\n  bottom: -25px;\n\n  display: block;\n\n  width: 100%;\n  padding: 0;\n  margin: 0;\n\n  list-style: none;\n\n  text-align: center;\n}\n.slick-dots li {\n  position: relative;\n\n  display: inline-block;\n\n  width: 20px;\n  height: 20px;\n  margin: 0 5px;\n  padding: 0;\n\n  cursor: pointer;\n}\n.slick-dots li button {\n  font-size: 0;\n  line-height: 0;\n\n  display: block;\n\n  width: 20px;\n  height: 20px;\n  padding: 5px;\n\n  cursor: pointer;\n\n  color: transparent;\n  border: 0;\n  outline: none;\n  background: transparent;\n}\n.slick-dots li button:hover,\n.slick-dots li button:focus {\n  outline: none;\n}\n.slick-dots li button:hover:before,\n.slick-dots li button:focus:before {\n  opacity: 1;\n}\n.slick-dots li button:before {\n  font-family: 'slick';\n  font-size: 6px;\n  line-height: 20px;\n\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  width: 20px;\n  height: 20px;\n\n  content: '\\2022';\n  text-align: center;\n\n  opacity: 0.25;\n  color: black;\n\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n.slick-dots li.slick-active button:before {\n  opacity: 0.75;\n  color: black;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/index.js!./assets/slick/slick.css":
/*!**********************************************************!*\
  !*** ./node_modules/css-loader!./assets/slick/slick.css ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(/*! ../../node_modules/css-loader/lib/css-base.js */ "./node_modules/css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Slider */\n.slick-slider\n{\n    position: relative;\n\n    display: block;\n    box-sizing: border-box;\n\n    -webkit-user-select: none;\n       -moz-user-select: none;\n        -ms-user-select: none;\n            user-select: none;\n\n    -webkit-touch-callout: none;\n    -khtml-user-select: none;\n    -ms-touch-action: pan-y;\n        touch-action: pan-y;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.slick-list\n{\n    position: relative;\n\n    display: block;\n    overflow: hidden;\n\n    margin: 0;\n    padding: 0;\n}\n.slick-list:focus\n{\n    outline: none;\n}\n.slick-list.dragging\n{\n    cursor: pointer;\n    cursor: hand;\n}\n\n.slick-slider .slick-track,\n.slick-slider .slick-list\n{\n    -webkit-transform: translate3d(0, 0, 0);\n       -moz-transform: translate3d(0, 0, 0);\n        -ms-transform: translate3d(0, 0, 0);\n         -o-transform: translate3d(0, 0, 0);\n            transform: translate3d(0, 0, 0);\n}\n\n.slick-track\n{\n    position: relative;\n    top: 0;\n    left: 0;\n\n    display: block;\n    margin-left: auto;\n    margin-right: auto;\n}\n.slick-track:before,\n.slick-track:after\n{\n    display: table;\n\n    content: '';\n}\n.slick-track:after\n{\n    clear: both;\n}\n.slick-loading .slick-track\n{\n    visibility: hidden;\n}\n\n.slick-slide\n{\n    display: none;\n    float: left;\n\n    height: 100%;\n    min-height: 1px;\n}\n[dir='rtl'] .slick-slide\n{\n    float: right;\n}\n.slick-slide img\n{\n    display: block;\n}\n.slick-slide.slick-loading img\n{\n    display: none;\n}\n.slick-slide.dragging img\n{\n    pointer-events: none;\n}\n.slick-initialized .slick-slide\n{\n    display: block;\n}\n.slick-loading .slick-slide\n{\n    visibility: hidden;\n}\n.slick-vertical .slick-slide\n{\n    display: block;\n\n    height: auto;\n\n    border: 1px solid transparent;\n}\n.slick-arrow.slick-hidden {\n    display: none;\n}\n", ""]);

// exports


/***/ }),

/***/ "./node_modules/css-loader/lib/css-base.js":
/*!*************************************************!*\
  !*** ./node_modules/css-loader/lib/css-base.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),

/***/ "./node_modules/decode-uri-component/index.js":
/*!****************************************************!*\
  !*** ./node_modules/decode-uri-component/index.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
	try {
		// Try to decode the entire string first
		return decodeURIComponent(components.join(''));
	} catch (err) {
		// Do nothing
	}

	if (components.length === 1) {
		return components;
	}

	split = split || 1;

	// Split the array in 2 parts
	var left = components.slice(0, split);
	var right = components.slice(split);

	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
	try {
		return decodeURIComponent(input);
	} catch (err) {
		var tokens = input.match(singleMatcher);

		for (var i = 1; i < tokens.length; i++) {
			input = decodeComponents(tokens, i).join('');

			tokens = input.match(singleMatcher);
		}

		return input;
	}
}

function customDecodeURIComponent(input) {
	// Keep track of all the replacements and prefill the map with the `BOM`
	var replaceMap = {
		'%FE%FF': '\uFFFD\uFFFD',
		'%FF%FE': '\uFFFD\uFFFD'
	};

	var match = multiMatcher.exec(input);
	while (match) {
		try {
			// Decode as big chunks as possible
			replaceMap[match[0]] = decodeURIComponent(match[0]);
		} catch (err) {
			var result = decode(match[0]);

			if (result !== match[0]) {
				replaceMap[match[0]] = result;
			}
		}

		match = multiMatcher.exec(input);
	}

	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
	replaceMap['%C2'] = '\uFFFD';

	var entries = Object.keys(replaceMap);

	for (var i = 0; i < entries.length; i++) {
		// Replace all decoded components
		var key = entries[i];
		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
	}

	return input;
}

module.exports = function (encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
	}

	try {
		encodedURI = encodedURI.replace(/\+/g, ' ');

		// Try the built in decoder first
		return decodeURIComponent(encodedURI);
	} catch (err) {
		// Fallback to a more advanced decoder
		return customDecodeURIComponent(encodedURI);
	}
};


/***/ }),

/***/ "./node_modules/enquire.js/src/MediaQuery.js":
/*!***************************************************!*\
  !*** ./node_modules/enquire.js/src/MediaQuery.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var QueryHandler = __webpack_require__(/*! ./QueryHandler */ "./node_modules/enquire.js/src/QueryHandler.js");
var each = __webpack_require__(/*! ./Util */ "./node_modules/enquire.js/src/Util.js").each;

/**
 * Represents a single media query, manages it's state and registered handlers for this query
 *
 * @constructor
 * @param {string} query the media query string
 * @param {boolean} [isUnconditional=false] whether the media query should run regardless of whether the conditions are met. Primarily for helping older browsers deal with mobile-first design
 */
function MediaQuery(query, isUnconditional) {
    this.query = query;
    this.isUnconditional = isUnconditional;
    this.handlers = [];
    this.mql = window.matchMedia(query);

    var self = this;
    this.listener = function(mql) {
        // Chrome passes an MediaQueryListEvent object, while other browsers pass MediaQueryList directly
        self.mql = mql.currentTarget || mql;
        self.assess();
    };
    this.mql.addListener(this.listener);
}

MediaQuery.prototype = {

    constuctor : MediaQuery,

    /**
     * add a handler for this query, triggering if already active
     *
     * @param {object} handler
     * @param {function} handler.match callback for when query is activated
     * @param {function} [handler.unmatch] callback for when query is deactivated
     * @param {function} [handler.setup] callback for immediate execution when a query handler is registered
     * @param {boolean} [handler.deferSetup=false] should the setup callback be deferred until the first time the handler is matched?
     */
    addHandler : function(handler) {
        var qh = new QueryHandler(handler);
        this.handlers.push(qh);

        this.matches() && qh.on();
    },

    /**
     * removes the given handler from the collection, and calls it's destroy methods
     *
     * @param {object || function} handler the handler to remove
     */
    removeHandler : function(handler) {
        var handlers = this.handlers;
        each(handlers, function(h, i) {
            if(h.equals(handler)) {
                h.destroy();
                return !handlers.splice(i,1); //remove from array and exit each early
            }
        });
    },

    /**
     * Determine whether the media query should be considered a match
     *
     * @return {Boolean} true if media query can be considered a match, false otherwise
     */
    matches : function() {
        return this.mql.matches || this.isUnconditional;
    },

    /**
     * Clears all handlers and unbinds events
     */
    clear : function() {
        each(this.handlers, function(handler) {
            handler.destroy();
        });
        this.mql.removeListener(this.listener);
        this.handlers.length = 0; //clear array
    },

    /*
        * Assesses the query, turning on all handlers if it matches, turning them off if it doesn't match
        */
    assess : function() {
        var action = this.matches() ? 'on' : 'off';

        each(this.handlers, function(handler) {
            handler[action]();
        });
    }
};

module.exports = MediaQuery;


/***/ }),

/***/ "./node_modules/enquire.js/src/MediaQueryDispatch.js":
/*!***********************************************************!*\
  !*** ./node_modules/enquire.js/src/MediaQueryDispatch.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var MediaQuery = __webpack_require__(/*! ./MediaQuery */ "./node_modules/enquire.js/src/MediaQuery.js");
var Util = __webpack_require__(/*! ./Util */ "./node_modules/enquire.js/src/Util.js");
var each = Util.each;
var isFunction = Util.isFunction;
var isArray = Util.isArray;

/**
 * Allows for registration of query handlers.
 * Manages the query handler's state and is responsible for wiring up browser events
 *
 * @constructor
 */
function MediaQueryDispatch () {
    if(!window.matchMedia) {
        throw new Error('matchMedia not present, legacy browsers require a polyfill');
    }

    this.queries = {};
    this.browserIsIncapable = !window.matchMedia('only all').matches;
}

MediaQueryDispatch.prototype = {

    constructor : MediaQueryDispatch,

    /**
     * Registers a handler for the given media query
     *
     * @param {string} q the media query
     * @param {object || Array || Function} options either a single query handler object, a function, or an array of query handlers
     * @param {function} options.match fired when query matched
     * @param {function} [options.unmatch] fired when a query is no longer matched
     * @param {function} [options.setup] fired when handler first triggered
     * @param {boolean} [options.deferSetup=false] whether setup should be run immediately or deferred until query is first matched
     * @param {boolean} [shouldDegrade=false] whether this particular media query should always run on incapable browsers
     */
    register : function(q, options, shouldDegrade) {
        var queries         = this.queries,
            isUnconditional = shouldDegrade && this.browserIsIncapable;

        if(!queries[q]) {
            queries[q] = new MediaQuery(q, isUnconditional);
        }

        //normalise to object in an array
        if(isFunction(options)) {
            options = { match : options };
        }
        if(!isArray(options)) {
            options = [options];
        }
        each(options, function(handler) {
            if (isFunction(handler)) {
                handler = { match : handler };
            }
            queries[q].addHandler(handler);
        });

        return this;
    },

    /**
     * unregisters a query and all it's handlers, or a specific handler for a query
     *
     * @param {string} q the media query to target
     * @param {object || function} [handler] specific handler to unregister
     */
    unregister : function(q, handler) {
        var query = this.queries[q];

        if(query) {
            if(handler) {
                query.removeHandler(handler);
            }
            else {
                query.clear();
                delete this.queries[q];
            }
        }

        return this;
    }
};

module.exports = MediaQueryDispatch;


/***/ }),

/***/ "./node_modules/enquire.js/src/QueryHandler.js":
/*!*****************************************************!*\
  !*** ./node_modules/enquire.js/src/QueryHandler.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Delegate to handle a media query being matched and unmatched.
 *
 * @param {object} options
 * @param {function} options.match callback for when the media query is matched
 * @param {function} [options.unmatch] callback for when the media query is unmatched
 * @param {function} [options.setup] one-time callback triggered the first time a query is matched
 * @param {boolean} [options.deferSetup=false] should the setup callback be run immediately, rather than first time query is matched?
 * @constructor
 */
function QueryHandler(options) {
    this.options = options;
    !options.deferSetup && this.setup();
}

QueryHandler.prototype = {

    constructor : QueryHandler,

    /**
     * coordinates setup of the handler
     *
     * @function
     */
    setup : function() {
        if(this.options.setup) {
            this.options.setup();
        }
        this.initialised = true;
    },

    /**
     * coordinates setup and triggering of the handler
     *
     * @function
     */
    on : function() {
        !this.initialised && this.setup();
        this.options.match && this.options.match();
    },

    /**
     * coordinates the unmatch event for the handler
     *
     * @function
     */
    off : function() {
        this.options.unmatch && this.options.unmatch();
    },

    /**
     * called when a handler is to be destroyed.
     * delegates to the destroy or unmatch callbacks, depending on availability.
     *
     * @function
     */
    destroy : function() {
        this.options.destroy ? this.options.destroy() : this.off();
    },

    /**
     * determines equality by reference.
     * if object is supplied compare options, if function, compare match callback
     *
     * @function
     * @param {object || function} [target] the target for comparison
     */
    equals : function(target) {
        return this.options === target || this.options.match === target;
    }

};

module.exports = QueryHandler;


/***/ }),

/***/ "./node_modules/enquire.js/src/Util.js":
/*!*********************************************!*\
  !*** ./node_modules/enquire.js/src/Util.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Helper function for iterating over a collection
 *
 * @param collection
 * @param fn
 */
function each(collection, fn) {
    var i      = 0,
        length = collection.length,
        cont;

    for(i; i < length; i++) {
        cont = fn(collection[i], i);
        if(cont === false) {
            break; //allow early exit
        }
    }
}

/**
 * Helper function for determining whether target object is an array
 *
 * @param target the object under test
 * @return {Boolean} true if array, false otherwise
 */
function isArray(target) {
    return Object.prototype.toString.apply(target) === '[object Array]';
}

/**
 * Helper function for determining whether target object is a function
 *
 * @param target the object under test
 * @return {Boolean} true if function, false otherwise
 */
function isFunction(target) {
    return typeof target === 'function';
}

module.exports = {
    isFunction : isFunction,
    isArray : isArray,
    each : each
};


/***/ }),

/***/ "./node_modules/enquire.js/src/index.js":
/*!**********************************************!*\
  !*** ./node_modules/enquire.js/src/index.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var MediaQueryDispatch = __webpack_require__(/*! ./MediaQueryDispatch */ "./node_modules/enquire.js/src/MediaQueryDispatch.js");
module.exports = new MediaQueryDispatch();


/***/ }),

/***/ "./node_modules/fbjs/lib/emptyFunction.js":
/*!************************************************!*\
  !*** ./node_modules/fbjs/lib/emptyFunction.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;

/***/ }),

/***/ "./node_modules/fbjs/lib/emptyObject.js":
/*!**********************************************!*\
  !*** ./node_modules/fbjs/lib/emptyObject.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var emptyObject = {};

if (true) {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;

/***/ }),

/***/ "./node_modules/fbjs/lib/invariant.js":
/*!********************************************!*\
  !*** ./node_modules/fbjs/lib/invariant.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (true) {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;

/***/ }),

/***/ "./node_modules/fbjs/lib/warning.js":
/*!******************************************!*\
  !*** ./node_modules/fbjs/lib/warning.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */



var emptyFunction = __webpack_require__(/*! ./emptyFunction */ "./node_modules/fbjs/lib/emptyFunction.js");

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (true) {
  var printWarning = function printWarning(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  warning = function warning(condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = warning;

/***/ }),

/***/ "./node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js ***!
  \**********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var REACT_STATICS = {
    childContextTypes: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    getDerivedStateFromProps: true,
    mixins: true,
    propTypes: true,
    type: true
};

var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    callee: true,
    arguments: true,
    arity: true
};

var defineProperty = Object.defineProperty;
var getOwnPropertyNames = Object.getOwnPropertyNames;
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var getPrototypeOf = Object.getPrototypeOf;
var objectPrototype = getPrototypeOf && getPrototypeOf(Object);

function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
    if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components

        if (objectPrototype) {
            var inheritedComponent = getPrototypeOf(sourceComponent);
            if (inheritedComponent && inheritedComponent !== objectPrototype) {
                hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
            }
        }

        var keys = getOwnPropertyNames(sourceComponent);

        if (getOwnPropertySymbols) {
            keys = keys.concat(getOwnPropertySymbols(sourceComponent));
        }

        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (!REACT_STATICS[key] && !KNOWN_STATICS[key] && (!blacklist || !blacklist[key])) {
                var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
                try { // Avoid failures from read-only properties
                    defineProperty(targetComponent, key, descriptor);
                } catch (e) {}
            }
        }

        return targetComponent;
    }

    return targetComponent;
}

module.exports = hoistNonReactStatics;


/***/ }),

/***/ "./node_modules/intl-format-cache/index.js":
/*!*************************************************!*\
  !*** ./node_modules/intl-format-cache/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports = module.exports = __webpack_require__(/*! ./lib/memoizer */ "./node_modules/intl-format-cache/lib/memoizer.js")['default'];
exports['default'] = exports;


/***/ }),

/***/ "./node_modules/intl-format-cache/lib/es5.js":
/*!***************************************************!*\
  !*** ./node_modules/intl-format-cache/lib/es5.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

// Function.prototype.bind implementation from Mozilla Developer Network:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Polyfill



var bind = Function.prototype.bind || function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // native functions don't have a prototype
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
};

// Purposely using the same implementation as the Intl.js `Intl` polyfill.
// Copyright 2013 Andy Earnshaw, MIT License

var hop = Object.prototype.hasOwnProperty;

var realDefineProp = (function () {
    try { return !!Object.defineProperty({}, 'a', {}); }
    catch (e) { return false; }
})();

var es3 = !realDefineProp && !Object.prototype.__defineGetter__;

var defineProperty = realDefineProp ? Object.defineProperty :
        function (obj, name, desc) {

    if ('get' in desc && obj.__defineGetter__) {
        obj.__defineGetter__(name, desc.get);
    } else if (!hop.call(obj, name) || 'value' in desc) {
        obj[name] = desc.value;
    }
};

var objCreate = Object.create || function (proto, props) {
    var obj, k;

    function F() {}
    F.prototype = proto;
    obj = new F();

    for (k in props) {
        if (hop.call(props, k)) {
            defineProperty(obj, k, props[k]);
        }
    }

    return obj;
};

exports.bind = bind, exports.defineProperty = defineProperty, exports.objCreate = objCreate;

//# sourceMappingURL=es5.js.map

/***/ }),

/***/ "./node_modules/intl-format-cache/lib/memoizer.js":
/*!********************************************************!*\
  !*** ./node_modules/intl-format-cache/lib/memoizer.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jshint esnext: true */


var src$es5$$ = __webpack_require__(/*! ./es5 */ "./node_modules/intl-format-cache/lib/es5.js");
exports["default"] = createFormatCache;

// -----------------------------------------------------------------------------

function createFormatCache(FormatConstructor) {
    var cache = src$es5$$.objCreate(null);

    return function () {
        var args    = Array.prototype.slice.call(arguments);
        var cacheId = getCacheId(args);
        var format  = cacheId && cache[cacheId];

        if (!format) {
            format = new (src$es5$$.bind.apply(FormatConstructor, [null].concat(args)))();

            if (cacheId) {
                cache[cacheId] = format;
            }
        }

        return format;
    };
}

// -- Utilities ----------------------------------------------------------------

function getCacheId(inputs) {
    // When JSON is not available in the runtime, we will not create a cache id.
    if (typeof JSON === 'undefined') { return; }

    var cacheId = [];

    var i, len, input;

    for (i = 0, len = inputs.length; i < len; i += 1) {
        input = inputs[i];

        if (input && typeof input === 'object') {
            cacheId.push(orderedProps(input));
        } else {
            cacheId.push(input);
        }
    }

    return JSON.stringify(cacheId);
}

function orderedProps(obj) {
    var props = [],
        keys  = [];

    var key, i, len, prop;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    var orderedKeys = keys.sort();

    for (i = 0, len = orderedKeys.length; i < len; i += 1) {
        key  = orderedKeys[i];
        prop = {};

        prop[key] = obj[key];
        props[i]  = prop;
    }

    return props;
}

//# sourceMappingURL=memoizer.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat-parser/index.js":
/*!*********************************************************!*\
  !*** ./node_modules/intl-messageformat-parser/index.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports = module.exports = __webpack_require__(/*! ./lib/parser */ "./node_modules/intl-messageformat-parser/lib/parser.js")['default'];
exports['default'] = exports;


/***/ }),

/***/ "./node_modules/intl-messageformat-parser/lib/parser.js":
/*!**************************************************************!*\
  !*** ./node_modules/intl-messageformat-parser/lib/parser.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports["default"] = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(elements) {
                return {
                    type    : 'messageFormatPattern',
                    elements: elements,
                    location: location()
                };
            },
        peg$c1 = function(text) {
                var string = '',
                    i, j, outerLen, inner, innerLen;

                for (i = 0, outerLen = text.length; i < outerLen; i += 1) {
                    inner = text[i];

                    for (j = 0, innerLen = inner.length; j < innerLen; j += 1) {
                        string += inner[j];
                    }
                }

                return string;
            },
        peg$c2 = function(messageText) {
                return {
                    type : 'messageTextElement',
                    value: messageText,
                    location: location()
                };
            },
        peg$c3 = /^[^ \t\n\r,.+={}#]/,
        peg$c4 = { type: "class", value: "[^ \\t\\n\\r,.+={}#]", description: "[^ \\t\\n\\r,.+={}#]" },
        peg$c5 = "{",
        peg$c6 = { type: "literal", value: "{", description: "\"{\"" },
        peg$c7 = ",",
        peg$c8 = { type: "literal", value: ",", description: "\",\"" },
        peg$c9 = "}",
        peg$c10 = { type: "literal", value: "}", description: "\"}\"" },
        peg$c11 = function(id, format) {
                return {
                    type  : 'argumentElement',
                    id    : id,
                    format: format && format[2],
                    location: location()
                };
            },
        peg$c12 = "number",
        peg$c13 = { type: "literal", value: "number", description: "\"number\"" },
        peg$c14 = "date",
        peg$c15 = { type: "literal", value: "date", description: "\"date\"" },
        peg$c16 = "time",
        peg$c17 = { type: "literal", value: "time", description: "\"time\"" },
        peg$c18 = function(type, style) {
                return {
                    type : type + 'Format',
                    style: style && style[2],
                    location: location()
                };
            },
        peg$c19 = "plural",
        peg$c20 = { type: "literal", value: "plural", description: "\"plural\"" },
        peg$c21 = function(pluralStyle) {
                return {
                    type   : pluralStyle.type,
                    ordinal: false,
                    offset : pluralStyle.offset || 0,
                    options: pluralStyle.options,
                    location: location()
                };
            },
        peg$c22 = "selectordinal",
        peg$c23 = { type: "literal", value: "selectordinal", description: "\"selectordinal\"" },
        peg$c24 = function(pluralStyle) {
                return {
                    type   : pluralStyle.type,
                    ordinal: true,
                    offset : pluralStyle.offset || 0,
                    options: pluralStyle.options,
                    location: location()
                }
            },
        peg$c25 = "select",
        peg$c26 = { type: "literal", value: "select", description: "\"select\"" },
        peg$c27 = function(options) {
                return {
                    type   : 'selectFormat',
                    options: options,
                    location: location()
                };
            },
        peg$c28 = "=",
        peg$c29 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c30 = function(selector, pattern) {
                return {
                    type    : 'optionalFormatPattern',
                    selector: selector,
                    value   : pattern,
                    location: location()
                };
            },
        peg$c31 = "offset:",
        peg$c32 = { type: "literal", value: "offset:", description: "\"offset:\"" },
        peg$c33 = function(number) {
                return number;
            },
        peg$c34 = function(offset, options) {
                return {
                    type   : 'pluralFormat',
                    offset : offset,
                    options: options,
                    location: location()
                };
            },
        peg$c35 = { type: "other", description: "whitespace" },
        peg$c36 = /^[ \t\n\r]/,
        peg$c37 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
        peg$c38 = { type: "other", description: "optionalWhitespace" },
        peg$c39 = /^[0-9]/,
        peg$c40 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c41 = /^[0-9a-f]/i,
        peg$c42 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
        peg$c43 = "0",
        peg$c44 = { type: "literal", value: "0", description: "\"0\"" },
        peg$c45 = /^[1-9]/,
        peg$c46 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c47 = function(digits) {
            return parseInt(digits, 10);
        },
        peg$c48 = /^[^{}\\\0-\x1F \t\n\r]/,
        peg$c49 = { type: "class", value: "[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]", description: "[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]" },
        peg$c50 = "\\\\",
        peg$c51 = { type: "literal", value: "\\\\", description: "\"\\\\\\\\\"" },
        peg$c52 = function() { return '\\'; },
        peg$c53 = "\\#",
        peg$c54 = { type: "literal", value: "\\#", description: "\"\\\\#\"" },
        peg$c55 = function() { return '\\#'; },
        peg$c56 = "\\{",
        peg$c57 = { type: "literal", value: "\\{", description: "\"\\\\{\"" },
        peg$c58 = function() { return '\u007B'; },
        peg$c59 = "\\}",
        peg$c60 = { type: "literal", value: "\\}", description: "\"\\\\}\"" },
        peg$c61 = function() { return '\u007D'; },
        peg$c62 = "\\u",
        peg$c63 = { type: "literal", value: "\\u", description: "\"\\\\u\"" },
        peg$c64 = function(digits) {
                return String.fromCharCode(parseInt(digits, 16));
            },
        peg$c65 = function(chars) { return chars.join(''); },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parsemessageFormatPattern();

      return s0;
    }

    function peg$parsemessageFormatPattern() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsemessageFormatElement();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsemessageFormatElement();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c0(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsemessageFormatElement() {
      var s0;

      s0 = peg$parsemessageTextElement();
      if (s0 === peg$FAILED) {
        s0 = peg$parseargumentElement();
      }

      return s0;
    }

    function peg$parsemessageText() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$currPos;
      s3 = peg$parse_();
      if (s3 !== peg$FAILED) {
        s4 = peg$parsechars();
        if (s4 !== peg$FAILED) {
          s5 = peg$parse_();
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$currPos;
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsechars();
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s3 = [s3, s4, s5];
                s2 = s3;
              } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
              }
            } else {
              peg$currPos = s2;
              s2 = peg$FAILED;
            }
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c1(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsews();
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parsemessageTextElement() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsemessageText();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseargument() {
      var s0, s1, s2;

      s0 = peg$parsenumber();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        if (peg$c3.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c3.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c4); }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
      }

      return s0;
    }

    function peg$parseargumentElement() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 123) {
        s1 = peg$c5;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseargument();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$currPos;
              if (input.charCodeAt(peg$currPos) === 44) {
                s6 = peg$c7;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c8); }
              }
              if (s6 !== peg$FAILED) {
                s7 = peg$parse_();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseelementFormat();
                  if (s8 !== peg$FAILED) {
                    s6 = [s6, s7, s8];
                    s5 = s6;
                  } else {
                    peg$currPos = s5;
                    s5 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s5;
                  s5 = peg$FAILED;
                }
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 125) {
                    s7 = peg$c9;
                    peg$currPos++;
                  } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c10); }
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c11(s3, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseelementFormat() {
      var s0;

      s0 = peg$parsesimpleFormat();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepluralFormat();
        if (s0 === peg$FAILED) {
          s0 = peg$parseselectOrdinalFormat();
          if (s0 === peg$FAILED) {
            s0 = peg$parseselectFormat();
          }
        }
      }

      return s0;
    }

    function peg$parsesimpleFormat() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c12) {
        s1 = peg$c12;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c14) {
          s1 = peg$c14;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c15); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c16) {
            s1 = peg$c16;
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c17); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c7;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsechars();
              if (s6 !== peg$FAILED) {
                s4 = [s4, s5, s6];
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c18(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepluralFormat() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c19) {
        s1 = peg$c19;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c20); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c7;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepluralStyle();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c21(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselectOrdinalFormat() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 13) === peg$c22) {
        s1 = peg$c22;
        peg$currPos += 13;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c23); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c7;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepluralStyle();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c24(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselectFormat() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c25) {
        s1 = peg$c25;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c26); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c7;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c8); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseoptionalFormatPattern();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseoptionalFormatPattern();
                }
              } else {
                s5 = peg$FAILED;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c27(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselector() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s2 = peg$c28;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c29); }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsenumber();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsechars();
      }

      return s0;
    }

    function peg$parseoptionalFormatPattern() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselector();
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 123) {
              s4 = peg$c5;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c6); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsemessageFormatPattern();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 125) {
                      s8 = peg$c9;
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c10); }
                    }
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c30(s2, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoffset() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7) === peg$c31) {
        s1 = peg$c31;
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsenumber();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c33(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepluralStyle() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseoffset();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseoptionalFormatPattern();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseoptionalFormatPattern();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c34(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsews() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      if (peg$c36.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c36.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
        }
      } else {
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c35); }
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsews();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsews();
      }
      if (s1 !== peg$FAILED) {
        s0 = input.substring(s0, peg$currPos);
      } else {
        s0 = s1;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }

      return s0;
    }

    function peg$parsedigit() {
      var s0;

      if (peg$c39.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c40); }
      }

      return s0;
    }

    function peg$parsehexDigit() {
      var s0;

      if (peg$c41.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 48) {
        s1 = peg$c43;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c44); }
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$currPos;
        if (peg$c45.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c46); }
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$parsedigit();
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$parsedigit();
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = input.substring(s1, peg$currPos);
        } else {
          s1 = s2;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c47(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsechar() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      if (peg$c48.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c49); }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c50) {
          s1 = peg$c50;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c52();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.substr(peg$currPos, 2) === peg$c53) {
            s1 = peg$c53;
            peg$currPos += 2;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c54); }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c55();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c56) {
              s1 = peg$c56;
              peg$currPos += 2;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c57); }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c58();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 2) === peg$c59) {
                s1 = peg$c59;
                peg$currPos += 2;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c60); }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c61();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.substr(peg$currPos, 2) === peg$c62) {
                  s1 = peg$c62;
                  peg$currPos += 2;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c63); }
                }
                if (s1 !== peg$FAILED) {
                  s2 = peg$currPos;
                  s3 = peg$currPos;
                  s4 = peg$parsehexDigit();
                  if (s4 !== peg$FAILED) {
                    s5 = peg$parsehexDigit();
                    if (s5 !== peg$FAILED) {
                      s6 = peg$parsehexDigit();
                      if (s6 !== peg$FAILED) {
                        s7 = peg$parsehexDigit();
                        if (s7 !== peg$FAILED) {
                          s4 = [s4, s5, s6, s7];
                          s3 = s4;
                        } else {
                          peg$currPos = s3;
                          s3 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s3;
                      s3 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                  }
                  if (s3 !== peg$FAILED) {
                    s2 = input.substring(s2, peg$currPos);
                  } else {
                    s2 = s3;
                  }
                  if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c64(s2);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsechars() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsechar();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsechar();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c65(s1);
      }
      s0 = s1;

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

//# sourceMappingURL=parser.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/index.js":
/*!**************************************************!*\
  !*** ./node_modules/intl-messageformat/index.js ***!
  \**************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node:true */



var IntlMessageFormat = __webpack_require__(/*! ./lib/main */ "./node_modules/intl-messageformat/lib/main.js")['default'];

// Add all locale data to `IntlMessageFormat`. This module will be ignored when
// bundling for the browser with Browserify/Webpack.
__webpack_require__(/*! ./lib/locales */ 2);

// Re-export `IntlMessageFormat` as the CommonJS default exports with all the
// locale data registered, and with English set as the default locale. Define
// the `default` prop for use with other compiled ES6 Modules.
exports = module.exports = IntlMessageFormat;
exports['default'] = exports;


/***/ }),

/***/ "./node_modules/intl-messageformat/lib/compiler.js":
/*!*********************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/compiler.js ***!
  \*********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */


exports["default"] = Compiler;

function Compiler(locales, formats, pluralFn) {
    this.locales  = locales;
    this.formats  = formats;
    this.pluralFn = pluralFn;
}

Compiler.prototype.compile = function (ast) {
    this.pluralStack        = [];
    this.currentPlural      = null;
    this.pluralNumberFormat = null;

    return this.compileMessage(ast);
};

Compiler.prototype.compileMessage = function (ast) {
    if (!(ast && ast.type === 'messageFormatPattern')) {
        throw new Error('Message AST is not of type: "messageFormatPattern"');
    }

    var elements = ast.elements,
        pattern  = [];

    var i, len, element;

    for (i = 0, len = elements.length; i < len; i += 1) {
        element = elements[i];

        switch (element.type) {
            case 'messageTextElement':
                pattern.push(this.compileMessageText(element));
                break;

            case 'argumentElement':
                pattern.push(this.compileArgument(element));
                break;

            default:
                throw new Error('Message element does not have a valid type');
        }
    }

    return pattern;
};

Compiler.prototype.compileMessageText = function (element) {
    // When this `element` is part of plural sub-pattern and its value contains
    // an unescaped '#', use a `PluralOffsetString` helper to properly output
    // the number with the correct offset in the string.
    if (this.currentPlural && /(^|[^\\])#/g.test(element.value)) {
        // Create a cache a NumberFormat instance that can be reused for any
        // PluralOffsetString instance in this message.
        if (!this.pluralNumberFormat) {
            this.pluralNumberFormat = new Intl.NumberFormat(this.locales);
        }

        return new PluralOffsetString(
                this.currentPlural.id,
                this.currentPlural.format.offset,
                this.pluralNumberFormat,
                element.value);
    }

    // Unescape the escaped '#'s in the message text.
    return element.value.replace(/\\#/g, '#');
};

Compiler.prototype.compileArgument = function (element) {
    var format = element.format;

    if (!format) {
        return new StringFormat(element.id);
    }

    var formats  = this.formats,
        locales  = this.locales,
        pluralFn = this.pluralFn,
        options;

    switch (format.type) {
        case 'numberFormat':
            options = formats.number[format.style];
            return {
                id    : element.id,
                format: new Intl.NumberFormat(locales, options).format
            };

        case 'dateFormat':
            options = formats.date[format.style];
            return {
                id    : element.id,
                format: new Intl.DateTimeFormat(locales, options).format
            };

        case 'timeFormat':
            options = formats.time[format.style];
            return {
                id    : element.id,
                format: new Intl.DateTimeFormat(locales, options).format
            };

        case 'pluralFormat':
            options = this.compileOptions(element);
            return new PluralFormat(
                element.id, format.ordinal, format.offset, options, pluralFn
            );

        case 'selectFormat':
            options = this.compileOptions(element);
            return new SelectFormat(element.id, options);

        default:
            throw new Error('Message element does not have a valid format type');
    }
};

Compiler.prototype.compileOptions = function (element) {
    var format      = element.format,
        options     = format.options,
        optionsHash = {};

    // Save the current plural element, if any, then set it to a new value when
    // compiling the options sub-patterns. This conforms the spec's algorithm
    // for handling `"#"` syntax in message text.
    this.pluralStack.push(this.currentPlural);
    this.currentPlural = format.type === 'pluralFormat' ? element : null;

    var i, len, option;

    for (i = 0, len = options.length; i < len; i += 1) {
        option = options[i];

        // Compile the sub-pattern and save it under the options's selector.
        optionsHash[option.selector] = this.compileMessage(option.value);
    }

    // Pop the plural stack to put back the original current plural value.
    this.currentPlural = this.pluralStack.pop();

    return optionsHash;
};

// -- Compiler Helper Classes --------------------------------------------------

function StringFormat(id) {
    this.id = id;
}

StringFormat.prototype.format = function (value) {
    if (!value && typeof value !== 'number') {
        return '';
    }

    return typeof value === 'string' ? value : String(value);
};

function PluralFormat(id, useOrdinal, offset, options, pluralFn) {
    this.id         = id;
    this.useOrdinal = useOrdinal;
    this.offset     = offset;
    this.options    = options;
    this.pluralFn   = pluralFn;
}

PluralFormat.prototype.getOption = function (value) {
    var options = this.options;

    var option = options['=' + value] ||
            options[this.pluralFn(value - this.offset, this.useOrdinal)];

    return option || options.other;
};

function PluralOffsetString(id, offset, numberFormat, string) {
    this.id           = id;
    this.offset       = offset;
    this.numberFormat = numberFormat;
    this.string       = string;
}

PluralOffsetString.prototype.format = function (value) {
    var number = this.numberFormat.format(value - this.offset);

    return this.string
            .replace(/(^|[^\\])#/g, '$1' + number)
            .replace(/\\#/g, '#');
};

function SelectFormat(id, options) {
    this.id      = id;
    this.options = options;
}

SelectFormat.prototype.getOption = function (value) {
    var options = this.options;
    return options[value] || options.other;
};

//# sourceMappingURL=compiler.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/lib/core.js":
/*!*****************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/core.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */


var src$utils$$ = __webpack_require__(/*! ./utils */ "./node_modules/intl-messageformat/lib/utils.js"), src$es5$$ = __webpack_require__(/*! ./es5 */ "./node_modules/intl-messageformat/lib/es5.js"), src$compiler$$ = __webpack_require__(/*! ./compiler */ "./node_modules/intl-messageformat/lib/compiler.js"), intl$messageformat$parser$$ = __webpack_require__(/*! intl-messageformat-parser */ "./node_modules/intl-messageformat-parser/index.js");
exports["default"] = MessageFormat;

// -- MessageFormat --------------------------------------------------------

function MessageFormat(message, locales, formats) {
    // Parse string messages into an AST.
    var ast = typeof message === 'string' ?
            MessageFormat.__parse(message) : message;

    if (!(ast && ast.type === 'messageFormatPattern')) {
        throw new TypeError('A message must be provided as a String or AST.');
    }

    // Creates a new object with the specified `formats` merged with the default
    // formats.
    formats = this._mergeFormats(MessageFormat.formats, formats);

    // Defined first because it's used to build the format pattern.
    src$es5$$.defineProperty(this, '_locale',  {value: this._resolveLocale(locales)});

    // Compile the `ast` to a pattern that is highly optimized for repeated
    // `format()` invocations. **Note:** This passes the `locales` set provided
    // to the constructor instead of just the resolved locale.
    var pluralFn = this._findPluralRuleFunction(this._locale);
    var pattern  = this._compilePattern(ast, locales, formats, pluralFn);

    // "Bind" `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    var messageFormat = this;
    this.format = function (values) {
      try {
        return messageFormat._format(pattern, values);
      } catch (e) {
        if (e.variableId) {
          throw new Error(
            'The intl string context variable \'' + e.variableId + '\'' +
            ' was not provided to the string \'' + message + '\''
          );
        } else {
          throw e;
        }
      }
    };
}

// Default format options used as the prototype of the `formats` provided to the
// constructor. These are used when constructing the internal Intl.NumberFormat
// and Intl.DateTimeFormat instances.
src$es5$$.defineProperty(MessageFormat, 'formats', {
    enumerable: true,

    value: {
        number: {
            'currency': {
                style: 'currency'
            },

            'percent': {
                style: 'percent'
            }
        },

        date: {
            'short': {
                month: 'numeric',
                day  : 'numeric',
                year : '2-digit'
            },

            'medium': {
                month: 'short',
                day  : 'numeric',
                year : 'numeric'
            },

            'long': {
                month: 'long',
                day  : 'numeric',
                year : 'numeric'
            },

            'full': {
                weekday: 'long',
                month  : 'long',
                day    : 'numeric',
                year   : 'numeric'
            }
        },

        time: {
            'short': {
                hour  : 'numeric',
                minute: 'numeric'
            },

            'medium':  {
                hour  : 'numeric',
                minute: 'numeric',
                second: 'numeric'
            },

            'long': {
                hour        : 'numeric',
                minute      : 'numeric',
                second      : 'numeric',
                timeZoneName: 'short'
            },

            'full': {
                hour        : 'numeric',
                minute      : 'numeric',
                second      : 'numeric',
                timeZoneName: 'short'
            }
        }
    }
});

// Define internal private properties for dealing with locale data.
src$es5$$.defineProperty(MessageFormat, '__localeData__', {value: src$es5$$.objCreate(null)});
src$es5$$.defineProperty(MessageFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error(
            'Locale data provided to IntlMessageFormat is missing a ' +
            '`locale` property'
        );
    }

    MessageFormat.__localeData__[data.locale.toLowerCase()] = data;
}});

// Defines `__parse()` static method as an exposed private.
src$es5$$.defineProperty(MessageFormat, '__parse', {value: intl$messageformat$parser$$["default"].parse});

// Define public `defaultLocale` property which defaults to English, but can be
// set by the developer.
src$es5$$.defineProperty(MessageFormat, 'defaultLocale', {
    enumerable: true,
    writable  : true,
    value     : undefined
});

MessageFormat.prototype.resolvedOptions = function () {
    // TODO: Provide anything else?
    return {
        locale: this._locale
    };
};

MessageFormat.prototype._compilePattern = function (ast, locales, formats, pluralFn) {
    var compiler = new src$compiler$$["default"](locales, formats, pluralFn);
    return compiler.compile(ast);
};

MessageFormat.prototype._findPluralRuleFunction = function (locale) {
    var localeData = MessageFormat.__localeData__;
    var data       = localeData[locale.toLowerCase()];

    // The locale data is de-duplicated, so we have to traverse the locale's
    // hierarchy until we find a `pluralRuleFunction` to return.
    while (data) {
        if (data.pluralRuleFunction) {
            return data.pluralRuleFunction;
        }

        data = data.parentLocale && localeData[data.parentLocale.toLowerCase()];
    }

    throw new Error(
        'Locale data added to IntlMessageFormat is missing a ' +
        '`pluralRuleFunction` for :' + locale
    );
};

MessageFormat.prototype._format = function (pattern, values) {
    var result = '',
        i, len, part, id, value, err;

    for (i = 0, len = pattern.length; i < len; i += 1) {
        part = pattern[i];

        // Exist early for string parts.
        if (typeof part === 'string') {
            result += part;
            continue;
        }

        id = part.id;

        // Enforce that all required values are provided by the caller.
        if (!(values && src$utils$$.hop.call(values, id))) {
          err = new Error('A value must be provided for: ' + id);
          err.variableId = id;
          throw err;
        }

        value = values[id];

        // Recursively format plural and select parts' option — which can be a
        // nested pattern structure. The choosing of the option to use is
        // abstracted-by and delegated-to the part helper object.
        if (part.options) {
            result += this._format(part.getOption(value), values);
        } else {
            result += part.format(value);
        }
    }

    return result;
};

MessageFormat.prototype._mergeFormats = function (defaults, formats) {
    var mergedFormats = {},
        type, mergedType;

    for (type in defaults) {
        if (!src$utils$$.hop.call(defaults, type)) { continue; }

        mergedFormats[type] = mergedType = src$es5$$.objCreate(defaults[type]);

        if (formats && src$utils$$.hop.call(formats, type)) {
            src$utils$$.extend(mergedType, formats[type]);
        }
    }

    return mergedFormats;
};

MessageFormat.prototype._resolveLocale = function (locales) {
    if (typeof locales === 'string') {
        locales = [locales];
    }

    // Create a copy of the array so we can push on the default locale.
    locales = (locales || []).concat(MessageFormat.defaultLocale);

    var localeData = MessageFormat.__localeData__;
    var i, len, localeParts, data;

    // Using the set of locales + the default locale, we look for the first one
    // which that has been registered. When data does not exist for a locale, we
    // traverse its ancestors to find something that's been registered within
    // its hierarchy of locales. Since we lack the proper `parentLocale` data
    // here, we must take a naive approach to traversal.
    for (i = 0, len = locales.length; i < len; i += 1) {
        localeParts = locales[i].toLowerCase().split('-');

        while (localeParts.length) {
            data = localeData[localeParts.join('-')];
            if (data) {
                // Return the normalized locale string; e.g., we return "en-US",
                // instead of "en-us".
                return data.locale;
            }

            localeParts.pop();
        }
    }

    var defaultLocale = locales.pop();
    throw new Error(
        'No locale data has been added to IntlMessageFormat for: ' +
        locales.join(', ') + ', or the default locale: ' + defaultLocale
    );
};

//# sourceMappingURL=core.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/lib/en.js":
/*!***************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/en.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// GENERATED FILE

exports["default"] = {"locale":"en","pluralRuleFunction":function (n,ord){var s=String(n).split("."),v0=!s[1],t0=Number(s[0])==n,n10=t0&&s[0].slice(-1),n100=t0&&s[0].slice(-2);if(ord)return n10==1&&n100!=11?"one":n10==2&&n100!=12?"two":n10==3&&n100!=13?"few":"other";return n==1&&v0?"one":"other"}};

//# sourceMappingURL=en.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/lib/es5.js":
/*!****************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/es5.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */


var src$utils$$ = __webpack_require__(/*! ./utils */ "./node_modules/intl-messageformat/lib/utils.js");

// Purposely using the same implementation as the Intl.js `Intl` polyfill.
// Copyright 2013 Andy Earnshaw, MIT License

var realDefineProp = (function () {
    try { return !!Object.defineProperty({}, 'a', {}); }
    catch (e) { return false; }
})();

var es3 = !realDefineProp && !Object.prototype.__defineGetter__;

var defineProperty = realDefineProp ? Object.defineProperty :
        function (obj, name, desc) {

    if ('get' in desc && obj.__defineGetter__) {
        obj.__defineGetter__(name, desc.get);
    } else if (!src$utils$$.hop.call(obj, name) || 'value' in desc) {
        obj[name] = desc.value;
    }
};

var objCreate = Object.create || function (proto, props) {
    var obj, k;

    function F() {}
    F.prototype = proto;
    obj = new F();

    for (k in props) {
        if (src$utils$$.hop.call(props, k)) {
            defineProperty(obj, k, props[k]);
        }
    }

    return obj;
};

exports.defineProperty = defineProperty, exports.objCreate = objCreate;

//# sourceMappingURL=es5.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/lib/main.js":
/*!*****************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/main.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jslint esnext: true */


var src$core$$ = __webpack_require__(/*! ./core */ "./node_modules/intl-messageformat/lib/core.js"), src$en$$ = __webpack_require__(/*! ./en */ "./node_modules/intl-messageformat/lib/en.js");

src$core$$["default"].__addLocaleData(src$en$$["default"]);
src$core$$["default"].defaultLocale = 'en';

exports["default"] = src$core$$["default"];

//# sourceMappingURL=main.js.map

/***/ }),

/***/ "./node_modules/intl-messageformat/lib/utils.js":
/*!******************************************************!*\
  !*** ./node_modules/intl-messageformat/lib/utils.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */


exports.extend = extend;
var hop = Object.prototype.hasOwnProperty;

function extend(obj) {
    var sources = Array.prototype.slice.call(arguments, 1),
        i, len, source, key;

    for (i = 0, len = sources.length; i < len; i += 1) {
        source = sources[i];
        if (!source) { continue; }

        for (key in source) {
            if (hop.call(source, key)) {
                obj[key] = source[key];
            }
        }
    }

    return obj;
}
exports.hop = hop;

//# sourceMappingURL=utils.js.map

/***/ }),

/***/ "./node_modules/intl-relativeformat/index.js":
/*!***************************************************!*\
  !*** ./node_modules/intl-relativeformat/index.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jshint node:true */



var IntlRelativeFormat = __webpack_require__(/*! ./lib/main */ "./node_modules/intl-relativeformat/lib/main.js")['default'];

// Add all locale data to `IntlRelativeFormat`. This module will be ignored when
// bundling for the browser with Browserify/Webpack.
__webpack_require__(/*! ./lib/locales */ 3);

// Re-export `IntlRelativeFormat` as the CommonJS default exports with all the
// locale data registered, and with English set as the default locale. Define
// the `default` prop for use with other compiled ES6 Modules.
exports = module.exports = IntlRelativeFormat;
exports['default'] = exports;


/***/ }),

/***/ "./node_modules/intl-relativeformat/lib/core.js":
/*!******************************************************!*\
  !*** ./node_modules/intl-relativeformat/lib/core.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */


var intl$messageformat$$ = __webpack_require__(/*! intl-messageformat */ "./node_modules/intl-messageformat/index.js"), src$diff$$ = __webpack_require__(/*! ./diff */ "./node_modules/intl-relativeformat/lib/diff.js"), src$es5$$ = __webpack_require__(/*! ./es5 */ "./node_modules/intl-relativeformat/lib/es5.js");
exports["default"] = RelativeFormat;

// -----------------------------------------------------------------------------

var FIELDS = [
    'second', 'second-short',
    'minute', 'minute-short',
    'hour', 'hour-short',
    'day', 'day-short',
    'month', 'month-short',
    'year', 'year-short'
];
var STYLES = ['best fit', 'numeric'];

// -- RelativeFormat -----------------------------------------------------------

function RelativeFormat(locales, options) {
    options = options || {};

    // Make a copy of `locales` if it's an array, so that it doesn't change
    // since it's used lazily.
    if (src$es5$$.isArray(locales)) {
        locales = locales.concat();
    }

    src$es5$$.defineProperty(this, '_locale', {value: this._resolveLocale(locales)});
    src$es5$$.defineProperty(this, '_options', {value: {
        style: this._resolveStyle(options.style),
        units: this._isValidUnits(options.units) && options.units
    }});

    src$es5$$.defineProperty(this, '_locales', {value: locales});
    src$es5$$.defineProperty(this, '_fields', {value: this._findFields(this._locale)});
    src$es5$$.defineProperty(this, '_messages', {value: src$es5$$.objCreate(null)});

    // "Bind" `format()` method to `this` so it can be passed by reference like
    // the other `Intl` APIs.
    var relativeFormat = this;
    this.format = function format(date, options) {
        return relativeFormat._format(date, options);
    };
}

// Define internal private properties for dealing with locale data.
src$es5$$.defineProperty(RelativeFormat, '__localeData__', {value: src$es5$$.objCreate(null)});
src$es5$$.defineProperty(RelativeFormat, '__addLocaleData', {value: function (data) {
    if (!(data && data.locale)) {
        throw new Error(
            'Locale data provided to IntlRelativeFormat is missing a ' +
            '`locale` property value'
        );
    }

    RelativeFormat.__localeData__[data.locale.toLowerCase()] = data;

    // Add data to IntlMessageFormat.
    intl$messageformat$$["default"].__addLocaleData(data);
}});

// Define public `defaultLocale` property which can be set by the developer, or
// it will be set when the first RelativeFormat instance is created by
// leveraging the resolved locale from `Intl`.
src$es5$$.defineProperty(RelativeFormat, 'defaultLocale', {
    enumerable: true,
    writable  : true,
    value     : undefined
});

// Define public `thresholds` property which can be set by the developer, and
// defaults to relative time thresholds from moment.js.
src$es5$$.defineProperty(RelativeFormat, 'thresholds', {
    enumerable: true,

    value: {
        second: 45, 'second-short': 45,  // seconds to minute
        minute: 45, 'minute-short': 45, // minutes to hour
        hour  : 22, 'hour-short': 22, // hours to day
        day   : 26, 'day-short': 26, // days to month
        month : 11, 'month-short': 11 // months to year
    }
});

RelativeFormat.prototype.resolvedOptions = function () {
    return {
        locale: this._locale,
        style : this._options.style,
        units : this._options.units
    };
};

RelativeFormat.prototype._compileMessage = function (units) {
    // `this._locales` is the original set of locales the user specified to the
    // constructor, while `this._locale` is the resolved root locale.
    var locales        = this._locales;
    var resolvedLocale = this._locale;

    var field        = this._fields[units];
    var relativeTime = field.relativeTime;
    var future       = '';
    var past         = '';
    var i;

    for (i in relativeTime.future) {
        if (relativeTime.future.hasOwnProperty(i)) {
            future += ' ' + i + ' {' +
                relativeTime.future[i].replace('{0}', '#') + '}';
        }
    }

    for (i in relativeTime.past) {
        if (relativeTime.past.hasOwnProperty(i)) {
            past += ' ' + i + ' {' +
                relativeTime.past[i].replace('{0}', '#') + '}';
        }
    }

    var message = '{when, select, future {{0, plural, ' + future + '}}' +
                                 'past {{0, plural, ' + past + '}}}';

    // Create the synthetic IntlMessageFormat instance using the original
    // locales value specified by the user when constructing the the parent
    // IntlRelativeFormat instance.
    return new intl$messageformat$$["default"](message, locales);
};

RelativeFormat.prototype._getMessage = function (units) {
    var messages = this._messages;

    // Create a new synthetic message based on the locale data from CLDR.
    if (!messages[units]) {
        messages[units] = this._compileMessage(units);
    }

    return messages[units];
};

RelativeFormat.prototype._getRelativeUnits = function (diff, units) {
    var field = this._fields[units];

    if (field.relative) {
        return field.relative[diff];
    }
};

RelativeFormat.prototype._findFields = function (locale) {
    var localeData = RelativeFormat.__localeData__;
    var data       = localeData[locale.toLowerCase()];

    // The locale data is de-duplicated, so we have to traverse the locale's
    // hierarchy until we find `fields` to return.
    while (data) {
        if (data.fields) {
            return data.fields;
        }

        data = data.parentLocale && localeData[data.parentLocale.toLowerCase()];
    }

    throw new Error(
        'Locale data added to IntlRelativeFormat is missing `fields` for :' +
        locale
    );
};

RelativeFormat.prototype._format = function (date, options) {
    var now = options && options.now !== undefined ? options.now : src$es5$$.dateNow();

    if (date === undefined) {
        date = now;
    }

    // Determine if the `date` and optional `now` values are valid, and throw a
    // similar error to what `Intl.DateTimeFormat#format()` would throw.
    if (!isFinite(now)) {
        throw new RangeError(
            'The `now` option provided to IntlRelativeFormat#format() is not ' +
            'in valid range.'
        );
    }

    if (!isFinite(date)) {
        throw new RangeError(
            'The date value provided to IntlRelativeFormat#format() is not ' +
            'in valid range.'
        );
    }

    var diffReport  = src$diff$$["default"](now, date);
    var units       = this._options.units || this._selectUnits(diffReport);
    var diffInUnits = diffReport[units];

    if (this._options.style !== 'numeric') {
        var relativeUnits = this._getRelativeUnits(diffInUnits, units);
        if (relativeUnits) {
            return relativeUnits;
        }
    }

    return this._getMessage(units).format({
        '0' : Math.abs(diffInUnits),
        when: diffInUnits < 0 ? 'past' : 'future'
    });
};

RelativeFormat.prototype._isValidUnits = function (units) {
    if (!units || src$es5$$.arrIndexOf.call(FIELDS, units) >= 0) {
        return true;
    }

    if (typeof units === 'string') {
        var suggestion = /s$/.test(units) && units.substr(0, units.length - 1);
        if (suggestion && src$es5$$.arrIndexOf.call(FIELDS, suggestion) >= 0) {
            throw new Error(
                '"' + units + '" is not a valid IntlRelativeFormat `units` ' +
                'value, did you mean: ' + suggestion
            );
        }
    }

    throw new Error(
        '"' + units + '" is not a valid IntlRelativeFormat `units` value, it ' +
        'must be one of: "' + FIELDS.join('", "') + '"'
    );
};

RelativeFormat.prototype._resolveLocale = function (locales) {
    if (typeof locales === 'string') {
        locales = [locales];
    }

    // Create a copy of the array so we can push on the default locale.
    locales = (locales || []).concat(RelativeFormat.defaultLocale);

    var localeData = RelativeFormat.__localeData__;
    var i, len, localeParts, data;

    // Using the set of locales + the default locale, we look for the first one
    // which that has been registered. When data does not exist for a locale, we
    // traverse its ancestors to find something that's been registered within
    // its hierarchy of locales. Since we lack the proper `parentLocale` data
    // here, we must take a naive approach to traversal.
    for (i = 0, len = locales.length; i < len; i += 1) {
        localeParts = locales[i].toLowerCase().split('-');

        while (localeParts.length) {
            data = localeData[localeParts.join('-')];
            if (data) {
                // Return the normalized locale string; e.g., we return "en-US",
                // instead of "en-us".
                return data.locale;
            }

            localeParts.pop();
        }
    }

    var defaultLocale = locales.pop();
    throw new Error(
        'No locale data has been added to IntlRelativeFormat for: ' +
        locales.join(', ') + ', or the default locale: ' + defaultLocale
    );
};

RelativeFormat.prototype._resolveStyle = function (style) {
    // Default to "best fit" style.
    if (!style) {
        return STYLES[0];
    }

    if (src$es5$$.arrIndexOf.call(STYLES, style) >= 0) {
        return style;
    }

    throw new Error(
        '"' + style + '" is not a valid IntlRelativeFormat `style` value, it ' +
        'must be one of: "' + STYLES.join('", "') + '"'
    );
};

RelativeFormat.prototype._selectUnits = function (diffReport) {
    var i, l, units;
    var fields = FIELDS.filter(function(field) {
        return field.indexOf('-short') < 1;
    });

    for (i = 0, l = fields.length; i < l; i += 1) {
        units = fields[i];

        if (Math.abs(diffReport[units]) < RelativeFormat.thresholds[units]) {
            break;
        }
    }

    return units;
};

//# sourceMappingURL=core.js.map

/***/ }),

/***/ "./node_modules/intl-relativeformat/lib/diff.js":
/*!******************************************************!*\
  !*** ./node_modules/intl-relativeformat/lib/diff.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */



var round = Math.round;

function daysToYears(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    return days * 400 / 146097;
}

exports["default"] = function (from, to) {
    // Convert to ms timestamps.
    from = +from;
    to   = +to;

    var millisecond = round(to - from),
        second      = round(millisecond / 1000),
        minute      = round(second / 60),
        hour        = round(minute / 60),
        day         = round(hour / 24),
        week        = round(day / 7);

    var rawYears = daysToYears(day),
        month    = round(rawYears * 12),
        year     = round(rawYears);

    return {
        millisecond    : millisecond,
        second         : second,
        'second-short' : second,
        minute         : minute,
        'minute-short' : minute,
        hour           : hour,
        'hour-short'   : hour,
        day            : day,
        'day-short'    : day,
        week           : week,
        'week-short'   : week,
        month          : month,
        'month-short'  : month,
        year           : year,
        'year-short'   : year
    };
};

//# sourceMappingURL=diff.js.map

/***/ }),

/***/ "./node_modules/intl-relativeformat/lib/en.js":
/*!****************************************************!*\
  !*** ./node_modules/intl-relativeformat/lib/en.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// GENERATED FILE

exports["default"] = {"locale":"en","pluralRuleFunction":function (n,ord){var s=String(n).split("."),v0=!s[1],t0=Number(s[0])==n,n10=t0&&s[0].slice(-1),n100=t0&&s[0].slice(-2);if(ord)return n10==1&&n100!=11?"one":n10==2&&n100!=12?"two":n10==3&&n100!=13?"few":"other";return n==1&&v0?"one":"other"},"fields":{"year":{"displayName":"year","relative":{"0":"this year","1":"next year","-1":"last year"},"relativeTime":{"future":{"one":"in {0} year","other":"in {0} years"},"past":{"one":"{0} year ago","other":"{0} years ago"}}},"year-short":{"displayName":"yr.","relative":{"0":"this yr.","1":"next yr.","-1":"last yr."},"relativeTime":{"future":{"one":"in {0} yr.","other":"in {0} yr."},"past":{"one":"{0} yr. ago","other":"{0} yr. ago"}}},"month":{"displayName":"month","relative":{"0":"this month","1":"next month","-1":"last month"},"relativeTime":{"future":{"one":"in {0} month","other":"in {0} months"},"past":{"one":"{0} month ago","other":"{0} months ago"}}},"month-short":{"displayName":"mo.","relative":{"0":"this mo.","1":"next mo.","-1":"last mo."},"relativeTime":{"future":{"one":"in {0} mo.","other":"in {0} mo."},"past":{"one":"{0} mo. ago","other":"{0} mo. ago"}}},"day":{"displayName":"day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"in {0} day","other":"in {0} days"},"past":{"one":"{0} day ago","other":"{0} days ago"}}},"day-short":{"displayName":"day","relative":{"0":"today","1":"tomorrow","-1":"yesterday"},"relativeTime":{"future":{"one":"in {0} day","other":"in {0} days"},"past":{"one":"{0} day ago","other":"{0} days ago"}}},"hour":{"displayName":"hour","relative":{"0":"this hour"},"relativeTime":{"future":{"one":"in {0} hour","other":"in {0} hours"},"past":{"one":"{0} hour ago","other":"{0} hours ago"}}},"hour-short":{"displayName":"hr.","relative":{"0":"this hour"},"relativeTime":{"future":{"one":"in {0} hr.","other":"in {0} hr."},"past":{"one":"{0} hr. ago","other":"{0} hr. ago"}}},"minute":{"displayName":"minute","relative":{"0":"this minute"},"relativeTime":{"future":{"one":"in {0} minute","other":"in {0} minutes"},"past":{"one":"{0} minute ago","other":"{0} minutes ago"}}},"minute-short":{"displayName":"min.","relative":{"0":"this minute"},"relativeTime":{"future":{"one":"in {0} min.","other":"in {0} min."},"past":{"one":"{0} min. ago","other":"{0} min. ago"}}},"second":{"displayName":"second","relative":{"0":"now"},"relativeTime":{"future":{"one":"in {0} second","other":"in {0} seconds"},"past":{"one":"{0} second ago","other":"{0} seconds ago"}}},"second-short":{"displayName":"sec.","relative":{"0":"now"},"relativeTime":{"future":{"one":"in {0} sec.","other":"in {0} sec."},"past":{"one":"{0} sec. ago","other":"{0} sec. ago"}}}}};

//# sourceMappingURL=en.js.map

/***/ }),

/***/ "./node_modules/intl-relativeformat/lib/es5.js":
/*!*****************************************************!*\
  !*** ./node_modules/intl-relativeformat/lib/es5.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jslint esnext: true */

// Purposely using the same implementation as the Intl.js `Intl` polyfill.
// Copyright 2013 Andy Earnshaw, MIT License



var hop = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var realDefineProp = (function () {
    try { return !!Object.defineProperty({}, 'a', {}); }
    catch (e) { return false; }
})();

var es3 = !realDefineProp && !Object.prototype.__defineGetter__;

var defineProperty = realDefineProp ? Object.defineProperty :
        function (obj, name, desc) {

    if ('get' in desc && obj.__defineGetter__) {
        obj.__defineGetter__(name, desc.get);
    } else if (!hop.call(obj, name) || 'value' in desc) {
        obj[name] = desc.value;
    }
};

var objCreate = Object.create || function (proto, props) {
    var obj, k;

    function F() {}
    F.prototype = proto;
    obj = new F();

    for (k in props) {
        if (hop.call(props, k)) {
            defineProperty(obj, k, props[k]);
        }
    }

    return obj;
};

var arrIndexOf = Array.prototype.indexOf || function (search, fromIndex) {
    /*jshint validthis:true */
    var arr = this;
    if (!arr.length) {
        return -1;
    }

    for (var i = fromIndex || 0, max = arr.length; i < max; i++) {
        if (arr[i] === search) {
            return i;
        }
    }

    return -1;
};

var isArray = Array.isArray || function (obj) {
    return toString.call(obj) === '[object Array]';
};

var dateNow = Date.now || function () {
    return new Date().getTime();
};

exports.defineProperty = defineProperty, exports.objCreate = objCreate, exports.arrIndexOf = arrIndexOf, exports.isArray = isArray, exports.dateNow = dateNow;

//# sourceMappingURL=es5.js.map

/***/ }),

/***/ "./node_modules/intl-relativeformat/lib/main.js":
/*!******************************************************!*\
  !*** ./node_modules/intl-relativeformat/lib/main.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* jslint esnext: true */


var src$core$$ = __webpack_require__(/*! ./core */ "./node_modules/intl-relativeformat/lib/core.js"), src$en$$ = __webpack_require__(/*! ./en */ "./node_modules/intl-relativeformat/lib/en.js");

src$core$$["default"].__addLocaleData(src$en$$["default"]);
src$core$$["default"].defaultLocale = 'en';

exports["default"] = src$core$$["default"];

//# sourceMappingURL=main.js.map

/***/ }),

/***/ "./node_modules/invariant/browser.js":
/*!*******************************************!*\
  !*** ./node_modules/invariant/browser.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (true) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;


/***/ }),

/***/ "./node_modules/json2mq/index.js":
/*!***************************************!*\
  !*** ./node_modules/json2mq/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var camel2hyphen = __webpack_require__(/*! string-convert/camel2hyphen */ "./node_modules/string-convert/camel2hyphen.js");

var isDimension = function (feature) {
  var re = /[height|width]$/;
  return re.test(feature);
};

var obj2mq = function (obj) {
  var mq = '';
  var features = Object.keys(obj);
  features.forEach(function (feature, index) {
    var value = obj[feature];
    feature = camel2hyphen(feature);
    // Add px to dimension features
    if (isDimension(feature) && typeof value === 'number') {
      value = value + 'px';
    }
    if (value === true) {
      mq += feature;
    } else if (value === false) {
      mq += 'not ' + feature;
    } else {
      mq += '(' + feature + ': ' + value + ')';
    }
    if (index < features.length-1) {
      mq += ' and '
    }
  });
  return mq;
};

var json2mq = function (query) {
  var mq = '';
  if (typeof query === 'string') {
    return query;
  }
  // Handling array of media queries
  if (query instanceof Array) {
    query.forEach(function (q, index) {
      mq += obj2mq(q);
      if (index < query.length-1) {
        mq += ', '
      }
    });
    return mq;
  }
  // Handling single media query
  return obj2mq(query);
};

module.exports = json2mq;

/***/ }),

/***/ "./node_modules/linkify-it/index.js":
/*!******************************************!*\
  !*** ./node_modules/linkify-it/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



////////////////////////////////////////////////////////////////////////////////
// Helpers

// Merge objects
//
function assign(obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}

function _class(obj) { return Object.prototype.toString.call(obj); }
function isString(obj) { return _class(obj) === '[object String]'; }
function isObject(obj) { return _class(obj) === '[object Object]'; }
function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
function isFunction(obj) { return _class(obj) === '[object Function]'; }


function escapeRE(str) { return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); }

////////////////////////////////////////////////////////////////////////////////


var defaultOptions = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};


function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function (acc, k) {
    return acc || defaultOptions.hasOwnProperty(k);
  }, false);
}


var defaultSchemas = {
  'http:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.http =  new RegExp(
          '^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i'
        );
      }
      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }
      return 0;
    }
  },
  'https:':  'http:',
  'ftp:':    'http:',
  '//':      {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.no_http) {
      // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.no_http =  new RegExp(
          '^' +
          self.re.src_auth +
          // Don't allow single-level domains, because of false positives like '//test'
          // with code comments
          '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' +
          self.re.src_port +
          self.re.src_host_terminator +
          self.re.src_path,

          'i'
        );
      }

      if (self.re.no_http.test(tail)) {
        // should not be `://` & `///`, that protects from errors in protocol name
        if (pos >= 3 && text[pos - 3] === ':') { return 0; }
        if (pos >= 3 && text[pos - 3] === '/') { return 0; }
        return tail.match(self.re.no_http)[0].length;
      }
      return 0;
    }
  },
  'mailto:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.mailto) {
        self.re.mailto =  new RegExp(
          '^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i'
        );
      }
      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }
      return 0;
    }
  }
};

/*eslint-disable max-len*/

// RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)
var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]';

// DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead
var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');

/*eslint-enable max-len*/

////////////////////////////////////////////////////////////////////////////////

function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__   = '';
}

function createValidator(re) {
  return function (text, pos) {
    var tail = text.slice(pos);

    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }
    return 0;
  };
}

function createNormalizer() {
  return function (match, self) {
    self.normalize(match);
  };
}

// Schemas compiler. Build regexps.
//
function compile(self) {

  // Load & clone RE patterns.
  var re = self.re = __webpack_require__(/*! ./lib/re */ "./node_modules/linkify-it/lib/re.js")(self.__opts__);

  // Define dynamic patterns
  var tlds = self.__tlds__.slice();

  self.onCompile();

  if (!self.__tlds_replaced__) {
    tlds.push(tlds_2ch_src_re);
  }
  tlds.push(re.src_xn);

  re.src_tlds = tlds.join('|');

  function untpl(tpl) { return tpl.replace('%TLDS%', re.src_tlds); }

  re.email_fuzzy      = RegExp(untpl(re.tpl_email_fuzzy), 'i');
  re.link_fuzzy       = RegExp(untpl(re.tpl_link_fuzzy), 'i');
  re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), 'i');
  re.host_fuzzy_test  = RegExp(untpl(re.tpl_host_fuzzy_test), 'i');

  //
  // Compile each schema
  //

  var aliases = [];

  self.__compiled__ = {}; // Reset compiled data

  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }

  Object.keys(self.__schemas__).forEach(function (name) {
    var val = self.__schemas__[name];

    // skip disabled methods
    if (val === null) { return; }

    var compiled = { validate: null, link: null };

    self.__compiled__[name] = compiled;

    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }

      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }

      return;
    }

    if (isString(val)) {
      aliases.push(name);
      return;
    }

    schemaError(name, val);
  });

  //
  // Compile postponed aliases
  //

  aliases.forEach(function (alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      // Silently fail on missed schemas to avoid errons on disable.
      // schemaError(alias, self.__schemas__[alias]);
      return;
    }

    self.__compiled__[alias].validate =
      self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize =
      self.__compiled__[self.__schemas__[alias]].normalize;
  });

  //
  // Fake record for guessed links
  //
  self.__compiled__[''] = { validate: null, normalize: createNormalizer() };

  //
  // Build schema condition
  //
  var slist = Object.keys(self.__compiled__)
                      .filter(function (name) {
                        // Filter disabled & fake schemas
                        return name.length > 0 && self.__compiled__[name];
                      })
                      .map(escapeRE)
                      .join('|');
  // (?!_) cause 1.5x slowdown
  self.re.schema_test   = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'i');
  self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'ig');

  self.re.pretest       = RegExp(
                            '(' + self.re.schema_test.source + ')|' +
                            '(' + self.re.host_fuzzy_test.source + ')|' +
                            '@',
                            'i');

  //
  // Cleanup
  //

  resetScanCache(self);
}

/**
 * class Match
 *
 * Match result. Single element of array, returned by [[LinkifyIt#match]]
 **/
function Match(self, shift) {
  var start = self.__index__,
      end   = self.__last_index__,
      text  = self.__text_cache__.slice(start, end);

  /**
   * Match#schema -> String
   *
   * Prefix (protocol) for matched string.
   **/
  this.schema    = self.__schema__.toLowerCase();
  /**
   * Match#index -> Number
   *
   * First position of matched string.
   **/
  this.index     = start + shift;
  /**
   * Match#lastIndex -> Number
   *
   * Next position after matched string.
   **/
  this.lastIndex = end + shift;
  /**
   * Match#raw -> String
   *
   * Matched string.
   **/
  this.raw       = text;
  /**
   * Match#text -> String
   *
   * Notmalized text of matched string.
   **/
  this.text      = text;
  /**
   * Match#url -> String
   *
   * Normalized url of matched string.
   **/
  this.url       = text;
}

function createMatch(self, shift) {
  var match = new Match(self, shift);

  self.__compiled__[match.schema].normalize(match, self);

  return match;
}


/**
 * class LinkifyIt
 **/

/**
 * new LinkifyIt(schemas, options)
 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Creates new linkifier instance with optional additional schemas.
 * Can be called without `new` keyword for convenience.
 *
 * By default understands:
 *
 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
 * - "fuzzy" links and emails (example.com, foo@bar.com).
 *
 * `schemas` is an object, where each key/value describes protocol/rule:
 *
 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
 *   for example). `linkify-it` makes shure that prefix is not preceeded with
 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
 * - __value__ - rule to check tail after link prefix
 *   - _String_ - just alias to existing rule
 *   - _Object_
 *     - _validate_ - validator function (should return matched length on success),
 *       or `RegExp`.
 *     - _normalize_ - optional function to normalize text & url of matched result
 *       (for example, for @twitter mentions).
 *
 * `options`:
 *
 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
 *   like version numbers. Default `false`.
 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
 *
 **/
function LinkifyIt(schemas, options) {
  if (!(this instanceof LinkifyIt)) {
    return new LinkifyIt(schemas, options);
  }

  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }

  this.__opts__           = assign({}, defaultOptions, options);

  // Cache last tested result. Used to skip repeating steps on next `match` call.
  this.__index__          = -1;
  this.__last_index__     = -1; // Next scan position
  this.__schema__         = '';
  this.__text_cache__     = '';

  this.__schemas__        = assign({}, defaultSchemas, schemas);
  this.__compiled__       = {};

  this.__tlds__           = tlds_default;
  this.__tlds_replaced__  = false;

  this.re = {};

  compile(this);
}


/** chainable
 * LinkifyIt#add(schema, definition)
 * - schema (String): rule name (fixed pattern prefix)
 * - definition (String|RegExp|Object): schema definition
 *
 * Add new rule definition. See constructor description for details.
 **/
LinkifyIt.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};


/** chainable
 * LinkifyIt#set(options)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Set recognition options for links without schema.
 **/
LinkifyIt.prototype.set = function set(options) {
  this.__opts__ = assign(this.__opts__, options);
  return this;
};


/**
 * LinkifyIt#test(text) -> Boolean
 *
 * Searches linkifiable pattern and returns `true` on success or `false` on fail.
 **/
LinkifyIt.prototype.test = function test(text) {
  // Reset scan cache
  this.__text_cache__ = text;
  this.__index__      = -1;

  if (!text.length) { return false; }

  var m, ml, me, len, shift, next, re, tld_pos, at_pos;

  // try to scan for link with schema - that's the most simple rule
  if (this.re.schema_test.test(text)) {
    re = this.re.schema_search;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      len = this.testSchemaAt(text, m[2], re.lastIndex);
      if (len) {
        this.__schema__     = m[2];
        this.__index__      = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }

  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
    // guess schemaless links
    tld_pos = text.search(this.re.host_fuzzy_test);
    if (tld_pos >= 0) {
      // if tld is located after found link - no need to check fuzzy pattern
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {

          shift = ml.index + ml[1].length;

          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__     = '';
            this.__index__      = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }

  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
    // guess schemaless emails
    at_pos = text.indexOf('@');
    if (at_pos >= 0) {
      // We can't skip this check, because this cases are possible:
      // 192.168.1.1@gmail.com, my.in@example.com
      if ((me = text.match(this.re.email_fuzzy)) !== null) {

        shift = me.index + me[1].length;
        next  = me.index + me[0].length;

        if (this.__index__ < 0 || shift < this.__index__ ||
            (shift === this.__index__ && next > this.__last_index__)) {
          this.__schema__     = 'mailto:';
          this.__index__      = shift;
          this.__last_index__ = next;
        }
      }
    }
  }

  return this.__index__ >= 0;
};


/**
 * LinkifyIt#pretest(text) -> Boolean
 *
 * Very quick check, that can give false positives. Returns true if link MAY BE
 * can exists. Can be used for speed optimization, when you need to check that
 * link NOT exists.
 **/
LinkifyIt.prototype.pretest = function pretest(text) {
  return this.re.pretest.test(text);
};


/**
 * LinkifyIt#testSchemaAt(text, name, position) -> Number
 * - text (String): text to scan
 * - name (String): rule (schema) name
 * - position (Number): text offset to check from
 *
 * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
 * at given position. Returns length of found pattern (0 on fail).
 **/
LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
  // If not supported schema check requested - terminate
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }
  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
};


/**
 * LinkifyIt#match(text) -> Array|null
 *
 * Returns array of found link descriptions or `null` on fail. We strongly
 * recommend to use [[LinkifyIt#test]] first, for best speed.
 *
 * ##### Result match description
 *
 * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
 *   protocol-neutral  links.
 * - __index__ - offset of matched text
 * - __lastIndex__ - index of next char after mathch end
 * - __raw__ - matched text
 * - __text__ - normalized text
 * - __url__ - link, generated from matched text
 **/
LinkifyIt.prototype.match = function match(text) {
  var shift = 0, result = [];

  // Try to take previous element from cache, if .test() called before
  if (this.__index__ >= 0 && this.__text_cache__ === text) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  }

  // Cut head if cache was used
  var tail = shift ? text.slice(shift) : text;

  // Scan string until end reached
  while (this.test(tail)) {
    result.push(createMatch(this, shift));

    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }

  if (result.length) {
    return result;
  }

  return null;
};


/** chainable
 * LinkifyIt#tlds(list [, keepOld]) -> this
 * - list (Array): list of tlds
 * - keepOld (Boolean): merge with current list if `true` (`false` by default)
 *
 * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
 * to avoid false positives. By default this algorythm used:
 *
 * - hostname with any 2-letter root zones are ok.
 * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
 *   are ok.
 * - encoded (`xn--...`) root zones are ok.
 *
 * If list is replaced, then exact match for 2-chars root zones will be checked.
 **/
LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
  list = Array.isArray(list) ? list : [ list ];

  if (!keepOld) {
    this.__tlds__ = list.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }

  this.__tlds__ = this.__tlds__.concat(list)
                                  .sort()
                                  .filter(function (el, idx, arr) {
                                    return el !== arr[idx - 1];
                                  })
                                  .reverse();

  compile(this);
  return this;
};

/**
 * LinkifyIt#normalize(match)
 *
 * Default normalizer (if schema does not define it's own).
 **/
LinkifyIt.prototype.normalize = function normalize(match) {

  // Do minimal possible changes by default. Need to collect feedback prior
  // to move forward https://github.com/markdown-it/linkify-it/issues/1

  if (!match.schema) { match.url = 'http://' + match.url; }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};


/**
 * LinkifyIt#onCompile()
 *
 * Override to modify basic RegExp-s.
 **/
LinkifyIt.prototype.onCompile = function onCompile() {
};


module.exports = LinkifyIt;


/***/ }),

/***/ "./node_modules/linkify-it/lib/re.js":
/*!*******************************************!*\
  !*** ./node_modules/linkify-it/lib/re.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = function (opts) {
  var re = {};

  // Use direct extract instead of `regenerate` to reduse browserified size
  re.src_Any = __webpack_require__(/*! uc.micro/properties/Any/regex */ "./node_modules/uc.micro/properties/Any/regex.js").source;
  re.src_Cc  = __webpack_require__(/*! uc.micro/categories/Cc/regex */ "./node_modules/uc.micro/categories/Cc/regex.js").source;
  re.src_Z   = __webpack_require__(/*! uc.micro/categories/Z/regex */ "./node_modules/uc.micro/categories/Z/regex.js").source;
  re.src_P   = __webpack_require__(/*! uc.micro/categories/P/regex */ "./node_modules/uc.micro/categories/P/regex.js").source;

  // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)
  re.src_ZPCc = [ re.src_Z, re.src_P, re.src_Cc ].join('|');

  // \p{\Z\Cc} (white spaces + control)
  re.src_ZCc = [ re.src_Z, re.src_Cc ].join('|');

  // Experimental. List of chars, completely prohibited in links
  // because can separate it from other part of text
  var text_separators = '[><\uff5c]';

  // All possible word characters (everything without punctuation, spaces & controls)
  // Defined via punctuation & spaces to save space
  // Should be something like \p{\L\N\S\M} (\w but without `_`)
  re.src_pseudo_letter       = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')';
  // The same as abothe but without [0-9]
  // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';

  ////////////////////////////////////////////////////////////////////////////////

  re.src_ip4 =

    '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';

  // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.
  re.src_auth    = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';

  re.src_port =

    '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';

  re.src_host_terminator =

    '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';

  re.src_path =

    '(?:' +
      '[/?#]' +
        '(?:' +
          '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-]).|' +
          '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' +
          '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' +
          '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' +
          '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' +
          "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" +
          "\\'(?=" + re.src_pseudo_letter + '|[-]).|' +  // allow `I'm_king` if no pair found
          '\\.{2,3}[a-zA-Z0-9%/]|' + // github has ... in commit range links. Restrict to
                                     // - english
                                     // - percent-encoded
                                     // - parts of file path
                                     // until more examples found.
          '\\.(?!' + re.src_ZCc + '|[.]).|' +
          (opts && opts['---'] ?
            '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
          :
            '\\-+|'
          ) +
          '\\,(?!' + re.src_ZCc + ').|' +      // allow `,,,` in paths
          '\\!(?!' + re.src_ZCc + '|[!]).|' +
          '\\?(?!' + re.src_ZCc + '|[?]).' +
        ')+' +
      '|\\/' +
    ')?';

  re.src_email_name =

    '[\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]+';

  re.src_xn =

    'xn--[a-z0-9\\-]{1,59}';

  // More to read about domain names
  // http://serverfault.com/questions/638260/

  re.src_domain_root =

    // Allow letters & digits (http://test1)
    '(?:' +
      re.src_xn +
      '|' +
      re.src_pseudo_letter + '{1,63}' +
    ')';

  re.src_domain =

    '(?:' +
      re.src_xn +
      '|' +
      '(?:' + re.src_pseudo_letter + ')' +
      '|' +
      // don't allow `--` in domain names, because:
      // - that can conflict with markdown &mdash; / &ndash;
      // - nobody use those anyway
      '(?:' + re.src_pseudo_letter + '(?:-(?!-)|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
    ')';

  re.src_host =

    '(?:' +
    // Don't need IP check, because digits are already allowed in normal domain names
    //   src_ip4 +
    // '|' +
      '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain/*_root*/ + ')' +
    ')';

  re.tpl_host_fuzzy =

    '(?:' +
      re.src_ip4 +
    '|' +
      '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' +
    ')';

  re.tpl_host_no_ip_fuzzy =

    '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';

  re.src_host_strict =

    re.src_host + re.src_host_terminator;

  re.tpl_host_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_host_terminator;

  re.src_host_port_strict =

    re.src_host + re.src_port + re.src_host_terminator;

  re.tpl_host_port_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;

  re.tpl_host_port_no_ip_fuzzy_strict =

    re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;


  ////////////////////////////////////////////////////////////////////////////////
  // Main rules

  // Rude test fuzzy links by host, for quick deny
  re.tpl_host_fuzzy_test =

    'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';

  re.tpl_email_fuzzy =

      '(^|' + text_separators + '|\\(|' + re.src_ZCc + ')(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';

  re.tpl_link_fuzzy =
      // Fuzzy link can't be prepended with .:/\- and non punctuation.
      // but can start with > (markdown blockquote)
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';

  re.tpl_link_no_ip_fuzzy =
      // Fuzzy link can't be prepended with .:/\- and non punctuation.
      // but can start with > (markdown blockquote)
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';

  return re;
};


/***/ }),

/***/ "./node_modules/mime-db/db.json":
/*!**************************************!*\
  !*** ./node_modules/mime-db/db.json ***!
  \**************************************/
/*! exports provided: application/1d-interleaved-parityfec, application/3gpdash-qoe-report+xml, application/3gpp-ims+xml, application/a2l, application/activemessage, application/activity+json, application/alto-costmap+json, application/alto-costmapfilter+json, application/alto-directory+json, application/alto-endpointcost+json, application/alto-endpointcostparams+json, application/alto-endpointprop+json, application/alto-endpointpropparams+json, application/alto-error+json, application/alto-networkmap+json, application/alto-networkmapfilter+json, application/aml, application/andrew-inset, application/applefile, application/applixware, application/atf, application/atfx, application/atom+xml, application/atomcat+xml, application/atomdeleted+xml, application/atomicmail, application/atomsvc+xml, application/atxml, application/auth-policy+xml, application/bacnet-xdd+zip, application/batch-smtp, application/bdoc, application/beep+xml, application/calendar+json, application/calendar+xml, application/call-completion, application/cals-1840, application/cbor, application/cccex, application/ccmp+xml, application/ccxml+xml, application/cdfx+xml, application/cdmi-capability, application/cdmi-container, application/cdmi-domain, application/cdmi-object, application/cdmi-queue, application/cdni, application/cea, application/cea-2018+xml, application/cellml+xml, application/cfw, application/clue_info+xml, application/cms, application/cnrp+xml, application/coap-group+json, application/coap-payload, application/commonground, application/conference-info+xml, application/cose, application/cose-key, application/cose-key-set, application/cpl+xml, application/csrattrs, application/csta+xml, application/cstadata+xml, application/csvm+json, application/cu-seeme, application/cwt, application/cybercash, application/dart, application/dash+xml, application/dashdelta, application/davmount+xml, application/dca-rft, application/dcd, application/dec-dx, application/dialog-info+xml, application/dicom, application/dicom+json, application/dicom+xml, application/dii, application/dit, application/dns, application/dns+json, application/dns-message, application/docbook+xml, application/dskpp+xml, application/dssc+der, application/dssc+xml, application/dvcs, application/ecmascript, application/edi-consent, application/edi-x12, application/edifact, application/efi, application/emergencycalldata.comment+xml, application/emergencycalldata.control+xml, application/emergencycalldata.deviceinfo+xml, application/emergencycalldata.ecall.msd, application/emergencycalldata.providerinfo+xml, application/emergencycalldata.serviceinfo+xml, application/emergencycalldata.subscriberinfo+xml, application/emergencycalldata.veds+xml, application/emma+xml, application/emotionml+xml, application/encaprtp, application/epp+xml, application/epub+zip, application/eshop, application/exi, application/expect-ct-report+json, application/fastinfoset, application/fastsoap, application/fdt+xml, application/fhir+json, application/fhir+xml, application/fido.trusted-apps+json, application/fits, application/font-sfnt, application/font-tdpfr, application/font-woff, application/framework-attributes+xml, application/geo+json, application/geo+json-seq, application/geopackage+sqlite3, application/geoxacml+xml, application/gltf-buffer, application/gml+xml, application/gpx+xml, application/gxf, application/gzip, application/h224, application/held+xml, application/hjson, application/http, application/hyperstudio, application/ibe-key-request+xml, application/ibe-pkg-reply+xml, application/ibe-pp-data, application/iges, application/im-iscomposing+xml, application/index, application/index.cmd, application/index.obj, application/index.response, application/index.vnd, application/inkml+xml, application/iotp, application/ipfix, application/ipp, application/isup, application/its+xml, application/java-archive, application/java-serialized-object, application/java-vm, application/javascript, application/jf2feed+json, application/jose, application/jose+json, application/jrd+json, application/json, application/json-patch+json, application/json-seq, application/json5, application/jsonml+json, application/jwk+json, application/jwk-set+json, application/jwt, application/kpml-request+xml, application/kpml-response+xml, application/ld+json, application/lgr+xml, application/link-format, application/load-control+xml, application/lost+xml, application/lostsync+xml, application/lxf, application/mac-binhex40, application/mac-compactpro, application/macwriteii, application/mads+xml, application/manifest+json, application/marc, application/marcxml+xml, application/mathematica, application/mathml+xml, application/mathml-content+xml, application/mathml-presentation+xml, application/mbms-associated-procedure-description+xml, application/mbms-deregister+xml, application/mbms-envelope+xml, application/mbms-msk+xml, application/mbms-msk-response+xml, application/mbms-protection-description+xml, application/mbms-reception-report+xml, application/mbms-register+xml, application/mbms-register-response+xml, application/mbms-schedule+xml, application/mbms-user-service-description+xml, application/mbox, application/media-policy-dataset+xml, application/media_control+xml, application/mediaservercontrol+xml, application/merge-patch+json, application/metalink+xml, application/metalink4+xml, application/mets+xml, application/mf4, application/mikey, application/mmt-usd+xml, application/mods+xml, application/moss-keys, application/moss-signature, application/mosskey-data, application/mosskey-request, application/mp21, application/mp4, application/mpeg4-generic, application/mpeg4-iod, application/mpeg4-iod-xmt, application/mrb-consumer+xml, application/mrb-publish+xml, application/msc-ivr+xml, application/msc-mixer+xml, application/msword, application/mud+json, application/mxf, application/n-quads, application/n-triples, application/nasdata, application/news-checkgroups, application/news-groupinfo, application/news-transmission, application/nlsml+xml, application/node, application/nss, application/ocsp-request, application/ocsp-response, application/octet-stream, application/oda, application/odm+xml, application/odx, application/oebps-package+xml, application/ogg, application/omdoc+xml, application/onenote, application/oxps, application/p2p-overlay+xml, application/parityfec, application/passport, application/patch-ops-error+xml, application/pdf, application/pdx, application/pem-certificate-chain, application/pgp-encrypted, application/pgp-keys, application/pgp-signature, application/pics-rules, application/pidf+xml, application/pidf-diff+xml, application/pkcs10, application/pkcs12, application/pkcs7-mime, application/pkcs7-signature, application/pkcs8, application/pkcs8-encrypted, application/pkix-attr-cert, application/pkix-cert, application/pkix-crl, application/pkix-pkipath, application/pkixcmp, application/pls+xml, application/poc-settings+xml, application/postscript, application/ppsp-tracker+json, application/problem+json, application/problem+xml, application/provenance+xml, application/prs.alvestrand.titrax-sheet, application/prs.cww, application/prs.hpub+zip, application/prs.nprend, application/prs.plucker, application/prs.rdf-xml-crypt, application/prs.xsf+xml, application/pskc+xml, application/qsig, application/raml+yaml, application/raptorfec, application/rdap+json, application/rdf+xml, application/reginfo+xml, application/relax-ng-compact-syntax, application/remote-printing, application/reputon+json, application/resource-lists+xml, application/resource-lists-diff+xml, application/rfc+xml, application/riscos, application/rlmi+xml, application/rls-services+xml, application/route-apd+xml, application/route-s-tsid+xml, application/route-usd+xml, application/rpki-ghostbusters, application/rpki-manifest, application/rpki-publication, application/rpki-roa, application/rpki-updown, application/rsd+xml, application/rss+xml, application/rtf, application/rtploopback, application/rtx, application/samlassertion+xml, application/samlmetadata+xml, application/sbml+xml, application/scaip+xml, application/scim+json, application/scvp-cv-request, application/scvp-cv-response, application/scvp-vp-request, application/scvp-vp-response, application/sdp, application/secevent+jwt, application/senml+cbor, application/senml+json, application/senml+xml, application/senml-exi, application/sensml+cbor, application/sensml+json, application/sensml+xml, application/sensml-exi, application/sep+xml, application/sep-exi, application/session-info, application/set-payment, application/set-payment-initiation, application/set-registration, application/set-registration-initiation, application/sgml, application/sgml-open-catalog, application/shf+xml, application/sieve, application/simple-filter+xml, application/simple-message-summary, application/simplesymbolcontainer, application/slate, application/smil, application/smil+xml, application/smpte336m, application/soap+fastinfoset, application/soap+xml, application/sparql-query, application/sparql-results+xml, application/spirits-event+xml, application/sql, application/srgs, application/srgs+xml, application/sru+xml, application/ssdl+xml, application/ssml+xml, application/stix+json, application/tamp-apex-update, application/tamp-apex-update-confirm, application/tamp-community-update, application/tamp-community-update-confirm, application/tamp-error, application/tamp-sequence-adjust, application/tamp-sequence-adjust-confirm, application/tamp-status-query, application/tamp-status-response, application/tamp-update, application/tamp-update-confirm, application/tar, application/taxii+json, application/tei+xml, application/tetra_isi, application/thraud+xml, application/timestamp-query, application/timestamp-reply, application/timestamped-data, application/tlsrpt+gzip, application/tlsrpt+json, application/tnauthlist, application/trickle-ice-sdpfrag, application/trig, application/ttml+xml, application/tve-trigger, application/tzif, application/tzif-leap, application/ulpfec, application/urc-grpsheet+xml, application/urc-ressheet+xml, application/urc-targetdesc+xml, application/urc-uisocketdesc+xml, application/vcard+json, application/vcard+xml, application/vemmi, application/vividence.scriptfile, application/vnd.1000minds.decision-model+xml, application/vnd.3gpp-prose+xml, application/vnd.3gpp-prose-pc3ch+xml, application/vnd.3gpp-v2x-local-service-information, application/vnd.3gpp.access-transfer-events+xml, application/vnd.3gpp.bsf+xml, application/vnd.3gpp.gmop+xml, application/vnd.3gpp.mc-signalling-ear, application/vnd.3gpp.mcdata-affiliation-command+xml, application/vnd.3gpp.mcdata-info+xml, application/vnd.3gpp.mcdata-payload, application/vnd.3gpp.mcdata-service-config+xml, application/vnd.3gpp.mcdata-signalling, application/vnd.3gpp.mcdata-ue-config+xml, application/vnd.3gpp.mcdata-user-profile+xml, application/vnd.3gpp.mcptt-affiliation-command+xml, application/vnd.3gpp.mcptt-floor-request+xml, application/vnd.3gpp.mcptt-info+xml, application/vnd.3gpp.mcptt-location-info+xml, application/vnd.3gpp.mcptt-mbms-usage-info+xml, application/vnd.3gpp.mcptt-service-config+xml, application/vnd.3gpp.mcptt-signed+xml, application/vnd.3gpp.mcptt-ue-config+xml, application/vnd.3gpp.mcptt-ue-init-config+xml, application/vnd.3gpp.mcptt-user-profile+xml, application/vnd.3gpp.mcvideo-affiliation-command+xml, application/vnd.3gpp.mcvideo-affiliation-info+xml, application/vnd.3gpp.mcvideo-location-info+xml, application/vnd.3gpp.mcvideo-mbms-usage-info+xml, application/vnd.3gpp.mcvideo-service-config+xml, application/vnd.3gpp.mcvideo-transmission-request+xml, application/vnd.3gpp.mcvideo-ue-config+xml, application/vnd.3gpp.mcvideo-user-profile+xml, application/vnd.3gpp.mid-call+xml, application/vnd.3gpp.pic-bw-large, application/vnd.3gpp.pic-bw-small, application/vnd.3gpp.pic-bw-var, application/vnd.3gpp.sms, application/vnd.3gpp.sms+xml, application/vnd.3gpp.srvcc-ext+xml, application/vnd.3gpp.srvcc-info+xml, application/vnd.3gpp.state-and-event-info+xml, application/vnd.3gpp.ussd+xml, application/vnd.3gpp2.bcmcsinfo+xml, application/vnd.3gpp2.sms, application/vnd.3gpp2.tcap, application/vnd.3lightssoftware.imagescal, application/vnd.3m.post-it-notes, application/vnd.accpac.simply.aso, application/vnd.accpac.simply.imp, application/vnd.acucobol, application/vnd.acucorp, application/vnd.adobe.air-application-installer-package+zip, application/vnd.adobe.flash.movie, application/vnd.adobe.formscentral.fcdt, application/vnd.adobe.fxp, application/vnd.adobe.partial-upload, application/vnd.adobe.xdp+xml, application/vnd.adobe.xfdf, application/vnd.aether.imp, application/vnd.afpc.afplinedata, application/vnd.afpc.modca, application/vnd.ah-barcode, application/vnd.ahead.space, application/vnd.airzip.filesecure.azf, application/vnd.airzip.filesecure.azs, application/vnd.amadeus+json, application/vnd.amazon.ebook, application/vnd.amazon.mobi8-ebook, application/vnd.americandynamics.acc, application/vnd.amiga.ami, application/vnd.amundsen.maze+xml, application/vnd.android.package-archive, application/vnd.anki, application/vnd.anser-web-certificate-issue-initiation, application/vnd.anser-web-funds-transfer-initiation, application/vnd.antix.game-component, application/vnd.apache.thrift.binary, application/vnd.apache.thrift.compact, application/vnd.apache.thrift.json, application/vnd.api+json, application/vnd.apothekende.reservation+json, application/vnd.apple.installer+xml, application/vnd.apple.keynote, application/vnd.apple.mpegurl, application/vnd.apple.numbers, application/vnd.apple.pages, application/vnd.apple.pkpass, application/vnd.arastra.swi, application/vnd.aristanetworks.swi, application/vnd.artisan+json, application/vnd.artsquare, application/vnd.astraea-software.iota, application/vnd.audiograph, application/vnd.autopackage, application/vnd.avalon+json, application/vnd.avistar+xml, application/vnd.balsamiq.bmml+xml, application/vnd.balsamiq.bmpr, application/vnd.banana-accounting, application/vnd.bbf.usp.msg, application/vnd.bbf.usp.msg+json, application/vnd.bekitzur-stech+json, application/vnd.bint.med-content, application/vnd.biopax.rdf+xml, application/vnd.blink-idb-value-wrapper, application/vnd.blueice.multipass, application/vnd.bluetooth.ep.oob, application/vnd.bluetooth.le.oob, application/vnd.bmi, application/vnd.businessobjects, application/vnd.byu.uapi+json, application/vnd.cab-jscript, application/vnd.canon-cpdl, application/vnd.canon-lips, application/vnd.capasystems-pg+json, application/vnd.cendio.thinlinc.clientconf, application/vnd.century-systems.tcp_stream, application/vnd.chemdraw+xml, application/vnd.chess-pgn, application/vnd.chipnuts.karaoke-mmd, application/vnd.cinderella, application/vnd.cirpack.isdn-ext, application/vnd.citationstyles.style+xml, application/vnd.claymore, application/vnd.cloanto.rp9, application/vnd.clonk.c4group, application/vnd.cluetrust.cartomobile-config, application/vnd.cluetrust.cartomobile-config-pkg, application/vnd.coffeescript, application/vnd.collabio.xodocuments.document, application/vnd.collabio.xodocuments.document-template, application/vnd.collabio.xodocuments.presentation, application/vnd.collabio.xodocuments.presentation-template, application/vnd.collabio.xodocuments.spreadsheet, application/vnd.collabio.xodocuments.spreadsheet-template, application/vnd.collection+json, application/vnd.collection.doc+json, application/vnd.collection.next+json, application/vnd.comicbook+zip, application/vnd.comicbook-rar, application/vnd.commerce-battelle, application/vnd.commonspace, application/vnd.contact.cmsg, application/vnd.coreos.ignition+json, application/vnd.cosmocaller, application/vnd.crick.clicker, application/vnd.crick.clicker.keyboard, application/vnd.crick.clicker.palette, application/vnd.crick.clicker.template, application/vnd.crick.clicker.wordbank, application/vnd.criticaltools.wbs+xml, application/vnd.ctc-posml, application/vnd.ctct.ws+xml, application/vnd.cups-pdf, application/vnd.cups-postscript, application/vnd.cups-ppd, application/vnd.cups-raster, application/vnd.cups-raw, application/vnd.curl, application/vnd.curl.car, application/vnd.curl.pcurl, application/vnd.cyan.dean.root+xml, application/vnd.cybank, application/vnd.d2l.coursepackage1p0+zip, application/vnd.dart, application/vnd.data-vision.rdz, application/vnd.datapackage+json, application/vnd.dataresource+json, application/vnd.debian.binary-package, application/vnd.dece.data, application/vnd.dece.ttml+xml, application/vnd.dece.unspecified, application/vnd.dece.zip, application/vnd.denovo.fcselayout-link, application/vnd.desmume.movie, application/vnd.dir-bi.plate-dl-nosuffix, application/vnd.dm.delegation+xml, application/vnd.dna, application/vnd.document+json, application/vnd.dolby.mlp, application/vnd.dolby.mobile.1, application/vnd.dolby.mobile.2, application/vnd.doremir.scorecloud-binary-document, application/vnd.dpgraph, application/vnd.dreamfactory, application/vnd.drive+json, application/vnd.ds-keypoint, application/vnd.dtg.local, application/vnd.dtg.local.flash, application/vnd.dtg.local.html, application/vnd.dvb.ait, application/vnd.dvb.dvbj, application/vnd.dvb.esgcontainer, application/vnd.dvb.ipdcdftnotifaccess, application/vnd.dvb.ipdcesgaccess, application/vnd.dvb.ipdcesgaccess2, application/vnd.dvb.ipdcesgpdd, application/vnd.dvb.ipdcroaming, application/vnd.dvb.iptv.alfec-base, application/vnd.dvb.iptv.alfec-enhancement, application/vnd.dvb.notif-aggregate-root+xml, application/vnd.dvb.notif-container+xml, application/vnd.dvb.notif-generic+xml, application/vnd.dvb.notif-ia-msglist+xml, application/vnd.dvb.notif-ia-registration-request+xml, application/vnd.dvb.notif-ia-registration-response+xml, application/vnd.dvb.notif-init+xml, application/vnd.dvb.pfr, application/vnd.dvb.service, application/vnd.dxr, application/vnd.dynageo, application/vnd.dzr, application/vnd.easykaraoke.cdgdownload, application/vnd.ecdis-update, application/vnd.ecip.rlp, application/vnd.ecowin.chart, application/vnd.ecowin.filerequest, application/vnd.ecowin.fileupdate, application/vnd.ecowin.series, application/vnd.ecowin.seriesrequest, application/vnd.ecowin.seriesupdate, application/vnd.efi.img, application/vnd.efi.iso, application/vnd.emclient.accessrequest+xml, application/vnd.enliven, application/vnd.enphase.envoy, application/vnd.eprints.data+xml, application/vnd.epson.esf, application/vnd.epson.msf, application/vnd.epson.quickanime, application/vnd.epson.salt, application/vnd.epson.ssf, application/vnd.ericsson.quickcall, application/vnd.espass-espass+zip, application/vnd.eszigno3+xml, application/vnd.etsi.aoc+xml, application/vnd.etsi.asic-e+zip, application/vnd.etsi.asic-s+zip, application/vnd.etsi.cug+xml, application/vnd.etsi.iptvcommand+xml, application/vnd.etsi.iptvdiscovery+xml, application/vnd.etsi.iptvprofile+xml, application/vnd.etsi.iptvsad-bc+xml, application/vnd.etsi.iptvsad-cod+xml, application/vnd.etsi.iptvsad-npvr+xml, application/vnd.etsi.iptvservice+xml, application/vnd.etsi.iptvsync+xml, application/vnd.etsi.iptvueprofile+xml, application/vnd.etsi.mcid+xml, application/vnd.etsi.mheg5, application/vnd.etsi.overload-control-policy-dataset+xml, application/vnd.etsi.pstn+xml, application/vnd.etsi.sci+xml, application/vnd.etsi.simservs+xml, application/vnd.etsi.timestamp-token, application/vnd.etsi.tsl+xml, application/vnd.etsi.tsl.der, application/vnd.eudora.data, application/vnd.evolv.ecig.profile, application/vnd.evolv.ecig.settings, application/vnd.evolv.ecig.theme, application/vnd.exstream-empower+zip, application/vnd.exstream-package, application/vnd.ezpix-album, application/vnd.ezpix-package, application/vnd.f-secure.mobile, application/vnd.fastcopy-disk-image, application/vnd.fdf, application/vnd.fdsn.mseed, application/vnd.fdsn.seed, application/vnd.ffsns, application/vnd.filmit.zfc, application/vnd.fints, application/vnd.firemonkeys.cloudcell, application/vnd.flographit, application/vnd.fluxtime.clip, application/vnd.font-fontforge-sfd, application/vnd.framemaker, application/vnd.frogans.fnc, application/vnd.frogans.ltf, application/vnd.fsc.weblaunch, application/vnd.fujitsu.oasys, application/vnd.fujitsu.oasys2, application/vnd.fujitsu.oasys3, application/vnd.fujitsu.oasysgp, application/vnd.fujitsu.oasysprs, application/vnd.fujixerox.art-ex, application/vnd.fujixerox.art4, application/vnd.fujixerox.ddd, application/vnd.fujixerox.docuworks, application/vnd.fujixerox.docuworks.binder, application/vnd.fujixerox.docuworks.container, application/vnd.fujixerox.hbpl, application/vnd.fut-misnet, application/vnd.futoin+cbor, application/vnd.futoin+json, application/vnd.fuzzysheet, application/vnd.genomatix.tuxedo, application/vnd.geo+json, application/vnd.geocube+xml, application/vnd.geogebra.file, application/vnd.geogebra.tool, application/vnd.geometry-explorer, application/vnd.geonext, application/vnd.geoplan, application/vnd.geospace, application/vnd.gerber, application/vnd.globalplatform.card-content-mgt, application/vnd.globalplatform.card-content-mgt-response, application/vnd.gmx, application/vnd.google-apps.document, application/vnd.google-apps.presentation, application/vnd.google-apps.spreadsheet, application/vnd.google-earth.kml+xml, application/vnd.google-earth.kmz, application/vnd.gov.sk.e-form+xml, application/vnd.gov.sk.e-form+zip, application/vnd.gov.sk.xmldatacontainer+xml, application/vnd.grafeq, application/vnd.gridmp, application/vnd.groove-account, application/vnd.groove-help, application/vnd.groove-identity-message, application/vnd.groove-injector, application/vnd.groove-tool-message, application/vnd.groove-tool-template, application/vnd.groove-vcard, application/vnd.hal+json, application/vnd.hal+xml, application/vnd.handheld-entertainment+xml, application/vnd.hbci, application/vnd.hc+json, application/vnd.hcl-bireports, application/vnd.hdt, application/vnd.heroku+json, application/vnd.hhe.lesson-player, application/vnd.hp-hpgl, application/vnd.hp-hpid, application/vnd.hp-hps, application/vnd.hp-jlyt, application/vnd.hp-pcl, application/vnd.hp-pclxl, application/vnd.httphone, application/vnd.hydrostatix.sof-data, application/vnd.hyper+json, application/vnd.hyper-item+json, application/vnd.hyperdrive+json, application/vnd.hzn-3d-crossword, application/vnd.ibm.afplinedata, application/vnd.ibm.electronic-media, application/vnd.ibm.minipay, application/vnd.ibm.modcap, application/vnd.ibm.rights-management, application/vnd.ibm.secure-container, application/vnd.iccprofile, application/vnd.ieee.1905, application/vnd.igloader, application/vnd.imagemeter.folder+zip, application/vnd.imagemeter.image+zip, application/vnd.immervision-ivp, application/vnd.immervision-ivu, application/vnd.ims.imsccv1p1, application/vnd.ims.imsccv1p2, application/vnd.ims.imsccv1p3, application/vnd.ims.lis.v2.result+json, application/vnd.ims.lti.v2.toolconsumerprofile+json, application/vnd.ims.lti.v2.toolproxy+json, application/vnd.ims.lti.v2.toolproxy.id+json, application/vnd.ims.lti.v2.toolsettings+json, application/vnd.ims.lti.v2.toolsettings.simple+json, application/vnd.informedcontrol.rms+xml, application/vnd.informix-visionary, application/vnd.infotech.project, application/vnd.infotech.project+xml, application/vnd.innopath.wamp.notification, application/vnd.insors.igm, application/vnd.intercon.formnet, application/vnd.intergeo, application/vnd.intertrust.digibox, application/vnd.intertrust.nncp, application/vnd.intu.qbo, application/vnd.intu.qfx, application/vnd.iptc.g2.catalogitem+xml, application/vnd.iptc.g2.conceptitem+xml, application/vnd.iptc.g2.knowledgeitem+xml, application/vnd.iptc.g2.newsitem+xml, application/vnd.iptc.g2.newsmessage+xml, application/vnd.iptc.g2.packageitem+xml, application/vnd.iptc.g2.planningitem+xml, application/vnd.ipunplugged.rcprofile, application/vnd.irepository.package+xml, application/vnd.is-xpr, application/vnd.isac.fcs, application/vnd.jam, application/vnd.japannet-directory-service, application/vnd.japannet-jpnstore-wakeup, application/vnd.japannet-payment-wakeup, application/vnd.japannet-registration, application/vnd.japannet-registration-wakeup, application/vnd.japannet-setstore-wakeup, application/vnd.japannet-verification, application/vnd.japannet-verification-wakeup, application/vnd.jcp.javame.midlet-rms, application/vnd.jisp, application/vnd.joost.joda-archive, application/vnd.jsk.isdn-ngn, application/vnd.kahootz, application/vnd.kde.karbon, application/vnd.kde.kchart, application/vnd.kde.kformula, application/vnd.kde.kivio, application/vnd.kde.kontour, application/vnd.kde.kpresenter, application/vnd.kde.kspread, application/vnd.kde.kword, application/vnd.kenameaapp, application/vnd.kidspiration, application/vnd.kinar, application/vnd.koan, application/vnd.kodak-descriptor, application/vnd.las.las+json, application/vnd.las.las+xml, application/vnd.leap+json, application/vnd.liberty-request+xml, application/vnd.llamagraphics.life-balance.desktop, application/vnd.llamagraphics.life-balance.exchange+xml, application/vnd.lotus-1-2-3, application/vnd.lotus-approach, application/vnd.lotus-freelance, application/vnd.lotus-notes, application/vnd.lotus-organizer, application/vnd.lotus-screencam, application/vnd.lotus-wordpro, application/vnd.macports.portpkg, application/vnd.mapbox-vector-tile, application/vnd.marlin.drm.actiontoken+xml, application/vnd.marlin.drm.conftoken+xml, application/vnd.marlin.drm.license+xml, application/vnd.marlin.drm.mdcf, application/vnd.mason+json, application/vnd.maxmind.maxmind-db, application/vnd.mcd, application/vnd.medcalcdata, application/vnd.mediastation.cdkey, application/vnd.meridian-slingshot, application/vnd.mfer, application/vnd.mfmp, application/vnd.micro+json, application/vnd.micrografx.flo, application/vnd.micrografx.igx, application/vnd.microsoft.portable-executable, application/vnd.microsoft.windows.thumbnail-cache, application/vnd.miele+json, application/vnd.mif, application/vnd.minisoft-hp3000-save, application/vnd.mitsubishi.misty-guard.trustweb, application/vnd.mobius.daf, application/vnd.mobius.dis, application/vnd.mobius.mbk, application/vnd.mobius.mqy, application/vnd.mobius.msl, application/vnd.mobius.plc, application/vnd.mobius.txf, application/vnd.mophun.application, application/vnd.mophun.certificate, application/vnd.motorola.flexsuite, application/vnd.motorola.flexsuite.adsi, application/vnd.motorola.flexsuite.fis, application/vnd.motorola.flexsuite.gotap, application/vnd.motorola.flexsuite.kmr, application/vnd.motorola.flexsuite.ttc, application/vnd.motorola.flexsuite.wem, application/vnd.motorola.iprm, application/vnd.mozilla.xul+xml, application/vnd.ms-3mfdocument, application/vnd.ms-artgalry, application/vnd.ms-asf, application/vnd.ms-cab-compressed, application/vnd.ms-color.iccprofile, application/vnd.ms-excel, application/vnd.ms-excel.addin.macroenabled.12, application/vnd.ms-excel.sheet.binary.macroenabled.12, application/vnd.ms-excel.sheet.macroenabled.12, application/vnd.ms-excel.template.macroenabled.12, application/vnd.ms-fontobject, application/vnd.ms-htmlhelp, application/vnd.ms-ims, application/vnd.ms-lrm, application/vnd.ms-office.activex+xml, application/vnd.ms-officetheme, application/vnd.ms-opentype, application/vnd.ms-outlook, application/vnd.ms-package.obfuscated-opentype, application/vnd.ms-pki.seccat, application/vnd.ms-pki.stl, application/vnd.ms-playready.initiator+xml, application/vnd.ms-powerpoint, application/vnd.ms-powerpoint.addin.macroenabled.12, application/vnd.ms-powerpoint.presentation.macroenabled.12, application/vnd.ms-powerpoint.slide.macroenabled.12, application/vnd.ms-powerpoint.slideshow.macroenabled.12, application/vnd.ms-powerpoint.template.macroenabled.12, application/vnd.ms-printdevicecapabilities+xml, application/vnd.ms-printing.printticket+xml, application/vnd.ms-printschematicket+xml, application/vnd.ms-project, application/vnd.ms-tnef, application/vnd.ms-windows.devicepairing, application/vnd.ms-windows.nwprinting.oob, application/vnd.ms-windows.printerpairing, application/vnd.ms-windows.wsd.oob, application/vnd.ms-wmdrm.lic-chlg-req, application/vnd.ms-wmdrm.lic-resp, application/vnd.ms-wmdrm.meter-chlg-req, application/vnd.ms-wmdrm.meter-resp, application/vnd.ms-word.document.macroenabled.12, application/vnd.ms-word.template.macroenabled.12, application/vnd.ms-works, application/vnd.ms-wpl, application/vnd.ms-xpsdocument, application/vnd.msa-disk-image, application/vnd.mseq, application/vnd.msign, application/vnd.multiad.creator, application/vnd.multiad.creator.cif, application/vnd.music-niff, application/vnd.musician, application/vnd.muvee.style, application/vnd.mynfc, application/vnd.ncd.control, application/vnd.ncd.reference, application/vnd.nearst.inv+json, application/vnd.nervana, application/vnd.netfpx, application/vnd.neurolanguage.nlu, application/vnd.nimn, application/vnd.nintendo.nitro.rom, application/vnd.nintendo.snes.rom, application/vnd.nitf, application/vnd.noblenet-directory, application/vnd.noblenet-sealer, application/vnd.noblenet-web, application/vnd.nokia.catalogs, application/vnd.nokia.conml+wbxml, application/vnd.nokia.conml+xml, application/vnd.nokia.iptv.config+xml, application/vnd.nokia.isds-radio-presets, application/vnd.nokia.landmark+wbxml, application/vnd.nokia.landmark+xml, application/vnd.nokia.landmarkcollection+xml, application/vnd.nokia.n-gage.ac+xml, application/vnd.nokia.n-gage.data, application/vnd.nokia.n-gage.symbian.install, application/vnd.nokia.ncd, application/vnd.nokia.pcd+wbxml, application/vnd.nokia.pcd+xml, application/vnd.nokia.radio-preset, application/vnd.nokia.radio-presets, application/vnd.novadigm.edm, application/vnd.novadigm.edx, application/vnd.novadigm.ext, application/vnd.ntt-local.content-share, application/vnd.ntt-local.file-transfer, application/vnd.ntt-local.ogw_remote-access, application/vnd.ntt-local.sip-ta_remote, application/vnd.ntt-local.sip-ta_tcp_stream, application/vnd.oasis.opendocument.chart, application/vnd.oasis.opendocument.chart-template, application/vnd.oasis.opendocument.database, application/vnd.oasis.opendocument.formula, application/vnd.oasis.opendocument.formula-template, application/vnd.oasis.opendocument.graphics, application/vnd.oasis.opendocument.graphics-template, application/vnd.oasis.opendocument.image, application/vnd.oasis.opendocument.image-template, application/vnd.oasis.opendocument.presentation, application/vnd.oasis.opendocument.presentation-template, application/vnd.oasis.opendocument.spreadsheet, application/vnd.oasis.opendocument.spreadsheet-template, application/vnd.oasis.opendocument.text, application/vnd.oasis.opendocument.text-master, application/vnd.oasis.opendocument.text-template, application/vnd.oasis.opendocument.text-web, application/vnd.obn, application/vnd.ocf+cbor, application/vnd.oftn.l10n+json, application/vnd.oipf.contentaccessdownload+xml, application/vnd.oipf.contentaccessstreaming+xml, application/vnd.oipf.cspg-hexbinary, application/vnd.oipf.dae.svg+xml, application/vnd.oipf.dae.xhtml+xml, application/vnd.oipf.mippvcontrolmessage+xml, application/vnd.oipf.pae.gem, application/vnd.oipf.spdiscovery+xml, application/vnd.oipf.spdlist+xml, application/vnd.oipf.ueprofile+xml, application/vnd.oipf.userprofile+xml, application/vnd.olpc-sugar, application/vnd.oma-scws-config, application/vnd.oma-scws-http-request, application/vnd.oma-scws-http-response, application/vnd.oma.bcast.associated-procedure-parameter+xml, application/vnd.oma.bcast.drm-trigger+xml, application/vnd.oma.bcast.imd+xml, application/vnd.oma.bcast.ltkm, application/vnd.oma.bcast.notification+xml, application/vnd.oma.bcast.provisioningtrigger, application/vnd.oma.bcast.sgboot, application/vnd.oma.bcast.sgdd+xml, application/vnd.oma.bcast.sgdu, application/vnd.oma.bcast.simple-symbol-container, application/vnd.oma.bcast.smartcard-trigger+xml, application/vnd.oma.bcast.sprov+xml, application/vnd.oma.bcast.stkm, application/vnd.oma.cab-address-book+xml, application/vnd.oma.cab-feature-handler+xml, application/vnd.oma.cab-pcc+xml, application/vnd.oma.cab-subs-invite+xml, application/vnd.oma.cab-user-prefs+xml, application/vnd.oma.dcd, application/vnd.oma.dcdc, application/vnd.oma.dd2+xml, application/vnd.oma.drm.risd+xml, application/vnd.oma.group-usage-list+xml, application/vnd.oma.lwm2m+json, application/vnd.oma.lwm2m+tlv, application/vnd.oma.pal+xml, application/vnd.oma.poc.detailed-progress-report+xml, application/vnd.oma.poc.final-report+xml, application/vnd.oma.poc.groups+xml, application/vnd.oma.poc.invocation-descriptor+xml, application/vnd.oma.poc.optimized-progress-report+xml, application/vnd.oma.push, application/vnd.oma.scidm.messages+xml, application/vnd.oma.xcap-directory+xml, application/vnd.omads-email+xml, application/vnd.omads-file+xml, application/vnd.omads-folder+xml, application/vnd.omaloc-supl-init, application/vnd.onepager, application/vnd.onepagertamp, application/vnd.onepagertamx, application/vnd.onepagertat, application/vnd.onepagertatp, application/vnd.onepagertatx, application/vnd.openblox.game+xml, application/vnd.openblox.game-binary, application/vnd.openeye.oeb, application/vnd.openofficeorg.extension, application/vnd.openstreetmap.data+xml, application/vnd.openxmlformats-officedocument.custom-properties+xml, application/vnd.openxmlformats-officedocument.customxmlproperties+xml, application/vnd.openxmlformats-officedocument.drawing+xml, application/vnd.openxmlformats-officedocument.drawingml.chart+xml, application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml, application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml, application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml, application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml, application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml, application/vnd.openxmlformats-officedocument.extended-properties+xml, application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml, application/vnd.openxmlformats-officedocument.presentationml.comments+xml, application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml, application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml, application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml, application/vnd.openxmlformats-officedocument.presentationml.presprops+xml, application/vnd.openxmlformats-officedocument.presentationml.slide, application/vnd.openxmlformats-officedocument.presentationml.slide+xml, application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml, application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml, application/vnd.openxmlformats-officedocument.presentationml.slideshow, application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml, application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml, application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml, application/vnd.openxmlformats-officedocument.presentationml.tags+xml, application/vnd.openxmlformats-officedocument.presentationml.template, application/vnd.openxmlformats-officedocument.presentationml.template.main+xml, application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.template, application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml, application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml, application/vnd.openxmlformats-officedocument.theme+xml, application/vnd.openxmlformats-officedocument.themeoverride+xml, application/vnd.openxmlformats-officedocument.vmldrawing, application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.template, application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml, application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml, application/vnd.openxmlformats-package.core-properties+xml, application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml, application/vnd.openxmlformats-package.relationships+xml, application/vnd.oracle.resource+json, application/vnd.orange.indata, application/vnd.osa.netdeploy, application/vnd.osgeo.mapguide.package, application/vnd.osgi.bundle, application/vnd.osgi.dp, application/vnd.osgi.subsystem, application/vnd.otps.ct-kip+xml, application/vnd.oxli.countgraph, application/vnd.pagerduty+json, application/vnd.palm, application/vnd.panoply, application/vnd.paos.xml, application/vnd.patentdive, application/vnd.patientecommsdoc, application/vnd.pawaafile, application/vnd.pcos, application/vnd.pg.format, application/vnd.pg.osasli, application/vnd.piaccess.application-licence, application/vnd.picsel, application/vnd.pmi.widget, application/vnd.poc.group-advertisement+xml, application/vnd.pocketlearn, application/vnd.powerbuilder6, application/vnd.powerbuilder6-s, application/vnd.powerbuilder7, application/vnd.powerbuilder7-s, application/vnd.powerbuilder75, application/vnd.powerbuilder75-s, application/vnd.preminet, application/vnd.previewsystems.box, application/vnd.proteus.magazine, application/vnd.psfs, application/vnd.publishare-delta-tree, application/vnd.pvi.ptid1, application/vnd.pwg-multiplexed, application/vnd.pwg-xhtml-print+xml, application/vnd.qualcomm.brew-app-res, application/vnd.quarantainenet, application/vnd.quark.quarkxpress, application/vnd.quobject-quoxdocument, application/vnd.radisys.moml+xml, application/vnd.radisys.msml+xml, application/vnd.radisys.msml-audit+xml, application/vnd.radisys.msml-audit-conf+xml, application/vnd.radisys.msml-audit-conn+xml, application/vnd.radisys.msml-audit-dialog+xml, application/vnd.radisys.msml-audit-stream+xml, application/vnd.radisys.msml-conf+xml, application/vnd.radisys.msml-dialog+xml, application/vnd.radisys.msml-dialog-base+xml, application/vnd.radisys.msml-dialog-fax-detect+xml, application/vnd.radisys.msml-dialog-fax-sendrecv+xml, application/vnd.radisys.msml-dialog-group+xml, application/vnd.radisys.msml-dialog-speech+xml, application/vnd.radisys.msml-dialog-transform+xml, application/vnd.rainstor.data, application/vnd.rapid, application/vnd.rar, application/vnd.realvnc.bed, application/vnd.recordare.musicxml, application/vnd.recordare.musicxml+xml, application/vnd.renlearn.rlprint, application/vnd.restful+json, application/vnd.rig.cryptonote, application/vnd.rim.cod, application/vnd.rn-realmedia, application/vnd.rn-realmedia-vbr, application/vnd.route66.link66+xml, application/vnd.rs-274x, application/vnd.ruckus.download, application/vnd.s3sms, application/vnd.sailingtracker.track, application/vnd.sbm.cid, application/vnd.sbm.mid2, application/vnd.scribus, application/vnd.sealed.3df, application/vnd.sealed.csf, application/vnd.sealed.doc, application/vnd.sealed.eml, application/vnd.sealed.mht, application/vnd.sealed.net, application/vnd.sealed.ppt, application/vnd.sealed.tiff, application/vnd.sealed.xls, application/vnd.sealedmedia.softseal.html, application/vnd.sealedmedia.softseal.pdf, application/vnd.seemail, application/vnd.sema, application/vnd.semd, application/vnd.semf, application/vnd.shana.informed.formdata, application/vnd.shana.informed.formtemplate, application/vnd.shana.informed.interchange, application/vnd.shana.informed.package, application/vnd.shootproof+json, application/vnd.sigrok.session, application/vnd.simtech-mindmapper, application/vnd.siren+json, application/vnd.smaf, application/vnd.smart.notebook, application/vnd.smart.teacher, application/vnd.software602.filler.form+xml, application/vnd.software602.filler.form-xml-zip, application/vnd.solent.sdkm+xml, application/vnd.spotfire.dxp, application/vnd.spotfire.sfs, application/vnd.sqlite3, application/vnd.sss-cod, application/vnd.sss-dtf, application/vnd.sss-ntf, application/vnd.stardivision.calc, application/vnd.stardivision.draw, application/vnd.stardivision.impress, application/vnd.stardivision.math, application/vnd.stardivision.writer, application/vnd.stardivision.writer-global, application/vnd.stepmania.package, application/vnd.stepmania.stepchart, application/vnd.street-stream, application/vnd.sun.wadl+xml, application/vnd.sun.xml.calc, application/vnd.sun.xml.calc.template, application/vnd.sun.xml.draw, application/vnd.sun.xml.draw.template, application/vnd.sun.xml.impress, application/vnd.sun.xml.impress.template, application/vnd.sun.xml.math, application/vnd.sun.xml.writer, application/vnd.sun.xml.writer.global, application/vnd.sun.xml.writer.template, application/vnd.sus-calendar, application/vnd.svd, application/vnd.swiftview-ics, application/vnd.symbian.install, application/vnd.syncml+xml, application/vnd.syncml.dm+wbxml, application/vnd.syncml.dm+xml, application/vnd.syncml.dm.notification, application/vnd.syncml.dmddf+wbxml, application/vnd.syncml.dmddf+xml, application/vnd.syncml.dmtnds+wbxml, application/vnd.syncml.dmtnds+xml, application/vnd.syncml.ds.notification, application/vnd.tableschema+json, application/vnd.tao.intent-module-archive, application/vnd.tcpdump.pcap, application/vnd.think-cell.ppttc+json, application/vnd.tmd.mediaflex.api+xml, application/vnd.tml, application/vnd.tmobile-livetv, application/vnd.tri.onesource, application/vnd.trid.tpt, application/vnd.triscape.mxs, application/vnd.trueapp, application/vnd.truedoc, application/vnd.ubisoft.webplayer, application/vnd.ufdl, application/vnd.uiq.theme, application/vnd.umajin, application/vnd.unity, application/vnd.uoml+xml, application/vnd.uplanet.alert, application/vnd.uplanet.alert-wbxml, application/vnd.uplanet.bearer-choice, application/vnd.uplanet.bearer-choice-wbxml, application/vnd.uplanet.cacheop, application/vnd.uplanet.cacheop-wbxml, application/vnd.uplanet.channel, application/vnd.uplanet.channel-wbxml, application/vnd.uplanet.list, application/vnd.uplanet.list-wbxml, application/vnd.uplanet.listcmd, application/vnd.uplanet.listcmd-wbxml, application/vnd.uplanet.signal, application/vnd.uri-map, application/vnd.valve.source.material, application/vnd.vcx, application/vnd.vd-study, application/vnd.vectorworks, application/vnd.vel+json, application/vnd.verimatrix.vcas, application/vnd.veryant.thin, application/vnd.vidsoft.vidconference, application/vnd.visio, application/vnd.visionary, application/vnd.vividence.scriptfile, application/vnd.vsf, application/vnd.wap.sic, application/vnd.wap.slc, application/vnd.wap.wbxml, application/vnd.wap.wmlc, application/vnd.wap.wmlscriptc, application/vnd.webturbo, application/vnd.wfa.p2p, application/vnd.wfa.wsc, application/vnd.windows.devicepairing, application/vnd.wmc, application/vnd.wmf.bootstrap, application/vnd.wolfram.mathematica, application/vnd.wolfram.mathematica.package, application/vnd.wolfram.player, application/vnd.wordperfect, application/vnd.wqd, application/vnd.wrq-hp3000-labelled, application/vnd.wt.stf, application/vnd.wv.csp+wbxml, application/vnd.wv.csp+xml, application/vnd.wv.ssp+xml, application/vnd.xacml+json, application/vnd.xara, application/vnd.xfdl, application/vnd.xfdl.webform, application/vnd.xmi+xml, application/vnd.xmpie.cpkg, application/vnd.xmpie.dpkg, application/vnd.xmpie.plan, application/vnd.xmpie.ppkg, application/vnd.xmpie.xlim, application/vnd.yamaha.hv-dic, application/vnd.yamaha.hv-script, application/vnd.yamaha.hv-voice, application/vnd.yamaha.openscoreformat, application/vnd.yamaha.openscoreformat.osfpvg+xml, application/vnd.yamaha.remote-setup, application/vnd.yamaha.smaf-audio, application/vnd.yamaha.smaf-phrase, application/vnd.yamaha.through-ngn, application/vnd.yamaha.tunnel-udpencap, application/vnd.yaoweme, application/vnd.yellowriver-custom-menu, application/vnd.youtube.yt, application/vnd.zul, application/vnd.zzazz.deck+xml, application/voicexml+xml, application/voucher-cms+json, application/vq-rtcpxr, application/wasm, application/watcherinfo+xml, application/webpush-options+json, application/whoispp-query, application/whoispp-response, application/widget, application/winhlp, application/wita, application/wordperfect5.1, application/wsdl+xml, application/wspolicy+xml, application/x-7z-compressed, application/x-abiword, application/x-ace-compressed, application/x-amf, application/x-apple-diskimage, application/x-arj, application/x-authorware-bin, application/x-authorware-map, application/x-authorware-seg, application/x-bcpio, application/x-bdoc, application/x-bittorrent, application/x-blorb, application/x-bzip, application/x-bzip2, application/x-cbr, application/x-cdlink, application/x-cfs-compressed, application/x-chat, application/x-chess-pgn, application/x-chrome-extension, application/x-cocoa, application/x-compress, application/x-conference, application/x-cpio, application/x-csh, application/x-deb, application/x-debian-package, application/x-dgc-compressed, application/x-director, application/x-doom, application/x-dtbncx+xml, application/x-dtbook+xml, application/x-dtbresource+xml, application/x-dvi, application/x-envoy, application/x-eva, application/x-font-bdf, application/x-font-dos, application/x-font-framemaker, application/x-font-ghostscript, application/x-font-libgrx, application/x-font-linux-psf, application/x-font-pcf, application/x-font-snf, application/x-font-speedo, application/x-font-sunos-news, application/x-font-type1, application/x-font-vfont, application/x-freearc, application/x-futuresplash, application/x-gca-compressed, application/x-glulx, application/x-gnumeric, application/x-gramps-xml, application/x-gtar, application/x-gzip, application/x-hdf, application/x-httpd-php, application/x-install-instructions, application/x-iso9660-image, application/x-java-archive-diff, application/x-java-jnlp-file, application/x-javascript, application/x-latex, application/x-lua-bytecode, application/x-lzh-compressed, application/x-makeself, application/x-mie, application/x-mobipocket-ebook, application/x-mpegurl, application/x-ms-application, application/x-ms-shortcut, application/x-ms-wmd, application/x-ms-wmz, application/x-ms-xbap, application/x-msaccess, application/x-msbinder, application/x-mscardfile, application/x-msclip, application/x-msdos-program, application/x-msdownload, application/x-msmediaview, application/x-msmetafile, application/x-msmoney, application/x-mspublisher, application/x-msschedule, application/x-msterminal, application/x-mswrite, application/x-netcdf, application/x-ns-proxy-autoconfig, application/x-nzb, application/x-perl, application/x-pilot, application/x-pkcs12, application/x-pkcs7-certificates, application/x-pkcs7-certreqresp, application/x-rar-compressed, application/x-redhat-package-manager, application/x-research-info-systems, application/x-sea, application/x-sh, application/x-shar, application/x-shockwave-flash, application/x-silverlight-app, application/x-sql, application/x-stuffit, application/x-stuffitx, application/x-subrip, application/x-sv4cpio, application/x-sv4crc, application/x-t3vm-image, application/x-tads, application/x-tar, application/x-tcl, application/x-tex, application/x-tex-tfm, application/x-texinfo, application/x-tgif, application/x-ustar, application/x-virtualbox-hdd, application/x-virtualbox-ova, application/x-virtualbox-ovf, application/x-virtualbox-vbox, application/x-virtualbox-vbox-extpack, application/x-virtualbox-vdi, application/x-virtualbox-vhd, application/x-virtualbox-vmdk, application/x-wais-source, application/x-web-app-manifest+json, application/x-www-form-urlencoded, application/x-x509-ca-cert, application/x-xfig, application/x-xliff+xml, application/x-xpinstall, application/x-xz, application/x-zmachine, application/x400-bp, application/xacml+xml, application/xaml+xml, application/xcap-att+xml, application/xcap-caps+xml, application/xcap-diff+xml, application/xcap-el+xml, application/xcap-error+xml, application/xcap-ns+xml, application/xcon-conference-info+xml, application/xcon-conference-info-diff+xml, application/xenc+xml, application/xhtml+xml, application/xhtml-voice+xml, application/xliff+xml, application/xml, application/xml-dtd, application/xml-external-parsed-entity, application/xml-patch+xml, application/xmpp+xml, application/xop+xml, application/xproc+xml, application/xslt+xml, application/xspf+xml, application/xv+xml, application/yang, application/yang-data+json, application/yang-data+xml, application/yang-patch+json, application/yang-patch+xml, application/yin+xml, application/zip, application/zlib, application/zstd, audio/1d-interleaved-parityfec, audio/32kadpcm, audio/3gpp, audio/3gpp2, audio/aac, audio/ac3, audio/adpcm, audio/amr, audio/amr-wb, audio/amr-wb+, audio/aptx, audio/asc, audio/atrac-advanced-lossless, audio/atrac-x, audio/atrac3, audio/basic, audio/bv16, audio/bv32, audio/clearmode, audio/cn, audio/dat12, audio/dls, audio/dsr-es201108, audio/dsr-es202050, audio/dsr-es202211, audio/dsr-es202212, audio/dv, audio/dvi4, audio/eac3, audio/encaprtp, audio/evrc, audio/evrc-qcp, audio/evrc0, audio/evrc1, audio/evrcb, audio/evrcb0, audio/evrcb1, audio/evrcnw, audio/evrcnw0, audio/evrcnw1, audio/evrcwb, audio/evrcwb0, audio/evrcwb1, audio/evs, audio/fwdred, audio/g711-0, audio/g719, audio/g722, audio/g7221, audio/g723, audio/g726-16, audio/g726-24, audio/g726-32, audio/g726-40, audio/g728, audio/g729, audio/g7291, audio/g729d, audio/g729e, audio/gsm, audio/gsm-efr, audio/gsm-hr-08, audio/ilbc, audio/ip-mr_v2.5, audio/isac, audio/l16, audio/l20, audio/l24, audio/l8, audio/lpc, audio/melp, audio/melp1200, audio/melp2400, audio/melp600, audio/midi, audio/mobile-xmf, audio/mp3, audio/mp4, audio/mp4a-latm, audio/mpa, audio/mpa-robust, audio/mpeg, audio/mpeg4-generic, audio/musepack, audio/ogg, audio/opus, audio/parityfec, audio/pcma, audio/pcma-wb, audio/pcmu, audio/pcmu-wb, audio/prs.sid, audio/qcelp, audio/raptorfec, audio/red, audio/rtp-enc-aescm128, audio/rtp-midi, audio/rtploopback, audio/rtx, audio/s3m, audio/silk, audio/smv, audio/smv-qcp, audio/smv0, audio/sp-midi, audio/speex, audio/t140c, audio/t38, audio/telephone-event, audio/tetra_acelp, audio/tone, audio/uemclip, audio/ulpfec, audio/usac, audio/vdvi, audio/vmr-wb, audio/vnd.3gpp.iufp, audio/vnd.4sb, audio/vnd.audiokoz, audio/vnd.celp, audio/vnd.cisco.nse, audio/vnd.cmles.radio-events, audio/vnd.cns.anp1, audio/vnd.cns.inf1, audio/vnd.dece.audio, audio/vnd.digital-winds, audio/vnd.dlna.adts, audio/vnd.dolby.heaac.1, audio/vnd.dolby.heaac.2, audio/vnd.dolby.mlp, audio/vnd.dolby.mps, audio/vnd.dolby.pl2, audio/vnd.dolby.pl2x, audio/vnd.dolby.pl2z, audio/vnd.dolby.pulse.1, audio/vnd.dra, audio/vnd.dts, audio/vnd.dts.hd, audio/vnd.dts.uhd, audio/vnd.dvb.file, audio/vnd.everad.plj, audio/vnd.hns.audio, audio/vnd.lucent.voice, audio/vnd.ms-playready.media.pya, audio/vnd.nokia.mobile-xmf, audio/vnd.nortel.vbk, audio/vnd.nuera.ecelp4800, audio/vnd.nuera.ecelp7470, audio/vnd.nuera.ecelp9600, audio/vnd.octel.sbc, audio/vnd.presonus.multitrack, audio/vnd.qcelp, audio/vnd.rhetorex.32kadpcm, audio/vnd.rip, audio/vnd.rn-realaudio, audio/vnd.sealedmedia.softseal.mpeg, audio/vnd.vmx.cvsd, audio/vnd.wave, audio/vorbis, audio/vorbis-config, audio/wav, audio/wave, audio/webm, audio/x-aac, audio/x-aiff, audio/x-caf, audio/x-flac, audio/x-m4a, audio/x-matroska, audio/x-mpegurl, audio/x-ms-wax, audio/x-ms-wma, audio/x-pn-realaudio, audio/x-pn-realaudio-plugin, audio/x-realaudio, audio/x-tta, audio/x-wav, audio/xm, chemical/x-cdx, chemical/x-cif, chemical/x-cmdf, chemical/x-cml, chemical/x-csml, chemical/x-pdb, chemical/x-xyz, font/collection, font/otf, font/sfnt, font/ttf, font/woff, font/woff2, image/aces, image/apng, image/avci, image/avcs, image/bmp, image/cgm, image/dicom-rle, image/emf, image/fits, image/g3fax, image/gif, image/heic, image/heic-sequence, image/heif, image/heif-sequence, image/ief, image/jls, image/jp2, image/jpeg, image/jpm, image/jpx, image/ktx, image/naplps, image/pjpeg, image/png, image/prs.btif, image/prs.pti, image/pwg-raster, image/sgi, image/svg+xml, image/t38, image/tiff, image/tiff-fx, image/vnd.adobe.photoshop, image/vnd.airzip.accelerator.azv, image/vnd.cns.inf2, image/vnd.dece.graphic, image/vnd.djvu, image/vnd.dvb.subtitle, image/vnd.dwg, image/vnd.dxf, image/vnd.fastbidsheet, image/vnd.fpx, image/vnd.fst, image/vnd.fujixerox.edmics-mmr, image/vnd.fujixerox.edmics-rlc, image/vnd.globalgraphics.pgb, image/vnd.microsoft.icon, image/vnd.mix, image/vnd.mozilla.apng, image/vnd.ms-modi, image/vnd.ms-photo, image/vnd.net-fpx, image/vnd.radiance, image/vnd.sealed.png, image/vnd.sealedmedia.softseal.gif, image/vnd.sealedmedia.softseal.jpg, image/vnd.svf, image/vnd.tencent.tap, image/vnd.valve.source.texture, image/vnd.wap.wbmp, image/vnd.xiff, image/vnd.zbrush.pcx, image/webp, image/wmf, image/x-3ds, image/x-cmu-raster, image/x-cmx, image/x-freehand, image/x-icon, image/x-jng, image/x-mrsid-image, image/x-ms-bmp, image/x-pcx, image/x-pict, image/x-portable-anymap, image/x-portable-bitmap, image/x-portable-graymap, image/x-portable-pixmap, image/x-rgb, image/x-tga, image/x-xbitmap, image/x-xcf, image/x-xpixmap, image/x-xwindowdump, message/cpim, message/delivery-status, message/disposition-notification, message/external-body, message/feedback-report, message/global, message/global-delivery-status, message/global-disposition-notification, message/global-headers, message/http, message/imdn+xml, message/news, message/partial, message/rfc822, message/s-http, message/sip, message/sipfrag, message/tracking-status, message/vnd.si.simp, message/vnd.wfa.wsc, model/3mf, model/gltf+json, model/gltf-binary, model/iges, model/mesh, model/stl, model/vnd.collada+xml, model/vnd.dwf, model/vnd.flatland.3dml, model/vnd.gdl, model/vnd.gs-gdl, model/vnd.gs.gdl, model/vnd.gtw, model/vnd.moml+xml, model/vnd.mts, model/vnd.opengex, model/vnd.parasolid.transmit.binary, model/vnd.parasolid.transmit.text, model/vnd.rosette.annotated-data-model, model/vnd.usdz+zip, model/vnd.valve.source.compiled-map, model/vnd.vtu, model/vrml, model/x3d+binary, model/x3d+fastinfoset, model/x3d+vrml, model/x3d+xml, model/x3d-vrml, multipart/alternative, multipart/appledouble, multipart/byteranges, multipart/digest, multipart/encrypted, multipart/form-data, multipart/header-set, multipart/mixed, multipart/multilingual, multipart/parallel, multipart/related, multipart/report, multipart/signed, multipart/vnd.bint.med-plus, multipart/voice-message, multipart/x-mixed-replace, text/1d-interleaved-parityfec, text/cache-manifest, text/calendar, text/calender, text/cmd, text/coffeescript, text/css, text/csv, text/csv-schema, text/directory, text/dns, text/ecmascript, text/encaprtp, text/enriched, text/fwdred, text/grammar-ref-list, text/html, text/jade, text/javascript, text/jcr-cnd, text/jsx, text/less, text/markdown, text/mathml, text/mizar, text/n3, text/parameters, text/parityfec, text/plain, text/provenance-notation, text/prs.fallenstein.rst, text/prs.lines.tag, text/prs.prop.logic, text/raptorfec, text/red, text/rfc822-headers, text/richtext, text/rtf, text/rtp-enc-aescm128, text/rtploopback, text/rtx, text/sgml, text/shex, text/slim, text/strings, text/stylus, text/t140, text/tab-separated-values, text/troff, text/turtle, text/ulpfec, text/uri-list, text/vcard, text/vnd.a, text/vnd.abc, text/vnd.ascii-art, text/vnd.curl, text/vnd.curl.dcurl, text/vnd.curl.mcurl, text/vnd.curl.scurl, text/vnd.debian.copyright, text/vnd.dmclientscript, text/vnd.dvb.subtitle, text/vnd.esmertec.theme-descriptor, text/vnd.fly, text/vnd.fmi.flexstor, text/vnd.gml, text/vnd.graphviz, text/vnd.hgl, text/vnd.in3d.3dml, text/vnd.in3d.spot, text/vnd.iptc.newsml, text/vnd.iptc.nitf, text/vnd.latex-z, text/vnd.motorola.reflex, text/vnd.ms-mediapackage, text/vnd.net2phone.commcenter.command, text/vnd.radisys.msml-basic-layout, text/vnd.senx.warpscript, text/vnd.si.uricatalogue, text/vnd.sun.j2me.app-descriptor, text/vnd.trolltech.linguist, text/vnd.wap.si, text/vnd.wap.sl, text/vnd.wap.wml, text/vnd.wap.wmlscript, text/vtt, text/x-asm, text/x-c, text/x-component, text/x-fortran, text/x-gwt-rpc, text/x-handlebars-template, text/x-java-source, text/x-jquery-tmpl, text/x-lua, text/x-markdown, text/x-nfo, text/x-opml, text/x-org, text/x-pascal, text/x-processing, text/x-sass, text/x-scss, text/x-setext, text/x-sfv, text/x-suse-ymp, text/x-uuencode, text/x-vcalendar, text/x-vcard, text/xml, text/xml-external-parsed-entity, text/yaml, video/1d-interleaved-parityfec, video/3gpp, video/3gpp-tt, video/3gpp2, video/bmpeg, video/bt656, video/celb, video/dv, video/encaprtp, video/h261, video/h263, video/h263-1998, video/h263-2000, video/h264, video/h264-rcdo, video/h264-svc, video/h265, video/iso.segment, video/jpeg, video/jpeg2000, video/jpm, video/mj2, video/mp1s, video/mp2p, video/mp2t, video/mp4, video/mp4v-es, video/mpeg, video/mpeg4-generic, video/mpv, video/nv, video/ogg, video/parityfec, video/pointer, video/quicktime, video/raptorfec, video/raw, video/rtp-enc-aescm128, video/rtploopback, video/rtx, video/smpte291, video/smpte292m, video/ulpfec, video/vc1, video/vc2, video/vnd.cctv, video/vnd.dece.hd, video/vnd.dece.mobile, video/vnd.dece.mp4, video/vnd.dece.pd, video/vnd.dece.sd, video/vnd.dece.video, video/vnd.directv.mpeg, video/vnd.directv.mpeg-tts, video/vnd.dlna.mpeg-tts, video/vnd.dvb.file, video/vnd.fvt, video/vnd.hns.video, video/vnd.iptvforum.1dparityfec-1010, video/vnd.iptvforum.1dparityfec-2005, video/vnd.iptvforum.2dparityfec-1010, video/vnd.iptvforum.2dparityfec-2005, video/vnd.iptvforum.ttsavc, video/vnd.iptvforum.ttsmpeg2, video/vnd.motorola.video, video/vnd.motorola.videop, video/vnd.mpegurl, video/vnd.ms-playready.media.pyv, video/vnd.nokia.interleaved-multimedia, video/vnd.nokia.mp4vr, video/vnd.nokia.videovoip, video/vnd.objectvideo, video/vnd.radgamettools.bink, video/vnd.radgamettools.smacker, video/vnd.sealed.mpeg1, video/vnd.sealed.mpeg4, video/vnd.sealed.swf, video/vnd.sealedmedia.softseal.mov, video/vnd.uvvu.mp4, video/vnd.vivo, video/vp8, video/webm, video/x-f4v, video/x-fli, video/x-flv, video/x-m4v, video/x-matroska, video/x-mng, video/x-ms-asf, video/x-ms-vob, video/x-ms-wm, video/x-ms-wmv, video/x-ms-wmx, video/x-ms-wvx, video/x-msvideo, video/x-sgi-movie, video/x-smv, x-conference/x-cooltalk, x-shader/x-fragment, x-shader/x-vertex, default */
/***/ (function(module) {

module.exports = {"application/1d-interleaved-parityfec":{"source":"iana"},"application/3gpdash-qoe-report+xml":{"source":"iana","compressible":true},"application/3gpp-ims+xml":{"source":"iana","compressible":true},"application/a2l":{"source":"iana"},"application/activemessage":{"source":"iana"},"application/activity+json":{"source":"iana","compressible":true},"application/alto-costmap+json":{"source":"iana","compressible":true},"application/alto-costmapfilter+json":{"source":"iana","compressible":true},"application/alto-directory+json":{"source":"iana","compressible":true},"application/alto-endpointcost+json":{"source":"iana","compressible":true},"application/alto-endpointcostparams+json":{"source":"iana","compressible":true},"application/alto-endpointprop+json":{"source":"iana","compressible":true},"application/alto-endpointpropparams+json":{"source":"iana","compressible":true},"application/alto-error+json":{"source":"iana","compressible":true},"application/alto-networkmap+json":{"source":"iana","compressible":true},"application/alto-networkmapfilter+json":{"source":"iana","compressible":true},"application/aml":{"source":"iana"},"application/andrew-inset":{"source":"iana","extensions":["ez"]},"application/applefile":{"source":"iana"},"application/applixware":{"source":"apache","extensions":["aw"]},"application/atf":{"source":"iana"},"application/atfx":{"source":"iana"},"application/atom+xml":{"source":"iana","compressible":true,"extensions":["atom"]},"application/atomcat+xml":{"source":"iana","compressible":true,"extensions":["atomcat"]},"application/atomdeleted+xml":{"source":"iana","compressible":true},"application/atomicmail":{"source":"iana"},"application/atomsvc+xml":{"source":"iana","compressible":true,"extensions":["atomsvc"]},"application/atxml":{"source":"iana"},"application/auth-policy+xml":{"source":"iana","compressible":true},"application/bacnet-xdd+zip":{"source":"iana","compressible":false},"application/batch-smtp":{"source":"iana"},"application/bdoc":{"compressible":false,"extensions":["bdoc"]},"application/beep+xml":{"source":"iana","compressible":true},"application/calendar+json":{"source":"iana","compressible":true},"application/calendar+xml":{"source":"iana","compressible":true},"application/call-completion":{"source":"iana"},"application/cals-1840":{"source":"iana"},"application/cbor":{"source":"iana"},"application/cccex":{"source":"iana"},"application/ccmp+xml":{"source":"iana","compressible":true},"application/ccxml+xml":{"source":"iana","compressible":true,"extensions":["ccxml"]},"application/cdfx+xml":{"source":"iana","compressible":true},"application/cdmi-capability":{"source":"iana","extensions":["cdmia"]},"application/cdmi-container":{"source":"iana","extensions":["cdmic"]},"application/cdmi-domain":{"source":"iana","extensions":["cdmid"]},"application/cdmi-object":{"source":"iana","extensions":["cdmio"]},"application/cdmi-queue":{"source":"iana","extensions":["cdmiq"]},"application/cdni":{"source":"iana"},"application/cea":{"source":"iana"},"application/cea-2018+xml":{"source":"iana","compressible":true},"application/cellml+xml":{"source":"iana","compressible":true},"application/cfw":{"source":"iana"},"application/clue_info+xml":{"source":"iana","compressible":true},"application/cms":{"source":"iana"},"application/cnrp+xml":{"source":"iana","compressible":true},"application/coap-group+json":{"source":"iana","compressible":true},"application/coap-payload":{"source":"iana"},"application/commonground":{"source":"iana"},"application/conference-info+xml":{"source":"iana","compressible":true},"application/cose":{"source":"iana"},"application/cose-key":{"source":"iana"},"application/cose-key-set":{"source":"iana"},"application/cpl+xml":{"source":"iana","compressible":true},"application/csrattrs":{"source":"iana"},"application/csta+xml":{"source":"iana","compressible":true},"application/cstadata+xml":{"source":"iana","compressible":true},"application/csvm+json":{"source":"iana","compressible":true},"application/cu-seeme":{"source":"apache","extensions":["cu"]},"application/cwt":{"source":"iana"},"application/cybercash":{"source":"iana"},"application/dart":{"compressible":true},"application/dash+xml":{"source":"iana","compressible":true,"extensions":["mpd"]},"application/dashdelta":{"source":"iana"},"application/davmount+xml":{"source":"iana","compressible":true,"extensions":["davmount"]},"application/dca-rft":{"source":"iana"},"application/dcd":{"source":"iana"},"application/dec-dx":{"source":"iana"},"application/dialog-info+xml":{"source":"iana","compressible":true},"application/dicom":{"source":"iana"},"application/dicom+json":{"source":"iana","compressible":true},"application/dicom+xml":{"source":"iana","compressible":true},"application/dii":{"source":"iana"},"application/dit":{"source":"iana"},"application/dns":{"source":"iana"},"application/dns+json":{"source":"iana","compressible":true},"application/dns-message":{"source":"iana"},"application/docbook+xml":{"source":"apache","compressible":true,"extensions":["dbk"]},"application/dskpp+xml":{"source":"iana","compressible":true},"application/dssc+der":{"source":"iana","extensions":["dssc"]},"application/dssc+xml":{"source":"iana","compressible":true,"extensions":["xdssc"]},"application/dvcs":{"source":"iana"},"application/ecmascript":{"source":"iana","compressible":true,"extensions":["ecma","es"]},"application/edi-consent":{"source":"iana"},"application/edi-x12":{"source":"iana","compressible":false},"application/edifact":{"source":"iana","compressible":false},"application/efi":{"source":"iana"},"application/emergencycalldata.comment+xml":{"source":"iana","compressible":true},"application/emergencycalldata.control+xml":{"source":"iana","compressible":true},"application/emergencycalldata.deviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.ecall.msd":{"source":"iana"},"application/emergencycalldata.providerinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.serviceinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.subscriberinfo+xml":{"source":"iana","compressible":true},"application/emergencycalldata.veds+xml":{"source":"iana","compressible":true},"application/emma+xml":{"source":"iana","compressible":true,"extensions":["emma"]},"application/emotionml+xml":{"source":"iana","compressible":true},"application/encaprtp":{"source":"iana"},"application/epp+xml":{"source":"iana","compressible":true},"application/epub+zip":{"source":"iana","compressible":false,"extensions":["epub"]},"application/eshop":{"source":"iana"},"application/exi":{"source":"iana","extensions":["exi"]},"application/expect-ct-report+json":{"source":"iana","compressible":true},"application/fastinfoset":{"source":"iana"},"application/fastsoap":{"source":"iana"},"application/fdt+xml":{"source":"iana","compressible":true},"application/fhir+json":{"source":"iana","compressible":true},"application/fhir+xml":{"source":"iana","compressible":true},"application/fido.trusted-apps+json":{"compressible":true},"application/fits":{"source":"iana"},"application/font-sfnt":{"source":"iana"},"application/font-tdpfr":{"source":"iana","extensions":["pfr"]},"application/font-woff":{"source":"iana","compressible":false},"application/framework-attributes+xml":{"source":"iana","compressible":true},"application/geo+json":{"source":"iana","compressible":true,"extensions":["geojson"]},"application/geo+json-seq":{"source":"iana"},"application/geopackage+sqlite3":{"source":"iana"},"application/geoxacml+xml":{"source":"iana","compressible":true},"application/gltf-buffer":{"source":"iana"},"application/gml+xml":{"source":"iana","compressible":true,"extensions":["gml"]},"application/gpx+xml":{"source":"apache","compressible":true,"extensions":["gpx"]},"application/gxf":{"source":"apache","extensions":["gxf"]},"application/gzip":{"source":"iana","compressible":false,"extensions":["gz"]},"application/h224":{"source":"iana"},"application/held+xml":{"source":"iana","compressible":true},"application/hjson":{"extensions":["hjson"]},"application/http":{"source":"iana"},"application/hyperstudio":{"source":"iana","extensions":["stk"]},"application/ibe-key-request+xml":{"source":"iana","compressible":true},"application/ibe-pkg-reply+xml":{"source":"iana","compressible":true},"application/ibe-pp-data":{"source":"iana"},"application/iges":{"source":"iana"},"application/im-iscomposing+xml":{"source":"iana","compressible":true},"application/index":{"source":"iana"},"application/index.cmd":{"source":"iana"},"application/index.obj":{"source":"iana"},"application/index.response":{"source":"iana"},"application/index.vnd":{"source":"iana"},"application/inkml+xml":{"source":"iana","compressible":true,"extensions":["ink","inkml"]},"application/iotp":{"source":"iana"},"application/ipfix":{"source":"iana","extensions":["ipfix"]},"application/ipp":{"source":"iana"},"application/isup":{"source":"iana"},"application/its+xml":{"source":"iana","compressible":true},"application/java-archive":{"source":"apache","compressible":false,"extensions":["jar","war","ear"]},"application/java-serialized-object":{"source":"apache","compressible":false,"extensions":["ser"]},"application/java-vm":{"source":"apache","compressible":false,"extensions":["class"]},"application/javascript":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["js","mjs"]},"application/jf2feed+json":{"source":"iana","compressible":true},"application/jose":{"source":"iana"},"application/jose+json":{"source":"iana","compressible":true},"application/jrd+json":{"source":"iana","compressible":true},"application/json":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["json","map"]},"application/json-patch+json":{"source":"iana","compressible":true},"application/json-seq":{"source":"iana"},"application/json5":{"extensions":["json5"]},"application/jsonml+json":{"source":"apache","compressible":true,"extensions":["jsonml"]},"application/jwk+json":{"source":"iana","compressible":true},"application/jwk-set+json":{"source":"iana","compressible":true},"application/jwt":{"source":"iana"},"application/kpml-request+xml":{"source":"iana","compressible":true},"application/kpml-response+xml":{"source":"iana","compressible":true},"application/ld+json":{"source":"iana","compressible":true,"extensions":["jsonld"]},"application/lgr+xml":{"source":"iana","compressible":true},"application/link-format":{"source":"iana"},"application/load-control+xml":{"source":"iana","compressible":true},"application/lost+xml":{"source":"iana","compressible":true,"extensions":["lostxml"]},"application/lostsync+xml":{"source":"iana","compressible":true},"application/lxf":{"source":"iana"},"application/mac-binhex40":{"source":"iana","extensions":["hqx"]},"application/mac-compactpro":{"source":"apache","extensions":["cpt"]},"application/macwriteii":{"source":"iana"},"application/mads+xml":{"source":"iana","compressible":true,"extensions":["mads"]},"application/manifest+json":{"charset":"UTF-8","compressible":true,"extensions":["webmanifest"]},"application/marc":{"source":"iana","extensions":["mrc"]},"application/marcxml+xml":{"source":"iana","compressible":true,"extensions":["mrcx"]},"application/mathematica":{"source":"iana","extensions":["ma","nb","mb"]},"application/mathml+xml":{"source":"iana","compressible":true,"extensions":["mathml"]},"application/mathml-content+xml":{"source":"iana","compressible":true},"application/mathml-presentation+xml":{"source":"iana","compressible":true},"application/mbms-associated-procedure-description+xml":{"source":"iana","compressible":true},"application/mbms-deregister+xml":{"source":"iana","compressible":true},"application/mbms-envelope+xml":{"source":"iana","compressible":true},"application/mbms-msk+xml":{"source":"iana","compressible":true},"application/mbms-msk-response+xml":{"source":"iana","compressible":true},"application/mbms-protection-description+xml":{"source":"iana","compressible":true},"application/mbms-reception-report+xml":{"source":"iana","compressible":true},"application/mbms-register+xml":{"source":"iana","compressible":true},"application/mbms-register-response+xml":{"source":"iana","compressible":true},"application/mbms-schedule+xml":{"source":"iana","compressible":true},"application/mbms-user-service-description+xml":{"source":"iana","compressible":true},"application/mbox":{"source":"iana","extensions":["mbox"]},"application/media-policy-dataset+xml":{"source":"iana","compressible":true},"application/media_control+xml":{"source":"iana","compressible":true},"application/mediaservercontrol+xml":{"source":"iana","compressible":true,"extensions":["mscml"]},"application/merge-patch+json":{"source":"iana","compressible":true},"application/metalink+xml":{"source":"apache","compressible":true,"extensions":["metalink"]},"application/metalink4+xml":{"source":"iana","compressible":true,"extensions":["meta4"]},"application/mets+xml":{"source":"iana","compressible":true,"extensions":["mets"]},"application/mf4":{"source":"iana"},"application/mikey":{"source":"iana"},"application/mmt-usd+xml":{"source":"iana","compressible":true},"application/mods+xml":{"source":"iana","compressible":true,"extensions":["mods"]},"application/moss-keys":{"source":"iana"},"application/moss-signature":{"source":"iana"},"application/mosskey-data":{"source":"iana"},"application/mosskey-request":{"source":"iana"},"application/mp21":{"source":"iana","extensions":["m21","mp21"]},"application/mp4":{"source":"iana","extensions":["mp4s","m4p"]},"application/mpeg4-generic":{"source":"iana"},"application/mpeg4-iod":{"source":"iana"},"application/mpeg4-iod-xmt":{"source":"iana"},"application/mrb-consumer+xml":{"source":"iana","compressible":true},"application/mrb-publish+xml":{"source":"iana","compressible":true},"application/msc-ivr+xml":{"source":"iana","compressible":true},"application/msc-mixer+xml":{"source":"iana","compressible":true},"application/msword":{"source":"iana","compressible":false,"extensions":["doc","dot"]},"application/mud+json":{"source":"iana","compressible":true},"application/mxf":{"source":"iana","extensions":["mxf"]},"application/n-quads":{"source":"iana","extensions":["nq"]},"application/n-triples":{"source":"iana","extensions":["nt"]},"application/nasdata":{"source":"iana"},"application/news-checkgroups":{"source":"iana"},"application/news-groupinfo":{"source":"iana"},"application/news-transmission":{"source":"iana"},"application/nlsml+xml":{"source":"iana","compressible":true},"application/node":{"source":"iana"},"application/nss":{"source":"iana"},"application/ocsp-request":{"source":"iana"},"application/ocsp-response":{"source":"iana"},"application/octet-stream":{"source":"iana","compressible":false,"extensions":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"]},"application/oda":{"source":"iana","extensions":["oda"]},"application/odm+xml":{"source":"iana","compressible":true},"application/odx":{"source":"iana"},"application/oebps-package+xml":{"source":"iana","compressible":true,"extensions":["opf"]},"application/ogg":{"source":"iana","compressible":false,"extensions":["ogx"]},"application/omdoc+xml":{"source":"apache","compressible":true,"extensions":["omdoc"]},"application/onenote":{"source":"apache","extensions":["onetoc","onetoc2","onetmp","onepkg"]},"application/oxps":{"source":"iana","extensions":["oxps"]},"application/p2p-overlay+xml":{"source":"iana","compressible":true},"application/parityfec":{"source":"iana"},"application/passport":{"source":"iana"},"application/patch-ops-error+xml":{"source":"iana","compressible":true,"extensions":["xer"]},"application/pdf":{"source":"iana","compressible":false,"extensions":["pdf"]},"application/pdx":{"source":"iana"},"application/pem-certificate-chain":{"source":"iana"},"application/pgp-encrypted":{"source":"iana","compressible":false,"extensions":["pgp"]},"application/pgp-keys":{"source":"iana"},"application/pgp-signature":{"source":"iana","extensions":["asc","sig"]},"application/pics-rules":{"source":"apache","extensions":["prf"]},"application/pidf+xml":{"source":"iana","compressible":true},"application/pidf-diff+xml":{"source":"iana","compressible":true},"application/pkcs10":{"source":"iana","extensions":["p10"]},"application/pkcs12":{"source":"iana"},"application/pkcs7-mime":{"source":"iana","extensions":["p7m","p7c"]},"application/pkcs7-signature":{"source":"iana","extensions":["p7s"]},"application/pkcs8":{"source":"iana","extensions":["p8"]},"application/pkcs8-encrypted":{"source":"iana"},"application/pkix-attr-cert":{"source":"iana","extensions":["ac"]},"application/pkix-cert":{"source":"iana","extensions":["cer"]},"application/pkix-crl":{"source":"iana","extensions":["crl"]},"application/pkix-pkipath":{"source":"iana","extensions":["pkipath"]},"application/pkixcmp":{"source":"iana","extensions":["pki"]},"application/pls+xml":{"source":"iana","compressible":true,"extensions":["pls"]},"application/poc-settings+xml":{"source":"iana","compressible":true},"application/postscript":{"source":"iana","compressible":true,"extensions":["ai","eps","ps"]},"application/ppsp-tracker+json":{"source":"iana","compressible":true},"application/problem+json":{"source":"iana","compressible":true},"application/problem+xml":{"source":"iana","compressible":true},"application/provenance+xml":{"source":"iana","compressible":true},"application/prs.alvestrand.titrax-sheet":{"source":"iana"},"application/prs.cww":{"source":"iana","extensions":["cww"]},"application/prs.hpub+zip":{"source":"iana","compressible":false},"application/prs.nprend":{"source":"iana"},"application/prs.plucker":{"source":"iana"},"application/prs.rdf-xml-crypt":{"source":"iana"},"application/prs.xsf+xml":{"source":"iana","compressible":true},"application/pskc+xml":{"source":"iana","compressible":true,"extensions":["pskcxml"]},"application/qsig":{"source":"iana"},"application/raml+yaml":{"compressible":true,"extensions":["raml"]},"application/raptorfec":{"source":"iana"},"application/rdap+json":{"source":"iana","compressible":true},"application/rdf+xml":{"source":"iana","compressible":true,"extensions":["rdf","owl"]},"application/reginfo+xml":{"source":"iana","compressible":true,"extensions":["rif"]},"application/relax-ng-compact-syntax":{"source":"iana","extensions":["rnc"]},"application/remote-printing":{"source":"iana"},"application/reputon+json":{"source":"iana","compressible":true},"application/resource-lists+xml":{"source":"iana","compressible":true,"extensions":["rl"]},"application/resource-lists-diff+xml":{"source":"iana","compressible":true,"extensions":["rld"]},"application/rfc+xml":{"source":"iana","compressible":true},"application/riscos":{"source":"iana"},"application/rlmi+xml":{"source":"iana","compressible":true},"application/rls-services+xml":{"source":"iana","compressible":true,"extensions":["rs"]},"application/route-apd+xml":{"source":"iana","compressible":true},"application/route-s-tsid+xml":{"source":"iana","compressible":true},"application/route-usd+xml":{"source":"iana","compressible":true},"application/rpki-ghostbusters":{"source":"iana","extensions":["gbr"]},"application/rpki-manifest":{"source":"iana","extensions":["mft"]},"application/rpki-publication":{"source":"iana"},"application/rpki-roa":{"source":"iana","extensions":["roa"]},"application/rpki-updown":{"source":"iana"},"application/rsd+xml":{"source":"apache","compressible":true,"extensions":["rsd"]},"application/rss+xml":{"source":"apache","compressible":true,"extensions":["rss"]},"application/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"application/rtploopback":{"source":"iana"},"application/rtx":{"source":"iana"},"application/samlassertion+xml":{"source":"iana","compressible":true},"application/samlmetadata+xml":{"source":"iana","compressible":true},"application/sbml+xml":{"source":"iana","compressible":true,"extensions":["sbml"]},"application/scaip+xml":{"source":"iana","compressible":true},"application/scim+json":{"source":"iana","compressible":true},"application/scvp-cv-request":{"source":"iana","extensions":["scq"]},"application/scvp-cv-response":{"source":"iana","extensions":["scs"]},"application/scvp-vp-request":{"source":"iana","extensions":["spq"]},"application/scvp-vp-response":{"source":"iana","extensions":["spp"]},"application/sdp":{"source":"iana","extensions":["sdp"]},"application/secevent+jwt":{"source":"iana"},"application/senml+cbor":{"source":"iana"},"application/senml+json":{"source":"iana","compressible":true},"application/senml+xml":{"source":"iana","compressible":true},"application/senml-exi":{"source":"iana"},"application/sensml+cbor":{"source":"iana"},"application/sensml+json":{"source":"iana","compressible":true},"application/sensml+xml":{"source":"iana","compressible":true},"application/sensml-exi":{"source":"iana"},"application/sep+xml":{"source":"iana","compressible":true},"application/sep-exi":{"source":"iana"},"application/session-info":{"source":"iana"},"application/set-payment":{"source":"iana"},"application/set-payment-initiation":{"source":"iana","extensions":["setpay"]},"application/set-registration":{"source":"iana"},"application/set-registration-initiation":{"source":"iana","extensions":["setreg"]},"application/sgml":{"source":"iana"},"application/sgml-open-catalog":{"source":"iana"},"application/shf+xml":{"source":"iana","compressible":true,"extensions":["shf"]},"application/sieve":{"source":"iana"},"application/simple-filter+xml":{"source":"iana","compressible":true},"application/simple-message-summary":{"source":"iana"},"application/simplesymbolcontainer":{"source":"iana"},"application/slate":{"source":"iana"},"application/smil":{"source":"iana"},"application/smil+xml":{"source":"iana","compressible":true,"extensions":["smi","smil"]},"application/smpte336m":{"source":"iana"},"application/soap+fastinfoset":{"source":"iana"},"application/soap+xml":{"source":"iana","compressible":true},"application/sparql-query":{"source":"iana","extensions":["rq"]},"application/sparql-results+xml":{"source":"iana","compressible":true,"extensions":["srx"]},"application/spirits-event+xml":{"source":"iana","compressible":true},"application/sql":{"source":"iana"},"application/srgs":{"source":"iana","extensions":["gram"]},"application/srgs+xml":{"source":"iana","compressible":true,"extensions":["grxml"]},"application/sru+xml":{"source":"iana","compressible":true,"extensions":["sru"]},"application/ssdl+xml":{"source":"apache","compressible":true,"extensions":["ssdl"]},"application/ssml+xml":{"source":"iana","compressible":true,"extensions":["ssml"]},"application/stix+json":{"source":"iana","compressible":true},"application/tamp-apex-update":{"source":"iana"},"application/tamp-apex-update-confirm":{"source":"iana"},"application/tamp-community-update":{"source":"iana"},"application/tamp-community-update-confirm":{"source":"iana"},"application/tamp-error":{"source":"iana"},"application/tamp-sequence-adjust":{"source":"iana"},"application/tamp-sequence-adjust-confirm":{"source":"iana"},"application/tamp-status-query":{"source":"iana"},"application/tamp-status-response":{"source":"iana"},"application/tamp-update":{"source":"iana"},"application/tamp-update-confirm":{"source":"iana"},"application/tar":{"compressible":true},"application/taxii+json":{"source":"iana","compressible":true},"application/tei+xml":{"source":"iana","compressible":true,"extensions":["tei","teicorpus"]},"application/tetra_isi":{"source":"iana"},"application/thraud+xml":{"source":"iana","compressible":true,"extensions":["tfi"]},"application/timestamp-query":{"source":"iana"},"application/timestamp-reply":{"source":"iana"},"application/timestamped-data":{"source":"iana","extensions":["tsd"]},"application/tlsrpt+gzip":{"source":"iana"},"application/tlsrpt+json":{"source":"iana","compressible":true},"application/tnauthlist":{"source":"iana"},"application/trickle-ice-sdpfrag":{"source":"iana"},"application/trig":{"source":"iana"},"application/ttml+xml":{"source":"iana","compressible":true},"application/tve-trigger":{"source":"iana"},"application/tzif":{"source":"iana"},"application/tzif-leap":{"source":"iana"},"application/ulpfec":{"source":"iana"},"application/urc-grpsheet+xml":{"source":"iana","compressible":true},"application/urc-ressheet+xml":{"source":"iana","compressible":true},"application/urc-targetdesc+xml":{"source":"iana","compressible":true},"application/urc-uisocketdesc+xml":{"source":"iana","compressible":true},"application/vcard+json":{"source":"iana","compressible":true},"application/vcard+xml":{"source":"iana","compressible":true},"application/vemmi":{"source":"iana"},"application/vividence.scriptfile":{"source":"apache"},"application/vnd.1000minds.decision-model+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-prose+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-prose-pc3ch+xml":{"source":"iana","compressible":true},"application/vnd.3gpp-v2x-local-service-information":{"source":"iana"},"application/vnd.3gpp.access-transfer-events+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.bsf+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.gmop+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mc-signalling-ear":{"source":"iana"},"application/vnd.3gpp.mcdata-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-payload":{"source":"iana"},"application/vnd.3gpp.mcdata-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-signalling":{"source":"iana"},"application/vnd.3gpp.mcdata-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcdata-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-floor-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-signed+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-ue-init-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcptt-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-command+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-affiliation-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-location-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-mbms-usage-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-service-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-transmission-request+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-ue-config+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mcvideo-user-profile+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.mid-call+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.pic-bw-large":{"source":"iana","extensions":["plb"]},"application/vnd.3gpp.pic-bw-small":{"source":"iana","extensions":["psb"]},"application/vnd.3gpp.pic-bw-var":{"source":"iana","extensions":["pvb"]},"application/vnd.3gpp.sms":{"source":"iana"},"application/vnd.3gpp.sms+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-ext+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.srvcc-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.state-and-event-info+xml":{"source":"iana","compressible":true},"application/vnd.3gpp.ussd+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.bcmcsinfo+xml":{"source":"iana","compressible":true},"application/vnd.3gpp2.sms":{"source":"iana"},"application/vnd.3gpp2.tcap":{"source":"iana","extensions":["tcap"]},"application/vnd.3lightssoftware.imagescal":{"source":"iana"},"application/vnd.3m.post-it-notes":{"source":"iana","extensions":["pwn"]},"application/vnd.accpac.simply.aso":{"source":"iana","extensions":["aso"]},"application/vnd.accpac.simply.imp":{"source":"iana","extensions":["imp"]},"application/vnd.acucobol":{"source":"iana","extensions":["acu"]},"application/vnd.acucorp":{"source":"iana","extensions":["atc","acutc"]},"application/vnd.adobe.air-application-installer-package+zip":{"source":"apache","compressible":false,"extensions":["air"]},"application/vnd.adobe.flash.movie":{"source":"iana"},"application/vnd.adobe.formscentral.fcdt":{"source":"iana","extensions":["fcdt"]},"application/vnd.adobe.fxp":{"source":"iana","extensions":["fxp","fxpl"]},"application/vnd.adobe.partial-upload":{"source":"iana"},"application/vnd.adobe.xdp+xml":{"source":"iana","compressible":true,"extensions":["xdp"]},"application/vnd.adobe.xfdf":{"source":"iana","extensions":["xfdf"]},"application/vnd.aether.imp":{"source":"iana"},"application/vnd.afpc.afplinedata":{"source":"iana"},"application/vnd.afpc.modca":{"source":"iana"},"application/vnd.ah-barcode":{"source":"iana"},"application/vnd.ahead.space":{"source":"iana","extensions":["ahead"]},"application/vnd.airzip.filesecure.azf":{"source":"iana","extensions":["azf"]},"application/vnd.airzip.filesecure.azs":{"source":"iana","extensions":["azs"]},"application/vnd.amadeus+json":{"source":"iana","compressible":true},"application/vnd.amazon.ebook":{"source":"apache","extensions":["azw"]},"application/vnd.amazon.mobi8-ebook":{"source":"iana"},"application/vnd.americandynamics.acc":{"source":"iana","extensions":["acc"]},"application/vnd.amiga.ami":{"source":"iana","extensions":["ami"]},"application/vnd.amundsen.maze+xml":{"source":"iana","compressible":true},"application/vnd.android.package-archive":{"source":"apache","compressible":false,"extensions":["apk"]},"application/vnd.anki":{"source":"iana"},"application/vnd.anser-web-certificate-issue-initiation":{"source":"iana","extensions":["cii"]},"application/vnd.anser-web-funds-transfer-initiation":{"source":"apache","extensions":["fti"]},"application/vnd.antix.game-component":{"source":"iana","extensions":["atx"]},"application/vnd.apache.thrift.binary":{"source":"iana"},"application/vnd.apache.thrift.compact":{"source":"iana"},"application/vnd.apache.thrift.json":{"source":"iana"},"application/vnd.api+json":{"source":"iana","compressible":true},"application/vnd.apothekende.reservation+json":{"source":"iana","compressible":true},"application/vnd.apple.installer+xml":{"source":"iana","compressible":true,"extensions":["mpkg"]},"application/vnd.apple.keynote":{"source":"iana","extensions":["keynote"]},"application/vnd.apple.mpegurl":{"source":"iana","extensions":["m3u8"]},"application/vnd.apple.numbers":{"source":"iana","extensions":["numbers"]},"application/vnd.apple.pages":{"source":"iana","extensions":["pages"]},"application/vnd.apple.pkpass":{"compressible":false,"extensions":["pkpass"]},"application/vnd.arastra.swi":{"source":"iana"},"application/vnd.aristanetworks.swi":{"source":"iana","extensions":["swi"]},"application/vnd.artisan+json":{"source":"iana","compressible":true},"application/vnd.artsquare":{"source":"iana"},"application/vnd.astraea-software.iota":{"source":"iana","extensions":["iota"]},"application/vnd.audiograph":{"source":"iana","extensions":["aep"]},"application/vnd.autopackage":{"source":"iana"},"application/vnd.avalon+json":{"source":"iana","compressible":true},"application/vnd.avistar+xml":{"source":"iana","compressible":true},"application/vnd.balsamiq.bmml+xml":{"source":"iana","compressible":true},"application/vnd.balsamiq.bmpr":{"source":"iana"},"application/vnd.banana-accounting":{"source":"iana"},"application/vnd.bbf.usp.msg":{"source":"iana"},"application/vnd.bbf.usp.msg+json":{"source":"iana","compressible":true},"application/vnd.bekitzur-stech+json":{"source":"iana","compressible":true},"application/vnd.bint.med-content":{"source":"iana"},"application/vnd.biopax.rdf+xml":{"source":"iana","compressible":true},"application/vnd.blink-idb-value-wrapper":{"source":"iana"},"application/vnd.blueice.multipass":{"source":"iana","extensions":["mpm"]},"application/vnd.bluetooth.ep.oob":{"source":"iana"},"application/vnd.bluetooth.le.oob":{"source":"iana"},"application/vnd.bmi":{"source":"iana","extensions":["bmi"]},"application/vnd.businessobjects":{"source":"iana","extensions":["rep"]},"application/vnd.byu.uapi+json":{"source":"iana","compressible":true},"application/vnd.cab-jscript":{"source":"iana"},"application/vnd.canon-cpdl":{"source":"iana"},"application/vnd.canon-lips":{"source":"iana"},"application/vnd.capasystems-pg+json":{"source":"iana","compressible":true},"application/vnd.cendio.thinlinc.clientconf":{"source":"iana"},"application/vnd.century-systems.tcp_stream":{"source":"iana"},"application/vnd.chemdraw+xml":{"source":"iana","compressible":true,"extensions":["cdxml"]},"application/vnd.chess-pgn":{"source":"iana"},"application/vnd.chipnuts.karaoke-mmd":{"source":"iana","extensions":["mmd"]},"application/vnd.cinderella":{"source":"iana","extensions":["cdy"]},"application/vnd.cirpack.isdn-ext":{"source":"iana"},"application/vnd.citationstyles.style+xml":{"source":"iana","compressible":true,"extensions":["csl"]},"application/vnd.claymore":{"source":"iana","extensions":["cla"]},"application/vnd.cloanto.rp9":{"source":"iana","extensions":["rp9"]},"application/vnd.clonk.c4group":{"source":"iana","extensions":["c4g","c4d","c4f","c4p","c4u"]},"application/vnd.cluetrust.cartomobile-config":{"source":"iana","extensions":["c11amc"]},"application/vnd.cluetrust.cartomobile-config-pkg":{"source":"iana","extensions":["c11amz"]},"application/vnd.coffeescript":{"source":"iana"},"application/vnd.collabio.xodocuments.document":{"source":"iana"},"application/vnd.collabio.xodocuments.document-template":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation":{"source":"iana"},"application/vnd.collabio.xodocuments.presentation-template":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet":{"source":"iana"},"application/vnd.collabio.xodocuments.spreadsheet-template":{"source":"iana"},"application/vnd.collection+json":{"source":"iana","compressible":true},"application/vnd.collection.doc+json":{"source":"iana","compressible":true},"application/vnd.collection.next+json":{"source":"iana","compressible":true},"application/vnd.comicbook+zip":{"source":"iana","compressible":false},"application/vnd.comicbook-rar":{"source":"iana"},"application/vnd.commerce-battelle":{"source":"iana"},"application/vnd.commonspace":{"source":"iana","extensions":["csp"]},"application/vnd.contact.cmsg":{"source":"iana","extensions":["cdbcmsg"]},"application/vnd.coreos.ignition+json":{"source":"iana","compressible":true},"application/vnd.cosmocaller":{"source":"iana","extensions":["cmc"]},"application/vnd.crick.clicker":{"source":"iana","extensions":["clkx"]},"application/vnd.crick.clicker.keyboard":{"source":"iana","extensions":["clkk"]},"application/vnd.crick.clicker.palette":{"source":"iana","extensions":["clkp"]},"application/vnd.crick.clicker.template":{"source":"iana","extensions":["clkt"]},"application/vnd.crick.clicker.wordbank":{"source":"iana","extensions":["clkw"]},"application/vnd.criticaltools.wbs+xml":{"source":"iana","compressible":true,"extensions":["wbs"]},"application/vnd.ctc-posml":{"source":"iana","extensions":["pml"]},"application/vnd.ctct.ws+xml":{"source":"iana","compressible":true},"application/vnd.cups-pdf":{"source":"iana"},"application/vnd.cups-postscript":{"source":"iana"},"application/vnd.cups-ppd":{"source":"iana","extensions":["ppd"]},"application/vnd.cups-raster":{"source":"iana"},"application/vnd.cups-raw":{"source":"iana"},"application/vnd.curl":{"source":"iana"},"application/vnd.curl.car":{"source":"apache","extensions":["car"]},"application/vnd.curl.pcurl":{"source":"apache","extensions":["pcurl"]},"application/vnd.cyan.dean.root+xml":{"source":"iana","compressible":true},"application/vnd.cybank":{"source":"iana"},"application/vnd.d2l.coursepackage1p0+zip":{"source":"iana","compressible":false},"application/vnd.dart":{"source":"iana","compressible":true,"extensions":["dart"]},"application/vnd.data-vision.rdz":{"source":"iana","extensions":["rdz"]},"application/vnd.datapackage+json":{"source":"iana","compressible":true},"application/vnd.dataresource+json":{"source":"iana","compressible":true},"application/vnd.debian.binary-package":{"source":"iana"},"application/vnd.dece.data":{"source":"iana","extensions":["uvf","uvvf","uvd","uvvd"]},"application/vnd.dece.ttml+xml":{"source":"iana","compressible":true,"extensions":["uvt","uvvt"]},"application/vnd.dece.unspecified":{"source":"iana","extensions":["uvx","uvvx"]},"application/vnd.dece.zip":{"source":"iana","extensions":["uvz","uvvz"]},"application/vnd.denovo.fcselayout-link":{"source":"iana","extensions":["fe_launch"]},"application/vnd.desmume.movie":{"source":"iana"},"application/vnd.dir-bi.plate-dl-nosuffix":{"source":"iana"},"application/vnd.dm.delegation+xml":{"source":"iana","compressible":true},"application/vnd.dna":{"source":"iana","extensions":["dna"]},"application/vnd.document+json":{"source":"iana","compressible":true},"application/vnd.dolby.mlp":{"source":"apache","extensions":["mlp"]},"application/vnd.dolby.mobile.1":{"source":"iana"},"application/vnd.dolby.mobile.2":{"source":"iana"},"application/vnd.doremir.scorecloud-binary-document":{"source":"iana"},"application/vnd.dpgraph":{"source":"iana","extensions":["dpg"]},"application/vnd.dreamfactory":{"source":"iana","extensions":["dfac"]},"application/vnd.drive+json":{"source":"iana","compressible":true},"application/vnd.ds-keypoint":{"source":"apache","extensions":["kpxx"]},"application/vnd.dtg.local":{"source":"iana"},"application/vnd.dtg.local.flash":{"source":"iana"},"application/vnd.dtg.local.html":{"source":"iana"},"application/vnd.dvb.ait":{"source":"iana","extensions":["ait"]},"application/vnd.dvb.dvbj":{"source":"iana"},"application/vnd.dvb.esgcontainer":{"source":"iana"},"application/vnd.dvb.ipdcdftnotifaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess":{"source":"iana"},"application/vnd.dvb.ipdcesgaccess2":{"source":"iana"},"application/vnd.dvb.ipdcesgpdd":{"source":"iana"},"application/vnd.dvb.ipdcroaming":{"source":"iana"},"application/vnd.dvb.iptv.alfec-base":{"source":"iana"},"application/vnd.dvb.iptv.alfec-enhancement":{"source":"iana"},"application/vnd.dvb.notif-aggregate-root+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-container+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-generic+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-msglist+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-request+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-ia-registration-response+xml":{"source":"iana","compressible":true},"application/vnd.dvb.notif-init+xml":{"source":"iana","compressible":true},"application/vnd.dvb.pfr":{"source":"iana"},"application/vnd.dvb.service":{"source":"iana","extensions":["svc"]},"application/vnd.dxr":{"source":"iana"},"application/vnd.dynageo":{"source":"iana","extensions":["geo"]},"application/vnd.dzr":{"source":"iana"},"application/vnd.easykaraoke.cdgdownload":{"source":"iana"},"application/vnd.ecdis-update":{"source":"iana"},"application/vnd.ecip.rlp":{"source":"iana"},"application/vnd.ecowin.chart":{"source":"iana","extensions":["mag"]},"application/vnd.ecowin.filerequest":{"source":"iana"},"application/vnd.ecowin.fileupdate":{"source":"iana"},"application/vnd.ecowin.series":{"source":"iana"},"application/vnd.ecowin.seriesrequest":{"source":"iana"},"application/vnd.ecowin.seriesupdate":{"source":"iana"},"application/vnd.efi.img":{"source":"iana"},"application/vnd.efi.iso":{"source":"iana"},"application/vnd.emclient.accessrequest+xml":{"source":"iana","compressible":true},"application/vnd.enliven":{"source":"iana","extensions":["nml"]},"application/vnd.enphase.envoy":{"source":"iana"},"application/vnd.eprints.data+xml":{"source":"iana","compressible":true},"application/vnd.epson.esf":{"source":"iana","extensions":["esf"]},"application/vnd.epson.msf":{"source":"iana","extensions":["msf"]},"application/vnd.epson.quickanime":{"source":"iana","extensions":["qam"]},"application/vnd.epson.salt":{"source":"iana","extensions":["slt"]},"application/vnd.epson.ssf":{"source":"iana","extensions":["ssf"]},"application/vnd.ericsson.quickcall":{"source":"iana"},"application/vnd.espass-espass+zip":{"source":"iana","compressible":false},"application/vnd.eszigno3+xml":{"source":"iana","compressible":true,"extensions":["es3","et3"]},"application/vnd.etsi.aoc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.asic-e+zip":{"source":"iana","compressible":false},"application/vnd.etsi.asic-s+zip":{"source":"iana","compressible":false},"application/vnd.etsi.cug+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvcommand+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-bc+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-cod+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsad-npvr+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvservice+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvsync+xml":{"source":"iana","compressible":true},"application/vnd.etsi.iptvueprofile+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mcid+xml":{"source":"iana","compressible":true},"application/vnd.etsi.mheg5":{"source":"iana"},"application/vnd.etsi.overload-control-policy-dataset+xml":{"source":"iana","compressible":true},"application/vnd.etsi.pstn+xml":{"source":"iana","compressible":true},"application/vnd.etsi.sci+xml":{"source":"iana","compressible":true},"application/vnd.etsi.simservs+xml":{"source":"iana","compressible":true},"application/vnd.etsi.timestamp-token":{"source":"iana"},"application/vnd.etsi.tsl+xml":{"source":"iana","compressible":true},"application/vnd.etsi.tsl.der":{"source":"iana"},"application/vnd.eudora.data":{"source":"iana"},"application/vnd.evolv.ecig.profile":{"source":"iana"},"application/vnd.evolv.ecig.settings":{"source":"iana"},"application/vnd.evolv.ecig.theme":{"source":"iana"},"application/vnd.exstream-empower+zip":{"source":"iana","compressible":false},"application/vnd.exstream-package":{"source":"iana"},"application/vnd.ezpix-album":{"source":"iana","extensions":["ez2"]},"application/vnd.ezpix-package":{"source":"iana","extensions":["ez3"]},"application/vnd.f-secure.mobile":{"source":"iana"},"application/vnd.fastcopy-disk-image":{"source":"iana"},"application/vnd.fdf":{"source":"iana","extensions":["fdf"]},"application/vnd.fdsn.mseed":{"source":"iana","extensions":["mseed"]},"application/vnd.fdsn.seed":{"source":"iana","extensions":["seed","dataless"]},"application/vnd.ffsns":{"source":"iana"},"application/vnd.filmit.zfc":{"source":"iana"},"application/vnd.fints":{"source":"iana"},"application/vnd.firemonkeys.cloudcell":{"source":"iana"},"application/vnd.flographit":{"source":"iana","extensions":["gph"]},"application/vnd.fluxtime.clip":{"source":"iana","extensions":["ftc"]},"application/vnd.font-fontforge-sfd":{"source":"iana"},"application/vnd.framemaker":{"source":"iana","extensions":["fm","frame","maker","book"]},"application/vnd.frogans.fnc":{"source":"iana","extensions":["fnc"]},"application/vnd.frogans.ltf":{"source":"iana","extensions":["ltf"]},"application/vnd.fsc.weblaunch":{"source":"iana","extensions":["fsc"]},"application/vnd.fujitsu.oasys":{"source":"iana","extensions":["oas"]},"application/vnd.fujitsu.oasys2":{"source":"iana","extensions":["oa2"]},"application/vnd.fujitsu.oasys3":{"source":"iana","extensions":["oa3"]},"application/vnd.fujitsu.oasysgp":{"source":"iana","extensions":["fg5"]},"application/vnd.fujitsu.oasysprs":{"source":"iana","extensions":["bh2"]},"application/vnd.fujixerox.art-ex":{"source":"iana"},"application/vnd.fujixerox.art4":{"source":"iana"},"application/vnd.fujixerox.ddd":{"source":"iana","extensions":["ddd"]},"application/vnd.fujixerox.docuworks":{"source":"iana","extensions":["xdw"]},"application/vnd.fujixerox.docuworks.binder":{"source":"iana","extensions":["xbd"]},"application/vnd.fujixerox.docuworks.container":{"source":"iana"},"application/vnd.fujixerox.hbpl":{"source":"iana"},"application/vnd.fut-misnet":{"source":"iana"},"application/vnd.futoin+cbor":{"source":"iana"},"application/vnd.futoin+json":{"source":"iana","compressible":true},"application/vnd.fuzzysheet":{"source":"iana","extensions":["fzs"]},"application/vnd.genomatix.tuxedo":{"source":"iana","extensions":["txd"]},"application/vnd.geo+json":{"source":"iana","compressible":true},"application/vnd.geocube+xml":{"source":"iana","compressible":true},"application/vnd.geogebra.file":{"source":"iana","extensions":["ggb"]},"application/vnd.geogebra.tool":{"source":"iana","extensions":["ggt"]},"application/vnd.geometry-explorer":{"source":"iana","extensions":["gex","gre"]},"application/vnd.geonext":{"source":"iana","extensions":["gxt"]},"application/vnd.geoplan":{"source":"iana","extensions":["g2w"]},"application/vnd.geospace":{"source":"iana","extensions":["g3w"]},"application/vnd.gerber":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt":{"source":"iana"},"application/vnd.globalplatform.card-content-mgt-response":{"source":"iana"},"application/vnd.gmx":{"source":"iana","extensions":["gmx"]},"application/vnd.google-apps.document":{"compressible":false,"extensions":["gdoc"]},"application/vnd.google-apps.presentation":{"compressible":false,"extensions":["gslides"]},"application/vnd.google-apps.spreadsheet":{"compressible":false,"extensions":["gsheet"]},"application/vnd.google-earth.kml+xml":{"source":"iana","compressible":true,"extensions":["kml"]},"application/vnd.google-earth.kmz":{"source":"iana","compressible":false,"extensions":["kmz"]},"application/vnd.gov.sk.e-form+xml":{"source":"iana","compressible":true},"application/vnd.gov.sk.e-form+zip":{"source":"iana","compressible":false},"application/vnd.gov.sk.xmldatacontainer+xml":{"source":"iana","compressible":true},"application/vnd.grafeq":{"source":"iana","extensions":["gqf","gqs"]},"application/vnd.gridmp":{"source":"iana"},"application/vnd.groove-account":{"source":"iana","extensions":["gac"]},"application/vnd.groove-help":{"source":"iana","extensions":["ghf"]},"application/vnd.groove-identity-message":{"source":"iana","extensions":["gim"]},"application/vnd.groove-injector":{"source":"iana","extensions":["grv"]},"application/vnd.groove-tool-message":{"source":"iana","extensions":["gtm"]},"application/vnd.groove-tool-template":{"source":"iana","extensions":["tpl"]},"application/vnd.groove-vcard":{"source":"iana","extensions":["vcg"]},"application/vnd.hal+json":{"source":"iana","compressible":true},"application/vnd.hal+xml":{"source":"iana","compressible":true,"extensions":["hal"]},"application/vnd.handheld-entertainment+xml":{"source":"iana","compressible":true,"extensions":["zmm"]},"application/vnd.hbci":{"source":"iana","extensions":["hbci"]},"application/vnd.hc+json":{"source":"iana","compressible":true},"application/vnd.hcl-bireports":{"source":"iana"},"application/vnd.hdt":{"source":"iana"},"application/vnd.heroku+json":{"source":"iana","compressible":true},"application/vnd.hhe.lesson-player":{"source":"iana","extensions":["les"]},"application/vnd.hp-hpgl":{"source":"iana","extensions":["hpgl"]},"application/vnd.hp-hpid":{"source":"iana","extensions":["hpid"]},"application/vnd.hp-hps":{"source":"iana","extensions":["hps"]},"application/vnd.hp-jlyt":{"source":"iana","extensions":["jlt"]},"application/vnd.hp-pcl":{"source":"iana","extensions":["pcl"]},"application/vnd.hp-pclxl":{"source":"iana","extensions":["pclxl"]},"application/vnd.httphone":{"source":"iana"},"application/vnd.hydrostatix.sof-data":{"source":"iana","extensions":["sfd-hdstx"]},"application/vnd.hyper+json":{"source":"iana","compressible":true},"application/vnd.hyper-item+json":{"source":"iana","compressible":true},"application/vnd.hyperdrive+json":{"source":"iana","compressible":true},"application/vnd.hzn-3d-crossword":{"source":"iana"},"application/vnd.ibm.afplinedata":{"source":"iana"},"application/vnd.ibm.electronic-media":{"source":"iana"},"application/vnd.ibm.minipay":{"source":"iana","extensions":["mpy"]},"application/vnd.ibm.modcap":{"source":"iana","extensions":["afp","listafp","list3820"]},"application/vnd.ibm.rights-management":{"source":"iana","extensions":["irm"]},"application/vnd.ibm.secure-container":{"source":"iana","extensions":["sc"]},"application/vnd.iccprofile":{"source":"iana","extensions":["icc","icm"]},"application/vnd.ieee.1905":{"source":"iana"},"application/vnd.igloader":{"source":"iana","extensions":["igl"]},"application/vnd.imagemeter.folder+zip":{"source":"iana","compressible":false},"application/vnd.imagemeter.image+zip":{"source":"iana","compressible":false},"application/vnd.immervision-ivp":{"source":"iana","extensions":["ivp"]},"application/vnd.immervision-ivu":{"source":"iana","extensions":["ivu"]},"application/vnd.ims.imsccv1p1":{"source":"iana"},"application/vnd.ims.imsccv1p2":{"source":"iana"},"application/vnd.ims.imsccv1p3":{"source":"iana"},"application/vnd.ims.lis.v2.result+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolconsumerprofile+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolproxy.id+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings+json":{"source":"iana","compressible":true},"application/vnd.ims.lti.v2.toolsettings.simple+json":{"source":"iana","compressible":true},"application/vnd.informedcontrol.rms+xml":{"source":"iana","compressible":true},"application/vnd.informix-visionary":{"source":"iana"},"application/vnd.infotech.project":{"source":"iana"},"application/vnd.infotech.project+xml":{"source":"iana","compressible":true},"application/vnd.innopath.wamp.notification":{"source":"iana"},"application/vnd.insors.igm":{"source":"iana","extensions":["igm"]},"application/vnd.intercon.formnet":{"source":"iana","extensions":["xpw","xpx"]},"application/vnd.intergeo":{"source":"iana","extensions":["i2g"]},"application/vnd.intertrust.digibox":{"source":"iana"},"application/vnd.intertrust.nncp":{"source":"iana"},"application/vnd.intu.qbo":{"source":"iana","extensions":["qbo"]},"application/vnd.intu.qfx":{"source":"iana","extensions":["qfx"]},"application/vnd.iptc.g2.catalogitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.conceptitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.knowledgeitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.newsmessage+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.packageitem+xml":{"source":"iana","compressible":true},"application/vnd.iptc.g2.planningitem+xml":{"source":"iana","compressible":true},"application/vnd.ipunplugged.rcprofile":{"source":"iana","extensions":["rcprofile"]},"application/vnd.irepository.package+xml":{"source":"iana","compressible":true,"extensions":["irp"]},"application/vnd.is-xpr":{"source":"iana","extensions":["xpr"]},"application/vnd.isac.fcs":{"source":"iana","extensions":["fcs"]},"application/vnd.jam":{"source":"iana","extensions":["jam"]},"application/vnd.japannet-directory-service":{"source":"iana"},"application/vnd.japannet-jpnstore-wakeup":{"source":"iana"},"application/vnd.japannet-payment-wakeup":{"source":"iana"},"application/vnd.japannet-registration":{"source":"iana"},"application/vnd.japannet-registration-wakeup":{"source":"iana"},"application/vnd.japannet-setstore-wakeup":{"source":"iana"},"application/vnd.japannet-verification":{"source":"iana"},"application/vnd.japannet-verification-wakeup":{"source":"iana"},"application/vnd.jcp.javame.midlet-rms":{"source":"iana","extensions":["rms"]},"application/vnd.jisp":{"source":"iana","extensions":["jisp"]},"application/vnd.joost.joda-archive":{"source":"iana","extensions":["joda"]},"application/vnd.jsk.isdn-ngn":{"source":"iana"},"application/vnd.kahootz":{"source":"iana","extensions":["ktz","ktr"]},"application/vnd.kde.karbon":{"source":"iana","extensions":["karbon"]},"application/vnd.kde.kchart":{"source":"iana","extensions":["chrt"]},"application/vnd.kde.kformula":{"source":"iana","extensions":["kfo"]},"application/vnd.kde.kivio":{"source":"iana","extensions":["flw"]},"application/vnd.kde.kontour":{"source":"iana","extensions":["kon"]},"application/vnd.kde.kpresenter":{"source":"iana","extensions":["kpr","kpt"]},"application/vnd.kde.kspread":{"source":"iana","extensions":["ksp"]},"application/vnd.kde.kword":{"source":"iana","extensions":["kwd","kwt"]},"application/vnd.kenameaapp":{"source":"iana","extensions":["htke"]},"application/vnd.kidspiration":{"source":"iana","extensions":["kia"]},"application/vnd.kinar":{"source":"iana","extensions":["kne","knp"]},"application/vnd.koan":{"source":"iana","extensions":["skp","skd","skt","skm"]},"application/vnd.kodak-descriptor":{"source":"iana","extensions":["sse"]},"application/vnd.las.las+json":{"source":"iana","compressible":true},"application/vnd.las.las+xml":{"source":"iana","compressible":true,"extensions":["lasxml"]},"application/vnd.leap+json":{"source":"iana","compressible":true},"application/vnd.liberty-request+xml":{"source":"iana","compressible":true},"application/vnd.llamagraphics.life-balance.desktop":{"source":"iana","extensions":["lbd"]},"application/vnd.llamagraphics.life-balance.exchange+xml":{"source":"iana","compressible":true,"extensions":["lbe"]},"application/vnd.lotus-1-2-3":{"source":"iana","extensions":["123"]},"application/vnd.lotus-approach":{"source":"iana","extensions":["apr"]},"application/vnd.lotus-freelance":{"source":"iana","extensions":["pre"]},"application/vnd.lotus-notes":{"source":"iana","extensions":["nsf"]},"application/vnd.lotus-organizer":{"source":"iana","extensions":["org"]},"application/vnd.lotus-screencam":{"source":"iana","extensions":["scm"]},"application/vnd.lotus-wordpro":{"source":"iana","extensions":["lwp"]},"application/vnd.macports.portpkg":{"source":"iana","extensions":["portpkg"]},"application/vnd.mapbox-vector-tile":{"source":"iana"},"application/vnd.marlin.drm.actiontoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.conftoken+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.license+xml":{"source":"iana","compressible":true},"application/vnd.marlin.drm.mdcf":{"source":"iana"},"application/vnd.mason+json":{"source":"iana","compressible":true},"application/vnd.maxmind.maxmind-db":{"source":"iana"},"application/vnd.mcd":{"source":"iana","extensions":["mcd"]},"application/vnd.medcalcdata":{"source":"iana","extensions":["mc1"]},"application/vnd.mediastation.cdkey":{"source":"iana","extensions":["cdkey"]},"application/vnd.meridian-slingshot":{"source":"iana"},"application/vnd.mfer":{"source":"iana","extensions":["mwf"]},"application/vnd.mfmp":{"source":"iana","extensions":["mfm"]},"application/vnd.micro+json":{"source":"iana","compressible":true},"application/vnd.micrografx.flo":{"source":"iana","extensions":["flo"]},"application/vnd.micrografx.igx":{"source":"iana","extensions":["igx"]},"application/vnd.microsoft.portable-executable":{"source":"iana"},"application/vnd.microsoft.windows.thumbnail-cache":{"source":"iana"},"application/vnd.miele+json":{"source":"iana","compressible":true},"application/vnd.mif":{"source":"iana","extensions":["mif"]},"application/vnd.minisoft-hp3000-save":{"source":"iana"},"application/vnd.mitsubishi.misty-guard.trustweb":{"source":"iana"},"application/vnd.mobius.daf":{"source":"iana","extensions":["daf"]},"application/vnd.mobius.dis":{"source":"iana","extensions":["dis"]},"application/vnd.mobius.mbk":{"source":"iana","extensions":["mbk"]},"application/vnd.mobius.mqy":{"source":"iana","extensions":["mqy"]},"application/vnd.mobius.msl":{"source":"iana","extensions":["msl"]},"application/vnd.mobius.plc":{"source":"iana","extensions":["plc"]},"application/vnd.mobius.txf":{"source":"iana","extensions":["txf"]},"application/vnd.mophun.application":{"source":"iana","extensions":["mpn"]},"application/vnd.mophun.certificate":{"source":"iana","extensions":["mpc"]},"application/vnd.motorola.flexsuite":{"source":"iana"},"application/vnd.motorola.flexsuite.adsi":{"source":"iana"},"application/vnd.motorola.flexsuite.fis":{"source":"iana"},"application/vnd.motorola.flexsuite.gotap":{"source":"iana"},"application/vnd.motorola.flexsuite.kmr":{"source":"iana"},"application/vnd.motorola.flexsuite.ttc":{"source":"iana"},"application/vnd.motorola.flexsuite.wem":{"source":"iana"},"application/vnd.motorola.iprm":{"source":"iana"},"application/vnd.mozilla.xul+xml":{"source":"iana","compressible":true,"extensions":["xul"]},"application/vnd.ms-3mfdocument":{"source":"iana"},"application/vnd.ms-artgalry":{"source":"iana","extensions":["cil"]},"application/vnd.ms-asf":{"source":"iana"},"application/vnd.ms-cab-compressed":{"source":"iana","extensions":["cab"]},"application/vnd.ms-color.iccprofile":{"source":"apache"},"application/vnd.ms-excel":{"source":"iana","compressible":false,"extensions":["xls","xlm","xla","xlc","xlt","xlw"]},"application/vnd.ms-excel.addin.macroenabled.12":{"source":"iana","extensions":["xlam"]},"application/vnd.ms-excel.sheet.binary.macroenabled.12":{"source":"iana","extensions":["xlsb"]},"application/vnd.ms-excel.sheet.macroenabled.12":{"source":"iana","extensions":["xlsm"]},"application/vnd.ms-excel.template.macroenabled.12":{"source":"iana","extensions":["xltm"]},"application/vnd.ms-fontobject":{"source":"iana","compressible":true,"extensions":["eot"]},"application/vnd.ms-htmlhelp":{"source":"iana","extensions":["chm"]},"application/vnd.ms-ims":{"source":"iana","extensions":["ims"]},"application/vnd.ms-lrm":{"source":"iana","extensions":["lrm"]},"application/vnd.ms-office.activex+xml":{"source":"iana","compressible":true},"application/vnd.ms-officetheme":{"source":"iana","extensions":["thmx"]},"application/vnd.ms-opentype":{"source":"apache","compressible":true},"application/vnd.ms-outlook":{"compressible":false,"extensions":["msg"]},"application/vnd.ms-package.obfuscated-opentype":{"source":"apache"},"application/vnd.ms-pki.seccat":{"source":"apache","extensions":["cat"]},"application/vnd.ms-pki.stl":{"source":"apache","extensions":["stl"]},"application/vnd.ms-playready.initiator+xml":{"source":"iana","compressible":true},"application/vnd.ms-powerpoint":{"source":"iana","compressible":false,"extensions":["ppt","pps","pot"]},"application/vnd.ms-powerpoint.addin.macroenabled.12":{"source":"iana","extensions":["ppam"]},"application/vnd.ms-powerpoint.presentation.macroenabled.12":{"source":"iana","extensions":["pptm"]},"application/vnd.ms-powerpoint.slide.macroenabled.12":{"source":"iana","extensions":["sldm"]},"application/vnd.ms-powerpoint.slideshow.macroenabled.12":{"source":"iana","extensions":["ppsm"]},"application/vnd.ms-powerpoint.template.macroenabled.12":{"source":"iana","extensions":["potm"]},"application/vnd.ms-printdevicecapabilities+xml":{"source":"iana","compressible":true},"application/vnd.ms-printing.printticket+xml":{"source":"apache","compressible":true},"application/vnd.ms-printschematicket+xml":{"source":"iana","compressible":true},"application/vnd.ms-project":{"source":"iana","extensions":["mpp","mpt"]},"application/vnd.ms-tnef":{"source":"iana"},"application/vnd.ms-windows.devicepairing":{"source":"iana"},"application/vnd.ms-windows.nwprinting.oob":{"source":"iana"},"application/vnd.ms-windows.printerpairing":{"source":"iana"},"application/vnd.ms-windows.wsd.oob":{"source":"iana"},"application/vnd.ms-wmdrm.lic-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.lic-resp":{"source":"iana"},"application/vnd.ms-wmdrm.meter-chlg-req":{"source":"iana"},"application/vnd.ms-wmdrm.meter-resp":{"source":"iana"},"application/vnd.ms-word.document.macroenabled.12":{"source":"iana","extensions":["docm"]},"application/vnd.ms-word.template.macroenabled.12":{"source":"iana","extensions":["dotm"]},"application/vnd.ms-works":{"source":"iana","extensions":["wps","wks","wcm","wdb"]},"application/vnd.ms-wpl":{"source":"iana","extensions":["wpl"]},"application/vnd.ms-xpsdocument":{"source":"iana","compressible":false,"extensions":["xps"]},"application/vnd.msa-disk-image":{"source":"iana"},"application/vnd.mseq":{"source":"iana","extensions":["mseq"]},"application/vnd.msign":{"source":"iana"},"application/vnd.multiad.creator":{"source":"iana"},"application/vnd.multiad.creator.cif":{"source":"iana"},"application/vnd.music-niff":{"source":"iana"},"application/vnd.musician":{"source":"iana","extensions":["mus"]},"application/vnd.muvee.style":{"source":"iana","extensions":["msty"]},"application/vnd.mynfc":{"source":"iana","extensions":["taglet"]},"application/vnd.ncd.control":{"source":"iana"},"application/vnd.ncd.reference":{"source":"iana"},"application/vnd.nearst.inv+json":{"source":"iana","compressible":true},"application/vnd.nervana":{"source":"iana"},"application/vnd.netfpx":{"source":"iana"},"application/vnd.neurolanguage.nlu":{"source":"iana","extensions":["nlu"]},"application/vnd.nimn":{"source":"iana"},"application/vnd.nintendo.nitro.rom":{"source":"iana"},"application/vnd.nintendo.snes.rom":{"source":"iana"},"application/vnd.nitf":{"source":"iana","extensions":["ntf","nitf"]},"application/vnd.noblenet-directory":{"source":"iana","extensions":["nnd"]},"application/vnd.noblenet-sealer":{"source":"iana","extensions":["nns"]},"application/vnd.noblenet-web":{"source":"iana","extensions":["nnw"]},"application/vnd.nokia.catalogs":{"source":"iana"},"application/vnd.nokia.conml+wbxml":{"source":"iana"},"application/vnd.nokia.conml+xml":{"source":"iana","compressible":true},"application/vnd.nokia.iptv.config+xml":{"source":"iana","compressible":true},"application/vnd.nokia.isds-radio-presets":{"source":"iana"},"application/vnd.nokia.landmark+wbxml":{"source":"iana"},"application/vnd.nokia.landmark+xml":{"source":"iana","compressible":true},"application/vnd.nokia.landmarkcollection+xml":{"source":"iana","compressible":true},"application/vnd.nokia.n-gage.ac+xml":{"source":"iana","compressible":true},"application/vnd.nokia.n-gage.data":{"source":"iana","extensions":["ngdat"]},"application/vnd.nokia.n-gage.symbian.install":{"source":"iana","extensions":["n-gage"]},"application/vnd.nokia.ncd":{"source":"iana"},"application/vnd.nokia.pcd+wbxml":{"source":"iana"},"application/vnd.nokia.pcd+xml":{"source":"iana","compressible":true},"application/vnd.nokia.radio-preset":{"source":"iana","extensions":["rpst"]},"application/vnd.nokia.radio-presets":{"source":"iana","extensions":["rpss"]},"application/vnd.novadigm.edm":{"source":"iana","extensions":["edm"]},"application/vnd.novadigm.edx":{"source":"iana","extensions":["edx"]},"application/vnd.novadigm.ext":{"source":"iana","extensions":["ext"]},"application/vnd.ntt-local.content-share":{"source":"iana"},"application/vnd.ntt-local.file-transfer":{"source":"iana"},"application/vnd.ntt-local.ogw_remote-access":{"source":"iana"},"application/vnd.ntt-local.sip-ta_remote":{"source":"iana"},"application/vnd.ntt-local.sip-ta_tcp_stream":{"source":"iana"},"application/vnd.oasis.opendocument.chart":{"source":"iana","extensions":["odc"]},"application/vnd.oasis.opendocument.chart-template":{"source":"iana","extensions":["otc"]},"application/vnd.oasis.opendocument.database":{"source":"iana","extensions":["odb"]},"application/vnd.oasis.opendocument.formula":{"source":"iana","extensions":["odf"]},"application/vnd.oasis.opendocument.formula-template":{"source":"iana","extensions":["odft"]},"application/vnd.oasis.opendocument.graphics":{"source":"iana","compressible":false,"extensions":["odg"]},"application/vnd.oasis.opendocument.graphics-template":{"source":"iana","extensions":["otg"]},"application/vnd.oasis.opendocument.image":{"source":"iana","extensions":["odi"]},"application/vnd.oasis.opendocument.image-template":{"source":"iana","extensions":["oti"]},"application/vnd.oasis.opendocument.presentation":{"source":"iana","compressible":false,"extensions":["odp"]},"application/vnd.oasis.opendocument.presentation-template":{"source":"iana","extensions":["otp"]},"application/vnd.oasis.opendocument.spreadsheet":{"source":"iana","compressible":false,"extensions":["ods"]},"application/vnd.oasis.opendocument.spreadsheet-template":{"source":"iana","extensions":["ots"]},"application/vnd.oasis.opendocument.text":{"source":"iana","compressible":false,"extensions":["odt"]},"application/vnd.oasis.opendocument.text-master":{"source":"iana","extensions":["odm"]},"application/vnd.oasis.opendocument.text-template":{"source":"iana","extensions":["ott"]},"application/vnd.oasis.opendocument.text-web":{"source":"iana","extensions":["oth"]},"application/vnd.obn":{"source":"iana"},"application/vnd.ocf+cbor":{"source":"iana"},"application/vnd.oftn.l10n+json":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessdownload+xml":{"source":"iana","compressible":true},"application/vnd.oipf.contentaccessstreaming+xml":{"source":"iana","compressible":true},"application/vnd.oipf.cspg-hexbinary":{"source":"iana"},"application/vnd.oipf.dae.svg+xml":{"source":"iana","compressible":true},"application/vnd.oipf.dae.xhtml+xml":{"source":"iana","compressible":true},"application/vnd.oipf.mippvcontrolmessage+xml":{"source":"iana","compressible":true},"application/vnd.oipf.pae.gem":{"source":"iana"},"application/vnd.oipf.spdiscovery+xml":{"source":"iana","compressible":true},"application/vnd.oipf.spdlist+xml":{"source":"iana","compressible":true},"application/vnd.oipf.ueprofile+xml":{"source":"iana","compressible":true},"application/vnd.oipf.userprofile+xml":{"source":"iana","compressible":true},"application/vnd.olpc-sugar":{"source":"iana","extensions":["xo"]},"application/vnd.oma-scws-config":{"source":"iana"},"application/vnd.oma-scws-http-request":{"source":"iana"},"application/vnd.oma-scws-http-response":{"source":"iana"},"application/vnd.oma.bcast.associated-procedure-parameter+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.drm-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.imd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.ltkm":{"source":"iana"},"application/vnd.oma.bcast.notification+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.provisioningtrigger":{"source":"iana"},"application/vnd.oma.bcast.sgboot":{"source":"iana"},"application/vnd.oma.bcast.sgdd+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sgdu":{"source":"iana"},"application/vnd.oma.bcast.simple-symbol-container":{"source":"iana"},"application/vnd.oma.bcast.smartcard-trigger+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.sprov+xml":{"source":"iana","compressible":true},"application/vnd.oma.bcast.stkm":{"source":"iana"},"application/vnd.oma.cab-address-book+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-feature-handler+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-pcc+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-subs-invite+xml":{"source":"iana","compressible":true},"application/vnd.oma.cab-user-prefs+xml":{"source":"iana","compressible":true},"application/vnd.oma.dcd":{"source":"iana"},"application/vnd.oma.dcdc":{"source":"iana"},"application/vnd.oma.dd2+xml":{"source":"iana","compressible":true,"extensions":["dd2"]},"application/vnd.oma.drm.risd+xml":{"source":"iana","compressible":true},"application/vnd.oma.group-usage-list+xml":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+json":{"source":"iana","compressible":true},"application/vnd.oma.lwm2m+tlv":{"source":"iana"},"application/vnd.oma.pal+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.detailed-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.final-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.groups+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.invocation-descriptor+xml":{"source":"iana","compressible":true},"application/vnd.oma.poc.optimized-progress-report+xml":{"source":"iana","compressible":true},"application/vnd.oma.push":{"source":"iana"},"application/vnd.oma.scidm.messages+xml":{"source":"iana","compressible":true},"application/vnd.oma.xcap-directory+xml":{"source":"iana","compressible":true},"application/vnd.omads-email+xml":{"source":"iana","compressible":true},"application/vnd.omads-file+xml":{"source":"iana","compressible":true},"application/vnd.omads-folder+xml":{"source":"iana","compressible":true},"application/vnd.omaloc-supl-init":{"source":"iana"},"application/vnd.onepager":{"source":"iana"},"application/vnd.onepagertamp":{"source":"iana"},"application/vnd.onepagertamx":{"source":"iana"},"application/vnd.onepagertat":{"source":"iana"},"application/vnd.onepagertatp":{"source":"iana"},"application/vnd.onepagertatx":{"source":"iana"},"application/vnd.openblox.game+xml":{"source":"iana","compressible":true},"application/vnd.openblox.game-binary":{"source":"iana"},"application/vnd.openeye.oeb":{"source":"iana"},"application/vnd.openofficeorg.extension":{"source":"apache","extensions":["oxt"]},"application/vnd.openstreetmap.data+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.custom-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.customxmlproperties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawing+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chart+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.extended-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presentation":{"source":"iana","compressible":false,"extensions":["pptx"]},"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slide":{"source":"iana","extensions":["sldx"]},"application/vnd.openxmlformats-officedocument.presentationml.slide+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideshow":{"source":"iana","extensions":["ppsx"]},"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.tags+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.template":{"source":"iana","extensions":["potx"]},"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":{"source":"iana","compressible":false,"extensions":["xlsx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.template":{"source":"iana","extensions":["xltx"]},"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.theme+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.themeoverride+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.vmldrawing":{"source":"iana"},"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document":{"source":"iana","compressible":false,"extensions":["docx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.template":{"source":"iana","extensions":["dotx"]},"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.core-properties+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml":{"source":"iana","compressible":true},"application/vnd.openxmlformats-package.relationships+xml":{"source":"iana","compressible":true},"application/vnd.oracle.resource+json":{"source":"iana","compressible":true},"application/vnd.orange.indata":{"source":"iana"},"application/vnd.osa.netdeploy":{"source":"iana"},"application/vnd.osgeo.mapguide.package":{"source":"iana","extensions":["mgp"]},"application/vnd.osgi.bundle":{"source":"iana"},"application/vnd.osgi.dp":{"source":"iana","extensions":["dp"]},"application/vnd.osgi.subsystem":{"source":"iana","extensions":["esa"]},"application/vnd.otps.ct-kip+xml":{"source":"iana","compressible":true},"application/vnd.oxli.countgraph":{"source":"iana"},"application/vnd.pagerduty+json":{"source":"iana","compressible":true},"application/vnd.palm":{"source":"iana","extensions":["pdb","pqa","oprc"]},"application/vnd.panoply":{"source":"iana"},"application/vnd.paos.xml":{"source":"iana"},"application/vnd.patentdive":{"source":"iana"},"application/vnd.patientecommsdoc":{"source":"iana"},"application/vnd.pawaafile":{"source":"iana","extensions":["paw"]},"application/vnd.pcos":{"source":"iana"},"application/vnd.pg.format":{"source":"iana","extensions":["str"]},"application/vnd.pg.osasli":{"source":"iana","extensions":["ei6"]},"application/vnd.piaccess.application-licence":{"source":"iana"},"application/vnd.picsel":{"source":"iana","extensions":["efif"]},"application/vnd.pmi.widget":{"source":"iana","extensions":["wg"]},"application/vnd.poc.group-advertisement+xml":{"source":"iana","compressible":true},"application/vnd.pocketlearn":{"source":"iana","extensions":["plf"]},"application/vnd.powerbuilder6":{"source":"iana","extensions":["pbd"]},"application/vnd.powerbuilder6-s":{"source":"iana"},"application/vnd.powerbuilder7":{"source":"iana"},"application/vnd.powerbuilder7-s":{"source":"iana"},"application/vnd.powerbuilder75":{"source":"iana"},"application/vnd.powerbuilder75-s":{"source":"iana"},"application/vnd.preminet":{"source":"iana"},"application/vnd.previewsystems.box":{"source":"iana","extensions":["box"]},"application/vnd.proteus.magazine":{"source":"iana","extensions":["mgz"]},"application/vnd.psfs":{"source":"iana"},"application/vnd.publishare-delta-tree":{"source":"iana","extensions":["qps"]},"application/vnd.pvi.ptid1":{"source":"iana","extensions":["ptid"]},"application/vnd.pwg-multiplexed":{"source":"iana"},"application/vnd.pwg-xhtml-print+xml":{"source":"iana","compressible":true},"application/vnd.qualcomm.brew-app-res":{"source":"iana"},"application/vnd.quarantainenet":{"source":"iana"},"application/vnd.quark.quarkxpress":{"source":"iana","extensions":["qxd","qxt","qwd","qwt","qxl","qxb"]},"application/vnd.quobject-quoxdocument":{"source":"iana"},"application/vnd.radisys.moml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-conn+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-audit-stream+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-conf+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-base+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-detect+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-fax-sendrecv+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-group+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-speech+xml":{"source":"iana","compressible":true},"application/vnd.radisys.msml-dialog-transform+xml":{"source":"iana","compressible":true},"application/vnd.rainstor.data":{"source":"iana"},"application/vnd.rapid":{"source":"iana"},"application/vnd.rar":{"source":"iana"},"application/vnd.realvnc.bed":{"source":"iana","extensions":["bed"]},"application/vnd.recordare.musicxml":{"source":"iana","extensions":["mxl"]},"application/vnd.recordare.musicxml+xml":{"source":"iana","compressible":true,"extensions":["musicxml"]},"application/vnd.renlearn.rlprint":{"source":"iana"},"application/vnd.restful+json":{"source":"iana","compressible":true},"application/vnd.rig.cryptonote":{"source":"iana","extensions":["cryptonote"]},"application/vnd.rim.cod":{"source":"apache","extensions":["cod"]},"application/vnd.rn-realmedia":{"source":"apache","extensions":["rm"]},"application/vnd.rn-realmedia-vbr":{"source":"apache","extensions":["rmvb"]},"application/vnd.route66.link66+xml":{"source":"iana","compressible":true,"extensions":["link66"]},"application/vnd.rs-274x":{"source":"iana"},"application/vnd.ruckus.download":{"source":"iana"},"application/vnd.s3sms":{"source":"iana"},"application/vnd.sailingtracker.track":{"source":"iana","extensions":["st"]},"application/vnd.sbm.cid":{"source":"iana"},"application/vnd.sbm.mid2":{"source":"iana"},"application/vnd.scribus":{"source":"iana"},"application/vnd.sealed.3df":{"source":"iana"},"application/vnd.sealed.csf":{"source":"iana"},"application/vnd.sealed.doc":{"source":"iana"},"application/vnd.sealed.eml":{"source":"iana"},"application/vnd.sealed.mht":{"source":"iana"},"application/vnd.sealed.net":{"source":"iana"},"application/vnd.sealed.ppt":{"source":"iana"},"application/vnd.sealed.tiff":{"source":"iana"},"application/vnd.sealed.xls":{"source":"iana"},"application/vnd.sealedmedia.softseal.html":{"source":"iana"},"application/vnd.sealedmedia.softseal.pdf":{"source":"iana"},"application/vnd.seemail":{"source":"iana","extensions":["see"]},"application/vnd.sema":{"source":"iana","extensions":["sema"]},"application/vnd.semd":{"source":"iana","extensions":["semd"]},"application/vnd.semf":{"source":"iana","extensions":["semf"]},"application/vnd.shana.informed.formdata":{"source":"iana","extensions":["ifm"]},"application/vnd.shana.informed.formtemplate":{"source":"iana","extensions":["itp"]},"application/vnd.shana.informed.interchange":{"source":"iana","extensions":["iif"]},"application/vnd.shana.informed.package":{"source":"iana","extensions":["ipk"]},"application/vnd.shootproof+json":{"source":"iana","compressible":true},"application/vnd.sigrok.session":{"source":"iana"},"application/vnd.simtech-mindmapper":{"source":"iana","extensions":["twd","twds"]},"application/vnd.siren+json":{"source":"iana","compressible":true},"application/vnd.smaf":{"source":"iana","extensions":["mmf"]},"application/vnd.smart.notebook":{"source":"iana"},"application/vnd.smart.teacher":{"source":"iana","extensions":["teacher"]},"application/vnd.software602.filler.form+xml":{"source":"iana","compressible":true},"application/vnd.software602.filler.form-xml-zip":{"source":"iana"},"application/vnd.solent.sdkm+xml":{"source":"iana","compressible":true,"extensions":["sdkm","sdkd"]},"application/vnd.spotfire.dxp":{"source":"iana","extensions":["dxp"]},"application/vnd.spotfire.sfs":{"source":"iana","extensions":["sfs"]},"application/vnd.sqlite3":{"source":"iana"},"application/vnd.sss-cod":{"source":"iana"},"application/vnd.sss-dtf":{"source":"iana"},"application/vnd.sss-ntf":{"source":"iana"},"application/vnd.stardivision.calc":{"source":"apache","extensions":["sdc"]},"application/vnd.stardivision.draw":{"source":"apache","extensions":["sda"]},"application/vnd.stardivision.impress":{"source":"apache","extensions":["sdd"]},"application/vnd.stardivision.math":{"source":"apache","extensions":["smf"]},"application/vnd.stardivision.writer":{"source":"apache","extensions":["sdw","vor"]},"application/vnd.stardivision.writer-global":{"source":"apache","extensions":["sgl"]},"application/vnd.stepmania.package":{"source":"iana","extensions":["smzip"]},"application/vnd.stepmania.stepchart":{"source":"iana","extensions":["sm"]},"application/vnd.street-stream":{"source":"iana"},"application/vnd.sun.wadl+xml":{"source":"iana","compressible":true,"extensions":["wadl"]},"application/vnd.sun.xml.calc":{"source":"apache","extensions":["sxc"]},"application/vnd.sun.xml.calc.template":{"source":"apache","extensions":["stc"]},"application/vnd.sun.xml.draw":{"source":"apache","extensions":["sxd"]},"application/vnd.sun.xml.draw.template":{"source":"apache","extensions":["std"]},"application/vnd.sun.xml.impress":{"source":"apache","extensions":["sxi"]},"application/vnd.sun.xml.impress.template":{"source":"apache","extensions":["sti"]},"application/vnd.sun.xml.math":{"source":"apache","extensions":["sxm"]},"application/vnd.sun.xml.writer":{"source":"apache","extensions":["sxw"]},"application/vnd.sun.xml.writer.global":{"source":"apache","extensions":["sxg"]},"application/vnd.sun.xml.writer.template":{"source":"apache","extensions":["stw"]},"application/vnd.sus-calendar":{"source":"iana","extensions":["sus","susp"]},"application/vnd.svd":{"source":"iana","extensions":["svd"]},"application/vnd.swiftview-ics":{"source":"iana"},"application/vnd.symbian.install":{"source":"apache","extensions":["sis","sisx"]},"application/vnd.syncml+xml":{"source":"iana","compressible":true,"extensions":["xsm"]},"application/vnd.syncml.dm+wbxml":{"source":"iana","extensions":["bdm"]},"application/vnd.syncml.dm+xml":{"source":"iana","compressible":true,"extensions":["xdm"]},"application/vnd.syncml.dm.notification":{"source":"iana"},"application/vnd.syncml.dmddf+wbxml":{"source":"iana"},"application/vnd.syncml.dmddf+xml":{"source":"iana","compressible":true},"application/vnd.syncml.dmtnds+wbxml":{"source":"iana"},"application/vnd.syncml.dmtnds+xml":{"source":"iana","compressible":true},"application/vnd.syncml.ds.notification":{"source":"iana"},"application/vnd.tableschema+json":{"source":"iana","compressible":true},"application/vnd.tao.intent-module-archive":{"source":"iana","extensions":["tao"]},"application/vnd.tcpdump.pcap":{"source":"iana","extensions":["pcap","cap","dmp"]},"application/vnd.think-cell.ppttc+json":{"source":"iana","compressible":true},"application/vnd.tmd.mediaflex.api+xml":{"source":"iana","compressible":true},"application/vnd.tml":{"source":"iana"},"application/vnd.tmobile-livetv":{"source":"iana","extensions":["tmo"]},"application/vnd.tri.onesource":{"source":"iana"},"application/vnd.trid.tpt":{"source":"iana","extensions":["tpt"]},"application/vnd.triscape.mxs":{"source":"iana","extensions":["mxs"]},"application/vnd.trueapp":{"source":"iana","extensions":["tra"]},"application/vnd.truedoc":{"source":"iana"},"application/vnd.ubisoft.webplayer":{"source":"iana"},"application/vnd.ufdl":{"source":"iana","extensions":["ufd","ufdl"]},"application/vnd.uiq.theme":{"source":"iana","extensions":["utz"]},"application/vnd.umajin":{"source":"iana","extensions":["umj"]},"application/vnd.unity":{"source":"iana","extensions":["unityweb"]},"application/vnd.uoml+xml":{"source":"iana","compressible":true,"extensions":["uoml"]},"application/vnd.uplanet.alert":{"source":"iana"},"application/vnd.uplanet.alert-wbxml":{"source":"iana"},"application/vnd.uplanet.bearer-choice":{"source":"iana"},"application/vnd.uplanet.bearer-choice-wbxml":{"source":"iana"},"application/vnd.uplanet.cacheop":{"source":"iana"},"application/vnd.uplanet.cacheop-wbxml":{"source":"iana"},"application/vnd.uplanet.channel":{"source":"iana"},"application/vnd.uplanet.channel-wbxml":{"source":"iana"},"application/vnd.uplanet.list":{"source":"iana"},"application/vnd.uplanet.list-wbxml":{"source":"iana"},"application/vnd.uplanet.listcmd":{"source":"iana"},"application/vnd.uplanet.listcmd-wbxml":{"source":"iana"},"application/vnd.uplanet.signal":{"source":"iana"},"application/vnd.uri-map":{"source":"iana"},"application/vnd.valve.source.material":{"source":"iana"},"application/vnd.vcx":{"source":"iana","extensions":["vcx"]},"application/vnd.vd-study":{"source":"iana"},"application/vnd.vectorworks":{"source":"iana"},"application/vnd.vel+json":{"source":"iana","compressible":true},"application/vnd.verimatrix.vcas":{"source":"iana"},"application/vnd.veryant.thin":{"source":"iana"},"application/vnd.vidsoft.vidconference":{"source":"iana"},"application/vnd.visio":{"source":"iana","extensions":["vsd","vst","vss","vsw"]},"application/vnd.visionary":{"source":"iana","extensions":["vis"]},"application/vnd.vividence.scriptfile":{"source":"iana"},"application/vnd.vsf":{"source":"iana","extensions":["vsf"]},"application/vnd.wap.sic":{"source":"iana"},"application/vnd.wap.slc":{"source":"iana"},"application/vnd.wap.wbxml":{"source":"iana","extensions":["wbxml"]},"application/vnd.wap.wmlc":{"source":"iana","extensions":["wmlc"]},"application/vnd.wap.wmlscriptc":{"source":"iana","extensions":["wmlsc"]},"application/vnd.webturbo":{"source":"iana","extensions":["wtb"]},"application/vnd.wfa.p2p":{"source":"iana"},"application/vnd.wfa.wsc":{"source":"iana"},"application/vnd.windows.devicepairing":{"source":"iana"},"application/vnd.wmc":{"source":"iana"},"application/vnd.wmf.bootstrap":{"source":"iana"},"application/vnd.wolfram.mathematica":{"source":"iana"},"application/vnd.wolfram.mathematica.package":{"source":"iana"},"application/vnd.wolfram.player":{"source":"iana","extensions":["nbp"]},"application/vnd.wordperfect":{"source":"iana","extensions":["wpd"]},"application/vnd.wqd":{"source":"iana","extensions":["wqd"]},"application/vnd.wrq-hp3000-labelled":{"source":"iana"},"application/vnd.wt.stf":{"source":"iana","extensions":["stf"]},"application/vnd.wv.csp+wbxml":{"source":"iana"},"application/vnd.wv.csp+xml":{"source":"iana","compressible":true},"application/vnd.wv.ssp+xml":{"source":"iana","compressible":true},"application/vnd.xacml+json":{"source":"iana","compressible":true},"application/vnd.xara":{"source":"iana","extensions":["xar"]},"application/vnd.xfdl":{"source":"iana","extensions":["xfdl"]},"application/vnd.xfdl.webform":{"source":"iana"},"application/vnd.xmi+xml":{"source":"iana","compressible":true},"application/vnd.xmpie.cpkg":{"source":"iana"},"application/vnd.xmpie.dpkg":{"source":"iana"},"application/vnd.xmpie.plan":{"source":"iana"},"application/vnd.xmpie.ppkg":{"source":"iana"},"application/vnd.xmpie.xlim":{"source":"iana"},"application/vnd.yamaha.hv-dic":{"source":"iana","extensions":["hvd"]},"application/vnd.yamaha.hv-script":{"source":"iana","extensions":["hvs"]},"application/vnd.yamaha.hv-voice":{"source":"iana","extensions":["hvp"]},"application/vnd.yamaha.openscoreformat":{"source":"iana","extensions":["osf"]},"application/vnd.yamaha.openscoreformat.osfpvg+xml":{"source":"iana","compressible":true,"extensions":["osfpvg"]},"application/vnd.yamaha.remote-setup":{"source":"iana"},"application/vnd.yamaha.smaf-audio":{"source":"iana","extensions":["saf"]},"application/vnd.yamaha.smaf-phrase":{"source":"iana","extensions":["spf"]},"application/vnd.yamaha.through-ngn":{"source":"iana"},"application/vnd.yamaha.tunnel-udpencap":{"source":"iana"},"application/vnd.yaoweme":{"source":"iana"},"application/vnd.yellowriver-custom-menu":{"source":"iana","extensions":["cmp"]},"application/vnd.youtube.yt":{"source":"iana"},"application/vnd.zul":{"source":"iana","extensions":["zir","zirz"]},"application/vnd.zzazz.deck+xml":{"source":"iana","compressible":true,"extensions":["zaz"]},"application/voicexml+xml":{"source":"iana","compressible":true,"extensions":["vxml"]},"application/voucher-cms+json":{"source":"iana","compressible":true},"application/vq-rtcpxr":{"source":"iana"},"application/wasm":{"compressible":true,"extensions":["wasm"]},"application/watcherinfo+xml":{"source":"iana","compressible":true},"application/webpush-options+json":{"source":"iana","compressible":true},"application/whoispp-query":{"source":"iana"},"application/whoispp-response":{"source":"iana"},"application/widget":{"source":"iana","extensions":["wgt"]},"application/winhlp":{"source":"apache","extensions":["hlp"]},"application/wita":{"source":"iana"},"application/wordperfect5.1":{"source":"iana"},"application/wsdl+xml":{"source":"iana","compressible":true,"extensions":["wsdl"]},"application/wspolicy+xml":{"source":"iana","compressible":true,"extensions":["wspolicy"]},"application/x-7z-compressed":{"source":"apache","compressible":false,"extensions":["7z"]},"application/x-abiword":{"source":"apache","extensions":["abw"]},"application/x-ace-compressed":{"source":"apache","extensions":["ace"]},"application/x-amf":{"source":"apache"},"application/x-apple-diskimage":{"source":"apache","extensions":["dmg"]},"application/x-arj":{"compressible":false,"extensions":["arj"]},"application/x-authorware-bin":{"source":"apache","extensions":["aab","x32","u32","vox"]},"application/x-authorware-map":{"source":"apache","extensions":["aam"]},"application/x-authorware-seg":{"source":"apache","extensions":["aas"]},"application/x-bcpio":{"source":"apache","extensions":["bcpio"]},"application/x-bdoc":{"compressible":false,"extensions":["bdoc"]},"application/x-bittorrent":{"source":"apache","extensions":["torrent"]},"application/x-blorb":{"source":"apache","extensions":["blb","blorb"]},"application/x-bzip":{"source":"apache","compressible":false,"extensions":["bz"]},"application/x-bzip2":{"source":"apache","compressible":false,"extensions":["bz2","boz"]},"application/x-cbr":{"source":"apache","extensions":["cbr","cba","cbt","cbz","cb7"]},"application/x-cdlink":{"source":"apache","extensions":["vcd"]},"application/x-cfs-compressed":{"source":"apache","extensions":["cfs"]},"application/x-chat":{"source":"apache","extensions":["chat"]},"application/x-chess-pgn":{"source":"apache","extensions":["pgn"]},"application/x-chrome-extension":{"extensions":["crx"]},"application/x-cocoa":{"source":"nginx","extensions":["cco"]},"application/x-compress":{"source":"apache"},"application/x-conference":{"source":"apache","extensions":["nsc"]},"application/x-cpio":{"source":"apache","extensions":["cpio"]},"application/x-csh":{"source":"apache","extensions":["csh"]},"application/x-deb":{"compressible":false},"application/x-debian-package":{"source":"apache","extensions":["deb","udeb"]},"application/x-dgc-compressed":{"source":"apache","extensions":["dgc"]},"application/x-director":{"source":"apache","extensions":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"]},"application/x-doom":{"source":"apache","extensions":["wad"]},"application/x-dtbncx+xml":{"source":"apache","compressible":true,"extensions":["ncx"]},"application/x-dtbook+xml":{"source":"apache","compressible":true,"extensions":["dtb"]},"application/x-dtbresource+xml":{"source":"apache","compressible":true,"extensions":["res"]},"application/x-dvi":{"source":"apache","compressible":false,"extensions":["dvi"]},"application/x-envoy":{"source":"apache","extensions":["evy"]},"application/x-eva":{"source":"apache","extensions":["eva"]},"application/x-font-bdf":{"source":"apache","extensions":["bdf"]},"application/x-font-dos":{"source":"apache"},"application/x-font-framemaker":{"source":"apache"},"application/x-font-ghostscript":{"source":"apache","extensions":["gsf"]},"application/x-font-libgrx":{"source":"apache"},"application/x-font-linux-psf":{"source":"apache","extensions":["psf"]},"application/x-font-pcf":{"source":"apache","extensions":["pcf"]},"application/x-font-snf":{"source":"apache","extensions":["snf"]},"application/x-font-speedo":{"source":"apache"},"application/x-font-sunos-news":{"source":"apache"},"application/x-font-type1":{"source":"apache","extensions":["pfa","pfb","pfm","afm"]},"application/x-font-vfont":{"source":"apache"},"application/x-freearc":{"source":"apache","extensions":["arc"]},"application/x-futuresplash":{"source":"apache","extensions":["spl"]},"application/x-gca-compressed":{"source":"apache","extensions":["gca"]},"application/x-glulx":{"source":"apache","extensions":["ulx"]},"application/x-gnumeric":{"source":"apache","extensions":["gnumeric"]},"application/x-gramps-xml":{"source":"apache","extensions":["gramps"]},"application/x-gtar":{"source":"apache","extensions":["gtar"]},"application/x-gzip":{"source":"apache"},"application/x-hdf":{"source":"apache","extensions":["hdf"]},"application/x-httpd-php":{"compressible":true,"extensions":["php"]},"application/x-install-instructions":{"source":"apache","extensions":["install"]},"application/x-iso9660-image":{"source":"apache","extensions":["iso"]},"application/x-java-archive-diff":{"source":"nginx","extensions":["jardiff"]},"application/x-java-jnlp-file":{"source":"apache","compressible":false,"extensions":["jnlp"]},"application/x-javascript":{"compressible":true},"application/x-latex":{"source":"apache","compressible":false,"extensions":["latex"]},"application/x-lua-bytecode":{"extensions":["luac"]},"application/x-lzh-compressed":{"source":"apache","extensions":["lzh","lha"]},"application/x-makeself":{"source":"nginx","extensions":["run"]},"application/x-mie":{"source":"apache","extensions":["mie"]},"application/x-mobipocket-ebook":{"source":"apache","extensions":["prc","mobi"]},"application/x-mpegurl":{"compressible":false},"application/x-ms-application":{"source":"apache","extensions":["application"]},"application/x-ms-shortcut":{"source":"apache","extensions":["lnk"]},"application/x-ms-wmd":{"source":"apache","extensions":["wmd"]},"application/x-ms-wmz":{"source":"apache","extensions":["wmz"]},"application/x-ms-xbap":{"source":"apache","extensions":["xbap"]},"application/x-msaccess":{"source":"apache","extensions":["mdb"]},"application/x-msbinder":{"source":"apache","extensions":["obd"]},"application/x-mscardfile":{"source":"apache","extensions":["crd"]},"application/x-msclip":{"source":"apache","extensions":["clp"]},"application/x-msdos-program":{"extensions":["exe"]},"application/x-msdownload":{"source":"apache","extensions":["exe","dll","com","bat","msi"]},"application/x-msmediaview":{"source":"apache","extensions":["mvb","m13","m14"]},"application/x-msmetafile":{"source":"apache","extensions":["wmf","wmz","emf","emz"]},"application/x-msmoney":{"source":"apache","extensions":["mny"]},"application/x-mspublisher":{"source":"apache","extensions":["pub"]},"application/x-msschedule":{"source":"apache","extensions":["scd"]},"application/x-msterminal":{"source":"apache","extensions":["trm"]},"application/x-mswrite":{"source":"apache","extensions":["wri"]},"application/x-netcdf":{"source":"apache","extensions":["nc","cdf"]},"application/x-ns-proxy-autoconfig":{"compressible":true,"extensions":["pac"]},"application/x-nzb":{"source":"apache","extensions":["nzb"]},"application/x-perl":{"source":"nginx","extensions":["pl","pm"]},"application/x-pilot":{"source":"nginx","extensions":["prc","pdb"]},"application/x-pkcs12":{"source":"apache","compressible":false,"extensions":["p12","pfx"]},"application/x-pkcs7-certificates":{"source":"apache","extensions":["p7b","spc"]},"application/x-pkcs7-certreqresp":{"source":"apache","extensions":["p7r"]},"application/x-rar-compressed":{"source":"apache","compressible":false,"extensions":["rar"]},"application/x-redhat-package-manager":{"source":"nginx","extensions":["rpm"]},"application/x-research-info-systems":{"source":"apache","extensions":["ris"]},"application/x-sea":{"source":"nginx","extensions":["sea"]},"application/x-sh":{"source":"apache","compressible":true,"extensions":["sh"]},"application/x-shar":{"source":"apache","extensions":["shar"]},"application/x-shockwave-flash":{"source":"apache","compressible":false,"extensions":["swf"]},"application/x-silverlight-app":{"source":"apache","extensions":["xap"]},"application/x-sql":{"source":"apache","extensions":["sql"]},"application/x-stuffit":{"source":"apache","compressible":false,"extensions":["sit"]},"application/x-stuffitx":{"source":"apache","extensions":["sitx"]},"application/x-subrip":{"source":"apache","extensions":["srt"]},"application/x-sv4cpio":{"source":"apache","extensions":["sv4cpio"]},"application/x-sv4crc":{"source":"apache","extensions":["sv4crc"]},"application/x-t3vm-image":{"source":"apache","extensions":["t3"]},"application/x-tads":{"source":"apache","extensions":["gam"]},"application/x-tar":{"source":"apache","compressible":true,"extensions":["tar"]},"application/x-tcl":{"source":"apache","extensions":["tcl","tk"]},"application/x-tex":{"source":"apache","extensions":["tex"]},"application/x-tex-tfm":{"source":"apache","extensions":["tfm"]},"application/x-texinfo":{"source":"apache","extensions":["texinfo","texi"]},"application/x-tgif":{"source":"apache","extensions":["obj"]},"application/x-ustar":{"source":"apache","extensions":["ustar"]},"application/x-virtualbox-hdd":{"compressible":true,"extensions":["hdd"]},"application/x-virtualbox-ova":{"compressible":true,"extensions":["ova"]},"application/x-virtualbox-ovf":{"compressible":true,"extensions":["ovf"]},"application/x-virtualbox-vbox":{"compressible":true,"extensions":["vbox"]},"application/x-virtualbox-vbox-extpack":{"compressible":false,"extensions":["vbox-extpack"]},"application/x-virtualbox-vdi":{"compressible":true,"extensions":["vdi"]},"application/x-virtualbox-vhd":{"compressible":true,"extensions":["vhd"]},"application/x-virtualbox-vmdk":{"compressible":true,"extensions":["vmdk"]},"application/x-wais-source":{"source":"apache","extensions":["src"]},"application/x-web-app-manifest+json":{"compressible":true,"extensions":["webapp"]},"application/x-www-form-urlencoded":{"source":"iana","compressible":true},"application/x-x509-ca-cert":{"source":"apache","extensions":["der","crt","pem"]},"application/x-xfig":{"source":"apache","extensions":["fig"]},"application/x-xliff+xml":{"source":"apache","compressible":true,"extensions":["xlf"]},"application/x-xpinstall":{"source":"apache","compressible":false,"extensions":["xpi"]},"application/x-xz":{"source":"apache","extensions":["xz"]},"application/x-zmachine":{"source":"apache","extensions":["z1","z2","z3","z4","z5","z6","z7","z8"]},"application/x400-bp":{"source":"iana"},"application/xacml+xml":{"source":"iana","compressible":true},"application/xaml+xml":{"source":"apache","compressible":true,"extensions":["xaml"]},"application/xcap-att+xml":{"source":"iana","compressible":true},"application/xcap-caps+xml":{"source":"iana","compressible":true},"application/xcap-diff+xml":{"source":"iana","compressible":true,"extensions":["xdf"]},"application/xcap-el+xml":{"source":"iana","compressible":true},"application/xcap-error+xml":{"source":"iana","compressible":true},"application/xcap-ns+xml":{"source":"iana","compressible":true},"application/xcon-conference-info+xml":{"source":"iana","compressible":true},"application/xcon-conference-info-diff+xml":{"source":"iana","compressible":true},"application/xenc+xml":{"source":"iana","compressible":true,"extensions":["xenc"]},"application/xhtml+xml":{"source":"iana","compressible":true,"extensions":["xhtml","xht"]},"application/xhtml-voice+xml":{"source":"apache","compressible":true},"application/xliff+xml":{"source":"iana","compressible":true},"application/xml":{"source":"iana","compressible":true,"extensions":["xml","xsl","xsd","rng"]},"application/xml-dtd":{"source":"iana","compressible":true,"extensions":["dtd"]},"application/xml-external-parsed-entity":{"source":"iana"},"application/xml-patch+xml":{"source":"iana","compressible":true},"application/xmpp+xml":{"source":"iana","compressible":true},"application/xop+xml":{"source":"iana","compressible":true,"extensions":["xop"]},"application/xproc+xml":{"source":"apache","compressible":true,"extensions":["xpl"]},"application/xslt+xml":{"source":"iana","compressible":true,"extensions":["xslt"]},"application/xspf+xml":{"source":"apache","compressible":true,"extensions":["xspf"]},"application/xv+xml":{"source":"iana","compressible":true,"extensions":["mxml","xhvml","xvml","xvm"]},"application/yang":{"source":"iana","extensions":["yang"]},"application/yang-data+json":{"source":"iana","compressible":true},"application/yang-data+xml":{"source":"iana","compressible":true},"application/yang-patch+json":{"source":"iana","compressible":true},"application/yang-patch+xml":{"source":"iana","compressible":true},"application/yin+xml":{"source":"iana","compressible":true,"extensions":["yin"]},"application/zip":{"source":"iana","compressible":false,"extensions":["zip"]},"application/zlib":{"source":"iana"},"application/zstd":{"source":"iana"},"audio/1d-interleaved-parityfec":{"source":"iana"},"audio/32kadpcm":{"source":"iana"},"audio/3gpp":{"source":"iana","compressible":false,"extensions":["3gpp"]},"audio/3gpp2":{"source":"iana"},"audio/aac":{"source":"iana"},"audio/ac3":{"source":"iana"},"audio/adpcm":{"source":"apache","extensions":["adp"]},"audio/amr":{"source":"iana"},"audio/amr-wb":{"source":"iana"},"audio/amr-wb+":{"source":"iana"},"audio/aptx":{"source":"iana"},"audio/asc":{"source":"iana"},"audio/atrac-advanced-lossless":{"source":"iana"},"audio/atrac-x":{"source":"iana"},"audio/atrac3":{"source":"iana"},"audio/basic":{"source":"iana","compressible":false,"extensions":["au","snd"]},"audio/bv16":{"source":"iana"},"audio/bv32":{"source":"iana"},"audio/clearmode":{"source":"iana"},"audio/cn":{"source":"iana"},"audio/dat12":{"source":"iana"},"audio/dls":{"source":"iana"},"audio/dsr-es201108":{"source":"iana"},"audio/dsr-es202050":{"source":"iana"},"audio/dsr-es202211":{"source":"iana"},"audio/dsr-es202212":{"source":"iana"},"audio/dv":{"source":"iana"},"audio/dvi4":{"source":"iana"},"audio/eac3":{"source":"iana"},"audio/encaprtp":{"source":"iana"},"audio/evrc":{"source":"iana"},"audio/evrc-qcp":{"source":"iana"},"audio/evrc0":{"source":"iana"},"audio/evrc1":{"source":"iana"},"audio/evrcb":{"source":"iana"},"audio/evrcb0":{"source":"iana"},"audio/evrcb1":{"source":"iana"},"audio/evrcnw":{"source":"iana"},"audio/evrcnw0":{"source":"iana"},"audio/evrcnw1":{"source":"iana"},"audio/evrcwb":{"source":"iana"},"audio/evrcwb0":{"source":"iana"},"audio/evrcwb1":{"source":"iana"},"audio/evs":{"source":"iana"},"audio/fwdred":{"source":"iana"},"audio/g711-0":{"source":"iana"},"audio/g719":{"source":"iana"},"audio/g722":{"source":"iana"},"audio/g7221":{"source":"iana"},"audio/g723":{"source":"iana"},"audio/g726-16":{"source":"iana"},"audio/g726-24":{"source":"iana"},"audio/g726-32":{"source":"iana"},"audio/g726-40":{"source":"iana"},"audio/g728":{"source":"iana"},"audio/g729":{"source":"iana"},"audio/g7291":{"source":"iana"},"audio/g729d":{"source":"iana"},"audio/g729e":{"source":"iana"},"audio/gsm":{"source":"iana"},"audio/gsm-efr":{"source":"iana"},"audio/gsm-hr-08":{"source":"iana"},"audio/ilbc":{"source":"iana"},"audio/ip-mr_v2.5":{"source":"iana"},"audio/isac":{"source":"apache"},"audio/l16":{"source":"iana"},"audio/l20":{"source":"iana"},"audio/l24":{"source":"iana","compressible":false},"audio/l8":{"source":"iana"},"audio/lpc":{"source":"iana"},"audio/melp":{"source":"iana"},"audio/melp1200":{"source":"iana"},"audio/melp2400":{"source":"iana"},"audio/melp600":{"source":"iana"},"audio/midi":{"source":"apache","extensions":["mid","midi","kar","rmi"]},"audio/mobile-xmf":{"source":"iana"},"audio/mp3":{"compressible":false,"extensions":["mp3"]},"audio/mp4":{"source":"iana","compressible":false,"extensions":["m4a","mp4a"]},"audio/mp4a-latm":{"source":"iana"},"audio/mpa":{"source":"iana"},"audio/mpa-robust":{"source":"iana"},"audio/mpeg":{"source":"iana","compressible":false,"extensions":["mpga","mp2","mp2a","mp3","m2a","m3a"]},"audio/mpeg4-generic":{"source":"iana"},"audio/musepack":{"source":"apache"},"audio/ogg":{"source":"iana","compressible":false,"extensions":["oga","ogg","spx"]},"audio/opus":{"source":"iana"},"audio/parityfec":{"source":"iana"},"audio/pcma":{"source":"iana"},"audio/pcma-wb":{"source":"iana"},"audio/pcmu":{"source":"iana"},"audio/pcmu-wb":{"source":"iana"},"audio/prs.sid":{"source":"iana"},"audio/qcelp":{"source":"iana"},"audio/raptorfec":{"source":"iana"},"audio/red":{"source":"iana"},"audio/rtp-enc-aescm128":{"source":"iana"},"audio/rtp-midi":{"source":"iana"},"audio/rtploopback":{"source":"iana"},"audio/rtx":{"source":"iana"},"audio/s3m":{"source":"apache","extensions":["s3m"]},"audio/silk":{"source":"apache","extensions":["sil"]},"audio/smv":{"source":"iana"},"audio/smv-qcp":{"source":"iana"},"audio/smv0":{"source":"iana"},"audio/sp-midi":{"source":"iana"},"audio/speex":{"source":"iana"},"audio/t140c":{"source":"iana"},"audio/t38":{"source":"iana"},"audio/telephone-event":{"source":"iana"},"audio/tetra_acelp":{"source":"iana"},"audio/tone":{"source":"iana"},"audio/uemclip":{"source":"iana"},"audio/ulpfec":{"source":"iana"},"audio/usac":{"source":"iana"},"audio/vdvi":{"source":"iana"},"audio/vmr-wb":{"source":"iana"},"audio/vnd.3gpp.iufp":{"source":"iana"},"audio/vnd.4sb":{"source":"iana"},"audio/vnd.audiokoz":{"source":"iana"},"audio/vnd.celp":{"source":"iana"},"audio/vnd.cisco.nse":{"source":"iana"},"audio/vnd.cmles.radio-events":{"source":"iana"},"audio/vnd.cns.anp1":{"source":"iana"},"audio/vnd.cns.inf1":{"source":"iana"},"audio/vnd.dece.audio":{"source":"iana","extensions":["uva","uvva"]},"audio/vnd.digital-winds":{"source":"iana","extensions":["eol"]},"audio/vnd.dlna.adts":{"source":"iana"},"audio/vnd.dolby.heaac.1":{"source":"iana"},"audio/vnd.dolby.heaac.2":{"source":"iana"},"audio/vnd.dolby.mlp":{"source":"iana"},"audio/vnd.dolby.mps":{"source":"iana"},"audio/vnd.dolby.pl2":{"source":"iana"},"audio/vnd.dolby.pl2x":{"source":"iana"},"audio/vnd.dolby.pl2z":{"source":"iana"},"audio/vnd.dolby.pulse.1":{"source":"iana"},"audio/vnd.dra":{"source":"iana","extensions":["dra"]},"audio/vnd.dts":{"source":"iana","extensions":["dts"]},"audio/vnd.dts.hd":{"source":"iana","extensions":["dtshd"]},"audio/vnd.dts.uhd":{"source":"iana"},"audio/vnd.dvb.file":{"source":"iana"},"audio/vnd.everad.plj":{"source":"iana"},"audio/vnd.hns.audio":{"source":"iana"},"audio/vnd.lucent.voice":{"source":"iana","extensions":["lvp"]},"audio/vnd.ms-playready.media.pya":{"source":"iana","extensions":["pya"]},"audio/vnd.nokia.mobile-xmf":{"source":"iana"},"audio/vnd.nortel.vbk":{"source":"iana"},"audio/vnd.nuera.ecelp4800":{"source":"iana","extensions":["ecelp4800"]},"audio/vnd.nuera.ecelp7470":{"source":"iana","extensions":["ecelp7470"]},"audio/vnd.nuera.ecelp9600":{"source":"iana","extensions":["ecelp9600"]},"audio/vnd.octel.sbc":{"source":"iana"},"audio/vnd.presonus.multitrack":{"source":"iana"},"audio/vnd.qcelp":{"source":"iana"},"audio/vnd.rhetorex.32kadpcm":{"source":"iana"},"audio/vnd.rip":{"source":"iana","extensions":["rip"]},"audio/vnd.rn-realaudio":{"compressible":false},"audio/vnd.sealedmedia.softseal.mpeg":{"source":"iana"},"audio/vnd.vmx.cvsd":{"source":"iana"},"audio/vnd.wave":{"compressible":false},"audio/vorbis":{"source":"iana","compressible":false},"audio/vorbis-config":{"source":"iana"},"audio/wav":{"compressible":false,"extensions":["wav"]},"audio/wave":{"compressible":false,"extensions":["wav"]},"audio/webm":{"source":"apache","compressible":false,"extensions":["weba"]},"audio/x-aac":{"source":"apache","compressible":false,"extensions":["aac"]},"audio/x-aiff":{"source":"apache","extensions":["aif","aiff","aifc"]},"audio/x-caf":{"source":"apache","compressible":false,"extensions":["caf"]},"audio/x-flac":{"source":"apache","extensions":["flac"]},"audio/x-m4a":{"source":"nginx","extensions":["m4a"]},"audio/x-matroska":{"source":"apache","extensions":["mka"]},"audio/x-mpegurl":{"source":"apache","extensions":["m3u"]},"audio/x-ms-wax":{"source":"apache","extensions":["wax"]},"audio/x-ms-wma":{"source":"apache","extensions":["wma"]},"audio/x-pn-realaudio":{"source":"apache","extensions":["ram","ra"]},"audio/x-pn-realaudio-plugin":{"source":"apache","extensions":["rmp"]},"audio/x-realaudio":{"source":"nginx","extensions":["ra"]},"audio/x-tta":{"source":"apache"},"audio/x-wav":{"source":"apache","extensions":["wav"]},"audio/xm":{"source":"apache","extensions":["xm"]},"chemical/x-cdx":{"source":"apache","extensions":["cdx"]},"chemical/x-cif":{"source":"apache","extensions":["cif"]},"chemical/x-cmdf":{"source":"apache","extensions":["cmdf"]},"chemical/x-cml":{"source":"apache","extensions":["cml"]},"chemical/x-csml":{"source":"apache","extensions":["csml"]},"chemical/x-pdb":{"source":"apache"},"chemical/x-xyz":{"source":"apache","extensions":["xyz"]},"font/collection":{"source":"iana","extensions":["ttc"]},"font/otf":{"source":"iana","compressible":true,"extensions":["otf"]},"font/sfnt":{"source":"iana"},"font/ttf":{"source":"iana","extensions":["ttf"]},"font/woff":{"source":"iana","extensions":["woff"]},"font/woff2":{"source":"iana","extensions":["woff2"]},"image/aces":{"source":"iana","extensions":["exr"]},"image/apng":{"compressible":false,"extensions":["apng"]},"image/avci":{"source":"iana"},"image/avcs":{"source":"iana"},"image/bmp":{"source":"iana","compressible":true,"extensions":["bmp"]},"image/cgm":{"source":"iana","extensions":["cgm"]},"image/dicom-rle":{"source":"iana","extensions":["drle"]},"image/emf":{"source":"iana","extensions":["emf"]},"image/fits":{"source":"iana","extensions":["fits"]},"image/g3fax":{"source":"iana","extensions":["g3"]},"image/gif":{"source":"iana","compressible":false,"extensions":["gif"]},"image/heic":{"source":"iana","extensions":["heic"]},"image/heic-sequence":{"source":"iana","extensions":["heics"]},"image/heif":{"source":"iana","extensions":["heif"]},"image/heif-sequence":{"source":"iana","extensions":["heifs"]},"image/ief":{"source":"iana","extensions":["ief"]},"image/jls":{"source":"iana","extensions":["jls"]},"image/jp2":{"source":"iana","compressible":false,"extensions":["jp2","jpg2"]},"image/jpeg":{"source":"iana","compressible":false,"extensions":["jpeg","jpg","jpe"]},"image/jpm":{"source":"iana","compressible":false,"extensions":["jpm"]},"image/jpx":{"source":"iana","compressible":false,"extensions":["jpx","jpf"]},"image/ktx":{"source":"iana","extensions":["ktx"]},"image/naplps":{"source":"iana"},"image/pjpeg":{"compressible":false},"image/png":{"source":"iana","compressible":false,"extensions":["png"]},"image/prs.btif":{"source":"iana","extensions":["btif"]},"image/prs.pti":{"source":"iana","extensions":["pti"]},"image/pwg-raster":{"source":"iana"},"image/sgi":{"source":"apache","extensions":["sgi"]},"image/svg+xml":{"source":"iana","compressible":true,"extensions":["svg","svgz"]},"image/t38":{"source":"iana","extensions":["t38"]},"image/tiff":{"source":"iana","compressible":false,"extensions":["tif","tiff"]},"image/tiff-fx":{"source":"iana","extensions":["tfx"]},"image/vnd.adobe.photoshop":{"source":"iana","compressible":true,"extensions":["psd"]},"image/vnd.airzip.accelerator.azv":{"source":"iana","extensions":["azv"]},"image/vnd.cns.inf2":{"source":"iana"},"image/vnd.dece.graphic":{"source":"iana","extensions":["uvi","uvvi","uvg","uvvg"]},"image/vnd.djvu":{"source":"iana","extensions":["djvu","djv"]},"image/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"image/vnd.dwg":{"source":"iana","extensions":["dwg"]},"image/vnd.dxf":{"source":"iana","extensions":["dxf"]},"image/vnd.fastbidsheet":{"source":"iana","extensions":["fbs"]},"image/vnd.fpx":{"source":"iana","extensions":["fpx"]},"image/vnd.fst":{"source":"iana","extensions":["fst"]},"image/vnd.fujixerox.edmics-mmr":{"source":"iana","extensions":["mmr"]},"image/vnd.fujixerox.edmics-rlc":{"source":"iana","extensions":["rlc"]},"image/vnd.globalgraphics.pgb":{"source":"iana"},"image/vnd.microsoft.icon":{"source":"iana","extensions":["ico"]},"image/vnd.mix":{"source":"iana"},"image/vnd.mozilla.apng":{"source":"iana"},"image/vnd.ms-modi":{"source":"iana","extensions":["mdi"]},"image/vnd.ms-photo":{"source":"apache","extensions":["wdp"]},"image/vnd.net-fpx":{"source":"iana","extensions":["npx"]},"image/vnd.radiance":{"source":"iana"},"image/vnd.sealed.png":{"source":"iana"},"image/vnd.sealedmedia.softseal.gif":{"source":"iana"},"image/vnd.sealedmedia.softseal.jpg":{"source":"iana"},"image/vnd.svf":{"source":"iana"},"image/vnd.tencent.tap":{"source":"iana","extensions":["tap"]},"image/vnd.valve.source.texture":{"source":"iana","extensions":["vtf"]},"image/vnd.wap.wbmp":{"source":"iana","extensions":["wbmp"]},"image/vnd.xiff":{"source":"iana","extensions":["xif"]},"image/vnd.zbrush.pcx":{"source":"iana","extensions":["pcx"]},"image/webp":{"source":"apache","extensions":["webp"]},"image/wmf":{"source":"iana","extensions":["wmf"]},"image/x-3ds":{"source":"apache","extensions":["3ds"]},"image/x-cmu-raster":{"source":"apache","extensions":["ras"]},"image/x-cmx":{"source":"apache","extensions":["cmx"]},"image/x-freehand":{"source":"apache","extensions":["fh","fhc","fh4","fh5","fh7"]},"image/x-icon":{"source":"apache","compressible":true,"extensions":["ico"]},"image/x-jng":{"source":"nginx","extensions":["jng"]},"image/x-mrsid-image":{"source":"apache","extensions":["sid"]},"image/x-ms-bmp":{"source":"nginx","compressible":true,"extensions":["bmp"]},"image/x-pcx":{"source":"apache","extensions":["pcx"]},"image/x-pict":{"source":"apache","extensions":["pic","pct"]},"image/x-portable-anymap":{"source":"apache","extensions":["pnm"]},"image/x-portable-bitmap":{"source":"apache","extensions":["pbm"]},"image/x-portable-graymap":{"source":"apache","extensions":["pgm"]},"image/x-portable-pixmap":{"source":"apache","extensions":["ppm"]},"image/x-rgb":{"source":"apache","extensions":["rgb"]},"image/x-tga":{"source":"apache","extensions":["tga"]},"image/x-xbitmap":{"source":"apache","extensions":["xbm"]},"image/x-xcf":{"compressible":false},"image/x-xpixmap":{"source":"apache","extensions":["xpm"]},"image/x-xwindowdump":{"source":"apache","extensions":["xwd"]},"message/cpim":{"source":"iana"},"message/delivery-status":{"source":"iana"},"message/disposition-notification":{"source":"iana","extensions":["disposition-notification"]},"message/external-body":{"source":"iana"},"message/feedback-report":{"source":"iana"},"message/global":{"source":"iana","extensions":["u8msg"]},"message/global-delivery-status":{"source":"iana","extensions":["u8dsn"]},"message/global-disposition-notification":{"source":"iana","extensions":["u8mdn"]},"message/global-headers":{"source":"iana","extensions":["u8hdr"]},"message/http":{"source":"iana","compressible":false},"message/imdn+xml":{"source":"iana","compressible":true},"message/news":{"source":"iana"},"message/partial":{"source":"iana","compressible":false},"message/rfc822":{"source":"iana","compressible":true,"extensions":["eml","mime"]},"message/s-http":{"source":"iana"},"message/sip":{"source":"iana"},"message/sipfrag":{"source":"iana"},"message/tracking-status":{"source":"iana"},"message/vnd.si.simp":{"source":"iana"},"message/vnd.wfa.wsc":{"source":"iana","extensions":["wsc"]},"model/3mf":{"source":"iana"},"model/gltf+json":{"source":"iana","compressible":true,"extensions":["gltf"]},"model/gltf-binary":{"source":"iana","compressible":true,"extensions":["glb"]},"model/iges":{"source":"iana","compressible":false,"extensions":["igs","iges"]},"model/mesh":{"source":"iana","compressible":false,"extensions":["msh","mesh","silo"]},"model/stl":{"source":"iana"},"model/vnd.collada+xml":{"source":"iana","compressible":true,"extensions":["dae"]},"model/vnd.dwf":{"source":"iana","extensions":["dwf"]},"model/vnd.flatland.3dml":{"source":"iana"},"model/vnd.gdl":{"source":"iana","extensions":["gdl"]},"model/vnd.gs-gdl":{"source":"apache"},"model/vnd.gs.gdl":{"source":"iana"},"model/vnd.gtw":{"source":"iana","extensions":["gtw"]},"model/vnd.moml+xml":{"source":"iana","compressible":true},"model/vnd.mts":{"source":"iana","extensions":["mts"]},"model/vnd.opengex":{"source":"iana"},"model/vnd.parasolid.transmit.binary":{"source":"iana"},"model/vnd.parasolid.transmit.text":{"source":"iana"},"model/vnd.rosette.annotated-data-model":{"source":"iana"},"model/vnd.usdz+zip":{"source":"iana","compressible":false},"model/vnd.valve.source.compiled-map":{"source":"iana"},"model/vnd.vtu":{"source":"iana","extensions":["vtu"]},"model/vrml":{"source":"iana","compressible":false,"extensions":["wrl","vrml"]},"model/x3d+binary":{"source":"apache","compressible":false,"extensions":["x3db","x3dbz"]},"model/x3d+fastinfoset":{"source":"iana"},"model/x3d+vrml":{"source":"apache","compressible":false,"extensions":["x3dv","x3dvz"]},"model/x3d+xml":{"source":"iana","compressible":true,"extensions":["x3d","x3dz"]},"model/x3d-vrml":{"source":"iana"},"multipart/alternative":{"source":"iana","compressible":false},"multipart/appledouble":{"source":"iana"},"multipart/byteranges":{"source":"iana"},"multipart/digest":{"source":"iana"},"multipart/encrypted":{"source":"iana","compressible":false},"multipart/form-data":{"source":"iana","compressible":false},"multipart/header-set":{"source":"iana"},"multipart/mixed":{"source":"iana","compressible":false},"multipart/multilingual":{"source":"iana"},"multipart/parallel":{"source":"iana"},"multipart/related":{"source":"iana","compressible":false},"multipart/report":{"source":"iana"},"multipart/signed":{"source":"iana","compressible":false},"multipart/vnd.bint.med-plus":{"source":"iana"},"multipart/voice-message":{"source":"iana"},"multipart/x-mixed-replace":{"source":"iana"},"text/1d-interleaved-parityfec":{"source":"iana"},"text/cache-manifest":{"source":"iana","compressible":true,"extensions":["appcache","manifest"]},"text/calendar":{"source":"iana","extensions":["ics","ifb"]},"text/calender":{"compressible":true},"text/cmd":{"compressible":true},"text/coffeescript":{"extensions":["coffee","litcoffee"]},"text/css":{"source":"iana","charset":"UTF-8","compressible":true,"extensions":["css"]},"text/csv":{"source":"iana","compressible":true,"extensions":["csv"]},"text/csv-schema":{"source":"iana"},"text/directory":{"source":"iana"},"text/dns":{"source":"iana"},"text/ecmascript":{"source":"iana"},"text/encaprtp":{"source":"iana"},"text/enriched":{"source":"iana"},"text/fwdred":{"source":"iana"},"text/grammar-ref-list":{"source":"iana"},"text/html":{"source":"iana","compressible":true,"extensions":["html","htm","shtml"]},"text/jade":{"extensions":["jade"]},"text/javascript":{"source":"iana","compressible":true},"text/jcr-cnd":{"source":"iana"},"text/jsx":{"compressible":true,"extensions":["jsx"]},"text/less":{"compressible":true,"extensions":["less"]},"text/markdown":{"source":"iana","compressible":true,"extensions":["markdown","md"]},"text/mathml":{"source":"nginx","extensions":["mml"]},"text/mizar":{"source":"iana"},"text/n3":{"source":"iana","compressible":true,"extensions":["n3"]},"text/parameters":{"source":"iana"},"text/parityfec":{"source":"iana"},"text/plain":{"source":"iana","compressible":true,"extensions":["txt","text","conf","def","list","log","in","ini"]},"text/provenance-notation":{"source":"iana"},"text/prs.fallenstein.rst":{"source":"iana"},"text/prs.lines.tag":{"source":"iana","extensions":["dsc"]},"text/prs.prop.logic":{"source":"iana"},"text/raptorfec":{"source":"iana"},"text/red":{"source":"iana"},"text/rfc822-headers":{"source":"iana"},"text/richtext":{"source":"iana","compressible":true,"extensions":["rtx"]},"text/rtf":{"source":"iana","compressible":true,"extensions":["rtf"]},"text/rtp-enc-aescm128":{"source":"iana"},"text/rtploopback":{"source":"iana"},"text/rtx":{"source":"iana"},"text/sgml":{"source":"iana","extensions":["sgml","sgm"]},"text/shex":{"extensions":["shex"]},"text/slim":{"extensions":["slim","slm"]},"text/strings":{"source":"iana"},"text/stylus":{"extensions":["stylus","styl"]},"text/t140":{"source":"iana"},"text/tab-separated-values":{"source":"iana","compressible":true,"extensions":["tsv"]},"text/troff":{"source":"iana","extensions":["t","tr","roff","man","me","ms"]},"text/turtle":{"source":"iana","charset":"UTF-8","extensions":["ttl"]},"text/ulpfec":{"source":"iana"},"text/uri-list":{"source":"iana","compressible":true,"extensions":["uri","uris","urls"]},"text/vcard":{"source":"iana","compressible":true,"extensions":["vcard"]},"text/vnd.a":{"source":"iana"},"text/vnd.abc":{"source":"iana"},"text/vnd.ascii-art":{"source":"iana"},"text/vnd.curl":{"source":"iana","extensions":["curl"]},"text/vnd.curl.dcurl":{"source":"apache","extensions":["dcurl"]},"text/vnd.curl.mcurl":{"source":"apache","extensions":["mcurl"]},"text/vnd.curl.scurl":{"source":"apache","extensions":["scurl"]},"text/vnd.debian.copyright":{"source":"iana"},"text/vnd.dmclientscript":{"source":"iana"},"text/vnd.dvb.subtitle":{"source":"iana","extensions":["sub"]},"text/vnd.esmertec.theme-descriptor":{"source":"iana"},"text/vnd.fly":{"source":"iana","extensions":["fly"]},"text/vnd.fmi.flexstor":{"source":"iana","extensions":["flx"]},"text/vnd.gml":{"source":"iana"},"text/vnd.graphviz":{"source":"iana","extensions":["gv"]},"text/vnd.hgl":{"source":"iana"},"text/vnd.in3d.3dml":{"source":"iana","extensions":["3dml"]},"text/vnd.in3d.spot":{"source":"iana","extensions":["spot"]},"text/vnd.iptc.newsml":{"source":"iana"},"text/vnd.iptc.nitf":{"source":"iana"},"text/vnd.latex-z":{"source":"iana"},"text/vnd.motorola.reflex":{"source":"iana"},"text/vnd.ms-mediapackage":{"source":"iana"},"text/vnd.net2phone.commcenter.command":{"source":"iana"},"text/vnd.radisys.msml-basic-layout":{"source":"iana"},"text/vnd.senx.warpscript":{"source":"iana"},"text/vnd.si.uricatalogue":{"source":"iana"},"text/vnd.sun.j2me.app-descriptor":{"source":"iana","extensions":["jad"]},"text/vnd.trolltech.linguist":{"source":"iana"},"text/vnd.wap.si":{"source":"iana"},"text/vnd.wap.sl":{"source":"iana"},"text/vnd.wap.wml":{"source":"iana","extensions":["wml"]},"text/vnd.wap.wmlscript":{"source":"iana","extensions":["wmls"]},"text/vtt":{"charset":"UTF-8","compressible":true,"extensions":["vtt"]},"text/x-asm":{"source":"apache","extensions":["s","asm"]},"text/x-c":{"source":"apache","extensions":["c","cc","cxx","cpp","h","hh","dic"]},"text/x-component":{"source":"nginx","extensions":["htc"]},"text/x-fortran":{"source":"apache","extensions":["f","for","f77","f90"]},"text/x-gwt-rpc":{"compressible":true},"text/x-handlebars-template":{"extensions":["hbs"]},"text/x-java-source":{"source":"apache","extensions":["java"]},"text/x-jquery-tmpl":{"compressible":true},"text/x-lua":{"extensions":["lua"]},"text/x-markdown":{"compressible":true,"extensions":["mkd"]},"text/x-nfo":{"source":"apache","extensions":["nfo"]},"text/x-opml":{"source":"apache","extensions":["opml"]},"text/x-org":{"compressible":true,"extensions":["org"]},"text/x-pascal":{"source":"apache","extensions":["p","pas"]},"text/x-processing":{"compressible":true,"extensions":["pde"]},"text/x-sass":{"extensions":["sass"]},"text/x-scss":{"extensions":["scss"]},"text/x-setext":{"source":"apache","extensions":["etx"]},"text/x-sfv":{"source":"apache","extensions":["sfv"]},"text/x-suse-ymp":{"compressible":true,"extensions":["ymp"]},"text/x-uuencode":{"source":"apache","extensions":["uu"]},"text/x-vcalendar":{"source":"apache","extensions":["vcs"]},"text/x-vcard":{"source":"apache","extensions":["vcf"]},"text/xml":{"source":"iana","compressible":true,"extensions":["xml"]},"text/xml-external-parsed-entity":{"source":"iana"},"text/yaml":{"extensions":["yaml","yml"]},"video/1d-interleaved-parityfec":{"source":"iana"},"video/3gpp":{"source":"iana","extensions":["3gp","3gpp"]},"video/3gpp-tt":{"source":"iana"},"video/3gpp2":{"source":"iana","extensions":["3g2"]},"video/bmpeg":{"source":"iana"},"video/bt656":{"source":"iana"},"video/celb":{"source":"iana"},"video/dv":{"source":"iana"},"video/encaprtp":{"source":"iana"},"video/h261":{"source":"iana","extensions":["h261"]},"video/h263":{"source":"iana","extensions":["h263"]},"video/h263-1998":{"source":"iana"},"video/h263-2000":{"source":"iana"},"video/h264":{"source":"iana","extensions":["h264"]},"video/h264-rcdo":{"source":"iana"},"video/h264-svc":{"source":"iana"},"video/h265":{"source":"iana"},"video/iso.segment":{"source":"iana"},"video/jpeg":{"source":"iana","extensions":["jpgv"]},"video/jpeg2000":{"source":"iana"},"video/jpm":{"source":"apache","extensions":["jpm","jpgm"]},"video/mj2":{"source":"iana","extensions":["mj2","mjp2"]},"video/mp1s":{"source":"iana"},"video/mp2p":{"source":"iana"},"video/mp2t":{"source":"iana","extensions":["ts"]},"video/mp4":{"source":"iana","compressible":false,"extensions":["mp4","mp4v","mpg4"]},"video/mp4v-es":{"source":"iana"},"video/mpeg":{"source":"iana","compressible":false,"extensions":["mpeg","mpg","mpe","m1v","m2v"]},"video/mpeg4-generic":{"source":"iana"},"video/mpv":{"source":"iana"},"video/nv":{"source":"iana"},"video/ogg":{"source":"iana","compressible":false,"extensions":["ogv"]},"video/parityfec":{"source":"iana"},"video/pointer":{"source":"iana"},"video/quicktime":{"source":"iana","compressible":false,"extensions":["qt","mov"]},"video/raptorfec":{"source":"iana"},"video/raw":{"source":"iana"},"video/rtp-enc-aescm128":{"source":"iana"},"video/rtploopback":{"source":"iana"},"video/rtx":{"source":"iana"},"video/smpte291":{"source":"iana"},"video/smpte292m":{"source":"iana"},"video/ulpfec":{"source":"iana"},"video/vc1":{"source":"iana"},"video/vc2":{"source":"iana"},"video/vnd.cctv":{"source":"iana"},"video/vnd.dece.hd":{"source":"iana","extensions":["uvh","uvvh"]},"video/vnd.dece.mobile":{"source":"iana","extensions":["uvm","uvvm"]},"video/vnd.dece.mp4":{"source":"iana"},"video/vnd.dece.pd":{"source":"iana","extensions":["uvp","uvvp"]},"video/vnd.dece.sd":{"source":"iana","extensions":["uvs","uvvs"]},"video/vnd.dece.video":{"source":"iana","extensions":["uvv","uvvv"]},"video/vnd.directv.mpeg":{"source":"iana"},"video/vnd.directv.mpeg-tts":{"source":"iana"},"video/vnd.dlna.mpeg-tts":{"source":"iana"},"video/vnd.dvb.file":{"source":"iana","extensions":["dvb"]},"video/vnd.fvt":{"source":"iana","extensions":["fvt"]},"video/vnd.hns.video":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.1dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-1010":{"source":"iana"},"video/vnd.iptvforum.2dparityfec-2005":{"source":"iana"},"video/vnd.iptvforum.ttsavc":{"source":"iana"},"video/vnd.iptvforum.ttsmpeg2":{"source":"iana"},"video/vnd.motorola.video":{"source":"iana"},"video/vnd.motorola.videop":{"source":"iana"},"video/vnd.mpegurl":{"source":"iana","extensions":["mxu","m4u"]},"video/vnd.ms-playready.media.pyv":{"source":"iana","extensions":["pyv"]},"video/vnd.nokia.interleaved-multimedia":{"source":"iana"},"video/vnd.nokia.mp4vr":{"source":"iana"},"video/vnd.nokia.videovoip":{"source":"iana"},"video/vnd.objectvideo":{"source":"iana"},"video/vnd.radgamettools.bink":{"source":"iana"},"video/vnd.radgamettools.smacker":{"source":"iana"},"video/vnd.sealed.mpeg1":{"source":"iana"},"video/vnd.sealed.mpeg4":{"source":"iana"},"video/vnd.sealed.swf":{"source":"iana"},"video/vnd.sealedmedia.softseal.mov":{"source":"iana"},"video/vnd.uvvu.mp4":{"source":"iana","extensions":["uvu","uvvu"]},"video/vnd.vivo":{"source":"iana","extensions":["viv"]},"video/vp8":{"source":"iana"},"video/webm":{"source":"apache","compressible":false,"extensions":["webm"]},"video/x-f4v":{"source":"apache","extensions":["f4v"]},"video/x-fli":{"source":"apache","extensions":["fli"]},"video/x-flv":{"source":"apache","compressible":false,"extensions":["flv"]},"video/x-m4v":{"source":"apache","extensions":["m4v"]},"video/x-matroska":{"source":"apache","compressible":false,"extensions":["mkv","mk3d","mks"]},"video/x-mng":{"source":"apache","extensions":["mng"]},"video/x-ms-asf":{"source":"apache","extensions":["asf","asx"]},"video/x-ms-vob":{"source":"apache","extensions":["vob"]},"video/x-ms-wm":{"source":"apache","extensions":["wm"]},"video/x-ms-wmv":{"source":"apache","compressible":false,"extensions":["wmv"]},"video/x-ms-wmx":{"source":"apache","extensions":["wmx"]},"video/x-ms-wvx":{"source":"apache","extensions":["wvx"]},"video/x-msvideo":{"source":"apache","extensions":["avi"]},"video/x-sgi-movie":{"source":"apache","extensions":["movie"]},"video/x-smv":{"source":"apache","extensions":["smv"]},"x-conference/x-cooltalk":{"source":"apache","extensions":["ice"]},"x-shader/x-fragment":{"compressible":true},"x-shader/x-vertex":{"compressible":true}};

/***/ }),

/***/ "./node_modules/mime-db/index.js":
/*!***************************************!*\
  !*** ./node_modules/mime-db/index.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * MIT Licensed
 */

/**
 * Module exports.
 */

module.exports = __webpack_require__(/*! ./db.json */ "./node_modules/mime-db/db.json")


/***/ }),

/***/ "./node_modules/mime-types/index.js":
/*!******************************************!*\
  !*** ./node_modules/mime-types/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */



/**
 * Module dependencies.
 * @private
 */

var db = __webpack_require__(/*! mime-db */ "./node_modules/mime-db/index.js")
var extname = __webpack_require__(/*! path */ "./node_modules/module-builder/node_modules/path-browserify/index.js").extname

/**
 * Module variables.
 * @private
 */

var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/
var TEXT_TYPE_REGEXP = /^text\//i

/**
 * Module exports.
 * @public
 */

exports.charset = charset
exports.charsets = { lookup: charset }
exports.contentType = contentType
exports.extension = extension
exports.extensions = Object.create(null)
exports.lookup = lookup
exports.types = Object.create(null)

// Populate the extensions/types maps
populateMaps(exports.extensions, exports.types)

/**
 * Get the default charset for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function charset (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)
  var mime = match && db[match[1].toLowerCase()]

  if (mime && mime.charset) {
    return mime.charset
  }

  // default text/* to utf-8
  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
    return 'UTF-8'
  }

  return false
}

/**
 * Create a full Content-Type header given a MIME type or extension.
 *
 * @param {string} str
 * @return {boolean|string}
 */

function contentType (str) {
  // TODO: should this even be in this module?
  if (!str || typeof str !== 'string') {
    return false
  }

  var mime = str.indexOf('/') === -1
    ? exports.lookup(str)
    : str

  if (!mime) {
    return false
  }

  // TODO: use content-type or other module
  if (mime.indexOf('charset') === -1) {
    var charset = exports.charset(mime)
    if (charset) mime += '; charset=' + charset.toLowerCase()
  }

  return mime
}

/**
 * Get the default extension for a MIME type.
 *
 * @param {string} type
 * @return {boolean|string}
 */

function extension (type) {
  if (!type || typeof type !== 'string') {
    return false
  }

  // TODO: use media-typer
  var match = EXTRACT_TYPE_REGEXP.exec(type)

  // get extensions
  var exts = match && exports.extensions[match[1].toLowerCase()]

  if (!exts || !exts.length) {
    return false
  }

  return exts[0]
}

/**
 * Lookup the MIME type for a file path/extension.
 *
 * @param {string} path
 * @return {boolean|string}
 */

function lookup (path) {
  if (!path || typeof path !== 'string') {
    return false
  }

  // get the extension ("ext" or ".ext" or full path)
  var extension = extname('x.' + path)
    .toLowerCase()
    .substr(1)

  if (!extension) {
    return false
  }

  return exports.types[extension] || false
}

/**
 * Populate the extensions and types maps.
 * @private
 */

function populateMaps (extensions, types) {
  // source preference (least -> most)
  var preference = ['nginx', 'apache', undefined, 'iana']

  Object.keys(db).forEach(function forEachMimeType (type) {
    var mime = db[type]
    var exts = mime.extensions

    if (!exts || !exts.length) {
      return
    }

    // mime -> extensions
    extensions[type] = exts

    // extension -> mime
    for (var i = 0; i < exts.length; i++) {
      var extension = exts[i]

      if (types[extension]) {
        var from = preference.indexOf(db[types[extension]].source)
        var to = preference.indexOf(mime.source)

        if (types[extension] !== 'application/octet-stream' &&
          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
          // skip the remapping
          continue
        }
      }

      // set the extension -> mime
      types[extension] = type
    }
  })
}


/***/ }),

/***/ "./node_modules/module-builder/node_modules/path-browserify/index.js":
/*!***************************************************************************!*\
  !*** ./node_modules/module-builder/node_modules/path-browserify/index.js ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../process/browser.js */ "./node_modules/module-builder/node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/module-builder/node_modules/process/browser.js":
/*!*********************************************************************!*\
  !*** ./node_modules/module-builder/node_modules/process/browser.js ***!
  \*********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ "./node_modules/ms/index.js":
/*!**********************************!*\
  !*** ./node_modules/ms/index.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ }),

/***/ "./node_modules/object-assign/index.js":
/*!*********************************************!*\
  !*** ./node_modules/object-assign/index.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),

/***/ "./node_modules/prop-types/checkPropTypes.js":
/*!***************************************************!*\
  !*** ./node_modules/prop-types/checkPropTypes.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var printWarning = function() {};

if (true) {
  var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "./node_modules/prop-types/lib/ReactPropTypesSecret.js");
  var loggedTypeFailures = {};

  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (true) {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            var err = Error(
              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.'
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          printWarning(
            (componentName || 'React class') + ': type specification of ' +
            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
            'You may have forgotten to pass an argument to the type checker ' +
            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
            'shape all require an argument).'
          )

        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          printWarning(
            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
          );
        }
      }
    }
  }
}

module.exports = checkPropTypes;


/***/ }),

/***/ "./node_modules/prop-types/factoryWithTypeCheckers.js":
/*!************************************************************!*\
  !*** ./node_modules/prop-types/factoryWithTypeCheckers.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var assign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ "./node_modules/prop-types/lib/ReactPropTypesSecret.js");
var checkPropTypes = __webpack_require__(/*! ./checkPropTypes */ "./node_modules/prop-types/checkPropTypes.js");

var printWarning = function() {};

if (true) {
  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

function emptyFunctionThatReturnsNull() {
  return null;
}

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (true) {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
          err.name = 'Invariant Violation';
          throw err;
        } else if ("development" !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            printWarning(
              'You are manually calling a React.PropTypes validation ' +
              'function for the `' + propFullName + '` prop on `' + componentName  + '`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
       true ? printWarning('Invalid argument supplied to oneOf, expected an instance of array.') : undefined;
      return emptyFunctionThatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues);
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (propValue.hasOwnProperty(key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
       true ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : undefined;
      return emptyFunctionThatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        printWarning(
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
        );
        return emptyFunctionThatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
          return null;
        }
      }

      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (!checker) {
          continue;
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from
      // props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),

/***/ "./node_modules/prop-types/index.js":
/*!******************************************!*\
  !*** ./node_modules/prop-types/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (true) {
  var REACT_ELEMENT_TYPE = (typeof Symbol === 'function' &&
    Symbol.for &&
    Symbol.for('react.element')) ||
    0xeac7;

  var isValidElement = function(object) {
    return typeof object === 'object' &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE;
  };

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = __webpack_require__(/*! ./factoryWithTypeCheckers */ "./node_modules/prop-types/factoryWithTypeCheckers.js")(isValidElement, throwOnDirectAccess);
} else {}


/***/ }),

/***/ "./node_modules/prop-types/lib/ReactPropTypesSecret.js":
/*!*************************************************************!*\
  !*** ./node_modules/prop-types/lib/ReactPropTypesSecret.js ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ }),

/***/ "./node_modules/query-string/index.js":
/*!********************************************!*\
  !*** ./node_modules/query-string/index.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strictUriEncode = __webpack_require__(/*! strict-uri-encode */ "./node_modules/strict-uri-encode/index.js");
var objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");
var decodeComponent = __webpack_require__(/*! decode-uri-component */ "./node_modules/decode-uri-component/index.js");

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

function extract(str) {
	var queryStart = str.indexOf('?');
	if (queryStart === -1) {
		return '';
	}
	return str.slice(queryStart + 1);
}

function parse(str, opts) {
	opts = objectAssign({arrayFormat: 'none'}, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^[?#&]/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeComponent(val);

		formatter(decodeComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

	if (opts.sort === false) {
		opts.sort = function () {};
	}

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort(opts.sort).map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

exports.parseUrl = function (str, opts) {
	return {
		url: str.split('?')[0] || '',
		query: parse(extract(str), opts)
	};
};


/***/ }),

/***/ "./node_modules/react-intl/lib/index.es.js":
/*!*************************************************!*\
  !*** ./node_modules/react-intl/lib/index.es.js ***!
  \*************************************************/
/*! exports provided: addLocaleData, intlShape, injectIntl, defineMessages, IntlProvider, FormattedDate, FormattedTime, FormattedRelative, FormattedNumber, FormattedPlural, FormattedMessage, FormattedHTMLMessage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addLocaleData", function() { return addLocaleData; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "intlShape", function() { return intlShape; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "injectIntl", function() { return injectIntl; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defineMessages", function() { return defineMessages; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "IntlProvider", function() { return IntlProvider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedDate", function() { return FormattedDate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedTime", function() { return FormattedTime; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedRelative", function() { return FormattedRelative; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedNumber", function() { return FormattedNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedPlural", function() { return FormattedPlural; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedMessage", function() { return FormattedMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FormattedHTMLMessage", function() { return FormattedHTMLMessage; });
/* harmony import */ var _locale_data_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../locale-data/index.js */ 1);
/* harmony import */ var _locale_data_index_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_locale_data_index_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var intl_messageformat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! intl-messageformat */ "./node_modules/intl-messageformat/index.js");
/* harmony import */ var intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(intl_messageformat__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var intl_relativeformat__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! intl-relativeformat */ "./node_modules/intl-relativeformat/index.js");
/* harmony import */ var intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(intl_relativeformat__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! hoist-non-react-statics */ "./node_modules/hoist-non-react-statics/dist/hoist-non-react-statics.cjs.js");
/* harmony import */ var hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var invariant__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! invariant */ "./node_modules/invariant/browser.js");
/* harmony import */ var invariant__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(invariant__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var intl_format_cache__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! intl-format-cache */ "./node_modules/intl-format-cache/index.js");
/* harmony import */ var intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(intl_format_cache__WEBPACK_IMPORTED_MODULE_7__);
/*
 * Copyright 2019, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */










// GENERATED FILE
var defaultLocaleData = { "locale": "en", "pluralRuleFunction": function pluralRuleFunction(n, ord) {
    var s = String(n).split("."),
        v0 = !s[1],
        t0 = Number(s[0]) == n,
        n10 = t0 && s[0].slice(-1),
        n100 = t0 && s[0].slice(-2);if (ord) return n10 == 1 && n100 != 11 ? "one" : n10 == 2 && n100 != 12 ? "two" : n10 == 3 && n100 != 13 ? "few" : "other";return n == 1 && v0 ? "one" : "other";
  }, "fields": { "year": { "displayName": "year", "relative": { "0": "this year", "1": "next year", "-1": "last year" }, "relativeTime": { "future": { "one": "in {0} year", "other": "in {0} years" }, "past": { "one": "{0} year ago", "other": "{0} years ago" } } }, "year-short": { "displayName": "yr.", "relative": { "0": "this yr.", "1": "next yr.", "-1": "last yr." }, "relativeTime": { "future": { "one": "in {0} yr.", "other": "in {0} yr." }, "past": { "one": "{0} yr. ago", "other": "{0} yr. ago" } } }, "month": { "displayName": "month", "relative": { "0": "this month", "1": "next month", "-1": "last month" }, "relativeTime": { "future": { "one": "in {0} month", "other": "in {0} months" }, "past": { "one": "{0} month ago", "other": "{0} months ago" } } }, "month-short": { "displayName": "mo.", "relative": { "0": "this mo.", "1": "next mo.", "-1": "last mo." }, "relativeTime": { "future": { "one": "in {0} mo.", "other": "in {0} mo." }, "past": { "one": "{0} mo. ago", "other": "{0} mo. ago" } } }, "day": { "displayName": "day", "relative": { "0": "today", "1": "tomorrow", "-1": "yesterday" }, "relativeTime": { "future": { "one": "in {0} day", "other": "in {0} days" }, "past": { "one": "{0} day ago", "other": "{0} days ago" } } }, "day-short": { "displayName": "day", "relative": { "0": "today", "1": "tomorrow", "-1": "yesterday" }, "relativeTime": { "future": { "one": "in {0} day", "other": "in {0} days" }, "past": { "one": "{0} day ago", "other": "{0} days ago" } } }, "hour": { "displayName": "hour", "relative": { "0": "this hour" }, "relativeTime": { "future": { "one": "in {0} hour", "other": "in {0} hours" }, "past": { "one": "{0} hour ago", "other": "{0} hours ago" } } }, "hour-short": { "displayName": "hr.", "relative": { "0": "this hour" }, "relativeTime": { "future": { "one": "in {0} hr.", "other": "in {0} hr." }, "past": { "one": "{0} hr. ago", "other": "{0} hr. ago" } } }, "minute": { "displayName": "minute", "relative": { "0": "this minute" }, "relativeTime": { "future": { "one": "in {0} minute", "other": "in {0} minutes" }, "past": { "one": "{0} minute ago", "other": "{0} minutes ago" } } }, "minute-short": { "displayName": "min.", "relative": { "0": "this minute" }, "relativeTime": { "future": { "one": "in {0} min.", "other": "in {0} min." }, "past": { "one": "{0} min. ago", "other": "{0} min. ago" } } }, "second": { "displayName": "second", "relative": { "0": "now" }, "relativeTime": { "future": { "one": "in {0} second", "other": "in {0} seconds" }, "past": { "one": "{0} second ago", "other": "{0} seconds ago" } } }, "second-short": { "displayName": "sec.", "relative": { "0": "now" }, "relativeTime": { "future": { "one": "in {0} sec.", "other": "in {0} sec." }, "past": { "one": "{0} sec. ago", "other": "{0} sec. ago" } } } } };

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

function addLocaleData() {
  var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  var locales = Array.isArray(data) ? data : [data];

  locales.forEach(function (localeData) {
    if (localeData && localeData.locale) {
      intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a.__addLocaleData(localeData);
      intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default.a.__addLocaleData(localeData);
    }
  });
}

function hasLocaleData(locale) {
  var localeParts = (locale || '').split('-');

  while (localeParts.length > 0) {
    if (hasIMFAndIRFLocaleData(localeParts.join('-'))) {
      return true;
    }

    localeParts.pop();
  }

  return false;
}

function hasIMFAndIRFLocaleData(locale) {
  var normalizedLocale = locale && locale.toLowerCase();

  return !!(intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a.__localeData__[normalizedLocale] && intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default.a.__localeData__[normalizedLocale]);
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};









var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var bool = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.bool;
var number = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.number;
var string = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string;
var func = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func;
var object = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.object;
var oneOf = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.oneOf;
var shape = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.shape;
var any = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any;
var oneOfType = prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.oneOfType;

var localeMatcher = oneOf(['best fit', 'lookup']);
var narrowShortLong = oneOf(['narrow', 'short', 'long']);
var numeric2digit = oneOf(['numeric', '2-digit']);
var funcReq = func.isRequired;

var intlConfigPropTypes = {
  locale: string,
  timeZone: string,
  formats: object,
  messages: object,
  textComponent: any,

  defaultLocale: string,
  defaultFormats: object,

  onError: func
};

var intlFormatPropTypes = {
  formatDate: funcReq,
  formatTime: funcReq,
  formatRelative: funcReq,
  formatNumber: funcReq,
  formatPlural: funcReq,
  formatMessage: funcReq,
  formatHTMLMessage: funcReq
};

var intlShape = shape(_extends({}, intlConfigPropTypes, intlFormatPropTypes, {
  formatters: object,
  now: funcReq
}));

var messageDescriptorPropTypes = {
  id: string.isRequired,
  description: oneOfType([string, object]),
  defaultMessage: string
};

var dateTimeFormatPropTypes = {
  localeMatcher: localeMatcher,
  formatMatcher: oneOf(['basic', 'best fit']),

  timeZone: string,
  hour12: bool,

  weekday: narrowShortLong,
  era: narrowShortLong,
  year: numeric2digit,
  month: oneOf(['numeric', '2-digit', 'narrow', 'short', 'long']),
  day: numeric2digit,
  hour: numeric2digit,
  minute: numeric2digit,
  second: numeric2digit,
  timeZoneName: oneOf(['short', 'long'])
};

var numberFormatPropTypes = {
  localeMatcher: localeMatcher,

  style: oneOf(['decimal', 'currency', 'percent']),
  currency: string,
  currencyDisplay: oneOf(['symbol', 'code', 'name']),
  useGrouping: bool,

  minimumIntegerDigits: number,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
  minimumSignificantDigits: number,
  maximumSignificantDigits: number
};

var relativeFormatPropTypes = {
  style: oneOf(['best fit', 'numeric']),
  units: oneOf(['second', 'minute', 'hour', 'day', 'month', 'year', 'second-short', 'minute-short', 'hour-short', 'day-short', 'month-short', 'year-short'])
};

var pluralFormatPropTypes = {
  style: oneOf(['cardinal', 'ordinal'])
};

/*
HTML escaping and shallow-equals implementations are the same as React's
(on purpose.) Therefore, it has the following Copyright and Licensing:

Copyright 2013-2014, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the LICENSE
file in the root directory of React's source tree.
*/

var intlConfigPropNames = Object.keys(intlConfigPropTypes);

var ESCAPED_CHARS = {
  '&': '&amp;',
  '>': '&gt;',
  '<': '&lt;',
  '"': '&quot;',
  "'": '&#x27;'
};

var UNSAFE_CHARS_REGEX = /[&><"']/g;

function escape(str) {
  return ('' + str).replace(UNSAFE_CHARS_REGEX, function (match) {
    return ESCAPED_CHARS[match];
  });
}

function filterProps(props, whitelist) {
  var defaults$$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return whitelist.reduce(function (filtered, name) {
    if (props.hasOwnProperty(name)) {
      filtered[name] = props[name];
    } else if (defaults$$1.hasOwnProperty(name)) {
      filtered[name] = defaults$$1[name];
    }

    return filtered;
  }, {});
}

function invariantIntlContext() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      intl = _ref.intl;

  invariant__WEBPACK_IMPORTED_MODULE_6___default()(intl, '[React Intl] Could not find required `intl` object. ' + '<IntlProvider> needs to exist in the component ancestry.');
}

function shallowEquals(objA, objB) {
  if (objA === objB) {
    return true;
  }

  if ((typeof objA === 'undefined' ? 'undefined' : _typeof(objA)) !== 'object' || objA === null || (typeof objB === 'undefined' ? 'undefined' : _typeof(objB)) !== 'object' || objB === null) {
    return false;
  }

  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  var bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB);
  for (var i = 0; i < keysA.length; i++) {
    if (!bHasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }

  return true;
}

function shouldIntlComponentUpdate(_ref2, nextProps, nextState) {
  var props = _ref2.props,
      state = _ref2.state,
      _ref2$context = _ref2.context,
      context = _ref2$context === undefined ? {} : _ref2$context;
  var nextContext = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var _context$intl = context.intl,
      intl = _context$intl === undefined ? {} : _context$intl;
  var _nextContext$intl = nextContext.intl,
      nextIntl = _nextContext$intl === undefined ? {} : _nextContext$intl;


  return !shallowEquals(nextProps, props) || !shallowEquals(nextState, state) || !(nextIntl === intl || shallowEquals(filterProps(nextIntl, intlConfigPropNames), filterProps(intl, intlConfigPropNames)));
}

function createError(message, exception) {
  var eMsg = exception ? '\n' + exception : '';
  return '[React Intl] ' + message + eMsg;
}

function defaultErrorHandler(error) {
  if (true) {
    console.error(error);
  }
}

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// Inspired by react-redux's `connect()` HOC factory function implementation:
// https://github.com/rackt/react-redux

function getDisplayName(Component$$1) {
  return Component$$1.displayName || Component$$1.name || 'Component';
}

function injectIntl(WrappedComponent) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$intlPropName = options.intlPropName,
      intlPropName = _options$intlPropName === undefined ? 'intl' : _options$intlPropName,
      _options$withRef = options.withRef,
      withRef = _options$withRef === undefined ? false : _options$withRef;

  var InjectIntl = function (_Component) {
    inherits(InjectIntl, _Component);

    function InjectIntl(props, context) {
      classCallCheck(this, InjectIntl);

      var _this = possibleConstructorReturn(this, (InjectIntl.__proto__ || Object.getPrototypeOf(InjectIntl)).call(this, props, context));

      invariantIntlContext(context);
      return _this;
    }

    createClass(InjectIntl, [{
      key: 'getWrappedInstance',
      value: function getWrappedInstance() {
        invariant__WEBPACK_IMPORTED_MODULE_6___default()(withRef, '[React Intl] To access the wrapped instance, ' + 'the `{withRef: true}` option must be set when calling: ' + '`injectIntl()`');

        return this._wrappedInstance;
      }
    }, {
      key: 'render',
      value: function render() {
        var _this2 = this;

        return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(WrappedComponent, _extends({}, this.props, defineProperty({}, intlPropName, this.context.intl), {
          ref: withRef ? /* istanbul ignore next */function (ref) {
            return _this2._wrappedInstance = ref;
          } : null
        }));
      }
    }]);
    return InjectIntl;
  }(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

  InjectIntl.displayName = 'InjectIntl(' + getDisplayName(WrappedComponent) + ')';
  InjectIntl.contextTypes = {
    intl: intlShape
  };
  InjectIntl.WrappedComponent = WrappedComponent;


  return hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_5___default()(InjectIntl, WrappedComponent);
}

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

function defineMessages(messageDescriptors) {
  // This simply returns what's passed-in because it's meant to be a hook for
  // babel-plugin-react-intl.
  return messageDescriptors;
}

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

// This is a "hack" until a proper `intl-pluralformat` package is created.

function resolveLocale(locales) {
  // IntlMessageFormat#_resolveLocale() does not depend on `this`.
  return intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a.prototype._resolveLocale(locales);
}

function findPluralFunction(locale) {
  // IntlMessageFormat#_findPluralFunction() does not depend on `this`.
  return intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a.prototype._findPluralRuleFunction(locale);
}

var IntlPluralFormat = function IntlPluralFormat(locales) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  classCallCheck(this, IntlPluralFormat);

  var useOrdinal = options.style === 'ordinal';
  var pluralFn = findPluralFunction(resolveLocale(locales));

  this.format = function (value) {
    return pluralFn(value, useOrdinal);
  };
};

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var DATE_TIME_FORMAT_OPTIONS = Object.keys(dateTimeFormatPropTypes);
var NUMBER_FORMAT_OPTIONS = Object.keys(numberFormatPropTypes);
var RELATIVE_FORMAT_OPTIONS = Object.keys(relativeFormatPropTypes);
var PLURAL_FORMAT_OPTIONS = Object.keys(pluralFormatPropTypes);

var RELATIVE_FORMAT_THRESHOLDS = {
  second: 60, // seconds to minute
  minute: 60, // minutes to hour
  hour: 24, // hours to day
  day: 30, // days to month
  month: 12 };

function updateRelativeFormatThresholds(newThresholds) {
  var thresholds = intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default.a.thresholds;
  thresholds.second = newThresholds.second;
  thresholds.minute = newThresholds.minute;
  thresholds.hour = newThresholds.hour;
  thresholds.day = newThresholds.day;
  thresholds.month = newThresholds.month;
  thresholds['second-short'] = newThresholds['second-short'];
  thresholds['minute-short'] = newThresholds['minute-short'];
  thresholds['hour-short'] = newThresholds['hour-short'];
  thresholds['day-short'] = newThresholds['day-short'];
  thresholds['month-short'] = newThresholds['month-short'];
}

function getNamedFormat(formats, type, name, onError) {
  var format = formats && formats[type] && formats[type][name];
  if (format) {
    return format;
  }

  onError(createError('No ' + type + ' format named: ' + name));
}

function formatDate(config, state, value) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale,
      formats = config.formats,
      timeZone = config.timeZone;
  var format = options.format;


  var onError = config.onError || defaultErrorHandler;
  var date = new Date(value);
  var defaults$$1 = _extends({}, timeZone && { timeZone: timeZone }, format && getNamedFormat(formats, 'date', format, onError));
  var filteredOptions = filterProps(options, DATE_TIME_FORMAT_OPTIONS, defaults$$1);

  try {
    return state.getDateTimeFormat(locale, filteredOptions).format(date);
  } catch (e) {
    onError(createError('Error formatting date.', e));
  }

  return String(date);
}

function formatTime(config, state, value) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale,
      formats = config.formats,
      timeZone = config.timeZone;
  var format = options.format;


  var onError = config.onError || defaultErrorHandler;
  var date = new Date(value);
  var defaults$$1 = _extends({}, timeZone && { timeZone: timeZone }, format && getNamedFormat(formats, 'time', format, onError));
  var filteredOptions = filterProps(options, DATE_TIME_FORMAT_OPTIONS, defaults$$1);

  if (!filteredOptions.hour && !filteredOptions.minute && !filteredOptions.second) {
    // Add default formatting options if hour, minute, or second isn't defined.
    filteredOptions = _extends({}, filteredOptions, { hour: 'numeric', minute: 'numeric' });
  }

  try {
    return state.getDateTimeFormat(locale, filteredOptions).format(date);
  } catch (e) {
    onError(createError('Error formatting time.', e));
  }

  return String(date);
}

function formatRelative(config, state, value) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale,
      formats = config.formats;
  var format = options.format;


  var onError = config.onError || defaultErrorHandler;
  var date = new Date(value);
  var now = new Date(options.now);
  var defaults$$1 = format && getNamedFormat(formats, 'relative', format, onError);
  var filteredOptions = filterProps(options, RELATIVE_FORMAT_OPTIONS, defaults$$1);

  // Capture the current threshold values, then temporarily override them with
  // specific values just for this render.
  var oldThresholds = _extends({}, intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default.a.thresholds);
  updateRelativeFormatThresholds(RELATIVE_FORMAT_THRESHOLDS);

  try {
    return state.getRelativeFormat(locale, filteredOptions).format(date, {
      now: isFinite(now) ? now : state.now()
    });
  } catch (e) {
    onError(createError('Error formatting relative time.', e));
  } finally {
    updateRelativeFormatThresholds(oldThresholds);
  }

  return String(date);
}

function formatNumber(config, state, value) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale,
      formats = config.formats;
  var format = options.format;


  var onError = config.onError || defaultErrorHandler;
  var defaults$$1 = format && getNamedFormat(formats, 'number', format, onError);
  var filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults$$1);

  try {
    return state.getNumberFormat(locale, filteredOptions).format(value);
  } catch (e) {
    onError(createError('Error formatting number.', e));
  }

  return String(value);
}

function formatPlural(config, state, value) {
  var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale;


  var filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);
  var onError = config.onError || defaultErrorHandler;

  try {
    return state.getPluralFormat(locale, filteredOptions).format(value);
  } catch (e) {
    onError(createError('Error formatting plural.', e));
  }

  return 'other';
}

function formatMessage(config, state) {
  var messageDescriptor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var values = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var locale = config.locale,
      formats = config.formats,
      messages = config.messages,
      defaultLocale = config.defaultLocale,
      defaultFormats = config.defaultFormats;
  var id = messageDescriptor.id,
      defaultMessage = messageDescriptor.defaultMessage;

  // Produce a better error if the user calls `intl.formatMessage(element)`

  if (true) {
    invariant__WEBPACK_IMPORTED_MODULE_6___default()(!Object(react__WEBPACK_IMPORTED_MODULE_4__["isValidElement"])(config), '[React Intl] Don\'t pass React elements to ' + 'formatMessage(), pass `.props`.');
  }

  // `id` is a required field of a Message Descriptor.
  invariant__WEBPACK_IMPORTED_MODULE_6___default()(id, '[React Intl] An `id` must be provided to format a message.');

  var message = messages && messages[id];
  var hasValues = Object.keys(values).length > 0;

  // Avoid expensive message formatting for simple messages without values. In
  // development messages will always be formatted in case of missing values.
  if (!hasValues && "development" === 'production') {
    return message || defaultMessage || id;
  }

  var formattedMessage = void 0;
  var onError = config.onError || defaultErrorHandler;

  if (message) {
    try {
      var formatter = state.getMessageFormat(message, locale, formats);

      formattedMessage = formatter.format(values);
    } catch (e) {
      onError(createError('Error formatting message: "' + id + '" for locale: "' + locale + '"' + (defaultMessage ? ', using default message as fallback.' : ''), e));
    }
  } else {
    // This prevents warnings from littering the console in development
    // when no `messages` are passed into the <IntlProvider> for the
    // default locale, and a default message is in the source.
    if (!defaultMessage || locale && locale.toLowerCase() !== defaultLocale.toLowerCase()) {
      onError(createError('Missing message: "' + id + '" for locale: "' + locale + '"' + (defaultMessage ? ', using default message as fallback.' : '')));
    }
  }

  if (!formattedMessage && defaultMessage) {
    try {
      var _formatter = state.getMessageFormat(defaultMessage, defaultLocale, defaultFormats);

      formattedMessage = _formatter.format(values);
    } catch (e) {
      onError(createError('Error formatting the default message for: "' + id + '"', e));
    }
  }

  if (!formattedMessage) {
    onError(createError('Cannot format message: "' + id + '", ' + ('using message ' + (message || defaultMessage ? 'source' : 'id') + ' as fallback.')));
  }

  return formattedMessage || message || defaultMessage || id;
}

function formatHTMLMessage(config, state, messageDescriptor) {
  var rawValues = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  // Process all the values before they are used when formatting the ICU
  // Message string. Since the formatted message might be injected via
  // `innerHTML`, all String-based values need to be HTML-escaped.
  var escapedValues = Object.keys(rawValues).reduce(function (escaped, name) {
    var value = rawValues[name];
    escaped[name] = typeof value === 'string' ? escape(value) : value;
    return escaped;
  }, {});

  return formatMessage(config, state, messageDescriptor, escapedValues);
}



var format = Object.freeze({
	formatDate: formatDate,
	formatTime: formatTime,
	formatRelative: formatRelative,
	formatNumber: formatNumber,
	formatPlural: formatPlural,
	formatMessage: formatMessage,
	formatHTMLMessage: formatHTMLMessage
});

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var intlConfigPropNames$1 = Object.keys(intlConfigPropTypes);
var intlFormatPropNames = Object.keys(intlFormatPropTypes);

// These are not a static property on the `IntlProvider` class so the intl
// config values can be inherited from an <IntlProvider> ancestor.
var defaultProps = {
  formats: {},
  messages: {},
  timeZone: null,
  textComponent: 'span',

  defaultLocale: 'en',
  defaultFormats: {},

  onError: defaultErrorHandler
};

var IntlProvider = function (_Component) {
  inherits(IntlProvider, _Component);

  function IntlProvider(props) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, IntlProvider);

    var _this = possibleConstructorReturn(this, (IntlProvider.__proto__ || Object.getPrototypeOf(IntlProvider)).call(this, props, context));

    invariant__WEBPACK_IMPORTED_MODULE_6___default()(typeof Intl !== 'undefined', '[React Intl] The `Intl` APIs must be available in the runtime, ' + 'and do not appear to be built-in. An `Intl` polyfill should be loaded.\n' + 'See: http://formatjs.io/guides/runtime-environments/');

    var intlContext = context.intl;

    // Used to stabilize time when performing an initial rendering so that
    // all relative times use the same reference "now" time.

    var initialNow = void 0;
    if (isFinite(props.initialNow)) {
      initialNow = Number(props.initialNow);
    } else {
      // When an `initialNow` isn't provided via `props`, look to see an
      // <IntlProvider> exists in the ancestry and call its `now()`
      // function to propagate its value for "now".
      initialNow = intlContext ? intlContext.now() : Date.now();
    }

    // Creating `Intl*` formatters is expensive. If there's a parent
    // `<IntlProvider>`, then its formatters will be used. Otherwise, this
    // memoize the `Intl*` constructors and cache them for the lifecycle of
    // this IntlProvider instance.

    var _ref = intlContext || {},
        _ref$formatters = _ref.formatters,
        formatters = _ref$formatters === undefined ? {
      getDateTimeFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(Intl.DateTimeFormat),
      getNumberFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(Intl.NumberFormat),
      getMessageFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a),
      getRelativeFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(intl_relativeformat__WEBPACK_IMPORTED_MODULE_2___default.a),
      getPluralFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(IntlPluralFormat)
    } : _ref$formatters;

    _this.state = _extends({}, formatters, {

      // Wrapper to provide stable "now" time for initial render.
      now: function now() {
        return _this._didDisplay ? Date.now() : initialNow;
      }
    });
    return _this;
  }

  createClass(IntlProvider, [{
    key: 'getConfig',
    value: function getConfig() {
      var intlContext = this.context.intl;

      // Build a whitelisted config object from `props`, defaults, and
      // `context.intl`, if an <IntlProvider> exists in the ancestry.

      var config = filterProps(this.props, intlConfigPropNames$1, intlContext);

      // Apply default props. This must be applied last after the props have
      // been resolved and inherited from any <IntlProvider> in the ancestry.
      // This matches how React resolves `defaultProps`.
      for (var propName in defaultProps) {
        if (config[propName] === undefined) {
          config[propName] = defaultProps[propName];
        }
      }

      if (!hasLocaleData(config.locale)) {
        var _config = config,
            locale = _config.locale,
            defaultLocale = _config.defaultLocale,
            defaultFormats = _config.defaultFormats,
            onError = _config.onError;


        onError(createError('Missing locale data for locale: "' + locale + '". ' + ('Using default locale: "' + defaultLocale + '" as fallback.')));

        // Since there's no registered locale data for `locale`, this will
        // fallback to the `defaultLocale` to make sure things can render.
        // The `messages` are overridden to the `defaultProps` empty object
        // to maintain referential equality across re-renders. It's assumed
        // each <FormattedMessage> contains a `defaultMessage` prop.
        config = _extends({}, config, {
          locale: defaultLocale,
          formats: defaultFormats,
          messages: defaultProps.messages
        });
      }

      return config;
    }
  }, {
    key: 'getBoundFormatFns',
    value: function getBoundFormatFns(config, state) {
      return intlFormatPropNames.reduce(function (boundFormatFns, name) {
        boundFormatFns[name] = format[name].bind(null, config, state);
        return boundFormatFns;
      }, {});
    }
  }, {
    key: 'getChildContext',
    value: function getChildContext() {
      var config = this.getConfig();

      // Bind intl factories and current config to the format functions.
      var boundFormatFns = this.getBoundFormatFns(config, this.state);

      var _state = this.state,
          now = _state.now,
          formatters = objectWithoutProperties(_state, ['now']);


      return {
        intl: _extends({}, config, boundFormatFns, {
          formatters: formatters,
          now: now
        })
      };
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._didDisplay = true;
    }
  }, {
    key: 'render',
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_4__["Children"].only(this.props.children);
    }
  }]);
  return IntlProvider;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

IntlProvider.displayName = 'IntlProvider';
IntlProvider.contextTypes = {
  intl: intlShape
};
IntlProvider.childContextTypes = {
  intl: intlShape.isRequired
};
 true ? IntlProvider.propTypes = _extends({}, intlConfigPropTypes, {
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.element.isRequired,
  initialNow: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var FormattedDate = function (_Component) {
  inherits(FormattedDate, _Component);

  function FormattedDate(props, context) {
    classCallCheck(this, FormattedDate);

    var _this = possibleConstructorReturn(this, (FormattedDate.__proto__ || Object.getPrototypeOf(FormattedDate)).call(this, props, context));

    invariantIntlContext(context);
    return _this;
  }

  createClass(FormattedDate, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatDate = _context$intl.formatDate,
          Text = _context$intl.textComponent;
      var _props = this.props,
          value = _props.value,
          children = _props.children;


      var formattedDate = formatDate(value, this.props);

      if (typeof children === 'function') {
        return children(formattedDate);
      }

      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(
        Text,
        null,
        formattedDate
      );
    }
  }]);
  return FormattedDate;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedDate.displayName = 'FormattedDate';
FormattedDate.contextTypes = {
  intl: intlShape
};
 true ? FormattedDate.propTypes = _extends({}, dateTimeFormatPropTypes, {
  value: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any.isRequired,
  format: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string,
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var FormattedTime = function (_Component) {
  inherits(FormattedTime, _Component);

  function FormattedTime(props, context) {
    classCallCheck(this, FormattedTime);

    var _this = possibleConstructorReturn(this, (FormattedTime.__proto__ || Object.getPrototypeOf(FormattedTime)).call(this, props, context));

    invariantIntlContext(context);
    return _this;
  }

  createClass(FormattedTime, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatTime = _context$intl.formatTime,
          Text = _context$intl.textComponent;
      var _props = this.props,
          value = _props.value,
          children = _props.children;


      var formattedTime = formatTime(value, this.props);

      if (typeof children === 'function') {
        return children(formattedTime);
      }

      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(
        Text,
        null,
        formattedTime
      );
    }
  }]);
  return FormattedTime;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedTime.displayName = 'FormattedTime';
FormattedTime.contextTypes = {
  intl: intlShape
};
 true ? FormattedTime.propTypes = _extends({}, dateTimeFormatPropTypes, {
  value: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any.isRequired,
  format: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string,
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var SECOND = 1000;
var MINUTE = 1000 * 60;
var HOUR = 1000 * 60 * 60;
var DAY = 1000 * 60 * 60 * 24;

// The maximum timer delay value is a 32-bit signed integer.
// See: https://mdn.io/setTimeout
var MAX_TIMER_DELAY = 2147483647;

function selectUnits(delta) {
  var absDelta = Math.abs(delta);

  if (absDelta < MINUTE) {
    return 'second';
  }

  if (absDelta < HOUR) {
    return 'minute';
  }

  if (absDelta < DAY) {
    return 'hour';
  }

  // The maximum scheduled delay will be measured in days since the maximum
  // timer delay is less than the number of milliseconds in 25 days.
  return 'day';
}

function getUnitDelay(units) {
  switch (units) {
    case 'second':
      return SECOND;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    case 'day':
      return DAY;
    default:
      return MAX_TIMER_DELAY;
  }
}

function isSameDate(a, b) {
  if (a === b) {
    return true;
  }

  var aTime = new Date(a).getTime();
  var bTime = new Date(b).getTime();

  return isFinite(aTime) && isFinite(bTime) && aTime === bTime;
}

var FormattedRelative = function (_Component) {
  inherits(FormattedRelative, _Component);

  function FormattedRelative(props, context) {
    classCallCheck(this, FormattedRelative);

    var _this = possibleConstructorReturn(this, (FormattedRelative.__proto__ || Object.getPrototypeOf(FormattedRelative)).call(this, props, context));

    invariantIntlContext(context);

    var now = isFinite(props.initialNow) ? Number(props.initialNow) : context.intl.now();

    // `now` is stored as state so that `render()` remains a function of
    // props + state, instead of accessing `Date.now()` inside `render()`.
    _this.state = { now: now };
    return _this;
  }

  createClass(FormattedRelative, [{
    key: 'scheduleNextUpdate',
    value: function scheduleNextUpdate(props, state) {
      var _this2 = this;

      // Cancel and pending update because we're scheduling a new update.
      clearTimeout(this._timer);

      var value = props.value,
          units = props.units,
          updateInterval = props.updateInterval;

      var time = new Date(value).getTime();

      // If the `updateInterval` is falsy, including `0` or we don't have a
      // valid date, then auto updates have been turned off, so we bail and
      // skip scheduling an update.
      if (!updateInterval || !isFinite(time)) {
        return;
      }

      var delta = time - state.now;
      var unitDelay = getUnitDelay(units || selectUnits(delta));
      var unitRemainder = Math.abs(delta % unitDelay);

      // We want the largest possible timer delay which will still display
      // accurate information while reducing unnecessary re-renders. The delay
      // should be until the next "interesting" moment, like a tick from
      // "1 minute ago" to "2 minutes ago" when the delta is 120,000ms.
      var delay = delta < 0 ? Math.max(updateInterval, unitDelay - unitRemainder) : Math.max(updateInterval, unitRemainder);

      this._timer = setTimeout(function () {
        _this2.setState({ now: _this2.context.intl.now() });
      }, delay);
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.scheduleNextUpdate(this.props, this.state);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(_ref) {
      var nextValue = _ref.value;

      // When the `props.value` date changes, `state.now` needs to be updated,
      // and the next update can be rescheduled.
      if (!isSameDate(nextValue, this.props.value)) {
        this.setState({ now: this.context.intl.now() });
      }
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps, nextState) {
      this.scheduleNextUpdate(nextProps, nextState);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      clearTimeout(this._timer);
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatRelative = _context$intl.formatRelative,
          Text = _context$intl.textComponent;
      var _props = this.props,
          value = _props.value,
          children = _props.children;


      var formattedRelative = formatRelative(value, _extends({}, this.props, this.state));

      if (typeof children === 'function') {
        return children(formattedRelative);
      }

      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(
        Text,
        null,
        formattedRelative
      );
    }
  }]);
  return FormattedRelative;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedRelative.displayName = 'FormattedRelative';
FormattedRelative.contextTypes = {
  intl: intlShape
};
FormattedRelative.defaultProps = {
  updateInterval: 1000 * 10
};
 true ? FormattedRelative.propTypes = _extends({}, relativeFormatPropTypes, {
  value: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any.isRequired,
  format: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string,
  updateInterval: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.number,
  initialNow: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any,
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var FormattedNumber = function (_Component) {
  inherits(FormattedNumber, _Component);

  function FormattedNumber(props, context) {
    classCallCheck(this, FormattedNumber);

    var _this = possibleConstructorReturn(this, (FormattedNumber.__proto__ || Object.getPrototypeOf(FormattedNumber)).call(this, props, context));

    invariantIntlContext(context);
    return _this;
  }

  createClass(FormattedNumber, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatNumber = _context$intl.formatNumber,
          Text = _context$intl.textComponent;
      var _props = this.props,
          value = _props.value,
          children = _props.children;


      var formattedNumber = formatNumber(value, this.props);

      if (typeof children === 'function') {
        return children(formattedNumber);
      }

      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(
        Text,
        null,
        formattedNumber
      );
    }
  }]);
  return FormattedNumber;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedNumber.displayName = 'FormattedNumber';
FormattedNumber.contextTypes = {
  intl: intlShape
};
 true ? FormattedNumber.propTypes = _extends({}, numberFormatPropTypes, {
  value: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any.isRequired,
  format: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string,
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var FormattedPlural = function (_Component) {
  inherits(FormattedPlural, _Component);

  function FormattedPlural(props, context) {
    classCallCheck(this, FormattedPlural);

    var _this = possibleConstructorReturn(this, (FormattedPlural.__proto__ || Object.getPrototypeOf(FormattedPlural)).call(this, props, context));

    invariantIntlContext(context);
    return _this;
  }

  createClass(FormattedPlural, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate() {
      for (var _len = arguments.length, next = Array(_len), _key = 0; _key < _len; _key++) {
        next[_key] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatPlural = _context$intl.formatPlural,
          Text = _context$intl.textComponent;
      var _props = this.props,
          value = _props.value,
          other = _props.other,
          children = _props.children;


      var pluralCategory = formatPlural(value, this.props);
      var formattedPlural = this.props[pluralCategory] || other;

      if (typeof children === 'function') {
        return children(formattedPlural);
      }

      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(
        Text,
        null,
        formattedPlural
      );
    }
  }]);
  return FormattedPlural;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedPlural.displayName = 'FormattedPlural';
FormattedPlural.contextTypes = {
  intl: intlShape
};
FormattedPlural.defaultProps = {
  style: 'cardinal'
};
 true ? FormattedPlural.propTypes = _extends({}, pluralFormatPropTypes, {
  value: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.any.isRequired,

  other: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node.isRequired,
  zero: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node,
  one: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node,
  two: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node,
  few: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node,
  many: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.node,

  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var defaultFormatMessage = function defaultFormatMessage(descriptor, values) {
  if (true) {
    console.error('[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry. Using default message as fallback.');
  }
  return formatMessage({}, { getMessageFormat: intl_format_cache__WEBPACK_IMPORTED_MODULE_7___default()(intl_messageformat__WEBPACK_IMPORTED_MODULE_1___default.a) }, descriptor, values);
};

var FormattedMessage = function (_Component) {
  inherits(FormattedMessage, _Component);

  function FormattedMessage(props, context) {
    classCallCheck(this, FormattedMessage);

    var _this = possibleConstructorReturn(this, (FormattedMessage.__proto__ || Object.getPrototypeOf(FormattedMessage)).call(this, props, context));

    if (!props.defaultMessage) {
      invariantIntlContext(context);
    }
    return _this;
  }

  createClass(FormattedMessage, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      var values = this.props.values;
      var nextValues = nextProps.values;


      if (!shallowEquals(nextValues, values)) {
        return true;
      }

      // Since `values` has already been checked, we know they're not
      // different, so the current `values` are carried over so the shallow
      // equals comparison on the other props isn't affected by the `values`.
      var nextPropsToCheck = _extends({}, nextProps, {
        values: values
      });

      for (var _len = arguments.length, next = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        next[_key - 1] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this, nextPropsToCheck].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _ref = this.context.intl || {},
          _ref$formatMessage = _ref.formatMessage,
          formatMessage$$1 = _ref$formatMessage === undefined ? defaultFormatMessage : _ref$formatMessage,
          _ref$textComponent = _ref.textComponent,
          Text = _ref$textComponent === undefined ? 'span' : _ref$textComponent;

      var _props = this.props,
          id = _props.id,
          description = _props.description,
          defaultMessage = _props.defaultMessage,
          values = _props.values,
          _props$tagName = _props.tagName,
          Component$$1 = _props$tagName === undefined ? Text : _props$tagName,
          children = _props.children;


      var tokenDelimiter = void 0;
      var tokenizedValues = void 0;
      var elements = void 0;

      var hasValues = values && Object.keys(values).length > 0;
      if (hasValues) {
        // Creates a token with a random UID that should not be guessable or
        // conflict with other parts of the `message` string.
        var uid = Math.floor(Math.random() * 0x10000000000).toString(16);

        var generateToken = function () {
          var counter = 0;
          return function () {
            return 'ELEMENT-' + uid + '-' + (counter += 1);
          };
        }();

        // Splitting with a delimiter to support IE8. When using a regex
        // with a capture group IE8 does not include the capture group in
        // the resulting array.
        tokenDelimiter = '@__' + uid + '__@';
        tokenizedValues = {};
        elements = {};

        // Iterates over the `props` to keep track of any React Element
        // values so they can be represented by the `token` as a placeholder
        // when the `message` is formatted. This allows the formatted
        // message to then be broken-up into parts with references to the
        // React Elements inserted back in.
        Object.keys(values).forEach(function (name) {
          var value = values[name];

          if (Object(react__WEBPACK_IMPORTED_MODULE_4__["isValidElement"])(value)) {
            var token = generateToken();
            tokenizedValues[name] = tokenDelimiter + token + tokenDelimiter;
            elements[token] = value;
          } else {
            tokenizedValues[name] = value;
          }
        });
      }

      var descriptor = { id: id, description: description, defaultMessage: defaultMessage };
      var formattedMessage = formatMessage$$1(descriptor, tokenizedValues || values);

      var nodes = void 0;

      var hasElements = elements && Object.keys(elements).length > 0;
      if (hasElements) {
        // Split the message into parts so the React Element values captured
        // above can be inserted back into the rendered message. This
        // approach allows messages to render with React Elements while
        // keeping React's virtual diffing working properly.
        nodes = formattedMessage.split(tokenDelimiter).filter(function (part) {
          return !!part;
        }).map(function (part) {
          return elements[part] || part;
        });
      } else {
        nodes = [formattedMessage];
      }

      if (typeof children === 'function') {
        return children.apply(undefined, toConsumableArray(nodes));
      }

      // Needs to use `createElement()` instead of JSX, otherwise React will
      // warn about a missing `key` prop with rich-text message formatting.
      return react__WEBPACK_IMPORTED_MODULE_4__["createElement"].apply(undefined, [Component$$1, null].concat(toConsumableArray(nodes)));
    }
  }]);
  return FormattedMessage;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedMessage.displayName = 'FormattedMessage';
FormattedMessage.contextTypes = {
  intl: intlShape
};
FormattedMessage.defaultProps = {
  values: {}
};
 true ? FormattedMessage.propTypes = _extends({}, messageDescriptorPropTypes, {
  values: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.object,
  tagName: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.oneOfType([prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string, prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.element]),
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var FormattedHTMLMessage = function (_Component) {
  inherits(FormattedHTMLMessage, _Component);

  function FormattedHTMLMessage(props, context) {
    classCallCheck(this, FormattedHTMLMessage);

    var _this = possibleConstructorReturn(this, (FormattedHTMLMessage.__proto__ || Object.getPrototypeOf(FormattedHTMLMessage)).call(this, props, context));

    invariantIntlContext(context);
    return _this;
  }

  createClass(FormattedHTMLMessage, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      var values = this.props.values;
      var nextValues = nextProps.values;


      if (!shallowEquals(nextValues, values)) {
        return true;
      }

      // Since `values` has already been checked, we know they're not
      // different, so the current `values` are carried over so the shallow
      // equals comparison on the other props isn't affected by the `values`.
      var nextPropsToCheck = _extends({}, nextProps, {
        values: values
      });

      for (var _len = arguments.length, next = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        next[_key - 1] = arguments[_key];
      }

      return shouldIntlComponentUpdate.apply(undefined, [this, nextPropsToCheck].concat(next));
    }
  }, {
    key: 'render',
    value: function render() {
      var _context$intl = this.context.intl,
          formatHTMLMessage = _context$intl.formatHTMLMessage,
          Text = _context$intl.textComponent;
      var _props = this.props,
          id = _props.id,
          description = _props.description,
          defaultMessage = _props.defaultMessage,
          rawValues = _props.values,
          _props$tagName = _props.tagName,
          Component$$1 = _props$tagName === undefined ? Text : _props$tagName,
          children = _props.children;


      var descriptor = { id: id, description: description, defaultMessage: defaultMessage };
      var formattedHTMLMessage = formatHTMLMessage(descriptor, rawValues);

      if (typeof children === 'function') {
        return children(formattedHTMLMessage);
      }

      // Since the message presumably has HTML in it, we need to set
      // `innerHTML` in order for it to be rendered and not escaped by React.
      // To be safe, all string prop values were escaped when formatting the
      // message. It is assumed that the message is not UGC, and came from the
      // developer making it more like a template.
      //
      // Note: There's a perf impact of using this component since there's no
      // way for React to do its virtual DOM diffing.
      var html = { __html: formattedHTMLMessage };
      return react__WEBPACK_IMPORTED_MODULE_4___default.a.createElement(Component$$1, { dangerouslySetInnerHTML: html });
    }
  }]);
  return FormattedHTMLMessage;
}(react__WEBPACK_IMPORTED_MODULE_4__["Component"]);

FormattedHTMLMessage.displayName = 'FormattedHTMLMessage';
FormattedHTMLMessage.contextTypes = {
  intl: intlShape
};
FormattedHTMLMessage.defaultProps = {
  values: {}
};
 true ? FormattedHTMLMessage.propTypes = _extends({}, messageDescriptorPropTypes, {
  values: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.object,
  tagName: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.string,
  children: prop_types__WEBPACK_IMPORTED_MODULE_3___default.a.func
}) : undefined;

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

addLocaleData(defaultLocaleData);

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

addLocaleData(_locale_data_index_js__WEBPACK_IMPORTED_MODULE_0___default.a);




/***/ }),

/***/ "./node_modules/react-intl/locale-data/en.js":
/*!***************************************************!*\
  !*** ./node_modules/react-intl/locale-data/en.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

!function(e,a){ true?module.exports=a():undefined}(this,function(){"use strict";return[{locale:"en",pluralRuleFunction:function(e,a){var t=String(e).split("."),o=!t[1],n=Number(t[0])==e,r=n&&t[0].slice(-1),i=n&&t[0].slice(-2);return a?1==r&&11!=i?"one":2==r&&12!=i?"two":3==r&&13!=i?"few":"other":1==e&&o?"one":"other"},fields:{year:{displayName:"year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{one:"in {0} year",other:"in {0} years"},past:{one:"{0} year ago",other:"{0} years ago"}}},"year-short":{displayName:"yr.",relative:{0:"this yr.",1:"next yr.","-1":"last yr."},relativeTime:{future:{one:"in {0} yr.",other:"in {0} yr."},past:{one:"{0} yr. ago",other:"{0} yr. ago"}}},month:{displayName:"month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{one:"in {0} month",other:"in {0} months"},past:{one:"{0} month ago",other:"{0} months ago"}}},"month-short":{displayName:"mo.",relative:{0:"this mo.",1:"next mo.","-1":"last mo."},relativeTime:{future:{one:"in {0} mo.",other:"in {0} mo."},past:{one:"{0} mo. ago",other:"{0} mo. ago"}}},day:{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},"day-short":{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},hour:{displayName:"hour",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hour",other:"in {0} hours"},past:{one:"{0} hour ago",other:"{0} hours ago"}}},"hour-short":{displayName:"hr.",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hr.",other:"in {0} hr."},past:{one:"{0} hr. ago",other:"{0} hr. ago"}}},minute:{displayName:"minute",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} minute",other:"in {0} minutes"},past:{one:"{0} minute ago",other:"{0} minutes ago"}}},"minute-short":{displayName:"min.",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} min.",other:"in {0} min."},past:{one:"{0} min. ago",other:"{0} min. ago"}}},second:{displayName:"second",relative:{0:"now"},relativeTime:{future:{one:"in {0} second",other:"in {0} seconds"},past:{one:"{0} second ago",other:"{0} seconds ago"}}},"second-short":{displayName:"sec.",relative:{0:"now"},relativeTime:{future:{one:"in {0} sec.",other:"in {0} sec."},past:{one:"{0} sec. ago",other:"{0} sec. ago"}}}}},{locale:"en-001",parentLocale:"en",fields:{year:{displayName:"year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{one:"in {0} year",other:"in {0} years"},past:{one:"{0} year ago",other:"{0} years ago"}}},"year-short":{displayName:"yr",relative:{0:"this yr.",1:"next yr.","-1":"last yr."},relativeTime:{future:{one:"in {0} yr",other:"in {0} yr"},past:{one:"{0} yr ago",other:"{0} yr ago"}}},month:{displayName:"month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{one:"in {0} month",other:"in {0} months"},past:{one:"{0} month ago",other:"{0} months ago"}}},"month-short":{displayName:"mo",relative:{0:"this mo.",1:"next mo.","-1":"last mo."},relativeTime:{future:{one:"in {0} mo",other:"in {0} mo"},past:{one:"{0} mo ago",other:"{0} mo ago"}}},day:{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},"day-short":{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},hour:{displayName:"hour",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hour",other:"in {0} hours"},past:{one:"{0} hour ago",other:"{0} hours ago"}}},"hour-short":{displayName:"hr",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hr",other:"in {0} hr"},past:{one:"{0} hr ago",other:"{0} hr ago"}}},minute:{displayName:"minute",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} minute",other:"in {0} minutes"},past:{one:"{0} minute ago",other:"{0} minutes ago"}}},"minute-short":{displayName:"min",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} min",other:"in {0} min"},past:{one:"{0} min ago",other:"{0} min ago"}}},second:{displayName:"second",relative:{0:"now"},relativeTime:{future:{one:"in {0} second",other:"in {0} seconds"},past:{one:"{0} second ago",other:"{0} seconds ago"}}},"second-short":{displayName:"sec",relative:{0:"now"},relativeTime:{future:{one:"in {0} sec",other:"in {0} sec"},past:{one:"{0} sec ago",other:"{0} sec ago"}}}}},{locale:"en-150",parentLocale:"en-001"},{locale:"en-AG",parentLocale:"en-001"},{locale:"en-AI",parentLocale:"en-001"},{locale:"en-AS",parentLocale:"en"},{locale:"en-AT",parentLocale:"en-150"},{locale:"en-AU",parentLocale:"en-001",fields:{year:{displayName:"year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{one:"in {0} year",other:"in {0} years"},past:{one:"{0} year ago",other:"{0} years ago"}}},"year-short":{displayName:"yr",relative:{0:"this yr.",1:"next yr.","-1":"last yr."},relativeTime:{future:{one:"in {0} yr",other:"in {0} yrs"},past:{one:"{0} yr ago",other:"{0} yrs ago"}}},month:{displayName:"month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{one:"in {0} month",other:"in {0} months"},past:{one:"{0} month ago",other:"{0} months ago"}}},"month-short":{displayName:"mo.",relative:{0:"this mo.",1:"next mo.","-1":"last mo."},relativeTime:{future:{one:"in {0} mo.",other:"in {0} mo."},past:{one:"{0} mo. ago",other:"{0} mo. ago"}}},day:{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},"day-short":{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},hour:{displayName:"hour",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hour",other:"in {0} hours"},past:{one:"{0} hour ago",other:"{0} hours ago"}}},"hour-short":{displayName:"h",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hr",other:"in {0} hrs"},past:{one:"{0} hr ago",other:"{0} hrs ago"}}},minute:{displayName:"minute",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} minute",other:"in {0} minutes"},past:{one:"{0} minute ago",other:"{0} minutes ago"}}},"minute-short":{displayName:"min.",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} min.",other:"in {0} mins"},past:{one:"{0} min. ago",other:"{0} mins ago"}}},second:{displayName:"second",relative:{0:"now"},relativeTime:{future:{one:"in {0} second",other:"in {0} seconds"},past:{one:"{0} second ago",other:"{0} seconds ago"}}},"second-short":{displayName:"sec.",relative:{0:"now"},relativeTime:{future:{one:"in {0} sec.",other:"in {0} secs"},past:{one:"{0} sec. ago",other:"{0} secs ago"}}}}},{locale:"en-BB",parentLocale:"en-001"},{locale:"en-BE",parentLocale:"en-001"},{locale:"en-BI",parentLocale:"en"},{locale:"en-BM",parentLocale:"en-001"},{locale:"en-BS",parentLocale:"en-001"},{locale:"en-BW",parentLocale:"en-001"},{locale:"en-BZ",parentLocale:"en-001"},{locale:"en-CA",parentLocale:"en-001",fields:{year:{displayName:"year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{one:"in {0} year",other:"in {0} years"},past:{one:"{0} year ago",other:"{0} years ago"}}},"year-short":{displayName:"yr.",relative:{0:"this yr.",1:"next yr.","-1":"last yr."},relativeTime:{future:{one:"in {0} yr.",other:"in {0} yrs."},past:{one:"{0} yr. ago",other:"{0} yrs. ago"}}},month:{displayName:"month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{one:"in {0} month",other:"in {0} months"},past:{one:"{0} month ago",other:"{0} months ago"}}},"month-short":{displayName:"mo.",relative:{0:"this mo.",1:"next mo.","-1":"last mo."},relativeTime:{future:{one:"in {0} mo.",other:"in {0} mos."},past:{one:"{0} mo. ago",other:"{0} mos. ago"}}},day:{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},"day-short":{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},hour:{displayName:"hour",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hour",other:"in {0} hours"},past:{one:"{0} hour ago",other:"{0} hours ago"}}},"hour-short":{displayName:"hr.",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hr.",other:"in {0} hrs."},past:{one:"{0} hr. ago",other:"{0} hrs. ago"}}},minute:{displayName:"minute",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} minute",other:"in {0} minutes"},past:{one:"{0} minute ago",other:"{0} minutes ago"}}},"minute-short":{displayName:"min.",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} min.",other:"in {0} mins."},past:{one:"{0} min. ago",other:"{0} mins. ago"}}},second:{displayName:"second",relative:{0:"now"},relativeTime:{future:{one:"in {0} second",other:"in {0} seconds"},past:{one:"{0} second ago",other:"{0} seconds ago"}}},"second-short":{displayName:"sec.",relative:{0:"now"},relativeTime:{future:{one:"in {0} sec.",other:"in {0} secs."},past:{one:"{0} sec. ago",other:"{0} secs. ago"}}}}},{locale:"en-CC",parentLocale:"en-001"},{locale:"en-CH",parentLocale:"en-150"},{locale:"en-CK",parentLocale:"en-001"},{locale:"en-CM",parentLocale:"en-001"},{locale:"en-CX",parentLocale:"en-001"},{locale:"en-CY",parentLocale:"en-001"},{locale:"en-DE",parentLocale:"en-150"},{locale:"en-DG",parentLocale:"en-001"},{locale:"en-DK",parentLocale:"en-150"},{locale:"en-DM",parentLocale:"en-001"},{locale:"en-Dsrt",pluralRuleFunction:function(e,a){return"other"},fields:{year:{displayName:"Year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{other:"+{0} y"},past:{other:"-{0} y"}}},"year-short":{displayName:"Year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{other:"+{0} y"},past:{other:"-{0} y"}}},month:{displayName:"Month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{other:"+{0} m"},past:{other:"-{0} m"}}},"month-short":{displayName:"Month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{other:"+{0} m"},past:{other:"-{0} m"}}},day:{displayName:"Day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{other:"+{0} d"},past:{other:"-{0} d"}}},"day-short":{displayName:"Day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{other:"+{0} d"},past:{other:"-{0} d"}}},hour:{displayName:"Hour",relative:{0:"this hour"},relativeTime:{future:{other:"+{0} h"},past:{other:"-{0} h"}}},"hour-short":{displayName:"Hour",relative:{0:"this hour"},relativeTime:{future:{other:"+{0} h"},past:{other:"-{0} h"}}},minute:{displayName:"Minute",relative:{0:"this minute"},relativeTime:{future:{other:"+{0} min"},past:{other:"-{0} min"}}},"minute-short":{displayName:"Minute",relative:{0:"this minute"},relativeTime:{future:{other:"+{0} min"},past:{other:"-{0} min"}}},second:{displayName:"Second",relative:{0:"now"},relativeTime:{future:{other:"+{0} s"},past:{other:"-{0} s"}}},"second-short":{displayName:"Second",relative:{0:"now"},relativeTime:{future:{other:"+{0} s"},past:{other:"-{0} s"}}}}},{locale:"en-ER",parentLocale:"en-001"},{locale:"en-FI",parentLocale:"en-150"},{locale:"en-FJ",parentLocale:"en-001"},{locale:"en-FK",parentLocale:"en-001"},{locale:"en-FM",parentLocale:"en-001"},{locale:"en-GB",parentLocale:"en-001"},{locale:"en-GD",parentLocale:"en-001"},{locale:"en-GG",parentLocale:"en-001"},{locale:"en-GH",parentLocale:"en-001"},{locale:"en-GI",parentLocale:"en-001"},{locale:"en-GM",parentLocale:"en-001"},{locale:"en-GU",parentLocale:"en"},{locale:"en-GY",parentLocale:"en-001"},{locale:"en-HK",parentLocale:"en-001"},{locale:"en-IE",parentLocale:"en-001"},{locale:"en-IL",parentLocale:"en-001"},{locale:"en-IM",parentLocale:"en-001"},{locale:"en-IN",parentLocale:"en-001"},{locale:"en-IO",parentLocale:"en-001"},{locale:"en-JE",parentLocale:"en-001"},{locale:"en-JM",parentLocale:"en-001"},{locale:"en-KE",parentLocale:"en-001"},{locale:"en-KI",parentLocale:"en-001"},{locale:"en-KN",parentLocale:"en-001"},{locale:"en-KY",parentLocale:"en-001"},{locale:"en-LC",parentLocale:"en-001"},{locale:"en-LR",parentLocale:"en-001"},{locale:"en-LS",parentLocale:"en-001"},{locale:"en-MG",parentLocale:"en-001"},{locale:"en-MH",parentLocale:"en"},{locale:"en-MO",parentLocale:"en-001"},{locale:"en-MP",parentLocale:"en"},{locale:"en-MS",parentLocale:"en-001"},{locale:"en-MT",parentLocale:"en-001"},{locale:"en-MU",parentLocale:"en-001"},{locale:"en-MW",parentLocale:"en-001"},{locale:"en-MY",parentLocale:"en-001"},{locale:"en-NA",parentLocale:"en-001"},{locale:"en-NF",parentLocale:"en-001"},{locale:"en-NG",parentLocale:"en-001"},{locale:"en-NL",parentLocale:"en-150"},{locale:"en-NR",parentLocale:"en-001"},{locale:"en-NU",parentLocale:"en-001"},{locale:"en-NZ",parentLocale:"en-001"},{locale:"en-PG",parentLocale:"en-001"},{locale:"en-PH",parentLocale:"en-001"},{locale:"en-PK",parentLocale:"en-001"},{locale:"en-PN",parentLocale:"en-001"},{locale:"en-PR",parentLocale:"en"},{locale:"en-PW",parentLocale:"en-001"},{locale:"en-RW",parentLocale:"en-001"},{locale:"en-SB",parentLocale:"en-001"},{locale:"en-SC",parentLocale:"en-001"},{locale:"en-SD",parentLocale:"en-001"},{locale:"en-SE",parentLocale:"en-150"},{locale:"en-SG",parentLocale:"en-001",fields:{year:{displayName:"year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{one:"in {0} year",other:"in {0} years"},past:{one:"{0} year ago",other:"{0} years ago"}}},"year-short":{displayName:"yr",relative:{0:"this yr",1:"next yr","-1":"last yr"},relativeTime:{future:{one:"in {0} yr",other:"in {0} yr"},past:{one:"{0} yr ago",other:"{0} yr ago"}}},month:{displayName:"month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{one:"in {0} month",other:"in {0} months"},past:{one:"{0} month ago",other:"{0} months ago"}}},"month-short":{displayName:"mth",relative:{0:"this mth",1:"next mth","-1":"last mth"},relativeTime:{future:{one:"in {0} mth",other:"in {0} mth"},past:{one:"{0} mth ago",other:"{0} mth ago"}}},day:{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},"day-short":{displayName:"day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{one:"in {0} day",other:"in {0} days"},past:{one:"{0} day ago",other:"{0} days ago"}}},hour:{displayName:"hour",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hour",other:"in {0} hours"},past:{one:"{0} hour ago",other:"{0} hours ago"}}},"hour-short":{displayName:"hr",relative:{0:"this hour"},relativeTime:{future:{one:"in {0} hr",other:"in {0} hr"},past:{one:"{0} hr ago",other:"{0} hr ago"}}},minute:{displayName:"minute",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} minute",other:"in {0} minutes"},past:{one:"{0} minute ago",other:"{0} minutes ago"}}},"minute-short":{displayName:"min",relative:{0:"this minute"},relativeTime:{future:{one:"in {0} min",other:"in {0} min"},past:{one:"{0} min ago",other:"{0} min ago"}}},second:{displayName:"second",relative:{0:"now"},relativeTime:{future:{one:"in {0} second",other:"in {0} seconds"},past:{one:"{0} second ago",other:"{0} seconds ago"}}},"second-short":{displayName:"sec",relative:{0:"now"},relativeTime:{future:{one:"in {0} sec",other:"in {0} sec"},past:{one:"{0} sec ago",other:"{0} sec ago"}}}}},{locale:"en-SH",parentLocale:"en-001"},{locale:"en-SI",parentLocale:"en-150"},{locale:"en-SL",parentLocale:"en-001"},{locale:"en-SS",parentLocale:"en-001"},{locale:"en-SX",parentLocale:"en-001"},{locale:"en-SZ",parentLocale:"en-001"},{locale:"en-Shaw",pluralRuleFunction:function(e,a){return"other"},fields:{year:{displayName:"Year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{other:"+{0} y"},past:{other:"-{0} y"}}},"year-short":{displayName:"Year",relative:{0:"this year",1:"next year","-1":"last year"},relativeTime:{future:{other:"+{0} y"},past:{other:"-{0} y"}}},month:{displayName:"Month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{other:"+{0} m"},past:{other:"-{0} m"}}},"month-short":{displayName:"Month",relative:{0:"this month",1:"next month","-1":"last month"},relativeTime:{future:{other:"+{0} m"},past:{other:"-{0} m"}}},day:{displayName:"Day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{other:"+{0} d"},past:{other:"-{0} d"}}},"day-short":{displayName:"Day",relative:{0:"today",1:"tomorrow","-1":"yesterday"},relativeTime:{future:{other:"+{0} d"},past:{other:"-{0} d"}}},hour:{displayName:"Hour",relative:{0:"this hour"},relativeTime:{future:{other:"+{0} h"},past:{other:"-{0} h"}}},"hour-short":{displayName:"Hour",relative:{0:"this hour"},relativeTime:{future:{other:"+{0} h"},past:{other:"-{0} h"}}},minute:{displayName:"Minute",relative:{0:"this minute"},relativeTime:{future:{other:"+{0} min"},past:{other:"-{0} min"}}},"minute-short":{displayName:"Minute",relative:{0:"this minute"},relativeTime:{future:{other:"+{0} min"},past:{other:"-{0} min"}}},second:{displayName:"Second",relative:{0:"now"},relativeTime:{future:{other:"+{0} s"},past:{other:"-{0} s"}}},"second-short":{displayName:"Second",relative:{0:"now"},relativeTime:{future:{other:"+{0} s"},past:{other:"-{0} s"}}}}},{locale:"en-TC",parentLocale:"en-001"},{locale:"en-TK",parentLocale:"en-001"},{locale:"en-TO",parentLocale:"en-001"},{locale:"en-TT",parentLocale:"en-001"},{locale:"en-TV",parentLocale:"en-001"},{locale:"en-TZ",parentLocale:"en-001"},{locale:"en-UG",parentLocale:"en-001"},{locale:"en-UM",parentLocale:"en"},{locale:"en-US",parentLocale:"en"},{locale:"en-VC",parentLocale:"en-001"},{locale:"en-VG",parentLocale:"en-001"},{locale:"en-VI",parentLocale:"en"},{locale:"en-VU",parentLocale:"en-001"},{locale:"en-WS",parentLocale:"en-001"},{locale:"en-ZA",parentLocale:"en-001"},{locale:"en-ZM",parentLocale:"en-001"},{locale:"en-ZW",parentLocale:"en-001"}]});


/***/ }),

/***/ "./node_modules/react-intl/locale-data/fr.js":
/*!***************************************************!*\
  !*** ./node_modules/react-intl/locale-data/fr.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

!function(e,a){ true?module.exports=a():undefined}(this,function(){"use strict";return[{locale:"fr",pluralRuleFunction:function(e,a){return a?1==e?"one":"other":e>=0&&e<2?"one":"other"},fields:{year:{displayName:"année",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"dans {0} an",other:"dans {0} ans"},past:{one:"il y a {0} an",other:"il y a {0} ans"}}},"year-short":{displayName:"an",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"dans {0} a",other:"dans {0} a"},past:{one:"il y a {0} a",other:"il y a {0} a"}}},month:{displayName:"mois",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} mois",other:"dans {0} mois"},past:{one:"il y a {0} mois",other:"il y a {0} mois"}}},"month-short":{displayName:"m.",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} m.",other:"dans {0} m."},past:{one:"il y a {0} m.",other:"il y a {0} m."}}},day:{displayName:"jour",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} jour",other:"dans {0} jours"},past:{one:"il y a {0} jour",other:"il y a {0} jours"}}},"day-short":{displayName:"j",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} j",other:"dans {0} j"},past:{one:"il y a {0} j",other:"il y a {0} j"}}},hour:{displayName:"heure",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} heure",other:"dans {0} heures"},past:{one:"il y a {0} heure",other:"il y a {0} heures"}}},"hour-short":{displayName:"h",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} h",other:"dans {0} h"},past:{one:"il y a {0} h",other:"il y a {0} h"}}},minute:{displayName:"minute",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} minute",other:"dans {0} minutes"},past:{one:"il y a {0} minute",other:"il y a {0} minutes"}}},"minute-short":{displayName:"min",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} min",other:"dans {0} min"},past:{one:"il y a {0} min",other:"il y a {0} min"}}},second:{displayName:"seconde",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} seconde",other:"dans {0} secondes"},past:{one:"il y a {0} seconde",other:"il y a {0} secondes"}}},"second-short":{displayName:"s",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} s",other:"dans {0} s"},past:{one:"il y a {0} s",other:"il y a {0} s"}}}}},{locale:"fr-BE",parentLocale:"fr"},{locale:"fr-BF",parentLocale:"fr"},{locale:"fr-BI",parentLocale:"fr"},{locale:"fr-BJ",parentLocale:"fr"},{locale:"fr-BL",parentLocale:"fr"},{locale:"fr-CA",parentLocale:"fr",fields:{year:{displayName:"année",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"Dans {0} an",other:"Dans {0} ans"},past:{one:"Il y a {0} an",other:"Il y a {0} ans"}}},"year-short":{displayName:"a",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"dans {0} a",other:"dans {0} a"},past:{one:"il y a {0} a",other:"il y a {0} a"}}},month:{displayName:"mois",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} mois",other:"dans {0} mois"},past:{one:"il y a {0} mois",other:"il y a {0} mois"}}},"month-short":{displayName:"m.",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} m.",other:"dans {0} m."},past:{one:"il y a {0} m.",other:"il y a {0} m."}}},day:{displayName:"jour",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} jour",other:"dans {0} jours"},past:{one:"il y a {0} jour",other:"il y a {0} jours"}}},"day-short":{displayName:"j",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} j",other:"dans {0} j"},past:{one:"il y a {0} j",other:"il y a {0} j"}}},hour:{displayName:"heure",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} heure",other:"dans {0} heures"},past:{one:"il y a {0} heure",other:"il y a {0} heures"}}},"hour-short":{displayName:"h",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} h",other:"dans {0} h"},past:{one:"il y a {0} h",other:"il y a {0} h"}}},minute:{displayName:"minute",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} minute",other:"dans {0} minutes"},past:{one:"il y a {0} minute",other:"il y a {0} minutes"}}},"minute-short":{displayName:"min",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} min",other:"dans {0} min"},past:{one:"il y a {0} min",other:"il y a {0} min"}}},second:{displayName:"seconde",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} seconde",other:"dans {0} secondes"},past:{one:"il y a {0} seconde",other:"il y a {0} secondes"}}},"second-short":{displayName:"s",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} s",other:"dans {0} s"},past:{one:"il y a {0} s",other:"il y a {0} s"}}}}},{locale:"fr-CD",parentLocale:"fr"},{locale:"fr-CF",parentLocale:"fr"},{locale:"fr-CG",parentLocale:"fr"},{locale:"fr-CH",parentLocale:"fr"},{locale:"fr-CI",parentLocale:"fr"},{locale:"fr-CM",parentLocale:"fr"},{locale:"fr-DJ",parentLocale:"fr"},{locale:"fr-DZ",parentLocale:"fr"},{locale:"fr-GA",parentLocale:"fr"},{locale:"fr-GF",parentLocale:"fr"},{locale:"fr-GN",parentLocale:"fr"},{locale:"fr-GP",parentLocale:"fr"},{locale:"fr-GQ",parentLocale:"fr"},{locale:"fr-HT",parentLocale:"fr",fields:{year:{displayName:"année",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"dans {0} an",other:"dans {0} ans"},past:{one:"il y a {0} an",other:"il y a {0} ans"}}},"year-short":{displayName:"an",relative:{0:"cette année",1:"l’année prochaine","-1":"l’année dernière"},relativeTime:{future:{one:"dans {0} a",other:"dans {0} a"},past:{one:"il y a {0} a",other:"il y a {0} a"}}},month:{displayName:"mois",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} mois",other:"dans {0} mois"},past:{one:"il y a {0} mois",other:"il y a {0} mois"}}},"month-short":{displayName:"m.",relative:{0:"ce mois-ci",1:"le mois prochain","-1":"le mois dernier"},relativeTime:{future:{one:"dans {0} m.",other:"dans {0} m."},past:{one:"il y a {0} m.",other:"il y a {0} m."}}},day:{displayName:"jour",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} jour",other:"dans {0} jours"},past:{one:"il y a {0} jour",other:"il y a {0} jours"}}},"day-short":{displayName:"jr.",relative:{0:"aujourd’hui",1:"demain",2:"après-demain","-2":"avant-hier","-1":"hier"},relativeTime:{future:{one:"dans {0} j",other:"dans {0} j"},past:{one:"il y a {0} j",other:"il y a {0} j"}}},hour:{displayName:"heure",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} heure",other:"dans {0} heures"},past:{one:"il y a {0} heure",other:"il y a {0} heures"}}},"hour-short":{displayName:"hr",relative:{0:"cette heure-ci"},relativeTime:{future:{one:"dans {0} h",other:"dans {0} h"},past:{one:"il y a {0} h",other:"il y a {0} h"}}},minute:{displayName:"minute",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} minute",other:"dans {0} minutes"},past:{one:"il y a {0} minute",other:"il y a {0} minutes"}}},"minute-short":{displayName:"min.",relative:{0:"cette minute-ci"},relativeTime:{future:{one:"dans {0} min",other:"dans {0} min"},past:{one:"il y a {0} min",other:"il y a {0} min"}}},second:{displayName:"seconde",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} seconde",other:"dans {0} secondes"},past:{one:"il y a {0} seconde",other:"il y a {0} secondes"}}},"second-short":{displayName:"s",relative:{0:"maintenant"},relativeTime:{future:{one:"dans {0} s",other:"dans {0} s"},past:{one:"il y a {0} s",other:"il y a {0} s"}}}}},{locale:"fr-KM",parentLocale:"fr"},{locale:"fr-LU",parentLocale:"fr"},{locale:"fr-MA",parentLocale:"fr"},{locale:"fr-MC",parentLocale:"fr"},{locale:"fr-MF",parentLocale:"fr"},{locale:"fr-MG",parentLocale:"fr"},{locale:"fr-ML",parentLocale:"fr"},{locale:"fr-MQ",parentLocale:"fr"},{locale:"fr-MR",parentLocale:"fr"},{locale:"fr-MU",parentLocale:"fr"},{locale:"fr-NC",parentLocale:"fr"},{locale:"fr-NE",parentLocale:"fr"},{locale:"fr-PF",parentLocale:"fr"},{locale:"fr-PM",parentLocale:"fr"},{locale:"fr-RE",parentLocale:"fr"},{locale:"fr-RW",parentLocale:"fr"},{locale:"fr-SC",parentLocale:"fr"},{locale:"fr-SN",parentLocale:"fr"},{locale:"fr-SY",parentLocale:"fr"},{locale:"fr-TD",parentLocale:"fr"},{locale:"fr-TG",parentLocale:"fr"},{locale:"fr-TN",parentLocale:"fr"},{locale:"fr-VU",parentLocale:"fr"},{locale:"fr-WF",parentLocale:"fr"},{locale:"fr-YT",parentLocale:"fr"}]});


/***/ }),

/***/ "./node_modules/react-intl/locale-data/pt.js":
/*!***************************************************!*\
  !*** ./node_modules/react-intl/locale-data/pt.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

!function(e,t){ true?module.exports=t():undefined}(this,function(){"use strict";return[{locale:"pt",pluralRuleFunction:function(e,t){var o=String(e).split(".")[0];return t?"other":0==o||1==o?"one":"other"},fields:{year:{displayName:"ano",relative:{0:"este ano",1:"próximo ano","-1":"ano passado"},relativeTime:{future:{one:"em {0} ano",other:"em {0} anos"},past:{one:"há {0} ano",other:"há {0} anos"}}},"year-short":{displayName:"ano",relative:{0:"este ano",1:"próximo ano","-1":"ano passado"},relativeTime:{future:{one:"em {0} ano",other:"em {0} anos"},past:{one:"há {0} ano",other:"há {0} anos"}}},month:{displayName:"mês",relative:{0:"este mês",1:"próximo mês","-1":"mês passado"},relativeTime:{future:{one:"em {0} mês",other:"em {0} meses"},past:{one:"há {0} mês",other:"há {0} meses"}}},"month-short":{displayName:"mês",relative:{0:"este mês",1:"próximo mês","-1":"mês passado"},relativeTime:{future:{one:"em {0} mês",other:"em {0} meses"},past:{one:"há {0} mês",other:"há {0} meses"}}},day:{displayName:"dia",relative:{0:"hoje",1:"amanhã",2:"depois de amanhã","-2":"anteontem","-1":"ontem"},relativeTime:{future:{one:"em {0} dia",other:"em {0} dias"},past:{one:"há {0} dia",other:"há {0} dias"}}},"day-short":{displayName:"dia",relative:{0:"hoje",1:"amanhã",2:"depois de amanhã","-2":"anteontem","-1":"ontem"},relativeTime:{future:{one:"em {0} dia",other:"em {0} dias"},past:{one:"há {0} dia",other:"há {0} dias"}}},hour:{displayName:"hora",relative:{0:"esta hora"},relativeTime:{future:{one:"em {0} hora",other:"em {0} horas"},past:{one:"há {0} hora",other:"há {0} horas"}}},"hour-short":{displayName:"h",relative:{0:"esta hora"},relativeTime:{future:{one:"em {0} h",other:"em {0} h"},past:{one:"há {0} h",other:"há {0} h"}}},minute:{displayName:"minuto",relative:{0:"este minuto"},relativeTime:{future:{one:"em {0} minuto",other:"em {0} minutos"},past:{one:"há {0} minuto",other:"há {0} minutos"}}},"minute-short":{displayName:"min.",relative:{0:"este minuto"},relativeTime:{future:{one:"em {0} min.",other:"em {0} min."},past:{one:"há {0} min.",other:"há {0} min."}}},second:{displayName:"segundo",relative:{0:"agora"},relativeTime:{future:{one:"em {0} segundo",other:"em {0} segundos"},past:{one:"há {0} segundo",other:"há {0} segundos"}}},"second-short":{displayName:"seg.",relative:{0:"agora"},relativeTime:{future:{one:"em {0} seg.",other:"em {0} seg."},past:{one:"há {0} seg.",other:"há {0} seg."}}}}},{locale:"pt-AO",parentLocale:"pt-PT"},{locale:"pt-PT",parentLocale:"pt",pluralRuleFunction:function(e,t){var o=!String(e).split(".")[1];return t?"other":1==e&&o?"one":"other"},fields:{year:{displayName:"ano",relative:{0:"este ano",1:"próximo ano","-1":"ano passado"},relativeTime:{future:{one:"dentro de {0} ano",other:"dentro de {0} anos"},past:{one:"há {0} ano",other:"há {0} anos"}}},"year-short":{displayName:"ano",relative:{0:"este ano",1:"próximo ano","-1":"ano passado"},relativeTime:{future:{one:"dentro de {0} ano",other:"dentro de {0} anos"},past:{one:"há {0} ano",other:"há {0} anos"}}},month:{displayName:"mês",relative:{0:"este mês",1:"próximo mês","-1":"mês passado"},relativeTime:{future:{one:"dentro de {0} mês",other:"dentro de {0} meses"},past:{one:"há {0} mês",other:"há {0} meses"}}},"month-short":{displayName:"mês",relative:{0:"este mês",1:"próximo mês","-1":"mês passado"},relativeTime:{future:{one:"dentro de {0} mês",other:"dentro de {0} meses"},past:{one:"há {0} mês",other:"há {0} meses"}}},day:{displayName:"dia",relative:{0:"hoje",1:"amanhã",2:"depois de amanhã","-2":"anteontem","-1":"ontem"},relativeTime:{future:{one:"dentro de {0} dia",other:"dentro de {0} dias"},past:{one:"há {0} dia",other:"há {0} dias"}}},"day-short":{displayName:"dia",relative:{0:"hoje",1:"amanhã",2:"depois de amanhã","-2":"anteontem","-1":"ontem"},relativeTime:{future:{one:"dentro de {0} dia",other:"dentro de {0} dias"},past:{one:"há {0} dia",other:"há {0} dias"}}},hour:{displayName:"hora",relative:{0:"esta hora"},relativeTime:{future:{one:"dentro de {0} hora",other:"dentro de {0} horas"},past:{one:"há {0} hora",other:"há {0} horas"}}},"hour-short":{displayName:"h",relative:{0:"esta hora"},relativeTime:{future:{one:"dentro de {0} h",other:"dentro de {0} h"},past:{one:"há {0} h",other:"há {0} h"}}},minute:{displayName:"minuto",relative:{0:"este minuto"},relativeTime:{future:{one:"dentro de {0} minuto",other:"dentro de {0} minutos"},past:{one:"há {0} minuto",other:"há {0} minutos"}}},"minute-short":{displayName:"min",relative:{0:"este minuto"},relativeTime:{future:{one:"dentro de {0} min",other:"dentro de {0} min"},past:{one:"há {0} min",other:"há {0} min"}}},second:{displayName:"segundo",relative:{0:"agora"},relativeTime:{future:{one:"dentro de {0} segundo",other:"dentro de {0} segundos"},past:{one:"há {0} segundo",other:"há {0} segundos"}}},"second-short":{displayName:"s",relative:{0:"agora"},relativeTime:{future:{one:"dentro de {0} s",other:"dentro de {0} s"},past:{one:"há {0} s",other:"há {0} s"}}}}},{locale:"pt-CH",parentLocale:"pt-PT"},{locale:"pt-CV",parentLocale:"pt-PT"},{locale:"pt-GQ",parentLocale:"pt-PT"},{locale:"pt-GW",parentLocale:"pt-PT"},{locale:"pt-LU",parentLocale:"pt-PT"},{locale:"pt-MO",parentLocale:"pt-PT"},{locale:"pt-MZ",parentLocale:"pt-PT"},{locale:"pt-ST",parentLocale:"pt-PT"},{locale:"pt-TL",parentLocale:"pt-PT"}]});


/***/ }),

/***/ "./node_modules/react-linkify/dist/Linkify.js":
/*!****************************************************!*\
  !*** ./node_modules/react-linkify/dist/Linkify.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linkify = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _linkifyIt = __webpack_require__(/*! linkify-it */ "./node_modules/linkify-it/index.js");

var _linkifyIt2 = _interopRequireDefault(_linkifyIt);

var _tlds = __webpack_require__(/*! tlds */ "./node_modules/tlds/index.js");

var _tlds2 = _interopRequireDefault(_tlds);

var _propTypes = __webpack_require__(/*! prop-types */ "./node_modules/prop-types/index.js");

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var linkify = exports.linkify = new _linkifyIt2.default();
linkify.tlds(_tlds2.default);

var Linkify = function (_React$Component) {
  _inherits(Linkify, _React$Component);

  function Linkify() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, Linkify);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Linkify.__proto__ || Object.getPrototypeOf(Linkify)).call.apply(_ref, [this].concat(args))), _this), _this.parseCounter = 0, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Linkify, [{
    key: 'getMatches',
    value: function getMatches(string) {
      return linkify.match(string);
    }
  }, {
    key: 'parseString',
    value: function parseString(string) {
      var _this2 = this;

      var elements = [];
      if (string === '') {
        return elements;
      }

      var matches = this.getMatches(string);
      if (!matches) {
        return string;
      }

      var lastIndex = 0;
      matches.forEach(function (match, idx) {
        // Push the preceding text if there is any
        if (match.index > lastIndex) {
          elements.push(string.substring(lastIndex, match.index));
        }
        // Shallow update values that specified the match
        var props = { href: match.url, key: 'parse' + _this2.parseCounter + 'match' + idx };
        for (var key in _this2.props.properties) {
          var val = _this2.props.properties[key];
          if (val === Linkify.MATCH) {
            val = match.url;
          }

          props[key] = val;
        }
        elements.push(_react2.default.createElement(_this2.props.component, props, match.text));
        lastIndex = match.lastIndex;
      });

      if (lastIndex < string.length) {
        elements.push(string.substring(lastIndex));
      }

      return elements.length === 1 ? elements[0] : elements;
    }
  }, {
    key: 'parse',
    value: function parse(children) {
      var _this3 = this;

      var parsed = children;

      if (typeof children === 'string') {
        parsed = this.parseString(children);
      } else if (_react2.default.isValidElement(children) && children.type !== 'a' && children.type !== 'button') {
        parsed = _react2.default.cloneElement(children, { key: 'parse' + ++this.parseCounter }, this.parse(children.props.children));
      } else if (children instanceof Array) {
        parsed = children.map(function (child) {
          return _this3.parse(child);
        });
      }

      return parsed;
    }
  }, {
    key: 'render',
    value: function render() {
      this.parseCounter = 0;
      var parsedChildren = this.parse(this.props.children);

      return _react2.default.createElement(
        'span',
        { className: this.props.className },
        parsedChildren
      );
    }
  }]);

  return Linkify;
}(_react2.default.Component);

Linkify.MATCH = 'LINKIFY_MATCH';
Linkify.propTypes = {
  className: _propTypes2.default.string,
  component: _propTypes2.default.any,
  properties: _propTypes2.default.object,
  urlRegex: _propTypes2.default.object,
  emailRegex: _propTypes2.default.object
};
Linkify.defaultProps = {
  className: 'Linkify',
  component: 'a',
  properties: {}
};
exports.default = Linkify;


/***/ }),

/***/ "./node_modules/react-slick/lib/arrows.js":
/*!************************************************!*\
  !*** ./node_modules/react-slick/lib/arrows.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.NextArrow = exports.PrevArrow = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");

var _classnames2 = _interopRequireDefault(_classnames);

var _helpers = __webpack_require__(/*! ./mixins/helpers */ "./node_modules/react-slick/lib/mixins/helpers.js");

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PrevArrow = exports.PrevArrow = function (_React$Component) {
  _inherits(PrevArrow, _React$Component);

  function PrevArrow() {
    _classCallCheck(this, PrevArrow);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  PrevArrow.prototype.clickHandler = function clickHandler(options, e) {
    if (e) {
      e.preventDefault();
    }
    this.props.clickHandler(options, e);
  };

  PrevArrow.prototype.render = function render() {
    var prevClasses = { 'slick-arrow': true, 'slick-prev': true };
    var prevHandler = this.clickHandler.bind(this, { message: 'previous' });

    if (!this.props.infinite && (this.props.currentSlide === 0 || this.props.slideCount <= this.props.slidesToShow)) {
      prevClasses['slick-disabled'] = true;
      prevHandler = null;
    }

    var prevArrowProps = {
      key: '0',
      'data-role': 'none',
      className: (0, _classnames2.default)(prevClasses),
      style: { display: 'block' },
      onClick: prevHandler
    };
    var customProps = {
      currentSlide: this.props.currentSlide,
      slideCount: this.props.slideCount
    };
    var prevArrow = void 0;

    if (this.props.prevArrow) {
      prevArrow = _react2.default.cloneElement(this.props.prevArrow, _extends({}, prevArrowProps, customProps));
    } else {
      prevArrow = _react2.default.createElement(
        'button',
        _extends({ key: '0', type: 'button' }, prevArrowProps),
        ' Previous'
      );
    }

    return prevArrow;
  };

  return PrevArrow;
}(_react2.default.Component);

var NextArrow = exports.NextArrow = function (_React$Component2) {
  _inherits(NextArrow, _React$Component2);

  function NextArrow() {
    _classCallCheck(this, NextArrow);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  NextArrow.prototype.clickHandler = function clickHandler(options, e) {
    if (e) {
      e.preventDefault();
    }
    this.props.clickHandler(options, e);
  };

  NextArrow.prototype.render = function render() {
    var nextClasses = { 'slick-arrow': true, 'slick-next': true };
    var nextHandler = this.clickHandler.bind(this, { message: 'next' });

    if (!_helpers2.default.canGoNext(this.props)) {
      nextClasses['slick-disabled'] = true;
      nextHandler = null;
    }

    var nextArrowProps = {
      key: '1',
      'data-role': 'none',
      className: (0, _classnames2.default)(nextClasses),
      style: { display: 'block' },
      onClick: nextHandler
    };
    var customProps = {
      currentSlide: this.props.currentSlide,
      slideCount: this.props.slideCount
    };
    var nextArrow = void 0;

    if (this.props.nextArrow) {
      nextArrow = _react2.default.cloneElement(this.props.nextArrow, _extends({}, nextArrowProps, customProps));
    } else {
      nextArrow = _react2.default.createElement(
        'button',
        _extends({ key: '1', type: 'button' }, nextArrowProps),
        ' Next'
      );
    }

    return nextArrow;
  };

  return NextArrow;
}(_react2.default.Component);

/***/ }),

/***/ "./node_modules/react-slick/lib/default-props.js":
/*!*******************************************************!*\
  !*** ./node_modules/react-slick/lib/default-props.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultProps = {
    className: '',
    accessibility: true,
    adaptiveHeight: false,
    arrows: true,
    autoplay: false,
    autoplaySpeed: 3000,
    centerMode: false,
    centerPadding: '50px',
    cssEase: 'ease',
    customPaging: function customPaging(i) {
        return _react2.default.createElement(
            'button',
            null,
            i + 1
        );
    },
    dots: false,
    dotsClass: 'slick-dots',
    draggable: true,
    easing: 'linear',
    edgeFriction: 0.35,
    fade: false,
    focusOnSelect: false,
    infinite: true,
    initialSlide: 0,
    lazyLoad: false,
    pauseOnHover: true,
    responsive: null,
    rtl: false,
    slide: 'div',
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 500,
    swipe: true,
    swipeToSlide: false,
    touchMove: true,
    touchThreshold: 5,
    useCSS: true,
    variableWidth: false,
    vertical: false,
    waitForAnimate: true,
    afterChange: null,
    beforeChange: null,
    edgeEvent: null,
    // init: function hook that gets called right before InnerSlider mounts
    init: null,
    swipeEvent: null,
    // nextArrow, prevArrow should react componets
    nextArrow: null,
    prevArrow: null
};

exports.default = defaultProps;

/***/ }),

/***/ "./node_modules/react-slick/lib/dots.js":
/*!**********************************************!*\
  !*** ./node_modules/react-slick/lib/dots.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.Dots = undefined;

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getDotCount = function getDotCount(spec) {
  var dots;

  if (spec.infinite) {
    dots = Math.ceil(spec.slideCount / spec.slidesToScroll);
  } else {
    dots = Math.ceil((spec.slideCount - spec.slidesToShow) / spec.slidesToScroll) + 1;
  }

  return dots;
};

var Dots = exports.Dots = function (_React$Component) {
  _inherits(Dots, _React$Component);

  function Dots() {
    _classCallCheck(this, Dots);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  Dots.prototype.clickHandler = function clickHandler(options, e) {
    // In Autoplay the focus stays on clicked button even after transition
    // to next slide. That only goes away by click somewhere outside
    e.preventDefault();
    this.props.clickHandler(options);
  };

  Dots.prototype.render = function render() {
    var _this2 = this;

    var dotCount = getDotCount({
      slideCount: this.props.slideCount,
      slidesToScroll: this.props.slidesToScroll,
      slidesToShow: this.props.slidesToShow,
      infinite: this.props.infinite
    });

    // Apply join & split to Array to pre-fill it for IE8
    //
    // Credit: http://stackoverflow.com/a/13735425/1849458
    var dots = Array.apply(null, Array(dotCount + 1).join('0').split('')).map(function (x, i) {

      var leftBound = i * _this2.props.slidesToScroll;
      var rightBound = i * _this2.props.slidesToScroll + (_this2.props.slidesToScroll - 1);
      var className = (0, _classnames2.default)({
        'slick-active': _this2.props.currentSlide >= leftBound && _this2.props.currentSlide <= rightBound
      });

      var dotOptions = {
        message: 'dots',
        index: i,
        slidesToScroll: _this2.props.slidesToScroll,
        currentSlide: _this2.props.currentSlide
      };

      var onClick = _this2.clickHandler.bind(_this2, dotOptions);

      return _react2.default.createElement(
        'li',
        { key: i, className: className },
        _react2.default.cloneElement(_this2.props.customPaging(i), { onClick: onClick })
      );
    });

    return _react2.default.createElement(
      'ul',
      { className: this.props.dotsClass, style: { display: 'block' } },
      dots
    );
  };

  return Dots;
}(_react2.default.Component);

/***/ }),

/***/ "./node_modules/react-slick/lib/index.js":
/*!***********************************************!*\
  !*** ./node_modules/react-slick/lib/index.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(/*! ./slider */ "./node_modules/react-slick/lib/slider.js");

/***/ }),

/***/ "./node_modules/react-slick/lib/initial-state.js":
/*!*******************************************************!*\
  !*** ./node_modules/react-slick/lib/initial-state.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var initialState = {
    animating: false,
    dragging: false,
    autoPlayTimer: null,
    currentDirection: 0,
    currentLeft: null,
    currentSlide: 0,
    direction: 1,
    listWidth: null,
    listHeight: null,
    scrolling: false,
    // loadIndex: 0,
    slideCount: null,
    slideWidth: null,
    slideHeight: null,
    swiping: false,
    // sliding: false,
    // slideOffset: 0,
    swipeLeft: null,
    touchObject: {
        startX: 0,
        startY: 0,
        curX: 0,
        curY: 0
    },

    lazyLoadedList: [],

    // added for react
    initialized: false,
    edgeDragged: false,
    swiped: false, // used by swipeEvent. differentites between touch and swipe.
    trackStyle: {},
    trackWidth: 0

    // Removed
    // transformsEnabled: false,
    // $nextArrow: null,
    // $prevArrow: null,
    // $dots: null,
    // $list: null,
    // $slideTrack: null,
    // $slides: null,
};

module.exports = initialState;

/***/ }),

/***/ "./node_modules/react-slick/lib/inner-slider.js":
/*!******************************************************!*\
  !*** ./node_modules/react-slick/lib/inner-slider.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.InnerSlider = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _eventHandlers = __webpack_require__(/*! ./mixins/event-handlers */ "./node_modules/react-slick/lib/mixins/event-handlers.js");

var _eventHandlers2 = _interopRequireDefault(_eventHandlers);

var _helpers = __webpack_require__(/*! ./mixins/helpers */ "./node_modules/react-slick/lib/mixins/helpers.js");

var _helpers2 = _interopRequireDefault(_helpers);

var _initialState = __webpack_require__(/*! ./initial-state */ "./node_modules/react-slick/lib/initial-state.js");

var _initialState2 = _interopRequireDefault(_initialState);

var _defaultProps = __webpack_require__(/*! ./default-props */ "./node_modules/react-slick/lib/default-props.js");

var _defaultProps2 = _interopRequireDefault(_defaultProps);

var _createReactClass = __webpack_require__(/*! create-react-class */ "./node_modules/create-react-class/index.js");

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _classnames = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");

var _classnames2 = _interopRequireDefault(_classnames);

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _track = __webpack_require__(/*! ./track */ "./node_modules/react-slick/lib/track.js");

var _dots = __webpack_require__(/*! ./dots */ "./node_modules/react-slick/lib/dots.js");

var _arrows = __webpack_require__(/*! ./arrows */ "./node_modules/react-slick/lib/arrows.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var InnerSlider = exports.InnerSlider = (0, _createReactClass2.default)({
  displayName: 'InnerSlider',

  mixins: [_helpers2.default, _eventHandlers2.default],
  list: null, // wraps the track
  track: null, // component that rolls out like a film
  listRefHandler: function listRefHandler(ref) {
    this.list = ref;
  },
  trackRefHandler: function trackRefHandler(ref) {
    this.track = ref;
  },
  getInitialState: function getInitialState() {
    return _extends({}, _initialState2.default, {
      currentSlide: this.props.initialSlide
    });
  },
  componentWillMount: function componentWillMount() {
    if (this.props.init) {
      this.props.init();
    }
    this.setState({
      mounted: true
    });
    var lazyLoadedList = [];
    // number of slides shown in the active frame
    var slidesToShow = this.props.slidesToShow;
    var childrenLen = _react2.default.Children.count(this.props.children);
    var currentSlide = this.state.currentSlide;
    for (var i = 0; i < childrenLen; i++) {
      // if currentSlide is the lastSlide of current frame and 
      // rest of the active slides are on the left of currentSlide
      // then the following might cause a problem
      if (i >= currentSlide && i < currentSlide + slidesToShow) {
        lazyLoadedList.push(i);
      }
    }
    if (this.props.centerMode === true) {
      // add slides to show on the left in case of centerMode with lazyLoad
      var additionalCount = Math.floor(slidesToShow / 2);
      if (parseInt(this.props.centerPadding) > 0) {
        additionalCount += 1;
      }
      var additionalNum = currentSlide;
      while (additionalCount--) {
        lazyLoadedList.push((--additionalNum + childrenLen) % childrenLen);
      }
    }

    if (this.props.lazyLoad && this.state.lazyLoadedList.length === 0) {
      this.setState({
        lazyLoadedList: lazyLoadedList
      });
    }
  },
  componentDidMount: function componentDidMount() {
    // Hack for autoplay -- Inspect Later
    this.initialize(this.props);
    this.adaptHeight();

    // To support server-side rendering
    if (!window) {
      return;
    }
    if (window.addEventListener) {
      window.addEventListener('resize', this.onWindowResized);
    } else {
      window.attachEvent('onresize', this.onWindowResized);
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    if (this.animationEndCallback) {
      clearTimeout(this.animationEndCallback);
    }
    if (window.addEventListener) {
      window.removeEventListener('resize', this.onWindowResized);
    } else {
      window.detachEvent('onresize', this.onWindowResized);
    }
    if (this.state.autoPlayTimer) {
      clearInterval(this.state.autoPlayTimer);
    }
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (this.props.slickGoTo != nextProps.slickGoTo) {
      if (true) {
        console.warn('react-slick deprecation warning: slickGoTo prop is deprecated and it will be removed in next release. Use slickGoTo method instead');
      }
      this.changeSlide({
        message: 'index',
        index: nextProps.slickGoTo,
        currentSlide: this.state.currentSlide
      });
    } else if (this.state.currentSlide >= nextProps.children.length) {
      this.update(nextProps);
      this.changeSlide({
        message: 'index',
        index: nextProps.children.length - nextProps.slidesToShow,
        currentSlide: this.state.currentSlide
      });
    } else {
      this.update(nextProps);
    }
  },
  componentDidUpdate: function componentDidUpdate() {
    if (this.props.lazyLoad && this.props.centerMode) {
      var childrenLen = _react2.default.Children.count(this.props.children);
      var additionalCount = Math.floor(this.props.slidesToShow / 2);
      if (parseInt(this.props.centerPadding) > 0) additionalCount++;
      var leftMostSlide = (this.state.currentSlide - additionalCount + childrenLen) % childrenLen;
      var rightMostSlide = (this.state.currentSlide + additionalCount) % childrenLen;
      if (!this.state.lazyLoadedList.includes(leftMostSlide)) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList + [leftMostSlide]
        });
      }
      if (!this.state.lazyLoadedList.includes(rightMostSlide)) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList + [rightMostSlide]
        });
      }
    }
    this.adaptHeight();
  },
  onWindowResized: function onWindowResized() {
    this.update(this.props);
    // animating state should be cleared while resizing, otherwise autoplay stops working
    this.setState({
      animating: false
    });
    clearTimeout(this.animationEndCallback);
    delete this.animationEndCallback;
  },
  slickPrev: function slickPrev() {
    this.changeSlide({ message: 'previous' });
  },
  slickNext: function slickNext() {
    this.changeSlide({ message: 'next' });
  },
  slickGoTo: function slickGoTo(slide) {
    slide = Number(slide);
    !isNaN(slide) && this.changeSlide({
      message: 'index',
      index: slide,
      currentSlide: this.state.currentSlide
    });
  },
  render: function render() {
    var className = (0, _classnames2.default)('slick-initialized', 'slick-slider', this.props.className, {
      'slick-vertical': this.props.vertical
    });

    var trackProps = {
      fade: this.props.fade,
      cssEase: this.props.cssEase,
      speed: this.props.speed,
      infinite: this.props.infinite,
      centerMode: this.props.centerMode,
      focusOnSelect: this.props.focusOnSelect ? this.selectHandler : null,
      currentSlide: this.state.currentSlide,
      lazyLoad: this.props.lazyLoad,
      lazyLoadedList: this.state.lazyLoadedList,
      rtl: this.props.rtl,
      slideWidth: this.state.slideWidth,
      slideHeight: this.state.slideHeight,
      listHeight: this.state.listHeight,
      vertical: this.props.vertical,
      slidesToShow: this.props.slidesToShow,
      slidesToScroll: this.props.slidesToScroll,
      slideCount: this.state.slideCount,
      trackStyle: this.state.trackStyle,
      variableWidth: this.props.variableWidth
    };

    var dots;

    if (this.props.dots === true && this.state.slideCount >= this.props.slidesToShow) {
      var dotProps = {
        dotsClass: this.props.dotsClass,
        slideCount: this.state.slideCount,
        slidesToShow: this.props.slidesToShow,
        currentSlide: this.state.currentSlide,
        slidesToScroll: this.props.slidesToScroll,
        clickHandler: this.changeSlide,
        children: this.props.children,
        customPaging: this.props.customPaging,
        infinite: this.props.infinite
      };

      dots = _react2.default.createElement(_dots.Dots, dotProps);
    }

    var prevArrow, nextArrow;

    var arrowProps = {
      infinite: this.props.infinite,
      centerMode: this.props.centerMode,
      currentSlide: this.state.currentSlide,
      slideCount: this.state.slideCount,
      slidesToShow: this.props.slidesToShow,
      prevArrow: this.props.prevArrow,
      nextArrow: this.props.nextArrow,
      clickHandler: this.changeSlide
    };

    if (this.props.arrows) {
      prevArrow = _react2.default.createElement(_arrows.PrevArrow, arrowProps);
      nextArrow = _react2.default.createElement(_arrows.NextArrow, arrowProps);
    }

    var verticalHeightStyle = null;

    if (this.props.vertical) {
      verticalHeightStyle = {
        height: this.state.listHeight
      };
    }

    var centerPaddingStyle = null;

    if (this.props.vertical === false) {
      if (this.props.centerMode === true) {
        centerPaddingStyle = {
          padding: '0px ' + this.props.centerPadding
        };
      }
    } else {
      if (this.props.centerMode === true) {
        centerPaddingStyle = {
          padding: this.props.centerPadding + ' 0px'
        };
      }
    }

    var listStyle = (0, _objectAssign2.default)({}, verticalHeightStyle, centerPaddingStyle);

    return _react2.default.createElement(
      'div',
      {
        className: className,
        onMouseEnter: this.onInnerSliderEnter,
        onMouseLeave: this.onInnerSliderLeave,
        onMouseOver: this.onInnerSliderOver
      },
      prevArrow,
      _react2.default.createElement(
        'div',
        {
          ref: this.listRefHandler,
          className: 'slick-list',
          style: listStyle,
          onMouseDown: this.swipeStart,
          onMouseMove: this.state.dragging ? this.swipeMove : null,
          onMouseUp: this.swipeEnd,
          onMouseLeave: this.state.dragging ? this.swipeEnd : null,
          onTouchStart: this.swipeStart,
          onTouchMove: this.state.dragging ? this.swipeMove : null,
          onTouchEnd: this.swipeEnd,
          onTouchCancel: this.state.dragging ? this.swipeEnd : null,
          onKeyDown: this.props.accessibility ? this.keyHandler : null },
        _react2.default.createElement(
          _track.Track,
          _extends({ ref: this.trackRefHandler }, trackProps),
          this.props.children
        )
      ),
      nextArrow,
      dots
    );
  }
});

/***/ }),

/***/ "./node_modules/react-slick/lib/mixins/event-handlers.js":
/*!***************************************************************!*\
  !*** ./node_modules/react-slick/lib/mixins/event-handlers.js ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _trackHelper = __webpack_require__(/*! ./trackHelper */ "./node_modules/react-slick/lib/mixins/trackHelper.js");

var _helpers = __webpack_require__(/*! ./helpers */ "./node_modules/react-slick/lib/mixins/helpers.js");

var _helpers2 = _interopRequireDefault(_helpers);

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _reactDom = __webpack_require__(/*! react-dom */ "react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventHandlers = {
  // Event handler for previous and next
  // gets called if slide is changed via arrows or dots but not swiping/dragging
  changeSlide: function changeSlide(options) {
    var indexOffset, previousInt, slideOffset, unevenOffset, targetSlide;
    var _props = this.props,
        slidesToScroll = _props.slidesToScroll,
        slidesToShow = _props.slidesToShow;
    var _state = this.state,
        slideCount = _state.slideCount,
        currentSlide = _state.currentSlide;

    unevenOffset = slideCount % slidesToScroll !== 0;
    indexOffset = unevenOffset ? 0 : (slideCount - currentSlide) % slidesToScroll;

    if (options.message === 'previous') {
      slideOffset = indexOffset === 0 ? slidesToScroll : slidesToShow - indexOffset;
      targetSlide = currentSlide - slideOffset;
      if (this.props.lazyLoad && !this.props.infinite) {
        previousInt = currentSlide - slideOffset;
        targetSlide = previousInt === -1 ? slideCount - 1 : previousInt;
      }
    } else if (options.message === 'next') {
      slideOffset = indexOffset === 0 ? slidesToScroll : indexOffset;
      targetSlide = currentSlide + slideOffset;
      if (this.props.lazyLoad && !this.props.infinite) {
        targetSlide = (currentSlide + slidesToScroll) % slideCount + indexOffset;
      }
    } else if (options.message === 'dots' || options.message === 'children') {
      // Click on dots
      targetSlide = options.index * options.slidesToScroll;
      if (targetSlide === options.currentSlide) {
        return;
      }
    } else if (options.message === 'index') {
      targetSlide = Number(options.index);
      if (targetSlide === options.currentSlide) {
        return;
      }
    }

    this.slideHandler(targetSlide);
  },

  // Accessiblity handler for previous and next
  keyHandler: function keyHandler(e) {
    //Dont slide if the cursor is inside the form fields and arrow keys are pressed
    if (!e.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
      if (e.keyCode === 37 && this.props.accessibility === true) {
        this.changeSlide({
          message: this.props.rtl === true ? 'next' : 'previous'
        });
      } else if (e.keyCode === 39 && this.props.accessibility === true) {
        this.changeSlide({
          message: this.props.rtl === true ? 'previous' : 'next'
        });
      }
    }
  },
  // Focus on selecting a slide (click handler on track)
  selectHandler: function selectHandler(options) {
    this.changeSlide(options);
  },
  // invoked when swiping/dragging starts (just once)
  swipeStart: function swipeStart(e) {
    var touches, posX, posY;

    if (this.props.swipe === false || 'ontouchend' in document && this.props.swipe === false) {
      return;
    } else if (this.props.draggable === false && e.type.indexOf('mouse') !== -1) {
      return;
    }
    posX = e.touches !== undefined ? e.touches[0].pageX : e.clientX;
    posY = e.touches !== undefined ? e.touches[0].pageY : e.clientY;
    this.setState({
      dragging: true,
      touchObject: {
        startX: posX,
        startY: posY,
        curX: posX,
        curY: posY
      }
    });
  },
  // continuous invokation while swiping/dragging is going on
  swipeMove: function swipeMove(e) {
    if (!this.state.dragging) {
      e.preventDefault();
      return;
    }
    if (this.state.scrolling) {
      return;
    }
    if (this.state.animating) {
      e.preventDefault();
      return;
    }
    if (this.props.vertical && this.props.swipeToSlide && this.props.verticalSwiping) {
      e.preventDefault();
    }
    var swipeLeft;
    var curLeft, positionOffset;
    var touchObject = this.state.touchObject;

    curLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
      slideIndex: this.state.currentSlide,
      trackRef: this.track
    }, this.props, this.state));
    touchObject.curX = e.touches ? e.touches[0].pageX : e.clientX;
    touchObject.curY = e.touches ? e.touches[0].pageY : e.clientY;
    touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(touchObject.curX - touchObject.startX, 2)));
    var verticalSwipeLength = Math.round(Math.sqrt(Math.pow(touchObject.curY - touchObject.startY, 2)));

    if (!this.props.verticalSwiping && !this.state.swiping && verticalSwipeLength > 4) {
      this.setState({
        scrolling: true
      });
      return;
    }

    if (this.props.verticalSwiping) {
      touchObject.swipeLength = verticalSwipeLength;
    }

    positionOffset = (this.props.rtl === false ? 1 : -1) * (touchObject.curX > touchObject.startX ? 1 : -1);

    if (this.props.verticalSwiping) {
      positionOffset = touchObject.curY > touchObject.startY ? 1 : -1;
    }

    var currentSlide = this.state.currentSlide;
    var dotCount = Math.ceil(this.state.slideCount / this.props.slidesToScroll); // this might not be correct, using getDotCount may be more accurate
    var swipeDirection = this.swipeDirection(this.state.touchObject);
    var touchSwipeLength = touchObject.swipeLength;

    if (this.props.infinite === false) {
      if (currentSlide === 0 && swipeDirection === 'right' || currentSlide + 1 >= dotCount && swipeDirection === 'left') {
        touchSwipeLength = touchObject.swipeLength * this.props.edgeFriction;

        if (this.state.edgeDragged === false && this.props.edgeEvent) {
          this.props.edgeEvent(swipeDirection);
          this.setState({ edgeDragged: true });
        }
      }
    }
    if (this.state.swiped === false && this.props.swipeEvent) {
      this.props.swipeEvent(swipeDirection);
      this.setState({ swiped: true });
    }

    if (!this.props.vertical) {
      if (!this.props.rtl) {
        swipeLeft = curLeft + touchSwipeLength * positionOffset;
      } else {
        swipeLeft = curLeft - touchSwipeLength * positionOffset;
      }
    } else {
      swipeLeft = curLeft + touchSwipeLength * (this.state.listHeight / this.state.listWidth) * positionOffset;
    }

    if (this.props.verticalSwiping) {
      swipeLeft = curLeft + touchSwipeLength * positionOffset;
    }

    this.setState({
      touchObject: touchObject,
      swipeLeft: swipeLeft,
      trackStyle: (0, _trackHelper.getTrackCSS)((0, _objectAssign2.default)({ left: swipeLeft }, this.props, this.state))
    });

    if (Math.abs(touchObject.curX - touchObject.startX) < Math.abs(touchObject.curY - touchObject.startY) * 0.8) {
      return;
    }
    if (touchObject.swipeLength > 4) {
      this.setState({
        swiping: true
      });
      e.preventDefault();
    }
  },
  getNavigableIndexes: function getNavigableIndexes() {
    var max = void 0;
    var breakPoint = 0;
    var counter = 0;
    var indexes = [];

    if (!this.props.infinite) {
      max = this.state.slideCount;
    } else {
      breakPoint = this.props.slidesToShow * -1;
      counter = this.props.slidesToShow * -1;
      max = this.state.slideCount * 2;
    }

    while (breakPoint < max) {
      indexes.push(breakPoint);
      breakPoint = counter + this.props.slidesToScroll;

      counter += this.props.slidesToScroll <= this.props.slidesToShow ? this.props.slidesToScroll : this.props.slidesToShow;
    }

    return indexes;
  },
  checkNavigable: function checkNavigable(index) {
    var navigables = this.getNavigableIndexes();
    var prevNavigable = 0;

    if (index > navigables[navigables.length - 1]) {
      index = navigables[navigables.length - 1];
    } else {
      for (var n in navigables) {
        if (index < navigables[n]) {
          index = prevNavigable;
          break;
        }

        prevNavigable = navigables[n];
      }
    }

    return index;
  },
  getSlideCount: function getSlideCount() {
    var _this = this;

    var centerOffset = this.props.centerMode ? this.state.slideWidth * Math.floor(this.props.slidesToShow / 2) : 0;

    if (this.props.swipeToSlide) {
      var swipedSlide = void 0;

      var slickList = _reactDom2.default.findDOMNode(this.list);

      var slides = slickList.querySelectorAll('.slick-slide');

      Array.from(slides).every(function (slide) {
        if (!_this.props.vertical) {
          if (slide.offsetLeft - centerOffset + _this.getWidth(slide) / 2 > _this.state.swipeLeft * -1) {
            swipedSlide = slide;
            return false;
          }
        } else {
          if (slide.offsetTop + _this.getHeight(slide) / 2 > _this.state.swipeLeft * -1) {
            swipedSlide = slide;
            return false;
          }
        }

        return true;
      });

      var currentIndex = this.props.rtl === true ? this.state.slideCount - this.state.currentSlide : this.state.currentSlide;
      var slidesTraversed = Math.abs(swipedSlide.dataset.index - currentIndex) || 1;

      return slidesTraversed;
    } else {
      return this.props.slidesToScroll;
    }
  },

  swipeEnd: function swipeEnd(e) {
    if (!this.state.dragging) {
      if (this.props.swipe) {
        e.preventDefault();
      }
      return;
    }
    var touchObject = this.state.touchObject;
    var minSwipe = this.state.listWidth / this.props.touchThreshold;
    var swipeDirection = this.swipeDirection(touchObject);

    if (this.props.verticalSwiping) {
      minSwipe = this.state.listHeight / this.props.touchThreshold;
    }

    var wasScrolling = this.state.scrolling;
    // reset the state of touch related state variables.
    this.setState({
      dragging: false,
      edgeDragged: false,
      scrolling: false,
      swiping: false,
      swiped: false,
      swipeLeft: null,
      touchObject: {}
    });
    if (wasScrolling) {
      return;
    }

    // Fix for #13
    if (!touchObject.swipeLength) {
      return;
    }
    if (touchObject.swipeLength > minSwipe) {
      e.preventDefault();

      var slideCount = void 0,
          newSlide = void 0;

      switch (swipeDirection) {

        case 'left':
        case 'down':
          newSlide = this.state.currentSlide + this.getSlideCount();
          slideCount = this.props.swipeToSlide ? this.checkNavigable(newSlide) : newSlide;
          this.state.currentDirection = 0;
          break;

        case 'right':
        case 'up':
          newSlide = this.state.currentSlide - this.getSlideCount();
          slideCount = this.props.swipeToSlide ? this.checkNavigable(newSlide) : newSlide;
          this.state.currentDirection = 1;
          break;

        default:
          slideCount = this.state.currentSlide;

      }

      this.slideHandler(slideCount);
    } else {
      // Adjust the track back to it's original position.
      var currentLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
        slideIndex: this.state.currentSlide,
        trackRef: this.track
      }, this.props, this.state));

      this.setState({
        trackStyle: (0, _trackHelper.getTrackAnimateCSS)((0, _objectAssign2.default)({ left: currentLeft }, this.props, this.state))
      });
    }
  },
  onInnerSliderEnter: function onInnerSliderEnter(e) {
    if (this.props.autoplay && this.props.pauseOnHover) {
      this.pause();
    }
  },
  onInnerSliderOver: function onInnerSliderOver(e) {
    if (this.props.autoplay && this.props.pauseOnHover) {
      this.pause();
    }
  },
  onInnerSliderLeave: function onInnerSliderLeave(e) {
    if (this.props.autoplay && this.props.pauseOnHover) {
      this.autoPlay();
    }
  }
};

exports.default = EventHandlers;

/***/ }),

/***/ "./node_modules/react-slick/lib/mixins/helpers.js":
/*!********************************************************!*\
  !*** ./node_modules/react-slick/lib/mixins/helpers.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(/*! react-dom */ "react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _trackHelper = __webpack_require__(/*! ./trackHelper */ "./node_modules/react-slick/lib/mixins/trackHelper.js");

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var helpers = {
  // supposed to start autoplay of slides
  initialize: function initialize(props) {
    var slickList = _reactDom2.default.findDOMNode(this.list);

    var slideCount = _react2.default.Children.count(props.children);
    var listWidth = this.getWidth(slickList);
    var trackWidth = this.getWidth(_reactDom2.default.findDOMNode(this.track));
    var slideWidth;

    if (!props.vertical) {
      var centerPaddingAdj = props.centerMode && parseInt(props.centerPadding) * 2;
      if (props.centerPadding.slice(-1) === '%') {
        centerPaddingAdj *= listWidth / 100;
      }
      slideWidth = (this.getWidth(_reactDom2.default.findDOMNode(this)) - centerPaddingAdj) / props.slidesToShow;
    } else {
      slideWidth = this.getWidth(_reactDom2.default.findDOMNode(this));
    }

    var slideHeight = this.getHeight(slickList.querySelector('[data-index="0"]'));
    var listHeight = slideHeight * props.slidesToShow;

    var currentSlide = props.rtl ? slideCount - 1 - props.initialSlide : props.initialSlide;

    this.setState({
      slideCount: slideCount,
      slideWidth: slideWidth,
      listWidth: listWidth,
      trackWidth: trackWidth,
      currentSlide: currentSlide,
      slideHeight: slideHeight,
      listHeight: listHeight
    }, function () {
      // this reference isn't lost due to mixin
      var targetLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
        slideIndex: this.state.currentSlide,
        trackRef: this.track
      }, props, this.state));
      // getCSS function needs previously set state
      var trackStyle = (0, _trackHelper.getTrackCSS)((0, _objectAssign2.default)({ left: targetLeft }, props, this.state));

      this.setState({ trackStyle: trackStyle });

      this.autoPlay(); // once we're set up, trigger the initial autoplay.
    });
  },
  update: function update(props) {
    var slickList = _reactDom2.default.findDOMNode(this.list);
    // This method has mostly same code as initialize method.
    // Refactor it
    var slideCount = _react2.default.Children.count(props.children);
    var listWidth = this.getWidth(slickList);
    var trackWidth = this.getWidth(_reactDom2.default.findDOMNode(this.track));
    var slideWidth;

    if (!props.vertical) {
      var centerPaddingAdj = props.centerMode && parseInt(props.centerPadding) * 2;
      if (props.centerPadding.slice(-1) === '%') {
        centerPaddingAdj *= listWidth / 100;
      }
      slideWidth = (this.getWidth(_reactDom2.default.findDOMNode(this)) - centerPaddingAdj) / props.slidesToShow;
    } else {
      slideWidth = this.getWidth(_reactDom2.default.findDOMNode(this));
    }

    var slideHeight = this.getHeight(slickList.querySelector('[data-index="0"]'));
    var listHeight = slideHeight * props.slidesToShow;

    // pause slider if autoplay is set to false
    if (!props.autoplay) {
      this.pause();
    } else {
      this.autoPlay();
    }

    this.setState({
      slideCount: slideCount,
      slideWidth: slideWidth,
      listWidth: listWidth,
      trackWidth: trackWidth,
      slideHeight: slideHeight,
      listHeight: listHeight
    }, function () {

      var targetLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
        slideIndex: this.state.currentSlide,
        trackRef: this.track
      }, props, this.state));
      // getCSS function needs previously set state
      var trackStyle = (0, _trackHelper.getTrackCSS)((0, _objectAssign2.default)({ left: targetLeft }, props, this.state));

      this.setState({ trackStyle: trackStyle });
    });
  },
  getWidth: function getWidth(elem) {
    return elem && (elem.getBoundingClientRect().width || elem.offsetWidth) || 0;
  },
  getHeight: function getHeight(elem) {
    return elem && (elem.getBoundingClientRect().height || elem.offsetHeight) || 0;
  },

  adaptHeight: function adaptHeight() {
    if (this.props.adaptiveHeight) {
      var selector = '[data-index="' + this.state.currentSlide + '"]';
      if (this.list) {
        var slickList = _reactDom2.default.findDOMNode(this.list);
        var elem = slickList.querySelector(selector) || {};
        slickList.style.height = (elem.offsetHeight || 0) + 'px';
      }
    }
  },
  canGoNext: function canGoNext(opts) {
    var canGo = true;
    if (!opts.infinite) {
      if (opts.centerMode) {
        // check if current slide is last slide
        if (opts.currentSlide >= opts.slideCount - 1) {
          canGo = false;
        }
      } else {
        // check if all slides are shown in slider
        if (opts.slideCount <= opts.slidesToShow || opts.currentSlide >= opts.slideCount - opts.slidesToShow) {
          canGo = false;
        }
      }
    }
    return canGo;
  },
  slideHandler: function slideHandler(index) {
    var _this = this;

    // index is target slide index

    // Functionality of animateSlide and postSlide is merged into this function
    var targetSlide, currentSlide;
    var targetLeft, currentLeft;
    var callback;

    if (this.props.waitForAnimate && this.state.animating) {
      return;
    }

    if (this.props.fade) {
      currentSlide = this.state.currentSlide;

      // Don't change slide if infinite=false and target slide is out of range
      if (this.props.infinite === false && (index < 0 || index >= this.state.slideCount)) {
        return;
      }

      //  Shifting targetSlide back into the range
      if (index < 0) {
        targetSlide = index + this.state.slideCount;
      } else if (index >= this.state.slideCount) {
        targetSlide = index - this.state.slideCount;
      } else {
        targetSlide = index;
      }

      if (this.props.lazyLoad && this.state.lazyLoadedList.indexOf(targetSlide) < 0) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList.concat(targetSlide)
        });
      }

      callback = function callback() {
        _this.setState({
          animating: false
        });
        if (_this.props.afterChange) {
          _this.props.afterChange(targetSlide);
        }
        delete _this.animationEndCallback;
      };

      this.setState({
        animating: true,
        currentSlide: targetSlide
      }, function () {
        this.animationEndCallback = setTimeout(callback, this.props.speed);
      });

      if (this.props.beforeChange) {
        this.props.beforeChange(this.state.currentSlide, targetSlide);
      }

      this.autoPlay();
      return;
    }

    targetSlide = index;
    if (targetSlide < 0) {
      if (this.props.infinite === false) {
        currentSlide = 0;
      } else if (this.state.slideCount % this.props.slidesToScroll !== 0) {
        currentSlide = this.state.slideCount - this.state.slideCount % this.props.slidesToScroll;
      } else {
        currentSlide = this.state.slideCount + targetSlide;
      }
    } else if (targetSlide >= this.state.slideCount) {
      if (this.props.infinite === false) {
        currentSlide = this.state.slideCount - this.props.slidesToShow;
      } else if (this.state.slideCount % this.props.slidesToScroll !== 0) {
        currentSlide = 0;
      } else {
        currentSlide = targetSlide - this.state.slideCount;
      }
    } else {
      currentSlide = targetSlide;
    }

    targetLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
      slideIndex: targetSlide,
      trackRef: this.track
    }, this.props, this.state));

    currentLeft = (0, _trackHelper.getTrackLeft)((0, _objectAssign2.default)({
      slideIndex: currentSlide,
      trackRef: this.track
    }, this.props, this.state));

    if (this.props.infinite === false) {
      if (targetLeft === currentLeft) {
        targetSlide = currentSlide;
      }
      targetLeft = currentLeft;
    }

    if (this.props.beforeChange) {
      this.props.beforeChange(this.state.currentSlide, currentSlide);
    }

    if (this.props.lazyLoad) {
      var slidesToLoad = [];
      var slideCount = this.state.slideCount;
      for (var i = targetSlide; i < targetSlide + this.props.slidesToShow; i++) {
        if (this.state.lazyLoadedList.indexOf(i) < 0) {
          slidesToLoad.push(i);
        }
        if (i >= slideCount && this.state.lazyLoadedList.indexOf(i - slideCount) < 0) {
          slidesToLoad.push(i - slideCount);
        }
        if (i < 0 && this.state.lazyLoadedList.indexOf(i + slideCount) < 0) {
          slidesToLoad.push(i + slideCount);
        }
      }
      if (slidesToLoad.length > 0) {
        this.setState({
          lazyLoadedList: this.state.lazyLoadedList.concat(slidesToLoad)
        });
      }
    }

    // Slide Transition happens here.
    // animated transition happens to target Slide and
    // non - animated transition happens to current Slide
    // If CSS transitions are false, directly go the current slide.

    if (this.props.useCSS === false) {

      this.setState({
        currentSlide: currentSlide,
        trackStyle: (0, _trackHelper.getTrackCSS)((0, _objectAssign2.default)({ left: currentLeft }, this.props, this.state))
      }, function () {
        if (this.props.afterChange) {
          this.props.afterChange(currentSlide);
        }
      });
    } else {

      var nextStateChanges = {
        animating: false,
        currentSlide: currentSlide,
        trackStyle: (0, _trackHelper.getTrackCSS)((0, _objectAssign2.default)({ left: currentLeft }, this.props, this.state)),
        swipeLeft: null
      };
      callback = function callback() {
        _this.setState(nextStateChanges, function () {
          if (_this.props.afterChange) {
            _this.props.afterChange(currentSlide);
          }
          delete _this.animationEndCallback;
        });
      };

      this.setState({
        animating: true,
        currentSlide: currentSlide,
        trackStyle: (0, _trackHelper.getTrackAnimateCSS)((0, _objectAssign2.default)({ left: targetLeft }, this.props, this.state))
      }, function () {
        this.animationEndCallback = setTimeout(callback, this.props.speed);
      });
    }

    this.autoPlay();
  },
  swipeDirection: function swipeDirection(touchObject) {
    var xDist, yDist, r, swipeAngle;

    xDist = touchObject.startX - touchObject.curX;
    yDist = touchObject.startY - touchObject.curY;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round(r * 180 / Math.PI);
    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if (swipeAngle <= 45 && swipeAngle >= 0 || swipeAngle <= 360 && swipeAngle >= 315) {
      return 'left';
    }
    if (swipeAngle >= 135 && swipeAngle <= 225) {
      return 'right';
    }
    if (this.props.verticalSwiping === true) {
      if (swipeAngle >= 35 && swipeAngle <= 135) {
        return 'down';
      } else {
        return 'up';
      }
    }

    return 'vertical';
  },
  play: function play() {
    var nextIndex;

    if (!this.state.mounted) {
      return false;
    }

    if (this.props.rtl) {
      nextIndex = this.state.currentSlide - this.props.slidesToScroll;
    } else {
      if (this.canGoNext(_extends({}, this.props, this.state))) {
        nextIndex = this.state.currentSlide + this.props.slidesToScroll;
      } else {
        return false;
      }
    }

    this.slideHandler(nextIndex);
  },
  autoPlay: function autoPlay() {
    if (this.state.autoPlayTimer) {
      clearTimeout(this.state.autoPlayTimer);
    }
    if (this.props.autoplay) {
      this.setState({
        autoPlayTimer: setTimeout(this.play, this.props.autoplaySpeed)
      });
    }
  },
  pause: function pause() {
    if (this.state.autoPlayTimer) {
      clearTimeout(this.state.autoPlayTimer);
      this.setState({
        autoPlayTimer: null
      });
    }
  }
};

exports.default = helpers;

/***/ }),

/***/ "./node_modules/react-slick/lib/mixins/trackHelper.js":
/*!************************************************************!*\
  !*** ./node_modules/react-slick/lib/mixins/trackHelper.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.getTrackLeft = exports.getTrackAnimateCSS = exports.getTrackCSS = undefined;
exports.getPreClones = getPreClones;
exports.getPostClones = getPostClones;
exports.getTotalSlides = getTotalSlides;

var _reactDom = __webpack_require__(/*! react-dom */ "react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// checks if spec is the superset of keys in keysArray, i.e., spec contains all the keys from keysArray
var checkSpecKeys = function checkSpecKeys(spec, keysArray) {
  return keysArray.reduce(function (value, key) {
    return value && spec.hasOwnProperty(key);
  }, true) ? null : console.error('Keys Missing', spec);
};

var getTrackCSS = exports.getTrackCSS = function getTrackCSS(spec) {
  checkSpecKeys(spec, ['left', 'variableWidth', 'slideCount', 'slidesToShow', 'slideWidth']);

  var trackWidth, trackHeight;
  var trackChildren = spec.slideCount + 2 * spec.slidesToShow; // this should probably be getTotalSlides
  if (!spec.vertical) {
    trackWidth = getTotalSlides(spec) * spec.slideWidth;
    trackWidth += spec.slideWidth / 2; // this is a temporary hack so that track div doesn't create new row for slight overflow
  } else {
    trackHeight = trackChildren * spec.slideHeight;
  }

  var style = {
    opacity: 1,
    WebkitTransform: !spec.vertical ? 'translate3d(' + spec.left + 'px, 0px, 0px)' : 'translate3d(0px, ' + spec.left + 'px, 0px)',
    transform: !spec.vertical ? 'translate3d(' + spec.left + 'px, 0px, 0px)' : 'translate3d(0px, ' + spec.left + 'px, 0px)',
    transition: '',
    WebkitTransition: '',
    msTransform: !spec.vertical ? 'translateX(' + spec.left + 'px)' : 'translateY(' + spec.left + 'px)'
  };
  if (spec.fade) {
    style = {
      opacity: 1
    };
  }

  if (trackWidth) {
    (0, _objectAssign2.default)(style, { width: trackWidth });
  }

  if (trackHeight) {
    (0, _objectAssign2.default)(style, { height: trackHeight });
  }

  // Fallback for IE8
  if (window && !window.addEventListener && window.attachEvent) {
    if (!spec.vertical) {
      style.marginLeft = spec.left + 'px';
    } else {
      style.marginTop = spec.left + 'px';
    }
  }

  return style;
};

var getTrackAnimateCSS = exports.getTrackAnimateCSS = function getTrackAnimateCSS(spec) {
  checkSpecKeys(spec, ['left', 'variableWidth', 'slideCount', 'slidesToShow', 'slideWidth', 'speed', 'cssEase']);

  var style = getTrackCSS(spec);
  // useCSS is true by default so it can be undefined
  style.WebkitTransition = '-webkit-transform ' + spec.speed + 'ms ' + spec.cssEase;
  style.transition = 'transform ' + spec.speed + 'ms ' + spec.cssEase;
  return style;
};

// gets total length of track that's on the left side of current slide
var getTrackLeft = exports.getTrackLeft = function getTrackLeft(spec) {

  checkSpecKeys(spec, ['slideIndex', 'trackRef', 'infinite', 'centerMode', 'slideCount', 'slidesToShow', 'slidesToScroll', 'slideWidth', 'listWidth', 'variableWidth', 'slideHeight']);

  var slideIndex = spec.slideIndex,
      trackRef = spec.trackRef,
      infinite = spec.infinite,
      centerMode = spec.centerMode,
      slideCount = spec.slideCount,
      slidesToShow = spec.slidesToShow,
      slidesToScroll = spec.slidesToScroll,
      slideWidth = spec.slideWidth,
      listWidth = spec.listWidth,
      variableWidth = spec.variableWidth,
      slideHeight = spec.slideHeight,
      fade = spec.fade,
      vertical = spec.vertical;


  var slideOffset = 0;
  var targetLeft;
  var targetSlide;
  var verticalOffset = 0;

  if (fade || spec.slideCount === 1) {
    return 0;
  }

  var slidesToOffset = 0;
  if (infinite) {
    slidesToOffset = -getPreClones(spec); // bring active slide to the beginning of visual area
    // if next scroll doesn't have enough children, just reach till the end of original slides instead of shifting slidesToScroll children
    if (slideCount % slidesToScroll !== 0 && slideIndex + slidesToScroll > slideCount) {
      slidesToOffset = -(slideIndex > slideCount ? slidesToShow - (slideIndex - slideCount) : slideCount % slidesToScroll);
    }
    // shift current slide to center of the frame
    if (centerMode) {
      slidesToOffset += parseInt(slidesToShow / 2);
    }
  } else {
    if (slideCount % slidesToScroll !== 0 && slideIndex + slidesToScroll > slideCount) {
      slidesToOffset = slidesToShow - slideCount % slidesToScroll;
    }
    if (centerMode) {
      slidesToOffset = parseInt(slidesToShow / 2);
    }
  }
  slideOffset = slidesToOffset * slideWidth;
  verticalOffset = slidesToOffset * slideHeight;

  if (!vertical) {
    targetLeft = slideIndex * slideWidth * -1 + slideOffset;
  } else {
    targetLeft = slideIndex * slideHeight * -1 + verticalOffset;
  }

  if (variableWidth === true) {
    var targetSlideIndex;
    var lastSlide = _reactDom2.default.findDOMNode(trackRef).children[slideCount - 1];
    var max = -lastSlide.offsetLeft + listWidth - lastSlide.offsetWidth;
    if (slideCount <= slidesToShow || infinite === false) {
      targetSlide = _reactDom2.default.findDOMNode(trackRef).childNodes[slideIndex];
    } else {
      targetSlideIndex = slideIndex + slidesToShow;
      targetSlide = _reactDom2.default.findDOMNode(trackRef).childNodes[targetSlideIndex];
    }
    targetLeft = targetSlide ? targetSlide.offsetLeft * -1 : 0;
    if (centerMode === true) {
      if (infinite === false) {
        targetSlide = _reactDom2.default.findDOMNode(trackRef).children[slideIndex];
      } else {
        targetSlide = _reactDom2.default.findDOMNode(trackRef).children[slideIndex + slidesToShow + 1];
      }

      if (targetSlide) {
        targetLeft = targetSlide.offsetLeft * -1 + (listWidth - targetSlide.offsetWidth) / 2;
      }
    }
    if (spec.infinite === false && targetLeft < max) {
      targetLeft = max;
    }
  }

  return targetLeft;
};

function getPreClones(spec) {
  return spec.slidesToShow + (spec.centerMode ? 1 : 0);
}

function getPostClones(spec) {
  return spec.slideCount;
}

function getTotalSlides(spec) {
  if (spec.slideCount === 1) {
    return 1;
  }
  return getPreClones(spec) + spec.slideCount + getPostClones(spec);
}

/***/ }),

/***/ "./node_modules/react-slick/lib/slider.js":
/*!************************************************!*\
  !*** ./node_modules/react-slick/lib/slider.js ***!
  \************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _innerSlider = __webpack_require__(/*! ./inner-slider */ "./node_modules/react-slick/lib/inner-slider.js");

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _json2mq = __webpack_require__(/*! json2mq */ "./node_modules/json2mq/index.js");

var _json2mq2 = _interopRequireDefault(_json2mq);

var _defaultProps = __webpack_require__(/*! ./default-props */ "./node_modules/react-slick/lib/default-props.js");

var _defaultProps2 = _interopRequireDefault(_defaultProps);

var _canUseDom = __webpack_require__(/*! can-use-dom */ "./node_modules/can-use-dom/index.js");

var _canUseDom2 = _interopRequireDefault(_canUseDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var enquire = _canUseDom2.default && __webpack_require__(/*! enquire.js */ "./node_modules/enquire.js/src/index.js");

var Slider = function (_React$Component) {
  _inherits(Slider, _React$Component);

  function Slider(props) {
    _classCallCheck(this, Slider);

    var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

    _this.state = {
      breakpoint: null
    };
    _this._responsiveMediaHandlers = [];
    _this.innerSliderRefHandler = _this.innerSliderRefHandler.bind(_this);
    return _this;
  }

  Slider.prototype.innerSliderRefHandler = function innerSliderRefHandler(ref) {
    this.innerSlider = ref;
  };

  Slider.prototype.media = function media(query, handler) {
    // javascript handler for  css media query
    enquire.register(query, handler);
    this._responsiveMediaHandlers.push({ query: query, handler: handler });
  };

  Slider.prototype.componentWillMount = function componentWillMount() {
    var _this2 = this;

    if (this.props.responsive) {
      var breakpoints = this.props.responsive.map(function (breakpt) {
        return breakpt.breakpoint;
      });
      // sort them in increasing order of their numerical value
      breakpoints.sort(function (x, y) {
        return x - y;
      });

      breakpoints.forEach(function (breakpoint, index) {
        // media query for each breakpoint
        var bQuery;
        if (index === 0) {
          bQuery = (0, _json2mq2.default)({ minWidth: 0, maxWidth: breakpoint });
        } else {
          bQuery = (0, _json2mq2.default)({ minWidth: breakpoints[index - 1], maxWidth: breakpoint });
        }
        // when not using server side rendering
        _canUseDom2.default && _this2.media(bQuery, function () {
          _this2.setState({ breakpoint: breakpoint });
        });
      });

      // Register media query for full screen. Need to support resize from small to large
      // convert javascript object to media query string
      var query = (0, _json2mq2.default)({ minWidth: breakpoints.slice(-1)[0] });

      _canUseDom2.default && this.media(query, function () {
        _this2.setState({ breakpoint: null });
      });
    }
  };

  Slider.prototype.componentWillUnmount = function componentWillUnmount() {
    this._responsiveMediaHandlers.forEach(function (obj) {
      enquire.unregister(obj.query, obj.handler);
    });
  };

  Slider.prototype.slickPrev = function slickPrev() {
    this.innerSlider.slickPrev();
  };

  Slider.prototype.slickNext = function slickNext() {
    this.innerSlider.slickNext();
  };

  Slider.prototype.slickGoTo = function slickGoTo(slide) {
    this.innerSlider.slickGoTo(slide);
  };

  Slider.prototype.slickPause = function slickPause() {
    this.innerSlider.pause();
  };

  Slider.prototype.slickPlay = function slickPlay() {
    this.innerSlider.autoPlay();
  };

  Slider.prototype.render = function render() {
    var _this3 = this;

    var settings;
    var newProps;
    if (this.state.breakpoint) {
      // never executes in the first render
      // so defaultProps should be already there in this.props
      newProps = this.props.responsive.filter(function (resp) {
        return resp.breakpoint === _this3.state.breakpoint;
      });
      settings = newProps[0].settings === 'unslick' ? 'unslick' : (0, _objectAssign2.default)({}, _defaultProps2.default, this.props, newProps[0].settings);
    } else {
      settings = (0, _objectAssign2.default)({}, _defaultProps2.default, this.props);
    }

    // force scrolling by one if centerMode is on
    if (settings.centerMode) {
      if (settings.slidesToScroll > 1 && "development" !== 'production') {
        console.warn('slidesToScroll should be equal to 1 in centerMode, you are using ' + settings.slidesToScroll);
      }
      settings.slidesToScroll = 1;
    }
    // force showing one slide and scrolling by one if the fade mode is on
    if (settings.fade) {
      if (settings.slidesToShow > 1 && "development" !== 'production') {
        console.warn('slidesToShow should be equal to 1 when fade is true, you\'re using ' + settings.slidesToShow);
      }
      if (settings.slidesToScroll > 1 && "development" !== 'production') {
        console.warn('slidesToScroll should be equal to 1 when fade is true, you\'re using ' + settings.slidesToScroll);
      }
      settings.slidesToShow = 1;
      settings.slidesToScroll = 1;
    }

    // makes sure that children is an array, even when there is only 1 child
    var children = _react2.default.Children.toArray(this.props.children);

    // Children may contain false or null, so we should filter them
    // children may also contain string filled with spaces (in certain cases where we use jsx strings)
    children = children.filter(function (child) {
      if (typeof child === 'string') {
        return !!child.trim();
      }
      return !!child;
    });

    if (settings === 'unslick') {
      // if 'unslick' responsive breakpoint setting used, just return the <Slider> tag nested HTML
      return _react2.default.createElement(
        'div',
        { className: this.props.className + ' unslicked' },
        children
      );
    } else {
      return _react2.default.createElement(
        _innerSlider.InnerSlider,
        _extends({ ref: this.innerSliderRefHandler }, settings),
        children
      );
    }
  };

  return Slider;
}(_react2.default.Component);

exports.default = Slider;

/***/ }),

/***/ "./node_modules/react-slick/lib/track.js":
/*!***********************************************!*\
  !*** ./node_modules/react-slick/lib/track.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.Track = undefined;

var _react = __webpack_require__(/*! react */ "react");

var _react2 = _interopRequireDefault(_react);

var _objectAssign = __webpack_require__(/*! object-assign */ "./node_modules/object-assign/index.js");

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _classnames = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// given specifications/props for a slide, fetch all the classes that need to be applied to the slide
var getSlideClasses = function getSlideClasses(spec) {
  // if spec has currentSlideIndex, we can also apply slickCurrent class according to that (https://github.com/kenwheeler/slick/blob/master/slick/slick.js#L2300-L2302)
  var slickActive, slickCenter, slickCloned;
  var centerOffset, index;

  if (spec.rtl) {
    // if we're going right to left, index is reversed
    index = spec.slideCount - 1 - spec.index;
  } else {
    // index of the slide
    index = spec.index;
  }
  slickCloned = index < 0 || index >= spec.slideCount;
  if (spec.centerMode) {
    centerOffset = Math.floor(spec.slidesToShow / 2);
    slickCenter = (index - spec.currentSlide) % spec.slideCount === 0; // concern: not sure if this should be correct (https://github.com/kenwheeler/slick/blob/master/slick/slick.js#L2328-L2346)
    if (index > spec.currentSlide - centerOffset - 1 && index <= spec.currentSlide + centerOffset) {
      slickActive = true;
    }
  } else {
    // concern: following can be incorrect in case where currentSlide is lastSlide in frame and rest of the slides to show have index smaller than currentSlideIndex
    slickActive = spec.currentSlide <= index && index < spec.currentSlide + spec.slidesToShow;
  }
  var slickCurrent = index === spec.currentSlide;
  return (0, _classnames2.default)({
    'slick-slide': true,
    'slick-active': slickActive,
    'slick-center': slickCenter,
    'slick-cloned': slickCloned,
    'slick-current': slickCurrent // dubious in case of RTL
  });
};

var getSlideStyle = function getSlideStyle(spec) {
  var style = {};

  if (spec.variableWidth === undefined || spec.variableWidth === false) {
    style.width = spec.slideWidth;
  }

  if (spec.fade) {
    style.position = 'relative';
    if (spec.vertical) {
      style.top = -spec.index * spec.slideHeight;
    } else {
      style.left = -spec.index * spec.slideWidth;
    }
    style.opacity = spec.currentSlide === spec.index ? 1 : 0;
    style.visibility = spec.currentSlide === spec.index ? 'visible' : 'hidden';
    style.transition = 'opacity ' + spec.speed + 'ms ' + spec.cssEase + ', ' + 'visibility ' + spec.speed + 'ms ' + spec.cssEase;
    style.WebkitTransition = 'opacity ' + spec.speed + 'ms ' + spec.cssEase + ', ' + 'visibility ' + spec.speed + 'ms ' + spec.cssEase;
  }

  return style;
};

var getKey = function getKey(child, fallbackKey) {
  return child.key || fallbackKey;
};

var renderSlides = function renderSlides(spec) {
  var key;
  var slides = [];
  var preCloneSlides = [];
  var postCloneSlides = [];
  var childrenCount = _react2.default.Children.count(spec.children);

  _react2.default.Children.forEach(spec.children, function (elem, index) {
    var child = void 0;
    var childOnClickOptions = {
      message: 'children',
      index: index,
      slidesToScroll: spec.slidesToScroll,
      currentSlide: spec.currentSlide
    };

    // in case of lazyLoad, whether or not we want to fetch the slide
    if (!spec.lazyLoad || spec.lazyLoad && spec.lazyLoadedList.indexOf(index) >= 0) {
      child = elem;
    } else {
      child = _react2.default.createElement('div', null);
    }
    var childStyle = getSlideStyle((0, _objectAssign2.default)({}, spec, { index: index }));
    var slideClass = child.props.className || '';

    var onClick = function onClick(e) {
      child.props && child.props.onClick && child.props.onClick(e);
      if (spec.focusOnSelect) {
        spec.focusOnSelect(childOnClickOptions);
      }
    };

    // push a cloned element of the desired slide
    slides.push(_react2.default.cloneElement(child, {
      key: 'original' + getKey(child, index),
      'data-index': index,
      className: (0, _classnames2.default)(getSlideClasses((0, _objectAssign2.default)({ index: index }, spec)), slideClass),
      tabIndex: '-1',
      style: (0, _objectAssign2.default)({ outline: 'none' }, child.props.style || {}, childStyle),
      onClick: onClick
    }));

    // variableWidth doesn't wrap properly.
    // if slide needs to be precloned or postcloned
    if (spec.infinite && spec.fade === false) {
      var preCloneNo = childrenCount - index;
      if (preCloneNo <= spec.slidesToShow + (spec.centerMode ? 1 : 0) && childrenCount !== spec.slidesToShow) {
        key = -preCloneNo;
        preCloneSlides.push(_react2.default.cloneElement(child, {
          key: 'precloned' + getKey(child, key),
          'data-index': key,
          className: (0, _classnames2.default)(getSlideClasses((0, _objectAssign2.default)({ index: key }, spec)), slideClass),
          style: (0, _objectAssign2.default)({}, child.props.style || {}, childStyle),
          onClick: onClick
        }));
      }

      if (childrenCount !== spec.slidesToShow) {
        key = childrenCount + index;
        postCloneSlides.push(_react2.default.cloneElement(child, {
          key: 'postcloned' + getKey(child, key),
          'data-index': key,
          className: (0, _classnames2.default)(getSlideClasses((0, _objectAssign2.default)({ index: key }, spec)), slideClass),
          style: (0, _objectAssign2.default)({}, child.props.style || {}, childStyle),
          onClick: onClick
        }));
      }
    }
  });

  if (spec.rtl) {
    return preCloneSlides.concat(slides, postCloneSlides).reverse();
  } else {
    return preCloneSlides.concat(slides, postCloneSlides);
  }
};

var Track = exports.Track = function (_React$Component) {
  _inherits(Track, _React$Component);

  function Track() {
    _classCallCheck(this, Track);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  Track.prototype.render = function render() {
    // var slides = renderSlides.call(this, this.props);
    var slides = renderSlides(this.props);
    return _react2.default.createElement(
      'div',
      { className: 'slick-track', style: this.props.trackStyle },
      slides
    );
  };

  return Track;
}(_react2.default.Component);

/***/ }),

/***/ "./node_modules/snarkdown/dist/snarkdown.es.js":
/*!*****************************************************!*\
  !*** ./node_modules/snarkdown/dist/snarkdown.es.js ***!
  \*****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var TAGS = {
	'' : ['<em>','</em>'],
	_ : ['<strong>','</strong>'],
	'\n' : ['<br />'],
	' ' : ['<br />'],
	'-': ['<hr />']
};

/** Outdent a string based on the first indented line's leading whitespace
 *	@private
 */
function outdent(str) {
	return str.replace(RegExp('^'+(str.match(/^(\t| )+/) || '')[0], 'gm'), '');
}

/** Encode special attribute characters to HTML entities in a String.
 *	@private
 */
function encodeAttr(str) {
	return (str+'').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Parse Markdown into an HTML String. */
function parse(md) {
	var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^```(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,3})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*])/gm,
		context = [],
		out = '',
		last = 0,
		links = {},
		chunk, prev, token, inner, t;

	function tag(token) {
		var desc = TAGS[token.replace(/\*/g,'_')[1] || ''],
			end = context[context.length-1]==token;
		if (!desc) { return token; }
		if (!desc[1]) { return desc[0]; }
		context[end?'pop':'push'](token);
		return desc[end|0];
	}

	function flush() {
		var str = '';
		while (context.length) { str += tag(context[context.length-1]); }
		return str;
	}

	md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function (s, name, url) {
		links[name.toLowerCase()] = url;
		return '';
	}).replace(/^\n+|\n+$/g, '');

	while ( (token=tokenizer.exec(md)) ) {
		prev = md.substring(last, token.index);
		last = tokenizer.lastIndex;
		chunk = token[0];
		if (prev.match(/[^\\](\\\\)*\\$/)) {
			// escaped
		}
		// Code/Indent blocks:
		else if (token[3] || token[4]) {
			chunk = '<pre class="code '+(token[4]?'poetry':token[2].toLowerCase())+'">'+outdent(encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, ''))+'</pre>';
		}
		// > Quotes, -* lists:
		else if (token[6]) {
			t = token[6];
			if (t.match(/\./)) {
				token[5] = token[5].replace(/^\d+/gm, '');
			}
			inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
			if (t==='>') { t = 'blockquote'; }
			else {
				t = t.match(/\./) ? 'ol' : 'ul';
				inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
			}
			chunk = '<'+t+'>' + inner + '</'+t+'>';
		}
		// Images:
		else if (token[8]) {
			chunk = "<img src=\"" + (encodeAttr(token[8])) + "\" alt=\"" + (encodeAttr(token[7])) + "\">";
		}
		// Links:
		else if (token[10]) {
			out = out.replace('<a>', ("<a href=\"" + (encodeAttr(token[11] || links[prev.toLowerCase()])) + "\">"));
			chunk = flush() + '</a>';
		}
		else if (token[9]) {
			chunk = '<a>';
		}
		// Headings:
		else if (token[12] || token[14]) {
			t = 'h' + (token[14] ? token[14].length : (token[13][0]==='='?1:2));
			chunk = '<'+t+'>' + parse(token[12] || token[15]) + '</'+t+'>';
		}
		// `code`:
		else if (token[16]) {
			chunk = '<code>'+encodeAttr(token[16])+'</code>';
		}
		// Inline formatting: *em*, **strong** & friends
		else if (token[17] || token[1]) {
			chunk = tag(token[17] || '--');
		}
		out += prev;
		out += chunk;
	}

	return (out + md.substring(last) + flush()).trim();
}

/* harmony default export */ __webpack_exports__["default"] = (parse);
//# sourceMappingURL=snarkdown.es.js.map


/***/ }),

/***/ "./node_modules/strict-uri-encode/index.js":
/*!*************************************************!*\
  !*** ./node_modules/strict-uri-encode/index.js ***!
  \*************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};


/***/ }),

/***/ "./node_modules/string-convert/camel2hyphen.js":
/*!*****************************************************!*\
  !*** ./node_modules/string-convert/camel2hyphen.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

var camel2hyphen = function (str) {
  return str
          .replace(/[A-Z]/g, function (match) {
            return '-' + match.toLowerCase();
          })
          .toLowerCase();
};

module.exports = camel2hyphen;

/***/ }),

/***/ "./node_modules/style-loader/lib/addStyles.js":
/*!****************************************************!*\
  !*** ./node_modules/style-loader/lib/addStyles.js ***!
  \****************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getTarget = function (target, parent) {
  if (parent){
    return parent.querySelector(target);
  }
  return document.querySelector(target);
};

var getElement = (function (fn) {
	var memo = {};

	return function(target, parent) {
                // If passing function in options, then use it for resolve "head" element.
                // Useful for Shadow Root style i.e
                // {
                //   insertInto: function () { return document.querySelector("#foo").shadowRoot }
                // }
                if (typeof target === 'function') {
                        return target();
                }
                if (typeof memo[target] === "undefined") {
			var styleTarget = getTarget.call(this, target, parent);
			// Special case to return head of iframe instead of iframe itself
			if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[target] = styleTarget;
		}
		return memo[target]
	};
})();

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(/*! ./urls */ "./node_modules/style-loader/lib/urls.js");

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton && typeof options.singleton !== "boolean") options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
        if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertAt.before, target);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}

	if(options.attrs.nonce === undefined) {
		var nonce = getNonce();
		if (nonce) {
			options.attrs.nonce = nonce;
		}
	}

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	if(options.attrs.type === undefined) {
		options.attrs.type = "text/css";
	}
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function getNonce() {
	if (false) {}

	return __webpack_require__.nc;
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ "./node_modules/style-loader/lib/urls.js":
/*!***********************************************!*\
  !*** ./node_modules/style-loader/lib/urls.js ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),

/***/ "./node_modules/tlds/index.js":
/*!************************************!*\
  !*** ./node_modules/tlds/index.js ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = [
  "aaa",
  "aarp",
  "abarth",
  "abb",
  "abbott",
  "abbvie",
  "abc",
  "able",
  "abogado",
  "abudhabi",
  "ac",
  "academy",
  "accenture",
  "accountant",
  "accountants",
  "aco",
  "active",
  "actor",
  "ad",
  "adac",
  "ads",
  "adult",
  "ae",
  "aeg",
  "aero",
  "aetna",
  "af",
  "afamilycompany",
  "afl",
  "africa",
  "ag",
  "agakhan",
  "agency",
  "ai",
  "aig",
  "aigo",
  "airbus",
  "airforce",
  "airtel",
  "akdn",
  "al",
  "alfaromeo",
  "alibaba",
  "alipay",
  "allfinanz",
  "allstate",
  "ally",
  "alsace",
  "alstom",
  "am",
  "americanexpress",
  "americanfamily",
  "amex",
  "amfam",
  "amica",
  "amsterdam",
  "analytics",
  "android",
  "anquan",
  "anz",
  "ao",
  "aol",
  "apartments",
  "app",
  "apple",
  "aq",
  "aquarelle",
  "ar",
  "arab",
  "aramco",
  "archi",
  "army",
  "arpa",
  "art",
  "arte",
  "as",
  "asda",
  "asia",
  "associates",
  "at",
  "athleta",
  "attorney",
  "au",
  "auction",
  "audi",
  "audible",
  "audio",
  "auspost",
  "author",
  "auto",
  "autos",
  "avianca",
  "aw",
  "aws",
  "ax",
  "axa",
  "az",
  "azure",
  "ba",
  "baby",
  "baidu",
  "banamex",
  "bananarepublic",
  "band",
  "bank",
  "bar",
  "barcelona",
  "barclaycard",
  "barclays",
  "barefoot",
  "bargains",
  "baseball",
  "basketball",
  "bauhaus",
  "bayern",
  "bb",
  "bbc",
  "bbt",
  "bbva",
  "bcg",
  "bcn",
  "bd",
  "be",
  "beats",
  "beauty",
  "beer",
  "bentley",
  "berlin",
  "best",
  "bestbuy",
  "bet",
  "bf",
  "bg",
  "bh",
  "bharti",
  "bi",
  "bible",
  "bid",
  "bike",
  "bing",
  "bingo",
  "bio",
  "biz",
  "bj",
  "black",
  "blackfriday",
  "blanco",
  "blockbuster",
  "blog",
  "bloomberg",
  "blue",
  "bm",
  "bms",
  "bmw",
  "bn",
  "bnl",
  "bnpparibas",
  "bo",
  "boats",
  "boehringer",
  "bofa",
  "bom",
  "bond",
  "boo",
  "book",
  "booking",
  "bosch",
  "bostik",
  "boston",
  "bot",
  "boutique",
  "box",
  "br",
  "bradesco",
  "bridgestone",
  "broadway",
  "broker",
  "brother",
  "brussels",
  "bs",
  "bt",
  "budapest",
  "bugatti",
  "build",
  "builders",
  "business",
  "buy",
  "buzz",
  "bv",
  "bw",
  "by",
  "bz",
  "bzh",
  "ca",
  "cab",
  "cafe",
  "cal",
  "call",
  "calvinklein",
  "cam",
  "camera",
  "camp",
  "cancerresearch",
  "canon",
  "capetown",
  "capital",
  "capitalone",
  "car",
  "caravan",
  "cards",
  "care",
  "career",
  "careers",
  "cars",
  "cartier",
  "casa",
  "case",
  "caseih",
  "cash",
  "casino",
  "cat",
  "catering",
  "catholic",
  "cba",
  "cbn",
  "cbre",
  "cbs",
  "cc",
  "cd",
  "ceb",
  "center",
  "ceo",
  "cern",
  "cf",
  "cfa",
  "cfd",
  "cg",
  "ch",
  "chanel",
  "channel",
  "chase",
  "chat",
  "cheap",
  "chintai",
  "christmas",
  "chrome",
  "chrysler",
  "church",
  "ci",
  "cipriani",
  "circle",
  "cisco",
  "citadel",
  "citi",
  "citic",
  "city",
  "cityeats",
  "ck",
  "cl",
  "claims",
  "cleaning",
  "click",
  "clinic",
  "clinique",
  "clothing",
  "cloud",
  "club",
  "clubmed",
  "cm",
  "cn",
  "co",
  "coach",
  "codes",
  "coffee",
  "college",
  "cologne",
  "com",
  "comcast",
  "commbank",
  "community",
  "company",
  "compare",
  "computer",
  "comsec",
  "condos",
  "construction",
  "consulting",
  "contact",
  "contractors",
  "cooking",
  "cookingchannel",
  "cool",
  "coop",
  "corsica",
  "country",
  "coupon",
  "coupons",
  "courses",
  "cr",
  "credit",
  "creditcard",
  "creditunion",
  "cricket",
  "crown",
  "crs",
  "cruise",
  "cruises",
  "csc",
  "cu",
  "cuisinella",
  "cv",
  "cw",
  "cx",
  "cy",
  "cymru",
  "cyou",
  "cz",
  "dabur",
  "dad",
  "dance",
  "data",
  "date",
  "dating",
  "datsun",
  "day",
  "dclk",
  "dds",
  "de",
  "deal",
  "dealer",
  "deals",
  "degree",
  "delivery",
  "dell",
  "deloitte",
  "delta",
  "democrat",
  "dental",
  "dentist",
  "desi",
  "design",
  "dev",
  "dhl",
  "diamonds",
  "diet",
  "digital",
  "direct",
  "directory",
  "discount",
  "discover",
  "dish",
  "diy",
  "dj",
  "dk",
  "dm",
  "dnp",
  "do",
  "docs",
  "doctor",
  "dodge",
  "dog",
  "doha",
  "domains",
  "dot",
  "download",
  "drive",
  "dtv",
  "dubai",
  "duck",
  "dunlop",
  "duns",
  "dupont",
  "durban",
  "dvag",
  "dvr",
  "dz",
  "earth",
  "eat",
  "ec",
  "eco",
  "edeka",
  "edu",
  "education",
  "ee",
  "eg",
  "email",
  "emerck",
  "energy",
  "engineer",
  "engineering",
  "enterprises",
  "epost",
  "epson",
  "equipment",
  "er",
  "ericsson",
  "erni",
  "es",
  "esq",
  "estate",
  "esurance",
  "et",
  "etisalat",
  "eu",
  "eurovision",
  "eus",
  "events",
  "everbank",
  "exchange",
  "expert",
  "exposed",
  "express",
  "extraspace",
  "fage",
  "fail",
  "fairwinds",
  "faith",
  "family",
  "fan",
  "fans",
  "farm",
  "farmers",
  "fashion",
  "fast",
  "fedex",
  "feedback",
  "ferrari",
  "ferrero",
  "fi",
  "fiat",
  "fidelity",
  "fido",
  "film",
  "final",
  "finance",
  "financial",
  "fire",
  "firestone",
  "firmdale",
  "fish",
  "fishing",
  "fit",
  "fitness",
  "fj",
  "fk",
  "flickr",
  "flights",
  "flir",
  "florist",
  "flowers",
  "fly",
  "fm",
  "fo",
  "foo",
  "food",
  "foodnetwork",
  "football",
  "ford",
  "forex",
  "forsale",
  "forum",
  "foundation",
  "fox",
  "fr",
  "free",
  "fresenius",
  "frl",
  "frogans",
  "frontdoor",
  "frontier",
  "ftr",
  "fujitsu",
  "fujixerox",
  "fun",
  "fund",
  "furniture",
  "futbol",
  "fyi",
  "ga",
  "gal",
  "gallery",
  "gallo",
  "gallup",
  "game",
  "games",
  "gap",
  "garden",
  "gb",
  "gbiz",
  "gd",
  "gdn",
  "ge",
  "gea",
  "gent",
  "genting",
  "george",
  "gf",
  "gg",
  "ggee",
  "gh",
  "gi",
  "gift",
  "gifts",
  "gives",
  "giving",
  "gl",
  "glade",
  "glass",
  "gle",
  "global",
  "globo",
  "gm",
  "gmail",
  "gmbh",
  "gmo",
  "gmx",
  "gn",
  "godaddy",
  "gold",
  "goldpoint",
  "golf",
  "goo",
  "goodhands",
  "goodyear",
  "goog",
  "google",
  "gop",
  "got",
  "gov",
  "gp",
  "gq",
  "gr",
  "grainger",
  "graphics",
  "gratis",
  "green",
  "gripe",
  "grocery",
  "group",
  "gs",
  "gt",
  "gu",
  "guardian",
  "gucci",
  "guge",
  "guide",
  "guitars",
  "guru",
  "gw",
  "gy",
  "hair",
  "hamburg",
  "hangout",
  "haus",
  "hbo",
  "hdfc",
  "hdfcbank",
  "health",
  "healthcare",
  "help",
  "helsinki",
  "here",
  "hermes",
  "hgtv",
  "hiphop",
  "hisamitsu",
  "hitachi",
  "hiv",
  "hk",
  "hkt",
  "hm",
  "hn",
  "hockey",
  "holdings",
  "holiday",
  "homedepot",
  "homegoods",
  "homes",
  "homesense",
  "honda",
  "honeywell",
  "horse",
  "hospital",
  "host",
  "hosting",
  "hot",
  "hoteles",
  "hotels",
  "hotmail",
  "house",
  "how",
  "hr",
  "hsbc",
  "ht",
  "hu",
  "hughes",
  "hyatt",
  "hyundai",
  "ibm",
  "icbc",
  "ice",
  "icu",
  "id",
  "ie",
  "ieee",
  "ifm",
  "ikano",
  "il",
  "im",
  "imamat",
  "imdb",
  "immo",
  "immobilien",
  "in",
  "industries",
  "infiniti",
  "info",
  "ing",
  "ink",
  "institute",
  "insurance",
  "insure",
  "int",
  "intel",
  "international",
  "intuit",
  "investments",
  "io",
  "ipiranga",
  "iq",
  "ir",
  "irish",
  "is",
  "iselect",
  "ismaili",
  "ist",
  "istanbul",
  "it",
  "itau",
  "itv",
  "iveco",
  "iwc",
  "jaguar",
  "java",
  "jcb",
  "jcp",
  "je",
  "jeep",
  "jetzt",
  "jewelry",
  "jio",
  "jlc",
  "jll",
  "jm",
  "jmp",
  "jnj",
  "jo",
  "jobs",
  "joburg",
  "jot",
  "joy",
  "jp",
  "jpmorgan",
  "jprs",
  "juegos",
  "juniper",
  "kaufen",
  "kddi",
  "ke",
  "kerryhotels",
  "kerrylogistics",
  "kerryproperties",
  "kfh",
  "kg",
  "kh",
  "ki",
  "kia",
  "kim",
  "kinder",
  "kindle",
  "kitchen",
  "kiwi",
  "km",
  "kn",
  "koeln",
  "komatsu",
  "kosher",
  "kp",
  "kpmg",
  "kpn",
  "kr",
  "krd",
  "kred",
  "kuokgroup",
  "kw",
  "ky",
  "kyoto",
  "kz",
  "la",
  "lacaixa",
  "ladbrokes",
  "lamborghini",
  "lamer",
  "lancaster",
  "lancia",
  "lancome",
  "land",
  "landrover",
  "lanxess",
  "lasalle",
  "lat",
  "latino",
  "latrobe",
  "law",
  "lawyer",
  "lb",
  "lc",
  "lds",
  "lease",
  "leclerc",
  "lefrak",
  "legal",
  "lego",
  "lexus",
  "lgbt",
  "li",
  "liaison",
  "lidl",
  "life",
  "lifeinsurance",
  "lifestyle",
  "lighting",
  "like",
  "lilly",
  "limited",
  "limo",
  "lincoln",
  "linde",
  "link",
  "lipsy",
  "live",
  "living",
  "lixil",
  "lk",
  "llc",
  "loan",
  "loans",
  "locker",
  "locus",
  "loft",
  "lol",
  "london",
  "lotte",
  "lotto",
  "love",
  "lpl",
  "lplfinancial",
  "lr",
  "ls",
  "lt",
  "ltd",
  "ltda",
  "lu",
  "lundbeck",
  "lupin",
  "luxe",
  "luxury",
  "lv",
  "ly",
  "ma",
  "macys",
  "madrid",
  "maif",
  "maison",
  "makeup",
  "man",
  "management",
  "mango",
  "map",
  "market",
  "marketing",
  "markets",
  "marriott",
  "marshalls",
  "maserati",
  "mattel",
  "mba",
  "mc",
  "mckinsey",
  "md",
  "me",
  "med",
  "media",
  "meet",
  "melbourne",
  "meme",
  "memorial",
  "men",
  "menu",
  "meo",
  "merckmsd",
  "metlife",
  "mg",
  "mh",
  "miami",
  "microsoft",
  "mil",
  "mini",
  "mint",
  "mit",
  "mitsubishi",
  "mk",
  "ml",
  "mlb",
  "mls",
  "mm",
  "mma",
  "mn",
  "mo",
  "mobi",
  "mobile",
  "mobily",
  "moda",
  "moe",
  "moi",
  "mom",
  "monash",
  "money",
  "monster",
  "mopar",
  "mormon",
  "mortgage",
  "moscow",
  "moto",
  "motorcycles",
  "mov",
  "movie",
  "movistar",
  "mp",
  "mq",
  "mr",
  "ms",
  "msd",
  "mt",
  "mtn",
  "mtr",
  "mu",
  "museum",
  "mutual",
  "mv",
  "mw",
  "mx",
  "my",
  "mz",
  "na",
  "nab",
  "nadex",
  "nagoya",
  "name",
  "nationwide",
  "natura",
  "navy",
  "nba",
  "nc",
  "ne",
  "nec",
  "net",
  "netbank",
  "netflix",
  "network",
  "neustar",
  "new",
  "newholland",
  "news",
  "next",
  "nextdirect",
  "nexus",
  "nf",
  "nfl",
  "ng",
  "ngo",
  "nhk",
  "ni",
  "nico",
  "nike",
  "nikon",
  "ninja",
  "nissan",
  "nissay",
  "nl",
  "no",
  "nokia",
  "northwesternmutual",
  "norton",
  "now",
  "nowruz",
  "nowtv",
  "np",
  "nr",
  "nra",
  "nrw",
  "ntt",
  "nu",
  "nyc",
  "nz",
  "obi",
  "observer",
  "off",
  "office",
  "okinawa",
  "olayan",
  "olayangroup",
  "oldnavy",
  "ollo",
  "om",
  "omega",
  "one",
  "ong",
  "onl",
  "online",
  "onyourside",
  "ooo",
  "open",
  "oracle",
  "orange",
  "org",
  "organic",
  "origins",
  "osaka",
  "otsuka",
  "ott",
  "ovh",
  "pa",
  "page",
  "panasonic",
  "panerai",
  "paris",
  "pars",
  "partners",
  "parts",
  "party",
  "passagens",
  "pay",
  "pccw",
  "pe",
  "pet",
  "pf",
  "pfizer",
  "pg",
  "ph",
  "pharmacy",
  "phd",
  "philips",
  "phone",
  "photo",
  "photography",
  "photos",
  "physio",
  "piaget",
  "pics",
  "pictet",
  "pictures",
  "pid",
  "pin",
  "ping",
  "pink",
  "pioneer",
  "pizza",
  "pk",
  "pl",
  "place",
  "play",
  "playstation",
  "plumbing",
  "plus",
  "pm",
  "pn",
  "pnc",
  "pohl",
  "poker",
  "politie",
  "porn",
  "post",
  "pr",
  "pramerica",
  "praxi",
  "press",
  "prime",
  "pro",
  "prod",
  "productions",
  "prof",
  "progressive",
  "promo",
  "properties",
  "property",
  "protection",
  "pru",
  "prudential",
  "ps",
  "pt",
  "pub",
  "pw",
  "pwc",
  "py",
  "qa",
  "qpon",
  "quebec",
  "quest",
  "qvc",
  "racing",
  "radio",
  "raid",
  "re",
  "read",
  "realestate",
  "realtor",
  "realty",
  "recipes",
  "red",
  "redstone",
  "redumbrella",
  "rehab",
  "reise",
  "reisen",
  "reit",
  "reliance",
  "ren",
  "rent",
  "rentals",
  "repair",
  "report",
  "republican",
  "rest",
  "restaurant",
  "review",
  "reviews",
  "rexroth",
  "rich",
  "richardli",
  "ricoh",
  "rightathome",
  "ril",
  "rio",
  "rip",
  "rmit",
  "ro",
  "rocher",
  "rocks",
  "rodeo",
  "rogers",
  "room",
  "rs",
  "rsvp",
  "ru",
  "rugby",
  "ruhr",
  "run",
  "rw",
  "rwe",
  "ryukyu",
  "sa",
  "saarland",
  "safe",
  "safety",
  "sakura",
  "sale",
  "salon",
  "samsclub",
  "samsung",
  "sandvik",
  "sandvikcoromant",
  "sanofi",
  "sap",
  "sapo",
  "sarl",
  "sas",
  "save",
  "saxo",
  "sb",
  "sbi",
  "sbs",
  "sc",
  "sca",
  "scb",
  "schaeffler",
  "schmidt",
  "scholarships",
  "school",
  "schule",
  "schwarz",
  "science",
  "scjohnson",
  "scor",
  "scot",
  "sd",
  "se",
  "search",
  "seat",
  "secure",
  "security",
  "seek",
  "select",
  "sener",
  "services",
  "ses",
  "seven",
  "sew",
  "sex",
  "sexy",
  "sfr",
  "sg",
  "sh",
  "shangrila",
  "sharp",
  "shaw",
  "shell",
  "shia",
  "shiksha",
  "shoes",
  "shop",
  "shopping",
  "shouji",
  "show",
  "showtime",
  "shriram",
  "si",
  "silk",
  "sina",
  "singles",
  "site",
  "sj",
  "sk",
  "ski",
  "skin",
  "sky",
  "skype",
  "sl",
  "sling",
  "sm",
  "smart",
  "smile",
  "sn",
  "sncf",
  "so",
  "soccer",
  "social",
  "softbank",
  "software",
  "sohu",
  "solar",
  "solutions",
  "song",
  "sony",
  "soy",
  "space",
  "spiegel",
  "sport",
  "spot",
  "spreadbetting",
  "sr",
  "srl",
  "srt",
  "st",
  "stada",
  "staples",
  "star",
  "starhub",
  "statebank",
  "statefarm",
  "statoil",
  "stc",
  "stcgroup",
  "stockholm",
  "storage",
  "store",
  "stream",
  "studio",
  "study",
  "style",
  "su",
  "sucks",
  "supplies",
  "supply",
  "support",
  "surf",
  "surgery",
  "suzuki",
  "sv",
  "swatch",
  "swiftcover",
  "swiss",
  "sx",
  "sy",
  "sydney",
  "symantec",
  "systems",
  "sz",
  "tab",
  "taipei",
  "talk",
  "taobao",
  "target",
  "tatamotors",
  "tatar",
  "tattoo",
  "tax",
  "taxi",
  "tc",
  "tci",
  "td",
  "tdk",
  "team",
  "tech",
  "technology",
  "tel",
  "telecity",
  "telefonica",
  "temasek",
  "tennis",
  "teva",
  "tf",
  "tg",
  "th",
  "thd",
  "theater",
  "theatre",
  "tiaa",
  "tickets",
  "tienda",
  "tiffany",
  "tips",
  "tires",
  "tirol",
  "tj",
  "tjmaxx",
  "tjx",
  "tk",
  "tkmaxx",
  "tl",
  "tm",
  "tmall",
  "tn",
  "to",
  "today",
  "tokyo",
  "tools",
  "top",
  "toray",
  "toshiba",
  "total",
  "tours",
  "town",
  "toyota",
  "toys",
  "tr",
  "trade",
  "trading",
  "training",
  "travel",
  "travelchannel",
  "travelers",
  "travelersinsurance",
  "trust",
  "trv",
  "tt",
  "tube",
  "tui",
  "tunes",
  "tushu",
  "tv",
  "tvs",
  "tw",
  "tz",
  "ua",
  "ubank",
  "ubs",
  "uconnect",
  "ug",
  "uk",
  "unicom",
  "university",
  "uno",
  "uol",
  "ups",
  "us",
  "uy",
  "uz",
  "va",
  "vacations",
  "vana",
  "vanguard",
  "vc",
  "ve",
  "vegas",
  "ventures",
  "verisign",
  "versicherung",
  "vet",
  "vg",
  "vi",
  "viajes",
  "video",
  "vig",
  "viking",
  "villas",
  "vin",
  "vip",
  "virgin",
  "visa",
  "vision",
  "vista",
  "vistaprint",
  "viva",
  "vivo",
  "vlaanderen",
  "vn",
  "vodka",
  "volkswagen",
  "volvo",
  "vote",
  "voting",
  "voto",
  "voyage",
  "vu",
  "vuelos",
  "wales",
  "walmart",
  "walter",
  "wang",
  "wanggou",
  "warman",
  "watch",
  "watches",
  "weather",
  "weatherchannel",
  "webcam",
  "weber",
  "website",
  "wed",
  "wedding",
  "weibo",
  "weir",
  "wf",
  "whoswho",
  "wien",
  "wiki",
  "williamhill",
  "win",
  "windows",
  "wine",
  "winners",
  "wme",
  "wolterskluwer",
  "woodside",
  "work",
  "works",
  "world",
  "wow",
  "ws",
  "wtc",
  "wtf",
  "xbox",
  "xerox",
  "xfinity",
  "xihuan",
  "xin",
  "कॉम", // xn--11b4c3d
  "セール", // xn--1ck2e1b
  "佛山", // xn--1qqw23a
  "ಭಾರತ", // xn--2scrj9c
  "慈善", // xn--30rr7y
  "集团", // xn--3bst00m
  "在线", // xn--3ds443g
  "한국", // xn--3e0b707e
  "ଭାରତ", // xn--3hcrj9c
  "大众汽车", // xn--3oq18vl8pn36a
  "点看", // xn--3pxu8k
  "คอม", // xn--42c2d9a
  "ভাৰত", // xn--45br5cyl
  "ভারত", // xn--45brj9c
  "八卦", // xn--45q11c
  "موقع", // xn--4gbrim
  "বাংলা", // xn--54b7fta0cc
  "公益", // xn--55qw42g
  "公司", // xn--55qx5d
  "香格里拉", // xn--5su34j936bgsg
  "网站", // xn--5tzm5g
  "移动", // xn--6frz82g
  "我爱你", // xn--6qq986b3xl
  "москва", // xn--80adxhks
  "қаз", // xn--80ao21a
  "католик", // xn--80aqecdr1a
  "онлайн", // xn--80asehdb
  "сайт", // xn--80aswg
  "联通", // xn--8y0a063a
  "срб", // xn--90a3ac
  "бг", // xn--90ae
  "бел", // xn--90ais
  "קום", // xn--9dbq2a
  "时尚", // xn--9et52u
  "微博", // xn--9krt00a
  "淡马锡", // xn--b4w605ferd
  "ファッション", // xn--bck1b9a5dre4c
  "орг", // xn--c1avg
  "नेट", // xn--c2br7g
  "ストア", // xn--cck2b3b
  "삼성", // xn--cg4bki
  "சிங்கப்பூர்", // xn--clchc0ea0b2g2a9gcd
  "商标", // xn--czr694b
  "商店", // xn--czrs0t
  "商城", // xn--czru2d
  "дети", // xn--d1acj3b
  "мкд", // xn--d1alf
  "ею", // xn--e1a4c
  "ポイント", // xn--eckvdtc9d
  "新闻", // xn--efvy88h
  "工行", // xn--estv75g
  "家電", // xn--fct429k
  "كوم", // xn--fhbei
  "中文网", // xn--fiq228c5hs
  "中信", // xn--fiq64b
  "中国", // xn--fiqs8s
  "中國", // xn--fiqz9s
  "娱乐", // xn--fjq720a
  "谷歌", // xn--flw351e
  "భారత్", // xn--fpcrj9c3d
  "ලංකා", // xn--fzc2c9e2c
  "電訊盈科", // xn--fzys8d69uvgm
  "购物", // xn--g2xx48c
  "クラウド", // xn--gckr3f0f
  "ભારત", // xn--gecrj9c
  "通販", // xn--gk3at1e
  "भारतम्", // xn--h2breg3eve
  "भारत", // xn--h2brj9c
  "भारोत", // xn--h2brj9c8c
  "网店", // xn--hxt814e
  "संगठन", // xn--i1b6b1a6a2e
  "餐厅", // xn--imr513n
  "网络", // xn--io0a7i
  "ком", // xn--j1aef
  "укр", // xn--j1amh
  "香港", // xn--j6w193g
  "诺基亚", // xn--jlq61u9w7b
  "食品", // xn--jvr189m
  "飞利浦", // xn--kcrx77d1x4a
  "台湾", // xn--kprw13d
  "台灣", // xn--kpry57d
  "手表", // xn--kpu716f
  "手机", // xn--kput3i
  "мон", // xn--l1acc
  "الجزائر", // xn--lgbbat1ad8j
  "عمان", // xn--mgb9awbf
  "ارامكو", // xn--mgba3a3ejt
  "ایران", // xn--mgba3a4f16a
  "العليان", // xn--mgba7c0bbn0a
  "اتصالات", // xn--mgbaakc7dvf
  "امارات", // xn--mgbaam7a8h
  "بازار", // xn--mgbab2bd
  "پاکستان", // xn--mgbai9azgqp6j
  "الاردن", // xn--mgbayh7gpa
  "موبايلي", // xn--mgbb9fbpob
  "بارت", // xn--mgbbh1a
  "بھارت", // xn--mgbbh1a71e
  "المغرب", // xn--mgbc0a9azcg
  "ابوظبي", // xn--mgbca7dzdo
  "السعودية", // xn--mgberp4a5d4ar
  "ڀارت", // xn--mgbgu82a
  "كاثوليك", // xn--mgbi4ecexp
  "سودان", // xn--mgbpl2fh
  "همراه", // xn--mgbt3dhd
  "عراق", // xn--mgbtx2b
  "مليسيا", // xn--mgbx4cd0ab
  "澳門", // xn--mix891f
  "닷컴", // xn--mk1bu44c
  "政府", // xn--mxtq1m
  "شبكة", // xn--ngbc5azd
  "بيتك", // xn--ngbe9e0a
  "عرب", // xn--ngbrx
  "გე", // xn--node
  "机构", // xn--nqv7f
  "组织机构", // xn--nqv7fs00ema
  "健康", // xn--nyqy26a
  "ไทย", // xn--o3cw4h
  "سورية", // xn--ogbpf8fl
  "招聘", // xn--otu796d
  "рус", // xn--p1acf
  "рф", // xn--p1ai
  "珠宝", // xn--pbt977c
  "تونس", // xn--pgbs0dh
  "大拿", // xn--pssy2u
  "みんな", // xn--q9jyb4c
  "グーグル", // xn--qcka1pmc
  "ελ", // xn--qxam
  "世界", // xn--rhqv96g
  "書籍", // xn--rovu88b
  "ഭാരതം", // xn--rvc1e0am3e
  "ਭਾਰਤ", // xn--s9brj9c
  "网址", // xn--ses554g
  "닷넷", // xn--t60b56a
  "コム", // xn--tckwe
  "天主教", // xn--tiq49xqyj
  "游戏", // xn--unup4y
  "vermögensberater", // xn--vermgensberater-ctb
  "vermögensberatung", // xn--vermgensberatung-pwb
  "企业", // xn--vhquv
  "信息", // xn--vuq861b
  "嘉里大酒店", // xn--w4r85el8fhu5dnra
  "嘉里", // xn--w4rs40l
  "مصر", // xn--wgbh1c
  "قطر", // xn--wgbl6a
  "广东", // xn--xhq521b
  "இலங்கை", // xn--xkc2al3hye2a
  "இந்தியா", // xn--xkc2dl3a5ee0h
  "հայ", // xn--y9a3aq
  "新加坡", // xn--yfro4i67o
  "فلسطين", // xn--ygbi2ammx
  "政务", // xn--zfr164b
  "xperia",
  "xxx",
  "xyz",
  "yachts",
  "yahoo",
  "yamaxun",
  "yandex",
  "ye",
  "yodobashi",
  "yoga",
  "yokohama",
  "you",
  "youtube",
  "yt",
  "yun",
  "za",
  "zappos",
  "zara",
  "zero",
  "zip",
  "zippo",
  "zm",
  "zone",
  "zuerich",
  "zw"
];


/***/ }),

/***/ "./node_modules/uc.micro/categories/Cc/regex.js":
/*!******************************************************!*\
  !*** ./node_modules/uc.micro/categories/Cc/regex.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports=/[\0-\x1F\x7F-\x9F]/

/***/ }),

/***/ "./node_modules/uc.micro/categories/P/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uc.micro/categories/P/regex.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports=/[!-#%-\*,-/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E49\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/

/***/ }),

/***/ "./node_modules/uc.micro/categories/Z/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uc.micro/categories/Z/regex.js ***!
  \*****************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/

/***/ }),

/***/ "./node_modules/uc.micro/properties/Any/regex.js":
/*!*******************************************************!*\
  !*** ./node_modules/uc.micro/properties/Any/regex.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/

/***/ }),

/***/ "./src/views/lite/components/Composer.jsx":
/*!************************************************!*\
  !*** ./src/views/lite/components/Composer.jsx ***!
  \************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var Composer =
/*#__PURE__*/
function (_Component) {
  _inherits(Composer, _Component);

  function Composer() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, Composer);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(Composer)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleKeyPress", function (e) {
      if (e.key === 'Enter') {
        _this.props.send();

        e.preventDefault();
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleKeyDown", function (e) {
      if (_this.props.config && _this.props.config.enableArrowNavigation) {
        var shouldFocusPrevious = e.target.selectionStart === 0 && (e.key === 'ArrowUp' || e.key === 'ArrowLeft');

        if (shouldFocusPrevious) {
          _this.props.focusPrevious();
        }

        var shouldFocusNext = e.target.selectionStart === _this.textInput.value.length && (e.key === 'ArrowDown' || e.key === 'ArrowRight');

        if (shouldFocusNext) {
          _this.props.focusNext();
        }
      } else if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
        _this.props.recallHistory(e.key);
      }
    });

    return _this;
  }

  _createClass(Composer, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.textInput.focus();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!prevProps.focused && this.props.focused) {
        this.textInput.focus();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-composer'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-composer-inner'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("textarea", {
        tabIndex: "1",
        ref: function ref(input) {
          _this2.textInput = input;
        },
        onFocus: this.props.onFocus,
        placeholder: this.props.placeholder,
        onChange: this.props.change,
        value: this.props.text,
        onKeyPress: this.handleKeyPress,
        onKeyDown: this.handleKeyDown
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        className: 'bpw-send-button',
        disabled: !this.props.text.length,
        onClick: this.props.send
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_1__["FormattedMessage"], {
        id: "composer.send"
      }))));
    }
  }]);

  return Composer;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_intl__WEBPACK_IMPORTED_MODULE_1__["injectIntl"])(Composer));

/***/ }),

/***/ "./src/views/lite/components/Container.jsx":
/*!*************************************************!*\
  !*** ./src/views/lite/components/Container.jsx ***!
  \*************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _Keyboard__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Keyboard */ "./src/views/lite/components/Keyboard.jsx");
/* harmony import */ var _ConversationList__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ConversationList */ "./src/views/lite/components/ConversationList.jsx");
/* harmony import */ var _Composer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Composer */ "./src/views/lite/components/Composer.jsx");
/* harmony import */ var _Header__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Header */ "./src/views/lite/components/Header.jsx");
/* harmony import */ var _common_BotInfo__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./common/BotInfo */ "./src/views/lite/components/common/BotInfo.jsx");
/* harmony import */ var _messages_MessageList__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./messages/MessageList */ "./src/views/lite/components/messages/MessageList.jsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils */ "./src/views/lite/utils.js");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }












var Container =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Container, _React$Component);

  function Container() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, Container);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(Container)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      currentFocus: 'input',
      showConvos: false,
      showBotInfo: false
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleFocusChanged", function (nextFocus) {
      return _this.setState({
        currentFocus: nextFocus
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleToggleShowConvos", function () {
      return _this.setState({
        showConvos: !_this.state.showConvos
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "toggleBotInfo", function () {
      return _this.setState({
        showBotInfo: !_this.state.showBotInfo
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleConvoClicked", function (convoId) {
      _this.props.onSwitchConvo && _this.props.onSwitchConvo(convoId);

      _this.handleToggleShowConvos();
    });

    return _this;
  }

  _createClass(Container, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (!this.props.currentConversation && this.props.botInfo.showBotInfoPage) {
        this.setState({
          showBotInfo: true
        });
      }
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!prevProps.currentConversation && this.props.currentConversation) {
        this.setState({
          showConvos: false
        });
      }
    }
  }, {
    key: "renderHeader",
    value: function renderHeader() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Header__WEBPACK_IMPORTED_MODULE_5__["default"], {
        focused: this.state.currentFocus === 'header',
        showConvos: this.state.showConvos,
        showBotInfo: this.state.showBotInfo,
        botInfo: this.props.botInfo,
        botName: this.props.botName,
        config: this.props.config,
        currentConversation: this.props.currentConversation,
        unreadCount: this.props.unreadCount,
        onResetClicked: this.props.onResetSession,
        onDownloadClicked: this.props.downloadConversation,
        onCloseClicked: this.props.onClose,
        onListClicked: this.handleToggleShowConvos,
        onInfoClicked: this.toggleBotInfo,
        focusNext: this.handleFocusChanged.bind(this, 'convo'),
        focusPrevious: this.handleFocusChanged.bind(this, 'input')
      });
    }
  }, {
    key: "renderComposer",
    value: function renderComposer() {
      var focused = this.state.currentFocus === 'input' && !this.state.showConvos && !this.state.showBotInfo;
      var Component = Object(_utils__WEBPACK_IMPORTED_MODULE_8__["getOverridedComponent"])(this.props.config.overrides, 'composer');

      if (Component) {
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Keyboard__WEBPACK_IMPORTED_MODULE_2__["Default"], null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(Component, _extends({
          original: {
            Composer: _Composer__WEBPACK_IMPORTED_MODULE_4__["default"]
          },
          name: this.props.botName
        }, this.props)));
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Keyboard__WEBPACK_IMPORTED_MODULE_2__["Default"], null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Composer__WEBPACK_IMPORTED_MODULE_4__["default"], {
        placeholder: this.props.intl.formatMessage({
          id: 'composer.placeholder'
        }, {
          name: this.props.botName
        }),
        send: this.props.onTextSend,
        change: this.props.onTextChanged,
        text: this.props.text,
        recallHistory: this.props.recallHistory,
        focused: focused,
        onFocus: this.handleFocusChanged.bind(this, 'input'),
        focusNext: this.handleFocusChanged.bind(this, 'header'),
        focusPrevious: this.handleFocusChanged.bind(this, 'convo'),
        config: this.props.config,
        onFileUpload: this.props.onFileUpload,
        onSendData: this.props.onSendData
      }));
    }
  }, {
    key: "renderConversation",
    value: function renderConversation() {
      var messagesProps = {
        bp: this.props.bp,
        typingUntil: this.props.currentConversation && this.props.currentConversation.typingUntil,
        messages: this.props.currentConversation && this.props.currentConversation.messages,
        botName: this.props.botName,
        botAvatarUrl: this.props.botInfo.details && this.props.botInfo.details.avatarUrl || this.props.config.avatarUrl,
        showUserName: this.props.config && this.props.config.showUserName,
        showUserAvatar: this.props.config && this.props.config.showUserAvatar,
        onFileUpload: this.props.onFileUpload,
        onSendData: this.props.onSendData,
        focused: this.state.currentFocus === 'convo',
        focusNext: this.handleFocusChanged.bind(this, 'input'),
        focusPrevious: this.handleFocusChanged.bind(this, 'header'),
        enableArrowNavigation: this.props.config && this.props.config.enableArrowNavigation
      };
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-msg-list-container'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_messages_MessageList__WEBPACK_IMPORTED_MODULE_7__["default"], messagesProps), this.renderComposer());
    }
  }, {
    key: "renderBody",
    value: function renderBody() {
      if (this.state.showConvos) {
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_ConversationList__WEBPACK_IMPORTED_MODULE_3__["default"], {
          enableArrowNavigation: this.props.config && this.props.config.enableArrowNavigation,
          conversations: this.props.conversations,
          createConversation: this.props.createConversation,
          onConversationClicked: this.handleConvoClicked
        });
      } else if (this.state.showBotInfo) {
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_common_BotInfo__WEBPACK_IMPORTED_MODULE_6__["default"], {
          botInfo: this.props.botInfo,
          config: this.props.config,
          currentConversation: this.props.currentConversation,
          toggleBotInfo: this.toggleBotInfo,
          onSendData: this.props.onSendData
        });
      } else {
        return this.renderConversation();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var fullscreen = this.props.fullscreen ? 'fullscreen' : null;
      var classNames = classnames__WEBPACK_IMPORTED_MODULE_1___default()('bpw-layout', 'bpw-chat-container', _defineProperty({
        'bpw-layout-fullscreen': fullscreen
      }, 'bpw-anim-' + this.props.transition, true));
      var CustomComponent = Object(_utils__WEBPACK_IMPORTED_MODULE_8__["getOverridedComponent"])(this.props.config.overrides, 'below_conversation');
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: classNames
      }, this.renderHeader(), this.renderBody(), CustomComponent && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(CustomComponent, this.props)));
    }
  }]);

  return Container;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_intl__WEBPACK_IMPORTED_MODULE_9__["injectIntl"])(Container));

/***/ }),

/***/ "./src/views/lite/components/ConversationList.jsx":
/*!********************************************************!*\
  !*** ./src/views/lite/components/ConversationList.jsx ***!
  \********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _icons_Add__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../icons/Add */ "./src/views/lite/icons/Add.jsx");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var ConversationListItem = Object(react_intl__WEBPACK_IMPORTED_MODULE_2__["injectIntl"])(function (_ref) {
  var conversation = _ref.conversation,
      onClick = _ref.onClick,
      hasFocus = _ref.hasFocus,
      intl = _ref.intl;
  var title = conversation.title || conversation.message_author || intl.formatMessage({
    id: 'conversationList.untitledConversation',
    defaultMessage: 'Untitled Conversation'
  });
  var date = intl.formatRelative(conversation.message_sent_on || conversation.created_on);
  var message = conversation.message_text || '...';
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-convo-item',
    onClick: onClick
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-align-right'
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-title'
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, title), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-date'
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", null, date))), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-convo-preview'
  }, message)));
});

var ConversationList =
/*#__PURE__*/
function (_React$Component) {
  _inherits(ConversationList, _React$Component);

  function ConversationList() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, ConversationList);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(ConversationList)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      focusIdx: null
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "changeFocus", function (step) {
      var focusIdx = _this.state.focusIdx || 0;
      focusIdx += step;

      if (focusIdx > _this.props.conversations.length) {
        focusIdx = 0;
      } else if (focusIdx < 0) {
        focusIdx = _this.props.conversations.length;
      }

      _this.setState({
        focusIdx: focusIdx
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleKeyDown", function (e) {
      if (!_this.props.enableArrowNavigation) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        _this.changeFocus(1);
      } else if (e.key == 'ArrowUp' || e.key == 'ArrowLeft') {
        _this.changeFocus(-1);
      } else if (e.key == 'Enter' && _this.state.focusIdx && _this.state.focusIdx < _this.props.conversations.length) {
        var convoId = _this.props.conversations[_this.state.focusIdx].id;

        _this.props.onConversationClicked(convoId);
      }
    });

    return _this;
  }

  _createClass(ConversationList, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.main.focus();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(_, prevState) {
      if (this.state.focusIdx === this.props.conversations.length) {
        this.btn.focus();
      } else if (prevState.focusIdx === this.props.conversations.length) {
        this.main.focus();
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          conversations = _this$props.conversations,
          createConversation = _this$props.createConversation,
          onConversationClicked = _this$props.onConversationClicked;
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        tabIndex: "0",
        ref: function ref(el) {
          return _this2.main = el;
        },
        className: 'bpw-convo-list',
        onKeyDown: this.handleKeyDown
      }, conversations.map(function (convo, idx) {
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(ConversationListItem, {
          key: convo.id,
          hasFocus: _this2.state.focusIdx == idx,
          conversation: convo,
          onClick: onConversationClicked.bind(_this2, convo.id)
        });
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        ref: function ref(el) {
          return _this2.btn = el;
        },
        className: 'bpw-convo-add-btn',
        onClick: createConversation
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Add__WEBPACK_IMPORTED_MODULE_1__["default"], {
        width: 15,
        height: 15
      })));
    }
  }]);

  return ConversationList;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);

/* harmony default export */ __webpack_exports__["default"] = (ConversationList);

/***/ }),

/***/ "./src/views/lite/components/Header.jsx":
/*!**********************************************!*\
  !*** ./src/views/lite/components/Header.jsx ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _icons_Reload__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../icons/Reload */ "./src/views/lite/icons/Reload.jsx");
/* harmony import */ var _icons_List__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../icons/List */ "./src/views/lite/icons/List.jsx");
/* harmony import */ var _icons_Close__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../icons/Close */ "./src/views/lite/icons/Close.jsx");
/* harmony import */ var _icons_Download__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../icons/Download */ "./src/views/lite/icons/Download.jsx");
/* harmony import */ var _icons_Information__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../icons/Information */ "./src/views/lite/icons/Information.jsx");
/* harmony import */ var _common_Avatar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./common/Avatar */ "./src/views/lite/components/common/Avatar.jsx");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }










var Header =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Header, _React$Component);

  function Header() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, Header);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(Header)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "btnEls", {});

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      currentFocusIdx: null
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "onBlur", function () {
      _this.setCurrentFocusIdx(null);
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "setCurrentFocusIdx", function (currentFocusIdx) {
      _this.setState({
        currentFocusIdx: currentFocusIdx
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "changeButtonFocus", function (step) {
      var idx = _this.state.currentFocusIdx !== null ? _this.state.currentFocusIdx + step : 0;

      if (idx < 0) {
        _this.onBlur();

        _this.props.focusPrevious();
      }

      for (idx; idx < Object.keys(_this.btnEls).length; idx++) {
        if (_this.btnEls[idx]) {
          _this.btnEls[idx].focus();

          _this.setCurrentFocusIdx(idx);

          break;
        }
      }

      if (idx == Object.keys(_this.btnEls).length) {
        _this.onBlur();

        _this.props.focusNext();
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "renderAvatar", function () {
      var avatarUrl = _this.props.botInfo.details && _this.props.botInfo.details.avatarUrl || _this.props.config.avatarUrl;
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_common_Avatar__WEBPACK_IMPORTED_MODULE_6__["default"], {
        name: _this.props.botName,
        avatarUrl: avatarUrl,
        height: 40,
        width: 40
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "renderTitle", function () {
      var title = _this.props.showConvos ? _this.props.intl.formatMessage({
        id: 'header.conversations'
      }) : _this.props.botName;
      var description = _this.props.config.botConvoDescription;
      var hasDescription = description && description.length > 0;
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-title'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-name'
      }, title, _this.props.unreadCount > 0 && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        className: 'bpw-header-unread'
      }, _this.props.unreadCount)), hasDescription && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-subtitle'
      }, description));
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleKeyDown", function (action, e) {
      if (!_this.props.config || _this.props.config && !_this.props.config.enableArrowNavigation) {
        return;
      }

      if (e.key == 'ArrowUp') {
        _this.props.focusPrevious();
      } else if (e.key == 'ArrowDown') {
        _this.props.focusNext();
      } else if (e.key == 'ArrowLeft') {
        _this.changeButtonFocus(-1);
      } else if (e.key == 'ArrowRight') {
        _this.changeButtonFocus(1);
      } else if (e.key == 'Enter') {
        e.preventDefault();
        action();
      }
    });

    return _this;
  }

  _createClass(Header, [{
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!prevProps.focused && this.props.focused) {
        this.changeButtonFocus(1);
      }
    }
  }, {
    key: "renderResetButton",
    value: function renderResetButton() {
      var _this2 = this;

      return !this.props.showConvos && !this.props.showBotInfo && this.props.config.enableReset && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        tabIndex: "-1",
        ref: function ref(el) {
          return _this2.btnEls[0] = el;
        },
        className: 'bpw-header-icon bpw-header-icon-reset',
        onClick: this.props.onResetClicked,
        onKeyDown: this.handleKeyDown.bind(this, this.props.onResetClicked),
        onBlur: this.onBlur
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Reload__WEBPACK_IMPORTED_MODULE_1__["default"], null));
    }
  }, {
    key: "renderDownloadButton",
    value: function renderDownloadButton() {
      var _this3 = this;

      return !this.props.showConvos && !this.props.showBotInfo && this.props.config.enableTranscriptDownload && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        tabIndex: "-1",
        ref: function ref(el) {
          return _this3.btnEls[1] = el;
        },
        className: 'bpw-header-icon bpw-header-icon-download',
        onClick: this.props.onDownloadClicked,
        onKeyDown: this.handleKeyDown.bind(this, this.props.onDownloadClicked),
        onBlur: this.onBlur
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Download__WEBPACK_IMPORTED_MODULE_4__["default"], null));
    }
  }, {
    key: "renderConvoButton",
    value: function renderConvoButton() {
      var _this4 = this;

      return this.props.config.showConversationsButton && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        tabIndex: "-1",
        ref: function ref(el) {
          return _this4.btnEls[2] = el;
        },
        className: 'bpw-header-icon bpw-header-icon-convo',
        onClick: this.props.onListClicked,
        onKeyDown: this.handleKeyDown.bind(this, this.props.onListClicked),
        onBlur: this.onBlur
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_List__WEBPACK_IMPORTED_MODULE_2__["default"], null));
    }
  }, {
    key: "renderBotInfoButton",
    value: function renderBotInfoButton() {
      var _this5 = this;

      return !this.props.showConvos && this.props.botInfo.showBotInfoPage && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        tabIndex: "-1",
        ref: function ref(el) {
          return _this5.btnEls[3] = el;
        },
        className: 'bpw-header-icon bpw-header-icon-botinfo',
        onClick: this.props.onInfoClicked,
        onKeyDown: this.handleKeyDown.bind(this, this.props.onInfoClicked),
        onBlur: this.onBlur
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Information__WEBPACK_IMPORTED_MODULE_5__["default"], null));
    }
  }, {
    key: "renderCloseButton",
    value: function renderCloseButton() {
      var _this6 = this;

      return this.props.onCloseClicked && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        tabIndex: "-1",
        ref: function ref(el) {
          return _this6.btnEls[4] = el;
        },
        className: 'bpw-header-icon bpw-header-icon-close',
        onClick: this.props.onCloseClicked,
        onKeyDown: this.handleKeyDown.bind(this, this.props.onCloseClicked),
        onBlur: this.onBlur
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Close__WEBPACK_IMPORTED_MODULE_3__["default"], null));
    }
  }, {
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-container'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-title-flexbox'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-header-title-container'
      }, this.renderAvatar(), this.renderTitle())), this.renderResetButton(), this.renderDownloadButton(), this.renderConvoButton(), this.renderBotInfoButton(), this.renderCloseButton());
    }
  }]);

  return Header;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_intl__WEBPACK_IMPORTED_MODULE_7__["injectIntl"])(Header));

/***/ }),

/***/ "./src/views/lite/components/Keyboard.jsx":
/*!************************************************!*\
  !*** ./src/views/lite/components/Keyboard.jsx ***!
  \************************************************/
/*! exports provided: Prepend, Append, Default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Prepend", function() { return Prepend; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Append", function() { return Append; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Default", function() { return Default; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }



var KeyboardElements =
/*#__PURE__*/
function (_React$Component) {
  _inherits(KeyboardElements, _React$Component);

  function KeyboardElements(props) {
    var _this;

    _classCallCheck(this, KeyboardElements);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(KeyboardElements).call(this, props));
    _this.el = document.createElement('div');
    return _this;
  }

  _createClass(KeyboardElements, [{
    key: "insertChildAt",
    value: function insertChildAt(child) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var parent = arguments.length > 2 ? arguments[2] : undefined;

      if (index >= parent.children.length) {
        parent.appendChild(child);
      } else {
        parent.insertBefore(child, parent.children[index]);
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      if (this.props.append) {
        this.insertChildAt(this.el, this.props.index, Default.appendRef.current);
      } else {
        this.insertChildAt(this.el, this.props.index, Default.prependRef.current);
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      if (this.props.append) {
        Default.appendRef.current.removeChild(this.el);
      } else {
        Default.prependRef.current.removeChild(this.el);
      }
    }
  }, {
    key: "render",
    value: function render() {
      return ReactDOM.createPortal(this.props.children, this.el);
    }
  }]);

  return KeyboardElements;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);

var Prepend =
/*#__PURE__*/
function (_Component) {
  _inherits(Prepend, _Component);

  function Prepend() {
    _classCallCheck(this, Prepend);

    return _possibleConstructorReturn(this, _getPrototypeOf(Prepend).apply(this, arguments));
  }

  _createClass(Prepend, [{
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, this.props.visible && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(KeyboardElements, {
        index: this.props.index
      }, this.props.keyboard), this.props.children);
    }
  }]);

  return Prepend;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);
var Append =
/*#__PURE__*/
function (_Component2) {
  _inherits(Append, _Component2);

  function Append() {
    _classCallCheck(this, Append);

    return _possibleConstructorReturn(this, _getPrototypeOf(Append).apply(this, arguments));
  }

  _createClass(Append, [{
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, this.props.visible && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(KeyboardElements, {
        append: true
      }, this.props.keyboard), this.props.children);
    }
  }]);

  return Append;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);
var Default =
/*#__PURE__*/
function (_Component3) {
  _inherits(Default, _Component3);

  function Default() {
    _classCallCheck(this, Default);

    return _possibleConstructorReturn(this, _getPrototypeOf(Default).apply(this, arguments));
  }

  _createClass(Default, [{
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-keyboard'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        ref: Default.prependRef
      }), this.props.children, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        ref: Default.appendRef
      }));
    }
  }]);

  return Default;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

_defineProperty(Default, "prependRef", react__WEBPACK_IMPORTED_MODULE_0___default.a.createRef());

_defineProperty(Default, "appendRef", react__WEBPACK_IMPORTED_MODULE_0___default.a.createRef());

/***/ }),

/***/ "./src/views/lite/components/common/Avatar.jsx":
/*!*****************************************************!*\
  !*** ./src/views/lite/components/common/Avatar.jsx ***!
  \*****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
var Avatar = function Avatar(_ref) {
  var name = _ref.name,
      avatarUrl = _ref.avatarUrl,
      height = _ref.height,
      width = _ref.width;
  return React.createElement("div", {
    className: 'bpw-bot-avatar'
  }, avatarUrl && React.createElement("img", {
    height: height,
    width: width,
    src: avatarUrl
  }), !avatarUrl && React.createElement("svg", {
    width: width,
    height: width
  }, React.createElement("text", {
    textAnchor: "middle",
    x: "50%",
    y: "50%",
    dy: "0.35em",
    fill: "#ffffff",
    fontSize: "15"
  }, name[0])));
};

/* harmony default export */ __webpack_exports__["default"] = (Avatar);

/***/ }),

/***/ "./src/views/lite/components/common/BotInfo.jsx":
/*!******************************************************!*\
  !*** ./src/views/lite/components/common/BotInfo.jsx ***!
  \******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var snarkdown__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! snarkdown */ "./node_modules/snarkdown/dist/snarkdown.es.js");
/* harmony import */ var _icons_Phone__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../icons/Phone */ "./src/views/lite/icons/Phone.jsx");
/* harmony import */ var _icons_Website__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../icons/Website */ "./src/views/lite/icons/Website.jsx");
/* harmony import */ var _icons_Email__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../icons/Email */ "./src/views/lite/icons/Email.jsx");
/* harmony import */ var _Avatar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Avatar */ "./src/views/lite/components/common/Avatar.jsx");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }









var CoverPicture = function CoverPicture(_ref) {
  var botInfo = _ref.botInfo;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("img", {
    className: 'bpw-botinfo-cover-picture',
    src: botInfo.details && botInfo.details.coverPictureUrl || "https://via.placeholder.com/400x175?text=".concat(botInfo.name)
  });
};

var BotAvatar = function BotAvatar(_ref2) {
  var botInfo = _ref2.botInfo,
      config = _ref2.config;
  var name = botInfo.name || config.botName;
  var avatarUrl = botInfo.details && botInfo.details.avatarUrl || config.avatarUrl;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Avatar__WEBPACK_IMPORTED_MODULE_5__["default"], {
    name: name,
    avatarUrl: avatarUrl,
    height: 64,
    width: 64
  });
};

var BotInfo =
/*#__PURE__*/
function (_React$Component) {
  _inherits(BotInfo, _React$Component);

  function BotInfo() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, BotInfo);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(BotInfo)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "startConversation", function () {
      _this.props.onSendData && _this.props.onSendData({
        type: 'request_start_conversation'
      }).then(_this.props.toggleBotInfo);
    });

    return _this;
  }

  _createClass(BotInfo, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.btnEl && this.btnEl.focus();
    }
  }, {
    key: "renderDescription",
    value: function renderDescription(text) {
      var html = Object(snarkdown__WEBPACK_IMPORTED_MODULE_1__["default"])(text || '');
      html = html.replace(/<a href/gi, "<a target=\"_blank\" href");
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-description',
        dangerouslySetInnerHTML: {
          __html: html
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this2 = this;

      var _this$props = this.props,
          botInfo = _this$props.botInfo,
          config = _this$props.config,
          currentConversation = _this$props.currentConversation;
      var isConvoStarted = currentConversation && !!currentConversation.messages.length;
      var onDismiss = isConvoStarted ? this.props.toggleBotInfo : this.startConversation;
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-container'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(CoverPicture, {
        botInfo: botInfo
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-summary'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(BotAvatar, {
        botInfo: botInfo,
        config: config
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("h3", null, botInfo.name || config.botName), this.renderDescription(botInfo.description)), botInfo.details && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react__WEBPACK_IMPORTED_MODULE_0__["Fragment"], null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-links'
      }, botInfo.details.phoneNumber && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-link'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Phone__WEBPACK_IMPORTED_MODULE_2__["default"], null)), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        target: "_blank",
        href: "tel:".concat(botInfo.details.phoneNumber)
      }, botInfo.details.phoneNumber)), botInfo.details.website && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-link'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Website__WEBPACK_IMPORTED_MODULE_3__["default"], null)), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        target: "_blank",
        href: botInfo.details.website
      }, botInfo.details.website)), botInfo.details.emailAddress && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-link'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Email__WEBPACK_IMPORTED_MODULE_4__["default"], null)), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        target: "_blank",
        href: "mailto:".concat(botInfo.details.emailAddress)
      }, botInfo.details.emailAddress))), botInfo.details.termsConditions && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-terms'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        target: "_blank",
        href: botInfo.details.termsConditions
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_6__["FormattedMessage"], {
        id: "botInfo.termsAndConditions"
      }))), botInfo.details.privacyPolicy && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-botinfo-terms'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        target: "_blank",
        href: botInfo.details.privacyPolicy
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_6__["FormattedMessage"], {
        id: "botInfo.privacyPolicy"
      })))), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        tabIndex: "1",
        ref: function ref(el) {
          return _this2.btnEl = el;
        },
        className: 'bpw-botinfo-start-button',
        onClick: onDismiss
      }, isConvoStarted ? react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_6__["FormattedMessage"], {
        id: "botInfo.backToConversation"
      }) : react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_6__["FormattedMessage"], {
        id: "botInfo.startConversation"
      })));
    }
  }]);

  return BotInfo;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_intl__WEBPACK_IMPORTED_MODULE_6__["injectIntl"])(BotInfo));

/***/ }),

/***/ "./src/views/lite/components/messages/Message.jsx":
/*!********************************************************!*\
  !*** ./src/views/lite/components/messages/Message.jsx ***!
  \********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _renderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./renderer */ "./src/views/lite/components/messages/renderer/index.jsx");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Keyboard__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Keyboard */ "./src/views/lite/components/Keyboard.jsx");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }






var Message =
/*#__PURE__*/
function (_Component) {
  _inherits(Message, _Component);

  function Message() {
    _classCallCheck(this, Message);

    return _possibleConstructorReturn(this, _getPrototypeOf(Message).apply(this, arguments));
  }

  _createClass(Message, [{
    key: "render_text",
    value: function render_text(textMessage) {
      var _this$props$payload = this.props.payload,
          text = _this$props$payload.text,
          markdown = _this$props$payload.markdown;

      if (!textMessage && !text) {
        return null;
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_renderer__WEBPACK_IMPORTED_MODULE_1__["Text"], {
        markdown: markdown,
        text: textMessage || text
      });
    }
  }, {
    key: "render_quick_reply",
    value: function render_quick_reply() {
      return this.render_text();
    }
  }, {
    key: "render_login_prompt",
    value: function render_login_prompt() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_renderer__WEBPACK_IMPORTED_MODULE_1__["LoginPrompt"], {
        isLastMessage: this.props.isLastGroup && this.props.isLastOfGroup,
        isBotMessage: this.props.isBotMessage,
        onSendData: this.props.onSendData
      });
    }
  }, {
    key: "render_carousel",
    value: function render_carousel() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_renderer__WEBPACK_IMPORTED_MODULE_1__["Carousel"], {
        onSendData: this.props.onSendData,
        carousel: this.props.payload
      });
    }
  }, {
    key: "render_typing",
    value: function render_typing() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-typing-group'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-typing-bubble'
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-typing-bubble'
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-typing-bubble'
      }));
    }
  }, {
    key: "render_file",
    value: function render_file() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_renderer__WEBPACK_IMPORTED_MODULE_1__["FileMessage"], {
        file: this.props.payload
      });
    }
  }, {
    key: "render_custom",
    value: function render_custom() {
      var _ref = this.props.payload || {},
          module = _ref.module,
          component = _ref.component,
          wrapped = _ref.wrapped;

      if (!module || !component) {
        return this.render_unsupported();
      }

      var InjectedModuleView = this.props.bp.getModuleInjector();

      var messageDataProps = _objectSpread({}, this.props.payload);

      delete messageDataProps.module;
      delete messageDataProps.component;

      var props = _objectSpread({}, _.pick(this.props, ['isLastGroup', 'isLastOfGroup', 'onSendData', 'onFileUpload', 'sentOn']), messageDataProps, {
        keyboard: _Keyboard__WEBPACK_IMPORTED_MODULE_3__,
        children: wrapped && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(Message, {
          bp: this.props.bp,
          keyboard: _Keyboard__WEBPACK_IMPORTED_MODULE_3__,
          noBubble: true,
          payload: wrapped
        })
      });

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(InjectedModuleView, {
        moduleName: module,
        componentName: component,
        lite: true,
        extraProps: props
      });
    }
  }, {
    key: "render_session_reset",
    value: function render_session_reset() {
      return this.render_text();
    }
  }, {
    key: "render_visit",
    value: function render_visit() {
      return null;
    }
  }, {
    key: "render_postback",
    value: function render_postback() {
      return this.render_text();
    }
  }, {
    key: "render_unsupported",
    value: function render_unsupported() {
      return '*Unsupported message type*';
    }
  }, {
    key: "render",
    value: function render() {
      var type = this.props.type || this.props.payload && this.props.payload.type;
      var renderer = (this['render_' + type] || this.render_unsupported).bind(this);
      var rendered = renderer();

      if (rendered === null) {
        return null;
      }

      var additionalStyle = this.props.payload && this.props.payload['web-style'] || {};

      if (this.props.noBubble) {
        return rendered;
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: classnames__WEBPACK_IMPORTED_MODULE_2___default()('bpw-chat-bubble', 'bpw-bubble-' + type),
        style: additionalStyle
      }, rendered);
    }
  }]);

  return Message;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Message);

/***/ }),

/***/ "./src/views/lite/components/messages/MessageGroup.jsx":
/*!*************************************************************!*\
  !*** ./src/views/lite/components/messages/MessageGroup.jsx ***!
  \*************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _Message__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Message */ "./src/views/lite/components/messages/Message.jsx");




var MessageGroup = function MessageGroup(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: classnames__WEBPACK_IMPORTED_MODULE_1___default()('bpw-message-big-container', {
      'bpw-from-user': !props.isBot,
      'bpw-from-bot': props.isBot
    })
  }, props.avatar, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-message-container'
  }, props.showUserName && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-message-username'
  }, props.userName), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-message-group'
  }, props.messages.map(function (data, i) {
    /**
     * @deprecated 12.0
     * Here, we convert old format to the new format Botpress uses internally.
     * - payload: all the data (raw, whatever) that is necessary to display the element
     * - type: extracted from payload for easy sorting
     */
    var payload = data.payload || data.message_data || data.message_raw || {
      text: data.message_text
    };

    if (!payload.type) {
      payload.type = data.message_type || data.message_data && data.message_data.type || 'text';
    } // Keeping compatibility with old schema for the quick reply


    if (data.message_type === 'quick_reply' && !payload.text) {
      payload.text = data.message_text;
    }

    if (data.message_type === 'file' && !payload.url) {
      payload.url = data.message_data && data.message_data.url || data.message_raw && data.message_raw.url;
    }

    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Message__WEBPACK_IMPORTED_MODULE_2__["default"], {
      bp: props.bp,
      key: "msg-".concat(i),
      isLastOfGroup: i >= props.messages.length - 1,
      isLastGroup: props.isLastGroup,
      payload: payload,
      sentOn: data.sent_on,
      onSendData: props.onSendData,
      onFileUpload: props.onFileUpload,
      isBotMessage: !data.userId
    });
  }))));
};

/* harmony default export */ __webpack_exports__["default"] = (MessageGroup);

/***/ }),

/***/ "./src/views/lite/components/messages/MessageList.jsx":
/*!************************************************************!*\
  !*** ./src/views/lite/components/messages/MessageList.jsx ***!
  \************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var date_fns_difference_in_minutes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! date-fns/difference_in_minutes */ "../../node_modules/date-fns/difference_in_minutes/index.js");
/* harmony import */ var date_fns_difference_in_minutes__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(date_fns_difference_in_minutes__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _MessageGroup__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./MessageGroup */ "./src/views/lite/components/messages/MessageGroup.jsx");
/* harmony import */ var _common_Avatar__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../common/Avatar */ "./src/views/lite/components/common/Avatar.jsx");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }






var TIME_BETWEEN_DATES = 10; // 10 minutes

var MessageList =
/*#__PURE__*/
function (_Component) {
  _inherits(MessageList, _Component);

  function MessageList() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, MessageList);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(MessageList)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleKeyDown", function (e) {
      if (!_this.props.enableArrowNavigation) {
        return;
      }

      var maxScroll = _this.messagesDiv.scrollHeight - _this.messagesDiv.clientHeight;
      var shouldFocusNext = e.key == 'ArrowRight' || e.key == 'ArrowDown' && _this.messagesDiv.scrollTop == maxScroll;
      var shouldFocusPrevious = e.key == 'ArrowLeft' || e.key == 'ArrowUp' && _this.messagesDiv.scrollTop == 0;

      if (shouldFocusNext) {
        _this.messagesDiv.blur();

        _this.props.focusNext();
      }

      if (shouldFocusPrevious) {
        _this.messagesDiv.blur();

        _this.props.focusPrevious();
      }
    });

    return _this;
  }

  _createClass(MessageList, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.tryScrollToBottom();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (!prevProps.focused && this.props.focused) {
        this.messagesDiv.focus();
      } //new message to display


      if (prevProps.messages !== this.props.messages || this.props.typingUntil) {
        this.tryScrollToBottom();
      }
    }
  }, {
    key: "tryScrollToBottom",
    value: function tryScrollToBottom() {
      var _this2 = this;

      setTimeout(function () {
        try {
          _this2.messagesDiv.scrollTop = _this2.messagesDiv.scrollHeight;
        } catch (err) {// Discard the error
        }
      }, 50);
    }
  }, {
    key: "renderDate",
    value: function renderDate(date) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-date-container'
      }, this.props.intl.formatTime(new Date(date), {
        hour12: false,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-small-line'
      }));
    }
  }, {
    key: "renderAvatar",
    value: function renderAvatar(name, url) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_common_Avatar__WEBPACK_IMPORTED_MODULE_3__["default"], {
        name: name,
        avatarUrl: url,
        height: 40,
        width: 40
      });
    }
  }, {
    key: "renderMessageGroups",
    value: function renderMessageGroups() {
      var _this3 = this;

      var messages = this.props.messages || [];
      var groups = [];
      var lastSpeaker = null;
      var lastDate = null;
      var currentGroup = null;
      messages.forEach(function (m) {
        var speaker = !!m.userId ? m.userId : 'bot';
        var date = m.sent_on; // Create a new group if messages are separated by more than X minutes or if different speaker

        if (speaker !== lastSpeaker || date_fns_difference_in_minutes__WEBPACK_IMPORTED_MODULE_1___default()(new Date(date), new Date(lastDate)) >= TIME_BETWEEN_DATES) {
          currentGroup = [];
          groups.push(currentGroup);
        }

        currentGroup.push(m);
        lastSpeaker = speaker;
        lastDate = date;
      });

      if (this.props.typingUntil) {
        if (lastSpeaker !== 'bot') {
          currentGroup = [];
          groups.push(currentGroup);
        }

        currentGroup.push({
          sent_on: new Date(),
          userId: null,
          message_type: 'typing'
        });
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, groups.map(function (group, i) {
        var lastGroup = groups[i - 1];
        var lastDate = lastGroup && lastGroup[lastGroup.length - 1] && lastGroup[lastGroup.length - 1].sent_on;
        var groupDate = group && group[0].sent_on;
        var isDateNeeded = !groups[i - 1] || date_fns_difference_in_minutes__WEBPACK_IMPORTED_MODULE_1___default()(new Date(groupDate), new Date(lastDate)) > TIME_BETWEEN_DATES;

        var _group = _slicedToArray(group, 1),
            _group$ = _group[0],
            userId = _group$.userId,
            userName = _group$.full_name,
            avatarUrl = _group$.avatar_url;

        var avatar = userId ? _this3.props.showUserAvatar && _this3.renderAvatar(userName, avatarUrl) : _this3.renderAvatar(_this3.props.botName, _this3.props.botAvatarUrl);
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
          key: i
        }, isDateNeeded ? _this3.renderDate(group[0].sent_on) : null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_MessageGroup__WEBPACK_IMPORTED_MODULE_2__["default"], {
          bp: _this3.props.bp,
          isBot: !userId,
          avatar: avatar,
          userName: userName,
          showUserAvatar: _this3.props.showUserAvatar,
          showUserName: _this3.props.showUserName,
          key: "msg-group-".concat(i),
          isLastGroup: i >= groups.length - 1,
          messages: group,
          onSendData: _this3.props.onSendData,
          onFileUpload: _this3.props.onFileUpload
        }));
      }));
    }
  }, {
    key: "render",
    value: function render() {
      var _this4 = this;

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        tabIndex: "-1",
        onKeyDown: this.handleKeyDown,
        className: 'bpw-msg-list',
        ref: function ref(m) {
          _this4.messagesDiv = m;
        }
      }, this.renderMessageGroups());
    }
  }]);

  return MessageList;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/* harmony default export */ __webpack_exports__["default"] = (Object(react_intl__WEBPACK_IMPORTED_MODULE_4__["injectIntl"])(MessageList));

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/Button.jsx":
/*!****************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/Button.jsx ***!
  \****************************************************************/
/*! exports provided: Button */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return Button; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _FileInput__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FileInput */ "./src/views/lite/components/messages/renderer/FileInput.jsx");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



/**
 * A simple button, with a possibility to be used as a file upload button
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onButtonClicked Called when the button is clicked with the label and the payload
 * @param {function} onFileUpload This is called when a file is uploaded
 */

var Button =
/*#__PURE__*/
function (_Component) {
  _inherits(Button, _Component);

  function Button(props) {
    var _this;

    _classCallCheck(this, Button);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Button).call(this, props));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleButtonClick", function (e) {
      if (_this.props.preventDoubleClick) {
        e.target.disabled = true;
      }

      _this.props.onButtonClick && _this.props.onButtonClick(_this.props.label, _this.props.payload);
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleFileUpload", function (event) {
      if (!event.target.files) {
        return;
      }

      _this.props.onFileUpload && _this.props.onFileUpload(_this.props.label, _this.props.payload, event.target.files[0]);
    });

    return _this;
  }

  _createClass(Button, [{
    key: "renderFileUpload",
    value: function renderFileUpload(accept) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        className: 'bpw-button'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", null, this.props.label), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_FileInput__WEBPACK_IMPORTED_MODULE_1__["default"], {
        name: "uploadField",
        accept: accept,
        className: 'bpw-file-message',
        placeholder: this.props.label,
        onChange: this.handleFileUpload
      }));
    }
  }, {
    key: "render",
    value: function render() {
      if (this.props.payload === 'BOTPRESS.IMAGE_UPLOAD') {
        return this.renderFileUpload('image/*');
      }

      if (this.props.payload === 'BOTPRESS.FILE_UPLOAD') {
        return this.renderFileUpload('*/*');
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        className: 'bpw-button',
        onClick: this.handleButtonClick
      }, this.props.label);
    }
  }]);

  return Button;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/Carousel.jsx":
/*!******************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/Carousel.jsx ***!
  \******************************************************************/
/*! exports provided: Carousel, Card */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Carousel", function() { return Carousel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Card", function() { return Card; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_slick__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-slick */ "./node_modules/react-slick/lib/index.js");
/* harmony import */ var react_slick__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_slick__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _assets_slick_slick_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../assets/slick/slick.css */ "./assets/slick/slick.css");
/* harmony import */ var _assets_slick_slick_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_assets_slick_slick_css__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../../../assets/slick/slick-theme.css */ "./assets/slick/slick-theme.css");
/* harmony import */ var _assets_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_assets_slick_slick_theme_css__WEBPACK_IMPORTED_MODULE_3__);
var _this = undefined;


 // Added those manually to remove the font dependencies which keeps showing 404 not found



var Carousel = function Carousel(props) {
  var elements = props.carousel.elements || [];
  var defaultSettings = {
    dots: false,
    infinite: false,
    responsive: [{
      breakpoint: 550,
      settings: {
        slidesToShow: 1
      }
    }, {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2
      }
    }, {
      breakpoint: 1548,
      settings: {
        slidesToShow: 3
      }
    }, {
      breakpoint: 2072,
      settings: {
        slidesToShow: 4
      }
    }, {
      breakpoint: 10000,
      settings: 'unslick'
    }],
    slidesToScroll: 1,
    autoplay: false,
    centerMode: false,
    arrows: elements.length > 1
  };
  var settings = Object.assign({}, defaultSettings, props.carousel.settings);
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_slick__WEBPACK_IMPORTED_MODULE_1___default.a, settings, elements.map(function (el, idx) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(Card, {
      element: el,
      key: idx,
      onSendData: props.onSendData
    });
  }));
};
var Card = function Card(props) {
  var _props$element = props.element,
      picture = _props$element.picture,
      title = _props$element.title,
      subtitle = _props$element.subtitle,
      buttons = _props$element.buttons;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-container'
  }, picture && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-picture',
    style: {
      backgroundImage: "url(\"".concat(picture, "\")")
    }
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-header'
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-title'
  }, title), subtitle && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-subtitle'
  }, subtitle)), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
    className: 'bpw-card-buttons'
  }, buttons.map(function (btn) {
    if (btn.url) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        href: btn.url,
        key: "1-".concat(btn.title),
        target: "_blank",
        className: 'bpw-card-action'
      }, btn.title || btn, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", {
        className: 'bpw-card-external-icon'
      }));
    } else if (btn.type == 'postback' || btn.payload) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        href: true,
        onClick: props.onSendData.bind(_this, {
          type: 'postback',
          payload: btn.payload
        }),
        key: "2-".concat(btn.title),
        className: 'bpw-card-action'
      }, btn.title || btn);
    } else if (btn.type == 'say_something' || btn.text) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        href: true,
        onClick: props.onSendData.bind(_this, {
          type: 'say_something',
          text: btn.text
        }),
        key: "2-".concat(btn.title),
        className: 'bpw-card-action'
      }, btn.title || btn);
    } else {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
        href: "#",
        key: "3-".concat(btn.title),
        target: "_blank",
        className: 'bpw-card-action'
      }, btn.title || btn, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", {
        className: 'bpw-card-external-icon'
      }));
    }
  }))));
};

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/FileInput.jsx":
/*!*******************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/FileInput.jsx ***!
  \*******************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return FileInput; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "react-dom");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




var FileInput =
/*#__PURE__*/
function (_Component) {
  _inherits(FileInput, _Component);

  function FileInput() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, FileInput);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(FileInput)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      value: '',
      styles: {
        parent: {
          position: 'relative'
        },
        file: {
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0,
          width: '100%',
          zIndex: 1
        },
        text: {
          position: 'relative',
          zIndex: -1
        }
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleChange", function (e) {
      _this.setState({
        value: e.target.value.split(/(\\|\/)/g).pop()
      });

      if (_this.props.onChange) {
        _this.props.onChange(e);
      }
    });

    return _this;
  }

  _createClass(FileInput, [{
    key: "render",
    value: function render() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        style: this.state.styles.parent
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("input", {
        type: "file",
        name: this.props.name,
        className: this.props.className,
        onChange: this.handleChange,
        accept: this.props.accept,
        style: this.state.styles.file
      }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("input", {
        type: "text",
        tabIndex: -1,
        name: this.props.name + '_filename',
        className: this.props.className,
        onChange: function onChange() {},
        placeholder: this.props.placeholder,
        disabled: this.props.disabled,
        style: this.state.styles.text
      }));
    }
  }]);

  return FileInput;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);



/***/ }),

/***/ "./src/views/lite/components/messages/renderer/FileMessage.jsx":
/*!*********************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/FileMessage.jsx ***!
  \*********************************************************************/
/*! exports provided: FileMessage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FileMessage", function() { return FileMessage; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ "./node_modules/module-builder/node_modules/path-browserify/index.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var mime_types__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! mime-types */ "./node_modules/mime-types/index.js");
/* harmony import */ var mime_types__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(mime_types__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Text__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Text */ "./src/views/lite/components/messages/renderer/Text.jsx");




var FileMessage = function FileMessage(props) {
  if (!props.file) {
    return null;
  }

  var _props$file = props.file,
      url = _props$file.url,
      name = _props$file.name,
      storage = _props$file.storage,
      text = _props$file.text;
  var extension = path__WEBPACK_IMPORTED_MODULE_1___default.a.extname(url);
  var mime = mime_types__WEBPACK_IMPORTED_MODULE_2___default.a.lookup(extension);
  var basename = path__WEBPACK_IMPORTED_MODULE_1___default.a.basename(url, extension);

  if (text) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Text__WEBPACK_IMPORTED_MODULE_3__["Text"], {
      text: text
    });
  }

  if (storage === 'local') {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
      className: 'bpw-file-message'
    }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, name, " (local)"));
  }

  if (!mime) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
      className: 'bpw-file-message'
    }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
      href: url,
      target: "_blank"
    }, name));
  }

  if (mime.includes('image/')) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("a", {
      href: url,
      target: "_blank"
    }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("img", {
      src: url,
      title: name
    }));
  } else if (mime.includes('audio/')) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("audio", {
      controls: true
    }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("source", {
      src: url,
      type: mime
    }));
  } else if (mime.includes('video/')) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("video", {
      width: "240",
      controls: true
    }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("source", {
      src: url,
      type: mime
    }));
  }
};

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/LoginPrompt.jsx":
/*!*********************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/LoginPrompt.jsx ***!
  \*********************************************************************/
/*! exports provided: LoginPrompt */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "LoginPrompt", function() { return LoginPrompt; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


var LoginPrompt =
/*#__PURE__*/
function (_Component) {
  _inherits(LoginPrompt, _Component);

  function LoginPrompt() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, LoginPrompt);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(LoginPrompt)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "state", {
      username: '',
      password: ''
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleInputChanged", function (event) {
      return _this.setState(_defineProperty({}, event.target.name, event.target.value));
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleFormSubmit", function (event) {
      _this.props.onSendData && _this.props.onSendData({
        type: 'login_prompt',
        text: 'Provided login information',
        username: _this.state.username,
        password: _this.state.password,
        sensitive: ['password']
      });
      event.preventDefault();
    });

    return _this;
  }

  _createClass(LoginPrompt, [{
    key: "render_bot_active",
    value: function render_bot_active() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("form", {
        className: 'bpw-form-container',
        onSubmit: this.handleFormSubmit
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("label", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("input", {
        id: "login_username",
        type: "input",
        name: "username",
        placeholder: "Username",
        className: "bpw-input",
        onChange: this.handleInputChanged
      })), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("label", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("input", {
        id: "login_password",
        type: "password",
        name: "password",
        placeholder: "Password",
        className: "bpw-input",
        onChange: this.handleInputChanged
      })), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("input", {
        id: "login_submit",
        className: 'bpw-button-alt',
        type: "submit",
        value: "Submit"
      }));
    }
  }, {
    key: "render_bot_past",
    value: function render_bot_past() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-special-action'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("p", null, "* Login form *"));
    }
  }, {
    key: "render_user",
    value: function render_user() {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-special-action'
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("p", null, "* Provided credentials *"));
    }
  }, {
    key: "render",
    value: function render() {
      if (!this.props.isBotMessage) {
        return this.render_user();
      }

      if (this.props.isLastMessage) {
        return this.render_bot_active();
      }

      return this.render_bot_past();
    }
  }]);

  return LoginPrompt;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/QuickReplies.jsx":
/*!**********************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/QuickReplies.jsx ***!
  \**********************************************************************/
/*! exports provided: QuickReplies */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "QuickReplies", function() { return QuickReplies; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Button__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Button */ "./src/views/lite/components/messages/renderer/Button.jsx");
/* harmony import */ var _Keyboard__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../Keyboard */ "./src/views/lite/components/Keyboard.jsx");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




/**
 * Displays an array of button, and handle when they are clicked
 *
 * @param {object} buttons The list of buttons to display (object with a label and a payload)
 * @param {function} onSendData Called with the required payload to answer the quick reply
 * @param {function} onFileUpload This is called when a file is uploaded
 *
 * @return onSendData is called with the reply
 */

var QuickReplies =
/*#__PURE__*/
function (_Component) {
  _inherits(QuickReplies, _Component);

  function QuickReplies(props) {
    var _this;

    _classCallCheck(this, QuickReplies);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(QuickReplies).call(this, props));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleButtonClicked", function (title, payload) {
      if (_this.props.onSendData) {
        _this.props.onSendData({
          type: 'quick_reply',
          text: title,
          payload: payload
        });
      }
    });

    return _this;
  }

  _createClass(QuickReplies, [{
    key: "renderKeyboard",
    value: function renderKeyboard(buttons) {
      var _this2 = this;

      return buttons.map(function (btn, idx) {
        if (Array.isArray(btn)) {
          return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", null, _this2.renderKeyboard(btn));
        } else {
          // By default, we prevent double clicks on buttons
          var preventDoubleClick = btn.allowMultipleClick === true ? false : true;
          return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Button__WEBPACK_IMPORTED_MODULE_1__["Button"], {
            key: idx,
            label: btn.label || btn.title,
            payload: btn.payload,
            preventDoubleClick: preventDoubleClick,
            onButtonClick: _this2.handleButtonClicked,
            onFileUpload: _this2.props.onFileUpload
          });
        }
      });
    }
  }, {
    key: "render",
    value: function render() {
      var buttons = this.props.buttons || this.props.quick_replies;
      var kbd = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        className: 'bpw-keyboard-quick_reply'
      }, buttons && this.renderKeyboard(buttons));
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_Keyboard__WEBPACK_IMPORTED_MODULE_2__["Prepend"], {
        keyboard: kbd,
        visible: this.props.isLastGroup && this.props.isLastOfGroup
      }, this.props.children);
    }
  }]);

  return QuickReplies;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/Text.jsx":
/*!**************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/Text.jsx ***!
  \**************************************************************/
/*! exports provided: Text */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return Text; });
/* harmony import */ var snarkdown__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! snarkdown */ "./node_modules/snarkdown/dist/snarkdown.es.js");
/* harmony import */ var react_linkify__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-linkify */ "./node_modules/react-linkify/dist/Linkify.js");
/* harmony import */ var react_linkify__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_linkify__WEBPACK_IMPORTED_MODULE_1__);


/**
 * A simple text element with optional markdown
 * @param {boolean} markdown Enable markdown parsing for the given text
 * @param {string} text The text to display
 */

var Text = function Text(props) {
  var message = React.createElement("p", null, props.text);

  if (props.markdown) {
    var html = Object(snarkdown__WEBPACK_IMPORTED_MODULE_0__["default"])(props.text || '');
    html = html.replace(/<a href/gi, "<a target=\"_blank\" href");
    message = React.createElement("div", {
      dangerouslySetInnerHTML: {
        __html: html
      }
    });
  }

  return React.createElement(react_linkify__WEBPACK_IMPORTED_MODULE_1___default.a, {
    properties: {
      target: '_blank'
    }
  }, React.createElement("div", null, message));
};

/***/ }),

/***/ "./src/views/lite/components/messages/renderer/index.jsx":
/*!***************************************************************!*\
  !*** ./src/views/lite/components/messages/renderer/index.jsx ***!
  \***************************************************************/
/*! exports provided: QuickReplies, FileMessage, FileInput, Carousel, LoginPrompt, Text, Button */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _QuickReplies__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./QuickReplies */ "./src/views/lite/components/messages/renderer/QuickReplies.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QuickReplies", function() { return _QuickReplies__WEBPACK_IMPORTED_MODULE_0__["QuickReplies"]; });

/* harmony import */ var _FileMessage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./FileMessage */ "./src/views/lite/components/messages/renderer/FileMessage.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FileMessage", function() { return _FileMessage__WEBPACK_IMPORTED_MODULE_1__["FileMessage"]; });

/* harmony import */ var _FileInput__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./FileInput */ "./src/views/lite/components/messages/renderer/FileInput.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FileInput", function() { return _FileInput__WEBPACK_IMPORTED_MODULE_2__["FileInput"]; });

/* harmony import */ var _Carousel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Carousel */ "./src/views/lite/components/messages/renderer/Carousel.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Carousel", function() { return _Carousel__WEBPACK_IMPORTED_MODULE_3__["Carousel"]; });

/* harmony import */ var _LoginPrompt__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./LoginPrompt */ "./src/views/lite/components/messages/renderer/LoginPrompt.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LoginPrompt", function() { return _LoginPrompt__WEBPACK_IMPORTED_MODULE_4__["LoginPrompt"]; });

/* harmony import */ var _Text__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Text */ "./src/views/lite/components/messages/renderer/Text.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return _Text__WEBPACK_IMPORTED_MODULE_5__["Text"]; });

/* harmony import */ var _Button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Button */ "./src/views/lite/components/messages/renderer/Button.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Button", function() { return _Button__WEBPACK_IMPORTED_MODULE_6__["Button"]; });









/***/ }),

/***/ "./src/views/lite/icons/Add.jsx":
/*!**************************************!*\
  !*** ./src/views/lite/icons/Add.jsx ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function (_ref) {
  var height = _ref.height,
      width = _ref.width;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    version: "1.1",
    x: "0px",
    y: "0px",
    width: width || 20,
    height: height || 20,
    viewBox: "0 0 357 357",
    space: "preserve"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("g", {
    id: "add"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M357,204H204v153h-51V204H0v-51h153V0h51v153h153V204z"
  }))));
});

/***/ }),

/***/ "./src/views/lite/icons/Chat.jsx":
/*!***************************************!*\
  !*** ./src/views/lite/icons/Chat.jsx ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function (_ref) {
  var height = _ref.height,
      width = _ref.width;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    width: width || 20,
    height: height || 20,
    viewBox: "0 0 20 20",
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M4.583 14.894l-3.256 3.78c-.7.813-1.26.598-1.25-.46a10689.413 10689.413 0 0 1 .035-4.775V4.816a3.89 3.89 0 0 1 3.88-3.89h12.064a3.885 3.885 0 0 1 3.882 3.89v6.185a3.89 3.89 0 0 1-3.882 3.89H4.583z",
    fill: "#FFF",
    fillRule: "evenodd"
  })));
});

/***/ }),

/***/ "./src/views/lite/icons/Close.jsx":
/*!****************************************!*\
  !*** ./src/views/lite/icons/Close.jsx ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    height: "15",
    viewBox: "0 0 95 95",
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("g", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    xmlns: "http://www.w3.org/2000/svg",
    d: "M62.819,47.97l32.533-32.534c0.781-0.781,0.781-2.047,0-2.828L83.333,0.586C82.958,0.211,82.448,0,81.919,0   c-0.53,0-1.039,0.211-1.414,0.586L47.97,33.121L15.435,0.586c-0.75-0.75-2.078-0.75-2.828,0L0.587,12.608   c-0.781,0.781-0.781,2.047,0,2.828L33.121,47.97L0.587,80.504c-0.781,0.781-0.781,2.047,0,2.828l12.02,12.021   c0.375,0.375,0.884,0.586,1.414,0.586c0.53,0,1.039-0.211,1.414-0.586L47.97,62.818l32.535,32.535   c0.375,0.375,0.884,0.586,1.414,0.586c0.529,0,1.039-0.211,1.414-0.586l12.02-12.021c0.781-0.781,0.781-2.048,0-2.828L62.819,47.97   z"
  }))));
});

/***/ }),

/***/ "./src/views/lite/icons/CloseChat.jsx":
/*!********************************************!*\
  !*** ./src/views/lite/icons/CloseChat.jsx ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function (_ref) {
  var height = _ref.height,
      width = _ref.width;
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    width: width || 17,
    height: height || 17,
    viewBox: "0 0 17 17",
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M16.726 15.402c.365.366.365.96 0 1.324-.178.178-.416.274-.663.274-.246 0-.484-.096-.663-.274L8.323 9.648h.353L1.6 16.726c-.177.178-.416.274-.663.274-.246 0-.484-.096-.663-.274-.365-.365-.365-.958 0-1.324L7.35 8.324v.35L.275 1.6C-.09 1.233-.09.64.274.274c.367-.365.96-.365 1.326 0l7.076 7.078h-.353L15.4.274c.366-.365.96-.365 1.326 0 .365.366.365.958 0 1.324L9.65 8.675v-.35l7.076 7.077z",
    fill: "#FFF",
    fillRule: "evenodd"
  })));
});

/***/ }),

/***/ "./src/views/lite/icons/Download.jsx":
/*!*******************************************!*\
  !*** ./src/views/lite/icons/Download.jsx ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    height: "15",
    viewBox: "0 0 32 32"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("title", null, "Download"), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M27.414 19.414l-10 10c-0.781 0.781-2.047 0.781-2.828 0l-10-10c-0.781-0.781-0.781-2.047 0-2.828s2.047-0.781 2.828 0l6.586 6.586v-19.172c0-1.105 0.895-2 2-2s2 0.895 2 2v19.172l6.586-6.586c0.39-0.39 0.902-0.586 1.414-0.586s1.024 0.195 1.414 0.586c0.781 0.781 0.781 2.047 0 2.828z"
  })));
});

/***/ }),

/***/ "./src/views/lite/icons/Email.jsx":
/*!****************************************!*\
  !*** ./src/views/lite/icons/Email.jsx ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"
  }));
});

/***/ }),

/***/ "./src/views/lite/icons/Information.jsx":
/*!**********************************************!*\
  !*** ./src/views/lite/icons/Information.jsx ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    version: "1.1",
    width: "17",
    viewBox: "0 0 437.6 437.6",
    space: "preserve"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("g", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M194,142.8c0.8,1.6,1.6,3.2,2.4,4.4c0.8,1.2,2,2.4,2.8,3.6c1.2,1.2,2.4,2.4,4,3.6c1.2,0.8,2.8,2,4.8,2.4     c1.6,0.8,3.2,1.2,5.2,1.6c2,0.4,3.6,0.4,5.2,0.4c1.6,0,3.6,0,5.2-0.4c1.6-0.4,3.2-0.8,4.4-1.6h0.4c1.6-0.8,3.2-1.6,4.8-2.8     c1.2-0.8,2.4-2,3.6-3.2l0.4-0.4c1.2-1.2,2-2.4,2.8-3.6s1.6-2.4,2-4c0-0.4,0-0.4,0.4-0.8c0.8-1.6,1.2-3.6,1.6-5.2     c0.4-1.6,0.4-3.6,0.4-5.2s0-3.6-0.4-5.2c-0.4-1.6-0.8-3.2-1.6-5.2c-1.2-2.8-2.8-5.2-4.8-7.2c-0.4-0.4-0.4-0.4-0.8-0.8     c-1.2-1.2-2.4-2-4-3.2c-1.6-0.8-2.8-1.6-4.4-2.4c-1.6-0.8-3.2-1.2-4.8-1.6c-2-0.4-3.6-0.4-5.2-0.4c-1.6,0-3.6,0-5.2,0.4     c-1.6,0.4-3.2,0.8-4.8,1.6H208c-1.6,0.8-3.2,1.6-4.4,2.4c-1.6,1.2-2.8,2-4,3.2c-1.2,1.2-2.4,2.4-3.2,3.6     c-0.8,1.2-1.6,2.8-2.4,4.4c-0.8,1.6-1.2,3.2-1.6,4.8c-0.4,2-0.4,3.6-0.4,5.2c0,1.6,0,3.6,0.4,5.2     C192.8,139.6,193.6,141.2,194,142.8z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M249.6,289.2h-9.2v-98c0-5.6-4.4-10.4-10.4-10.4h-42c-5.6,0-10.4,4.4-10.4,10.4v21.6c0,5.6,4.4,10.4,10.4,10.4h8.4v66.4     H188c-5.6,0-10.4,4.4-10.4,10.4v21.6c0,5.6,4.4,10.4,10.4,10.4h61.6c5.6,0,10.4-4.4,10.4-10.4V300     C260,294,255.2,289.2,249.6,289.2z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M218.8,0C98,0,0,98,0,218.8s98,218.8,218.8,218.8s218.8-98,218.8-218.8S339.6,0,218.8,0z M218.8,408.8     c-104.8,0-190-85.2-190-190s85.2-190,190-190s190,85.2,190,190S323.6,408.8,218.8,408.8z"
  }))));
});

/***/ }),

/***/ "./src/views/lite/icons/List.jsx":
/*!***************************************!*\
  !*** ./src/views/lite/icons/List.jsx ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    height: "15",
    viewBox: "0 0 489 489",
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("g", {
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M52.7,134.75c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.8-52.7-52.8S0,52.95,0,81.95S23.7,134.75,52.7,134.75z M52.7,53.75    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2S37.2,53.75,52.7,53.75z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M52.7,297.55c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.7-52.7-52.7S0,215.75,0,244.85S23.7,297.55,52.7,297.55z M52.7,216.65    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.6-28.2-28.2S37.2,216.65,52.7,216.65z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M52.7,460.45c29.1,0,52.7-23.7,52.7-52.7c0-29.1-23.7-52.7-52.7-52.7S0,378.75,0,407.75C0,436.75,23.7,460.45,52.7,460.45    z M52.7,379.45c15.6,0,28.2,12.7,28.2,28.2c0,15.6-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2C24.5,392.15,37.2,379.45,52.7,379.45    z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M175.9,94.25h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,94.25,175.9,94.25z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M175.9,257.15h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,257.15,175.9,257.15z"
  }), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M175.9,419.95h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,419.95,175.9,419.95z"
  }))));
});

/***/ }),

/***/ "./src/views/lite/icons/Phone.jsx":
/*!****************************************!*\
  !*** ./src/views/lite/icons/Phone.jsx ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M20 22.621l-3.521-6.795c-.008.004-1.974.97-2.064 1.011-2.24 1.086-6.799-7.82-4.609-8.994l2.083-1.026-3.493-6.817-2.106 1.039c-7.202 3.755 4.233 25.982 11.6 22.615.121-.055 2.102-1.029 2.11-1.033z"
  }));
});

/***/ }),

/***/ "./src/views/lite/icons/Reload.jsx":
/*!*****************************************!*\
  !*** ./src/views/lite/icons/Reload.jsx ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("i", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    height: "15",
    viewBox: "0 0 512 512",
    xmlns: "http://www.w3.org/2000/svg"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("g", null, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    xmlns: "http://www.w3.org/2000/svg",
    d: "M288.502,32.502c-108.328,0-198.827,77.485-219.166,179.899l-42.482-53.107L0,180.784l68.769,85.961    c3.352,4.178,8.338,6.447,13.427,6.447c2.596,0,5.226-0.585,7.685-1.805l103.153-51.577l-15.387-30.757l-75.8,37.892    c14.063-90.5,92.27-160.059,186.655-160.059c104.271,0,189.114,84.843,189.114,189.114s-84.843,189.114-189.114,189.114v34.384    C411.735,479.498,512,379.233,512,256S411.735,32.502,288.502,32.502z"
  }))));
});

/***/ }),

/***/ "./src/views/lite/icons/Website.jsx":
/*!******************************************!*\
  !*** ./src/views/lite/icons/Website.jsx ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

/* harmony default export */ __webpack_exports__["default"] = (function () {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24"
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 16.057v-3.057h2.994c-.059 1.143-.212 2.24-.456 3.279-.823-.12-1.674-.188-2.538-.222zm1.957 2.162c-.499 1.33-1.159 2.497-1.957 3.456v-3.62c.666.028 1.319.081 1.957.164zm-1.957-7.219v-3.015c.868-.034 1.721-.103 2.548-.224.238 1.027.389 2.111.446 3.239h-2.994zm0-5.014v-3.661c.806.969 1.471 2.15 1.971 3.496-.642.084-1.3.137-1.971.165zm2.703-3.267c1.237.496 2.354 1.228 3.29 2.146-.642.234-1.311.442-2.019.607-.344-.992-.775-1.91-1.271-2.753zm-7.241 13.56c-.244-1.039-.398-2.136-.456-3.279h2.994v3.057c-.865.034-1.714.102-2.538.222zm2.538 1.776v3.62c-.798-.959-1.458-2.126-1.957-3.456.638-.083 1.291-.136 1.957-.164zm-2.994-7.055c.057-1.128.207-2.212.446-3.239.827.121 1.68.19 2.548.224v3.015h-2.994zm1.024-5.179c.5-1.346 1.165-2.527 1.97-3.496v3.661c-.671-.028-1.329-.081-1.97-.165zm-2.005-.35c-.708-.165-1.377-.373-2.018-.607.937-.918 2.053-1.65 3.29-2.146-.496.844-.927 1.762-1.272 2.753zm-.549 1.918c-.264 1.151-.434 2.36-.492 3.611h-3.933c.165-1.658.739-3.197 1.617-4.518.88.361 1.816.67 2.808.907zm.009 9.262c-.988.236-1.92.542-2.797.9-.89-1.328-1.471-2.879-1.637-4.551h3.934c.058 1.265.231 2.488.5 3.651zm.553 1.917c.342.976.768 1.881 1.257 2.712-1.223-.49-2.326-1.211-3.256-2.115.636-.229 1.299-.435 1.999-.597zm9.924 0c.7.163 1.362.367 1.999.597-.931.903-2.034 1.625-3.257 2.116.489-.832.915-1.737 1.258-2.713zm.553-1.917c.27-1.163.442-2.386.501-3.651h3.934c-.167 1.672-.748 3.223-1.638 4.551-.877-.358-1.81-.664-2.797-.9zm.501-5.651c-.058-1.251-.229-2.46-.492-3.611.992-.237 1.929-.546 2.809-.907.877 1.321 1.451 2.86 1.616 4.518h-3.933z"
  }));
});

/***/ }),

/***/ "./src/views/lite/index.jsx":
/*!**********************************!*\
  !*** ./src/views/lite/index.jsx ***!
  \**********************************/
/*! exports provided: Fullscreen, Embedded, embedded, fullscreen, Carousel, QuickReplies, LoginPrompt, Text, Form, FileMessage */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Fullscreen", function() { return Fullscreen; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Embedded", function() { return Embedded; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _main_jsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./main.jsx */ "./src/views/lite/main.jsx");
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! . */ "./src/views/lite/index.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "embedded", function() { return ___WEBPACK_IMPORTED_MODULE_2__["Embedded"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "fullscreen", function() { return ___WEBPACK_IMPORTED_MODULE_2__["Fullscreen"]; });

/* harmony import */ var _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/messages/renderer */ "./src/views/lite/components/messages/renderer/index.jsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Carousel", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["Carousel"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "QuickReplies", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["QuickReplies"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "LoginPrompt", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["LoginPrompt"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Text", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["Text"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Form", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["Form"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "FileMessage", function() { return _components_messages_renderer__WEBPACK_IMPORTED_MODULE_3__["FileMessage"]; });

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }



var Fullscreen = function Fullscreen(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_main_jsx__WEBPACK_IMPORTED_MODULE_1__["default"], _extends({}, props, {
    fullscreen: true
  }));
};
var Embedded = function Embedded(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_main_jsx__WEBPACK_IMPORTED_MODULE_1__["default"], _extends({}, props, {
    fullscreen: false
  }));
};
/**
 * @deprecated Since the way views are handled has changed, we're also exporting views in lowercase.
 * https://botpress.io/docs/developers/migrate/
 */





/***/ }),

/***/ "./src/views/lite/main.jsx":
/*!*********************************!*\
  !*** ./src/views/lite/main.jsx ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Web; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! classnames */ "./node_modules/classnames/index.js");
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var date_fns_is_before__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! date-fns/is_before */ "../../node_modules/date-fns/is_before/index.js");
/* harmony import */ var date_fns_is_before__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(date_fns_is_before__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var query_string__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! query-string */ "./node_modules/query-string/index.js");
/* harmony import */ var query_string__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(query_string__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var ms__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ms */ "./node_modules/ms/index.js");
/* harmony import */ var ms__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(ms__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _icons_Chat__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./icons/Chat */ "./src/views/lite/icons/Chat.jsx");
/* harmony import */ var _icons_CloseChat__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./icons/CloseChat */ "./src/views/lite/icons/CloseChat.jsx");
/* harmony import */ var _components_Container__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/Container */ "./src/views/lite/components/Container.jsx");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./utils */ "./src/views/lite/utils.js");
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
/* harmony import */ var _translations__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./translations */ "./src/views/lite/translations/index.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }













var _values = function _values(obj) {
  return Object.keys(obj).map(function (x) {
    return obj[x];
  });
};

Object(_translations__WEBPACK_IMPORTED_MODULE_10__["initializeLocale"])();
Object(_utils__WEBPACK_IMPORTED_MODULE_8__["checkLocationOrigin"])();
var ANIM_DURATION = 300;
var MIN_TIME_BETWEEN_SOUNDS = 10000; // 10 seconds

var HISTORY_STARTING_POINT = -1;
var HISTORY_MAX_MESSAGES = 10;
var HISTORY_UP = 'ArrowUp';
var defaultOptions = {
  enableReset: true,
  stylesheet: '/assets/modules/channel-web/default.css',
  extraStylesheet: '',
  showConversationsButton: true,
  showUserName: false,
  showUserAvatar: false,
  enableTranscriptDownload: false,
  enableArrowNavigation: false
};

var Web =
/*#__PURE__*/
function (_React$Component) {
  _inherits(Web, _React$Component);

  function Web(props) {
    var _this;

    _classCallCheck(this, Web);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Web).call(this, props));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "fetchData",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return _this.fetchBotInfo();

            case 3:
              _context.next = 5;
              return _this.fetchConversations();

            case 5:
              _context.next = 7;
              return _this.fetchCurrentConversation();

            case 7:
              _context.next = 14;
              break;

            case 9:
              _context.prev = 9;
              _context.t0 = _context["catch"](0);
              console.log('Error while fetching data, creating new convo...', _context.t0);
              _context.next = 14;
              return _this.createConversation();

            case 14:
              _context.next = 16;
              return _this.sendUserVisit();

            case 16:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[0, 9]]);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "fetchBotInfo",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var _ref3, botInfo;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return _this.axios.get('/botInfo', _this.axiosConfig);

            case 3:
              _ref3 = _context2.sent;
              botInfo = _ref3.data;

              _this.setState({
                botInfo: botInfo
              });

              _context2.next = 11;
              break;

            case 8:
              _context2.prev = 8;
              _context2.t0 = _context2["catch"](0);
              console.log('Error while fetching bot informations', _context2.t0);

            case 11:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[0, 8]]);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "fetchConversations",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3() {
      var _ref5, data;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _this.axios.get("/conversations/".concat(_this.userId), _this.axiosConfig);

            case 2:
              _ref5 = _context3.sent;
              data = _ref5.data;

              if (!_this.isUnmounted) {
                _this.setState(data);
              }

            case 5:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "fetchCurrentConversation",
    /*#__PURE__*/
    function () {
      var _ref6 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee4(convoId) {
        var _this$state, conversations, currentConversationId, conversationIdToFetch, lifeTimeMargin, isConversationExpired, _ref7, data;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _this$state = _this.state, conversations = _this$state.conversations, currentConversationId = _this$state.currentConversationId;
                conversationIdToFetch = convoId || currentConversationId;

                if (!(conversations.length && !conversationIdToFetch)) {
                  _context4.next = 9;
                  break;
                }

                lifeTimeMargin = Date.now() - ms__WEBPACK_IMPORTED_MODULE_4___default()(_this.state.recentConversationLifetime);
                isConversationExpired = new Date(conversations[0].last_heard_on).getTime() < lifeTimeMargin;

                if (!(isConversationExpired && _this.state.startNewConvoOnTimeout)) {
                  _context4.next = 7;
                  break;
                }

                return _context4.abrupt("return");

              case 7:
                conversationIdToFetch = conversations[0].id;

                _this.setState({
                  currentConversationId: conversationIdToFetch
                });

              case 9:
                _context4.next = 11;
                return _this.axios.get("/conversations/".concat(_this.userId, "/").concat(conversationIdToFetch), _this.axiosConfig);

              case 11:
                _ref7 = _context4.sent;
                data = _ref7.data;

                if (!(_this.state.currentConversationId !== conversationIdToFetch)) {
                  _context4.next = 15;
                  break;
                }

                return _context4.abrupt("return", _this.fetchCurrentConversation());

              case 15:
                _this.setState({
                  currentConversation: data
                });

              case 16:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      return function (_x) {
        return _ref6.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleSendData",
    /*#__PURE__*/
    function () {
      var _ref8 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee5(data) {
        var msgTypes, config;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                msgTypes = ['text', 'quick_reply', 'form', 'login_prompt', 'visit', 'postback'];
                config = _objectSpread({
                  params: {
                    conversationId: _this.state.currentConversationId
                  }
                }, _this.axiosConfig);
                _context5.prev = 2;

                if (msgTypes.includes(data.type)) {
                  _context5.next = 7;
                  break;
                }

                _context5.next = 6;
                return _this.axios.post("/events/".concat(_this.userId), data, _this.axiosConfig);

              case 6:
                return _context5.abrupt("return", _context5.sent);

              case 7:
                _context5.next = 9;
                return _this.axios.post("/messages/".concat(_this.userId), data, config);

              case 9:
                return _context5.abrupt("return", _context5.sent);

              case 12:
                _context5.prev = 12;
                _context5.t0 = _context5["catch"](2);

                _this.handleApiError(_context5.t0);

              case 15:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[2, 12]]);
      }));

      return function (_x2) {
        return _ref8.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleFileUpload",
    /*#__PURE__*/
    function () {
      var _ref9 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee6(title, payload, file) {
        var config, data;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                config = _objectSpread({
                  params: {
                    conversationId: _this.state.currentConversationId
                  }
                }, _this.axiosConfig);
                data = new FormData();
                data.append('file', file);
                _context6.next = 5;
                return _this.axios.post("/messages/".concat(_this.userId, "/files"), data, config);

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      return function (_x3, _x4, _x5) {
        return _ref9.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleSessionReset",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee7() {
      var convoId;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              convoId = _this.state.currentConversationId;
              return _context7.abrupt("return", _this.axios.post("/conversations/".concat(_this.userId, "/").concat(convoId, "/reset"), {}, _this.axiosConfig));

            case 2:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "createConversation",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee8() {
      var _ref12, data;

      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return _this.axios.post("/conversations/".concat(_this.userId, "/new"), {}, _this.axiosConfig);

            case 2:
              _ref12 = _context8.sent;
              data = _ref12.data;
              _context8.next = 6;
              return _this.fetchConversations();

            case 6:
              _context8.next = 8;
              return _this.handleSwitchConvo(data.convoId);

            case 8:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "downloadConversation",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee9() {
      var convoId, _ref14, data, blobFile;

      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              convoId = _this.state.currentConversationId;
              _context9.prev = 1;
              _context9.next = 4;
              return _this.axios.get("/conversations/".concat(_this.userId, "/").concat(convoId, "/download/txt"), _this.axiosConfig);

            case 4:
              _ref14 = _context9.sent;
              data = _ref14.data;
              blobFile = new Blob([data.txt]);
              Object(_utils__WEBPACK_IMPORTED_MODULE_8__["downloadFile"])(data.name, blobFile);
              _context9.next = 13;
              break;

            case 10:
              _context9.prev = 10;
              _context9.t0 = _context9["catch"](1);
              console.log('Error trying to download conversation');

            case 13:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this, [[1, 10]]);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "changeUserId",
    /*#__PURE__*/
    function () {
      var _ref15 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee10(newId) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _this.props.bp.events.updateVisitorId(newId);

                _this.setState({
                  currentConversationId: null
                });

                _context10.next = 4;
                return _this.setUserId();

              case 4:
                _context10.next = 6;
                return _this.fetchData();

              case 6:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      return function (_x6) {
        return _ref15.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "setReference",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee11() {
      var convoId;
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              if (!(typeof _this.state.reference !== 'string')) {
                _context11.next = 2;
                break;
              }

              return _context11.abrupt("return");

            case 2:
              _context11.prev = 2;
              convoId = _this.state.currentConversationId;
              _context11.next = 6;
              return _this.axios.post("/conversations/".concat(_this.userId, "/").concat(convoId, "/reference/").concat(_this.state.reference), {}, _this.axiosConfig);

            case 6:
              _context11.next = 11;
              break;

            case 8:
              _context11.prev = 8;
              _context11.t0 = _context11["catch"](2);
              console.log('Invalid reference ' + _this.state.reference);

            case 11:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11, this, [[2, 8]]);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleIframeApi", function (_ref17) {
      var _ref17$data = _ref17.data,
          action = _ref17$data.action,
          payload = _ref17$data.payload;

      if (action === 'configure') {
        if (payload.userId) {
          _this.changeUserId(payload.userId);
        }

        _this.setState({
          config: Object.assign({}, defaultOptions, payload)
        }, _this.updateAxiosConfig);
      } else if (action === 'event') {
        var type = payload.type,
            text = payload.text;

        if (type === 'show') {
          _this.handleSwitchView('side');
        } else if (type === 'hide') {
          _this.handleSwitchView('widget');
        } else if (type === 'message') {
          _this.setState({
            textToSend: text
          });

          _this.handleSendMessage();
        } else {
          return _this.handleSendData({
            type: type,
            payload: payload
          });
        }
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleButtonClicked", function () {
      _this.state.view === 'convo' ? _this.handleSwitchView('widget') : _this.handleSwitchView('side');
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleApiError", function (error) {
      //@deprecated 11.9 (replace with proper error management)
      var data = _.get(error, 'response.data', {});

      if (data && typeof data === 'string' && data.includes('BP_CONV_NOT_FOUND')) {
        console.log('Conversation not found, starting a new one...');

        _this.createConversation();
      }

      if (data.errorCode === 'BP_0401') {
        _this.setState({
          config: _objectSpread({}, _this.state.config, {
            externalAuthToken: undefined
          })
        }, _this.updateAxiosConfig);

        console.log("External token expired or invalid. Removed from future requests");
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "sendUserVisit",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee12() {
      return regeneratorRuntime.wrap(function _callee12$(_context12) {
        while (1) {
          switch (_context12.prev = _context12.next) {
            case 0:
              _context12.next = 2;
              return _this.handleSendData({
                type: 'visit',
                text: 'User visit',
                timezone: new Date().getTimezoneOffset() / 60,
                language: Object(_translations__WEBPACK_IMPORTED_MODULE_10__["getUserLocale"])()
              });

            case 2:
            case "end":
              return _context12.stop();
          }
        }
      }, _callee12, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleSendMessage",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee13() {
      return regeneratorRuntime.wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              if (!(!_this.state.textToSend || !_this.state.textToSend.length)) {
                _context13.next = 2;
                break;
              }

              return _context13.abrupt("return");

            case 2:
              _this.setState({
                messageHistory: _.take([_this.state.textToSend].concat(_toConsumableArray(_this.state.messageHistory)), HISTORY_MAX_MESSAGES),
                historyPosition: HISTORY_STARTING_POINT
              });

              _context13.next = 5;
              return _this.handleSendData({
                type: 'text',
                text: _this.state.textToSend
              });

            case 5:
              _this.handleSwitchView('side');

              _this.setState({
                textToSend: ''
              });

            case 7:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleNewMessage",
    /*#__PURE__*/
    function () {
      var _ref20 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee14(event) {
        return regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                if (!(event.payload && event.payload.type === 'visit' || event.message_type === 'visit')) {
                  _context14.next = 2;
                  break;
                }

                return _context14.abrupt("return");

              case 2:
                _context14.next = 4;
                return _this.safeUpdateCurrentConvo(event.conversationId, true, function (convo) {
                  return Object.assign({}, convo, {
                    messages: _toConsumableArray(convo.messages).concat([event]),
                    typingUntil: event.userId ? convo.typingUntil : null
                  });
                });

              case 4:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      return function (_x7) {
        return _ref20.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleBotTyping",
    /*#__PURE__*/
    function () {
      var _ref21 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee15(event) {
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return _this.safeUpdateCurrentConvo(event.conversationId, false, function (convo) {
                  return Object.assign({}, convo, {
                    typingUntil: new Date(Date.now() + event.timeInMs)
                  });
                });

              case 2:
                setTimeout(_this.expireTyping, event.timeInMs + 50);

              case 3:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      return function (_x8) {
        return _ref21.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "expireTyping",
    /*#__PURE__*/
    _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee16() {
      var currentTypingUntil, timerExpired;
      return regeneratorRuntime.wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              currentTypingUntil = _this.state.currentConversation && _this.state.currentConversation.typingUntil;
              timerExpired = currentTypingUntil && date_fns_is_before__WEBPACK_IMPORTED_MODULE_2___default()(new Date(currentTypingUntil), new Date());

              if (!timerExpired) {
                _context16.next = 5;
                break;
              }

              _context16.next = 5;
              return _this.safeUpdateCurrentConvo(_this.state.currentConversationId, false, function (convo) {
                return Object.assign({}, convo, {
                  typingUntil: null
                });
              });

            case 5:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16, this);
    })));

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "postToParent", function (t, payload) {
      // we could filter on event type if necessary
      window.parent && window.parent.postMessage(payload, '*');
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleResetUnreadCount", function () {
      if (document.hasFocus && document.hasFocus() && _this.state.view === 'side') {
        _this.setState({
          unreadCount: 0
        });
      }
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleRecallHistory", function (direction) {
      var position = direction === HISTORY_UP ? _this.state.historyPosition + 1 : _this.state.historyPosition - 1;

      var text = _.nth(_this.state.messageHistory, position);

      text && _this.setState({
        textToSend: text,
        historyPosition: position
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleTextChanged", function (event) {
      _this.setState({
        textToSend: event.target.value
      });
    });

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleSwitchConvo",
    /*#__PURE__*/
    function () {
      var _ref23 = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee17(convoId) {
        return regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                _this.setState({
                  currentConversation: null,
                  currentConversationId: convoId
                });

                _context17.next = 3;
                return _this.fetchCurrentConversation(convoId);

              case 3:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      return function (_x9) {
        return _ref23.apply(this, arguments);
      };
    }());

    _defineProperty(_assertThisInitialized(_assertThisInitialized(_this)), "handleClosePanel", function () {
      _this.handleSwitchView('widget');
    });

    Object(_utils__WEBPACK_IMPORTED_MODULE_8__["initializeAnalytics"])();

    var _queryString$parse = query_string__WEBPACK_IMPORTED_MODULE_3___default.a.parse(location.search),
        options = _queryString$parse.options,
        ref = _queryString$parse.ref;

    var _JSON$parse = JSON.parse(decodeURIComponent(options || '{}')),
        _config = _JSON$parse.config;

    if (_config.overrides) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _values(_config.overrides)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var override = _step.value;

          _this.props.bp.loadModuleView(override.module, true);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    _this.state = {
      view: null,
      botInfo: null,
      textToSend: '',
      loading: true,
      played: false,
      opened: false,
      config: Object.assign({}, defaultOptions, _config),
      conversations: [],
      currentConversation: null,
      currentConversationId: null,
      unreadCount: 0,
      isButtonHidden: _config.hideWidget,
      isTransitioning: false,
      messageHistory: [],
      historyPosition: HISTORY_STARTING_POINT,
      reference: ref
    };
    _this.axios = _this.props.bp.axios;

    _this.updateAxiosConfig();

    return _this;
  }

  _createClass(Web, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.setupSocket();

      if (this.state.config.userId) {
        this.props.bp.events.updateVisitorId(this.state.config.userId);
      }

      window.addEventListener('message', this.handleIframeApi);
      this.axios.interceptors.request.use(function (config) {
        var prefix = config.url.indexOf('?') > 0 ? '&' : '?';
        config.url += prefix + '__ts=' + new Date().getTime();
        return config;
      }, function (error) {
        return Promise.reject(error);
      });
      this.initialize();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      window.removeEventListener('message', this.handleIframeApi);
      this.isUnmounted = true;
    }
  }, {
    key: "initialize",
    value: function () {
      var _initialize = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee18() {
        return regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                _context18.next = 2;
                return this.setUserId();

              case 2:
                _context18.next = 4;
                return this.fetchData();

              case 4:
                _context18.next = 6;
                return this.setReference();

              case 6:
                this.handleSwitchView('widget');
                this.setState({
                  loading: false
                });

              case 8:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      return function initialize() {
        return _initialize.apply(this, arguments);
      };
    }()
  }, {
    key: "updateAxiosConfig",
    value: function updateAxiosConfig() {
      var _this$state$config = this.state.config,
          botId = _this$state$config.botId,
          externalAuthToken = _this$state$config.externalAuthToken;
      this.axiosConfig = botId ? {
        baseURL: "".concat(window.location.origin, "/api/v1/bots/").concat(botId, "/mod/channel-web")
      } : {
        baseURL: "".concat(window.BOT_API_PATH, "/mod/channel-web")
      };

      if (externalAuthToken) {
        this.axiosConfig = _objectSpread({}, this.axiosConfig, {
          headers: {
            ExternalAuth: "Bearer ".concat(externalAuthToken)
          }
        });
      }
    }
  }, {
    key: "setUserId",
    value: function setUserId() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var interval = setInterval(function () {
          if (window.__BP_VISITOR_ID) {
            clearInterval(interval);
            _this2.userId = window.__BP_VISITOR_ID;
            window.parent.postMessage({
              userId: _this2.userId
            }, '*');
            resolve();
          }
        }, 250);
        setTimeout(function () {
          clearInterval(interval);
          reject();
        }, 300000);
      });
    }
  }, {
    key: "handleSwitchView",
    value: function handleSwitchView(view) {
      var _this3 = this;

      if (this.state.isTransitioning) {
        return;
      }

      this.setState({
        isTransitioning: true
      });

      if (view === 'side' && this.state.view !== 'side') {
        this.setState({
          opened: true,
          unreadCount: 0,
          convoTransition: 'fadeOut',
          widgetTransition: 'fadeOut'
        });
        setTimeout(function () {
          _this3.setState({
            sideTransition: 'fadeIn',
            view: view,
            isTransitioning: false
          });
        }, ANIM_DURATION + 10);
      }

      if (view === 'widget') {
        this.setState({
          convoTransition: 'fadeOut',
          sideTransition: 'fadeOut'
        });

        if (!this.state.view || this.state.view === 'side') {
          setTimeout(function () {
            _this3.setState({
              widgetTransition: 'fadeIn',
              view: view,
              isTransitioning: false
            });
          }, ANIM_DURATION);
        }
      }

      setTimeout(function () {
        _this3.setState({
          view: view,
          isTransitioning: false
        });
      }, ANIM_DURATION);
      setTimeout(function () {
        _this3.setState({
          widgetTransition: null,
          convoTransition: null,
          sideTransition: _this3.state.sideTransition === 'fadeIn' ? 'fadeIn' : null,
          isTransitioning: false
        });
      }, ANIM_DURATION * 2.1);
    }
  }, {
    key: "setupSocket",
    value: function setupSocket() {
      // Connect the Botpress's Web Socket to the server
      if (this.props.bp && this.props.bp.events) {
        this.props.bp.events.setup();
      }

      this.props.bp.events.on('guest.webchat.message', this.handleNewMessage);
      this.props.bp.events.on('guest.webchat.typing', this.handleBotTyping); //firehose events to parent page

      this.props.bp.events.onAny(this.postToParent);
    }
  }, {
    key: "safeUpdateCurrentConvo",
    value: function () {
      var _safeUpdateCurrentConvo = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee19(convoId, addToUnread, updater) {
        var newConvo;
        return regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                if (!(!this.state.currentConversation || this.state.currentConversationId != convoId)) {
                  _context19.next = 6;
                  break;
                }

                _context19.next = 3;
                return this.fetchConversations();

              case 3:
                _context19.next = 5;
                return this.fetchCurrentConversation();

              case 5:
                return _context19.abrupt("return");

              case 6:
                // there's no focus on the actual conversation
                if (document.hasFocus && !document.hasFocus() || this.state.view !== 'side') {
                  this.playSound();

                  if (addToUnread) {
                    this.setState({
                      unreadCount: this.state.unreadCount + 1
                    });
                  }
                }

                this.handleResetUnreadCount();
                newConvo = updater && updater(this.state.currentConversation);

                if (newConvo) {
                  this.setState({
                    currentConversation: newConvo
                  });
                }

              case 10:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      return function safeUpdateCurrentConvo(_x10, _x11, _x12) {
        return _safeUpdateCurrentConvo.apply(this, arguments);
      };
    }()
  }, {
    key: "playSound",
    value: function playSound() {
      var _this4 = this;

      if (!this.state.played && this.state.view !== 'convo') {
        // TODO: Remove this condition (view !== 'convo') and fix transition sounds
        var audio = new Audio('/assets/modules/channel-web/notification.mp3');
        audio.play();
        this.setState({
          played: true
        });
        setTimeout(function () {
          _this4.setState({
            played: false
          });
        }, MIN_TIME_BETWEEN_SOUNDS);
      }
    }
  }, {
    key: "renderWidget",
    value: function renderWidget() {
      if (this.state.isButtonHidden) {
        return null;
      }

      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("button", {
        className: classnames__WEBPACK_IMPORTED_MODULE_1___default()('bpw-widget-btn', 'bpw-floating-button', _defineProperty({}, 'bpw-anim-' + this.state.widgetTransition, true)),
        onClick: this.handleButtonClicked
      }, this.state.view === 'convo' ? react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_CloseChat__WEBPACK_IMPORTED_MODULE_6__["default"], null) : react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_icons_Chat__WEBPACK_IMPORTED_MODULE_5__["default"], null), this.state.unreadCount > 0 && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
        className: 'bpw-floating-button-unread'
      }, this.state.unreadCount));
    }
  }, {
    key: "renderSide",
    value: function renderSide() {
      var locale = Object(_translations__WEBPACK_IMPORTED_MODULE_10__["getUserLocale"])(_translations__WEBPACK_IMPORTED_MODULE_10__["availableLocale"], _translations__WEBPACK_IMPORTED_MODULE_10__["defaultLocale"]);
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(react_intl__WEBPACK_IMPORTED_MODULE_9__["IntlProvider"], {
        locale: locale,
        messages: _translations__WEBPACK_IMPORTED_MODULE_10__["translations"][locale],
        defaultLocale: _translations__WEBPACK_IMPORTED_MODULE_10__["defaultLocale"]
      }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_components_Container__WEBPACK_IMPORTED_MODULE_7__["default"], {
        bp: this.props.bp,
        config: this.state.config,
        text: this.state.textToSend,
        fullscreen: this.props.fullscreen,
        transition: !this.props.fullscreen && this.state.sideTransition,
        unreadCount: this.state.unreadCount,
        currentConversation: this.state.currentConversation,
        conversations: this.state.conversations,
        onClose: !this.props.fullscreen && this.handleClosePanel,
        onResetSession: this.handleSessionReset,
        onSwitchConvo: this.handleSwitchConvo,
        onTextSend: this.handleSendMessage,
        recallHistory: this.handleRecallHistory,
        onTextChanged: this.handleTextChanged,
        onFileUpload: this.handleFileUpload,
        onSendData: this.handleSendData,
        downloadConversation: this.downloadConversation,
        createConversation: this.createConversation,
        botInfo: this.state.botInfo,
        botName: this.state.botInfo.name || this.state.config.botName || 'Bot'
      }));
    }
  }, {
    key: "render",
    value: function render() {
      if (this.state.loading || !this.state.view) {
        return null;
      }

      var parentClass = "bp-widget-web bp-widget-".concat(this.state.view);

      if (this.parentClass !== parentClass) {
        window.parent && window.parent.postMessage({
          type: 'setClass',
          value: parentClass
        }, '*');
        this.parentClass = parentClass;
      }

      var _this$state$config2 = this.state.config,
          stylesheet = _this$state$config2.stylesheet,
          extraStylesheet = _this$state$config2.extraStylesheet;
      var view = this.state.view !== 'side' && !this.props.fullscreen ? this.renderWidget() : this.renderSide();
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", {
        onFocus: this.handleResetUnreadCount
      }, stylesheet && stylesheet.length && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("link", {
        rel: "stylesheet",
        type: "text/css",
        href: stylesheet
      }), extraStylesheet && extraStylesheet.length && react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("link", {
        rel: "stylesheet",
        type: "text/css",
        href: extraStylesheet
      }), view);
    }
  }]);

  return Web;
}(react__WEBPACK_IMPORTED_MODULE_0___default.a.Component);



/***/ }),

/***/ "./src/views/lite/translations/en.json":
/*!*********************************************!*\
  !*** ./src/views/lite/translations/en.json ***!
  \*********************************************/
/*! exports provided: composer.placeholder, composer.send, header.conversations, conversationList.untitledConversation, botInfo.backToConversation, botInfo.startConversation, botInfo.privacyPolicy, botInfo.termsAndConditions, default */
/***/ (function(module) {

module.exports = {"composer.placeholder":"Reply to {name}","composer.send":"Send","header.conversations":"Conversations","conversationList.untitledConversation":"Untitled Conversation","botInfo.backToConversation":"Back to Conversation","botInfo.startConversation":"Start Conversation","botInfo.privacyPolicy":"View Privacy Policy","botInfo.termsAndConditions":"View Terms of Service"};

/***/ }),

/***/ "./src/views/lite/translations/fr.json":
/*!*********************************************!*\
  !*** ./src/views/lite/translations/fr.json ***!
  \*********************************************/
/*! exports provided: composer.placeholder, composer.send, header.conversations, conversationList.untitledConversation, botInfo.backToConversation, botInfo.startConversation, botInfo.privacyPolicy, botInfo.termsAndConditions, default */
/***/ (function(module) {

module.exports = {"composer.placeholder":"Répondre à {name}","composer.send":"Envoyer","header.conversations":"Conversations","conversationList.untitledConversation":"Conversation sans titre","botInfo.backToConversation":"Retour à la conversation","botInfo.startConversation":"Démarrer la conversation","botInfo.privacyPolicy":"Politique de confidentialité","botInfo.termsAndConditions":"Termes et conditions"};

/***/ }),

/***/ "./src/views/lite/translations/index.js":
/*!**********************************************!*\
  !*** ./src/views/lite/translations/index.js ***!
  \**********************************************/
/*! exports provided: initializeLocale, translations, availableLocale, defaultLocale, getUserLocale */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "initializeLocale", function() { return initializeLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "translations", function() { return translations; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "availableLocale", function() { return availableLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "defaultLocale", function() { return defaultLocale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUserLocale", function() { return getUserLocale; });
/* harmony import */ var react_intl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react-intl */ "./node_modules/react-intl/lib/index.es.js");
/* harmony import */ var react_intl_locale_data_pt__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-intl/locale-data/pt */ "./node_modules/react-intl/locale-data/pt.js");
/* harmony import */ var react_intl_locale_data_pt__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_intl_locale_data_pt__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_intl_locale_data_en__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-intl/locale-data/en */ "./node_modules/react-intl/locale-data/en.js");
/* harmony import */ var react_intl_locale_data_en__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_intl_locale_data_en__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_intl_locale_data_fr__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-intl/locale-data/fr */ "./node_modules/react-intl/locale-data/fr.js");
/* harmony import */ var react_intl_locale_data_fr__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_intl_locale_data_fr__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _fr_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./fr.json */ "./src/views/lite/translations/fr.json");
var _fr_json__WEBPACK_IMPORTED_MODULE_4___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./fr.json */ "./src/views/lite/translations/fr.json", 1);
/* harmony import */ var _pt_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./pt.json */ "./src/views/lite/translations/pt.json");
var _pt_json__WEBPACK_IMPORTED_MODULE_5___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./pt.json */ "./src/views/lite/translations/pt.json", 1);
/* harmony import */ var _en_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./en.json */ "./src/views/lite/translations/en.json");
var _en_json__WEBPACK_IMPORTED_MODULE_6___namespace = /*#__PURE__*/__webpack_require__.t(/*! ./en.json */ "./src/views/lite/translations/en.json", 1);
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }








var availableLocale = ['en', 'pt', 'fr'];
var defaultLocale = 'en';
var translations = {
  pt: _pt_json__WEBPACK_IMPORTED_MODULE_5__,
  fr: _fr_json__WEBPACK_IMPORTED_MODULE_4__,
  en: _en_json__WEBPACK_IMPORTED_MODULE_6__,
  'en-US': _en_json__WEBPACK_IMPORTED_MODULE_6__
};

var getUserLocale = function getUserLocale(available, defaultFallback) {
  var locale = navigator.language || navigator.userLanguage || '';
  var langCode = locale.split('-')[0];
  return available && !available.includes(langCode) ? defaultFallback : langCode;
};

var initializeLocale = function initializeLocale() {
  Object(react_intl__WEBPACK_IMPORTED_MODULE_0__["addLocaleData"])(_toConsumableArray(react_intl_locale_data_pt__WEBPACK_IMPORTED_MODULE_1___default.a).concat(_toConsumableArray(react_intl_locale_data_en__WEBPACK_IMPORTED_MODULE_2___default.a), _toConsumableArray(react_intl_locale_data_fr__WEBPACK_IMPORTED_MODULE_3___default.a)));
};



/***/ }),

/***/ "./src/views/lite/translations/pt.json":
/*!*********************************************!*\
  !*** ./src/views/lite/translations/pt.json ***!
  \*********************************************/
/*! exports provided: composer.placeholder, composer.send, header.conversations, conversationList.untitledConversation, botInfo.backToConversation, botInfo.startConversation, botInfo.privacyPolicy, botInfo.termsAndConditions, default */
/***/ (function(module) {

module.exports = {"composer.placeholder":"Fale com {name}","composer.send":"Send","header.conversations":"Conversas","conversationList.untitledConversation":"Conversa sem título","botInfo.backToConversation":"Back to Conversation","botInfo.startConversation":"Start Conversation","botInfo.privacyPolicy":"View Privacy Policy","botInfo.termsAndConditions":"View Terms of Service"};

/***/ }),

/***/ "./src/views/lite/utils.js":
/*!*********************************!*\
  !*** ./src/views/lite/utils.js ***!
  \*********************************/
/*! exports provided: getOverridedComponent, asyncDebounce, downloadFile, checkLocationOrigin, initializeAnalytics */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getOverridedComponent", function() { return getOverridedComponent; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "asyncDebounce", function() { return asyncDebounce; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "downloadFile", function() { return downloadFile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "checkLocationOrigin", function() { return checkLocationOrigin; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "initializeAnalytics", function() { return initializeAnalytics; });
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var getOverridedComponent = function getOverridedComponent(overrides, componentName) {
  if (overrides && overrides[componentName]) {
    var _overrides$componentN = overrides[componentName],
        module = _overrides$componentN.module,
        component = _overrides$componentN.component;

    if (module && component) {
      return window.botpress[module][component];
    }
  }
};
var asyncDebounce =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(timeMs) {
    var lastClickInMs, debounce;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            lastClickInMs = undefined;

            debounce = function debounce(promise) {
              var now = Date.now();

              if (!lastClickInMs) {
                lastClickInMs = now;
              }

              if (now - lastClickInMs > timeMs) {
                lastClickInMs = now;
                return promise;
              }
            };

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function asyncDebounce(_x) {
    return _ref.apply(this, arguments);
  };
}();
var downloadFile = function downloadFile(name, blob) {
  var url = window.URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
var checkLocationOrigin = function checkLocationOrigin() {
  if (!window.location.origin) {
    var _window$location = window.location,
        protocol = _window$location.protocol,
        hostname = _window$location.hostname,
        port = _window$location.port;
    window.location.origin = "".concat(protocol, "//").concat(hostname).concat(port && ':' + port);
  }
};
var initializeAnalytics = function initializeAnalytics() {
  if (window.botpressWebChat && window.botpressWebChat.sendUsageStats) {
    try {
      ReactGA.initialize('UA-90044826-2');
      ReactGA.event({
        category: 'WebChat',
        action: 'render',
        nonInteraction: true
      });
    } catch (err) {
      console.log('Error init analytics', err);
    }
  }
};

/***/ }),

/***/ 0:
/*!****************************************!*\
  !*** multi ./src/views/lite/index.jsx ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./src/views/lite/index.jsx */"./src/views/lite/index.jsx");


/***/ }),

/***/ 1:
/*!*****************************************!*\
  !*** ../locale-data/index.js (ignored) ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 2:
/*!*******************************!*\
  !*** ./lib/locales (ignored) ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ 3:
/*!*******************************!*\
  !*** ./lib/locales (ignored) ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),

/***/ "react-dom":
/*!***************************!*\
  !*** external "ReactDOM" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ })

/******/ });
//# sourceMappingURL=lite.bundle.js.map