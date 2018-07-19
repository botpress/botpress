botpress = typeof botpress === "object" ? botpress : {}; botpress["@botpress/channel-web"] =
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
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
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
/******/ 	__webpack_require__.p = "/js/modules/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 28);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = React;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var isDate = __webpack_require__(17)

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
      offset = parseTimezone(dateStrings.timezone)
    } else {
      // get offset accurate to hour in timezones that change offset
      offset = new Date(timestamp + time).getTimezoneOffset()
      offset = new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE).getTimezoneOffset()
    }

    return new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE)
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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
  Copyright (c) 2016 Jed Watson.
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
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
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
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (function () {
			return classNames;
		}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {
		window.classNames = classNames;
	}
}());


/***/ }),
/* 3 */
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
/* 4 */
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

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(44);

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
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
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

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
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
/* 5 */
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
/* 6 */
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
/* 7 */
/***/ (function(module, exports) {

module.exports = ReactDOM;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(86);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

if (process.env.NODE_ENV !== 'production') {
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _style = __webpack_require__(20);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BotAvatar = function BotAvatar(props) {
  return React.createElement('div', { className: _style2.default.defaultAvatar });
};

exports.default = BotAvatar;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

var startOfWeek = __webpack_require__(68)

/**
 * @category ISO Week Helpers
 * @summary Return the start of an ISO week for the given date.
 *
 * @description
 * Return the start of an ISO week for the given date.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of an ISO week
 *
 * @example
 * // The start of an ISO week for 2 September 2014 11:55:00:
 * var result = startOfISOWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfISOWeek (dirtyDate) {
  return startOfWeek(dirtyDate, {weekStartsOn: 1})
}

module.exports = startOfISOWeek


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyFunction = __webpack_require__(12);

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  (function () {
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
  })();
}

module.exports = warning;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hexToRGBA = hexToRGBA;
function hexToRGBA(hex) {
  var alpha = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _trackHelper = __webpack_require__(24);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var helpers = {
  initialize: function initialize(props) {
    var slickList = _reactDom2.default.findDOMNode(this.list);

    var slideCount = _react2.default.Children.count(props.children);
    var listWidth = this.getWidth(slickList);
    var trackWidth = this.getWidth(_reactDom2.default.findDOMNode(this.track));
    var slideWidth;

    if (!props.vertical) {
      var centerPaddingAdj = props.centerMode && parseInt(props.centerPadding) * 2;
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
        slickList.style.height = slickList.querySelector(selector).offsetHeight + 'px';
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

    // Functionality of animateSlide and postSlide is merged into this function
    // console.log('slideHandler', index);
    var targetSlide, currentSlide;
    var targetLeft, currentLeft;
    var callback;

    if (this.props.waitForAnimate && this.state.animating) {
      return;
    }

    if (this.props.fade) {
      currentSlide = this.state.currentSlide;

      // Don't change slide if it's not infite and current slide is the first or last slide.
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
      targetLeft = currentLeft;
    }

    if (this.props.beforeChange) {
      this.props.beforeChange(this.state.currentSlide, currentSlide);
    }

    if (this.props.lazyLoad) {
      var loaded = true;
      var slidesToLoad = [];
      for (var i = targetSlide; i < targetSlide + this.props.slidesToShow; i++) {
        loaded = loaded && this.state.lazyLoadedList.indexOf(i) >= 0;
        if (!loaded) {
          slidesToLoad.push(i);
        }
      }
      if (!loaded) {
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
        _this.setState(nextStateChanges);
        if (_this.props.afterChange) {
          _this.props.afterChange(currentSlide);
        }
        delete _this.animationEndCallback;
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
      return this.props.rtl === false ? 'left' : 'right';
    }
    if (swipeAngle >= 135 && swipeAngle <= 225) {
      return this.props.rtl === false ? 'right' : 'left';
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
/* 17 */
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
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _style = __webpack_require__(42);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Send = function (_Component) {
  _inherits(Send, _Component);

  function Send(props) {
    _classCallCheck(this, Send);

    return _possibleConstructorReturn(this, (Send.__proto__ || Object.getPrototypeOf(Send)).call(this, props));
  }

  _createClass(Send, [{
    key: 'renderSendButton',
    value: function renderSendButton() {
      return _react2.default.createElement(
        'span',
        null,
        _react2.default.createElement(
          'div',
          { className: _style2.default['enter-prompt'], onClick: this.props.send },
          _react2.default.createElement(
            'a',
            { style: { color: this.props.config.foregroundColor } },
            _react2.default.createElement(
              'i',
              { className: 'flex' },
              _react2.default.createElement(
                'svg',
                { width: '13', height: '13', viewBox: '0 0 13 13', xmlns: 'http://www.w3.org/2000/svg' },
                _react2.default.createElement('path', {
                  d: 'M12.975.38c.014.043.02.087.024.132v.06c-.004.048-.014.095-.03.14-.006.017-.007.032-.014.046L7.252 12.692c-.09.19-.28.308-.49.308-.216-.002-.406-.127-.493-.32l-.537-3.41C5.56 8.18 4.55 7.1 3.478 6.86l-3.2-.72c-.18-.1-.287-.293-.277-.5.012-.206.138-.39.328-.47L12.248.04 12.3.026c.05-.015.098-.025.148-.026.02 0 .038 0 .058.003.046.004.09.013.132.028l.055.02c.056.027.11.06.154.107.053.053.085.11.11.168.008.018.013.036.018.055z',
                  fillRule: 'evenodd'
                })
              )
            ),
            _react2.default.createElement(
              'span',
              null,
              'Send Message'
            )
          )
        )
      );
    }
  }, {
    key: 'renderPromoElement',
    value: function renderPromoElement() {
      var platform = 'Botpress';
      var link = 'https://botpress.io';

      return _react2.default.createElement(
        'span',
        null,
        _react2.default.createElement(
          'div',
          { className: _style2.default['flex-minimal'] },
          _react2.default.createElement(
            'div',
            { className: _style2.default.element },
            _react2.default.createElement(
              'span',
              null,
              "We're ",
              _react2.default.createElement(
                'i',
                null,
                _react2.default.createElement(
                  'svg',
                  { width: '7', height: '13', viewBox: '0 0 7 13', xmlns: 'http://www.w3.org/2000/svg' },
                  _react2.default.createElement(
                    'g',
                    { fill: 'none', fillRule: 'evenodd' },
                    _react2.default.createElement('path', {
                      d: 'M4.127.496C4.51-.12 5.37.356 5.16 1.07L3.89 5.14H6.22c.483 0 .757.616.464 1.044l-4.338 6.34c-.407.595-1.244.082-1.01-.618L2.72 7.656H.778c-.47 0-.748-.59-.48-1.02L4.13.495z',
                      fill: '#F6A623'
                    }),
                    _react2.default.createElement('path', { fill: '#FEF79E', d: 'M4.606.867L.778 7.007h2.807l-1.7 5.126 4.337-6.34H3.16' })
                  )
                )
              ),
              ' by ',
              _react2.default.createElement(
                'a',
                { href: link, target: '_blank', style: { color: this.props.config.foregroundColor } },
                platform
              )
            )
          )
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      return null;

      return _react2.default.createElement(
        'div',
        { className: _style2.default.footer },
        this.props.text === '' ? this.renderPromoElement() : this.renderSendButton()
      );
    }
  }]);

  return Send;
}(_react.Component);

exports.default = Send;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _style = __webpack_require__(45);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Send = function (_Component) {
  _inherits(Send, _Component);

  function Send(props) {
    _classCallCheck(this, Send);

    return _possibleConstructorReturn(this, (Send.__proto__ || Object.getPrototypeOf(Send)).call(this, props));
  }

  _createClass(Send, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.textInput.focus();
    }
  }, {
    key: 'handleFocus',
    value: function handleFocus(value) {
      if (this.props.focused) {
        this.props.focused(value);
      }
    }
  }, {
    key: 'handleKeyPress',
    value: function handleKeyPress(e) {
      if (e.key === 'Enter') {
        this.props.send();
        e.preventDefault();
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return _react2.default.createElement(
        'div',
        { tabIndex: '-1', className: _style2.default.input },
        _react2.default.createElement('textarea', {
          tabIndex: '1',
          ref: function ref(input) {
            _this2.textInput = input;
          },
          onBlur: function onBlur() {
            return _this2.handleFocus(false);
          },
          onFocus: function onFocus() {
            return _this2.handleFocus(true);
          },
          placeholder: this.props.placeholder,
          onChange: this.props.change,
          value: this.props.text,
          onKeyPress: this.handleKeyPress.bind(this),
          style: {
            color: this.props.config.textColorOnBackground
          }
        })
      );
    }
  }]);

  return Send;
}(_react.Component);

exports.default = Send;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(47);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../node_modules/css-loader/index.js??ref--1-1!../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../node_modules/css-loader/index.js??ref--1-1!../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

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
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var buildDistanceInWordsLocale = __webpack_require__(58)
var buildFormatLocale = __webpack_require__(59)

/**
 * @category Locales
 * @summary English locale.
 */
module.exports = {
  distanceInWords: buildDistanceInWordsLocale(),
  format: buildFormatLocale()
}


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)
var startOfISOWeek = __webpack_require__(11)

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Get the ISO week-numbering year of the given date.
 *
 * @description
 * Get the ISO week-numbering year of the given date,
 * which always starts 3 days before the year's first Thursday.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the ISO week-numbering year
 *
 * @example
 * // Which ISO-week numbering year is 2 January 2005?
 * var result = getISOYear(new Date(2005, 0, 2))
 * //=> 2004
 */
function getISOYear (dirtyDate) {
  var date = parse(dirtyDate)
  var year = date.getFullYear()

  var fourthOfJanuaryOfNextYear = new Date(0)
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4)
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0)
  var startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear)

  var fourthOfJanuaryOfThisYear = new Date(0)
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4)
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0)
  var startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear)

  if (date.getTime() >= startOfNextYear.getTime()) {
    return year + 1
  } else if (date.getTime() >= startOfThisYear.getTime()) {
    return year
  } else {
    return year - 1
  }
}

module.exports = getISOYear


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.getTrackLeft = exports.getTrackAnimateCSS = exports.getTrackCSS = undefined;

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var checkSpecKeys = function checkSpecKeys(spec, keysArray) {
  return keysArray.reduce(function (value, key) {
    return value && spec.hasOwnProperty(key);
  }, true) ? null : console.error('Keys Missing', spec);
};

var getTrackCSS = exports.getTrackCSS = function getTrackCSS(spec) {
  checkSpecKeys(spec, ['left', 'variableWidth', 'slideCount', 'slidesToShow', 'slideWidth']);

  var trackWidth, trackHeight;

  var trackChildren = spec.slideCount + 2 * spec.slidesToShow;

  if (!spec.vertical) {
    if (spec.variableWidth) {
      trackWidth = (spec.slideCount + 2 * spec.slidesToShow) * spec.slideWidth;
    } else if (spec.centerMode) {
      trackWidth = (spec.slideCount + 2 * (spec.slidesToShow + 1)) * spec.slideWidth;
    } else {
      trackWidth = (spec.slideCount + 2 * spec.slidesToShow) * spec.slideWidth;
    }
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

var getTrackLeft = exports.getTrackLeft = function getTrackLeft(spec) {

  checkSpecKeys(spec, ['slideIndex', 'trackRef', 'infinite', 'centerMode', 'slideCount', 'slidesToShow', 'slidesToScroll', 'slideWidth', 'listWidth', 'variableWidth', 'slideHeight']);

  var slideOffset = 0;
  var targetLeft;
  var targetSlide;
  var verticalOffset = 0;

  if (spec.fade) {
    return 0;
  }

  if (spec.infinite) {
    if (spec.slideCount >= spec.slidesToShow) {
      slideOffset = spec.slideWidth * spec.slidesToShow * -1;
      verticalOffset = spec.slideHeight * spec.slidesToShow * -1;
    }
    if (spec.slideCount % spec.slidesToScroll !== 0) {
      if (spec.slideIndex + spec.slidesToScroll > spec.slideCount && spec.slideCount > spec.slidesToShow) {
        if (spec.slideIndex > spec.slideCount) {
          slideOffset = (spec.slidesToShow - (spec.slideIndex - spec.slideCount)) * spec.slideWidth * -1;
          verticalOffset = (spec.slidesToShow - (spec.slideIndex - spec.slideCount)) * spec.slideHeight * -1;
        } else {
          slideOffset = spec.slideCount % spec.slidesToScroll * spec.slideWidth * -1;
          verticalOffset = spec.slideCount % spec.slidesToScroll * spec.slideHeight * -1;
        }
      }
    }
  } else {

    if (spec.slideCount % spec.slidesToScroll !== 0) {
      if (spec.slideIndex + spec.slidesToScroll > spec.slideCount && spec.slideCount > spec.slidesToShow) {
        var slidesToOffset = spec.slidesToShow - spec.slideCount % spec.slidesToScroll;
        slideOffset = slidesToOffset * spec.slideWidth;
      }
    }
  }

  if (spec.centerMode) {
    if (spec.infinite) {
      slideOffset += spec.slideWidth * Math.floor(spec.slidesToShow / 2);
    } else {
      slideOffset = spec.slideWidth * Math.floor(spec.slidesToShow / 2);
    }
  }

  if (!spec.vertical) {
    targetLeft = spec.slideIndex * spec.slideWidth * -1 + slideOffset;
  } else {
    targetLeft = spec.slideIndex * spec.slideHeight * -1 + verticalOffset;
  }

  if (spec.variableWidth === true) {
    var targetSlideIndex;
    if (spec.slideCount <= spec.slidesToShow || spec.infinite === false) {
      targetSlide = _reactDom2.default.findDOMNode(spec.trackRef).childNodes[spec.slideIndex];
    } else {
      targetSlideIndex = spec.slideIndex + spec.slidesToShow;
      targetSlide = _reactDom2.default.findDOMNode(spec.trackRef).childNodes[targetSlideIndex];
    }
    targetLeft = targetSlide ? targetSlide.offsetLeft * -1 : 0;
    if (spec.centerMode === true) {
      if (spec.infinite === false) {
        targetSlide = _reactDom2.default.findDOMNode(spec.trackRef).children[spec.slideIndex];
      } else {
        targetSlide = _reactDom2.default.findDOMNode(spec.trackRef).children[spec.slideIndex + spec.slidesToShow + 1];
      }

      if (targetSlide) {
        targetLeft = targetSlide.offsetLeft * -1 + (spec.listWidth - targetSlide.offsetWidth) / 2;
      }
    }
  }

  return targetLeft;
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _react = __webpack_require__(0);

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
    init: null,
    swipeEvent: null,
    // nextArrow, prevArrow are react componets
    nextArrow: null,
    prevArrow: null
};

module.exports = defaultProps;

/***/ }),
/* 26 */
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
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "../fonts/slick.eot";

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(29);


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebBotpressUIInjection = exports.Web = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _reactResizableBox = __webpack_require__(30);

var _reactResizableBox2 = _interopRequireDefault(_reactResizableBox);

var _web = __webpack_require__(35);

var _web2 = _interopRequireDefault(_web);

var _style = __webpack_require__(121);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Web = exports.Web = _web2.default;

var INJECTION_ID = 'botpress-platform-webchat-injection';
var INJECTION_URL = '/api/botpress-platform-webchat/inject.js';

var WebBotpressUIInjection = exports.WebBotpressUIInjection = function (_React$Component) {
  _inherits(WebBotpressUIInjection, _React$Component);

  function WebBotpressUIInjection() {
    _classCallCheck(this, WebBotpressUIInjection);

    return _possibleConstructorReturn(this, (WebBotpressUIInjection.__proto__ || Object.getPrototypeOf(WebBotpressUIInjection)).apply(this, arguments));
  }

  _createClass(WebBotpressUIInjection, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      if (document.getElementById(INJECTION_ID)) {
        return;
      }

      var script = window.document.createElement('script');
      script.src = INJECTION_URL;
      script.id = INJECTION_ID;
      script.onload = function () {
        return window.botpressWebChat.init({
          hideWidget: true,
          botConvoTitle: 'Bot Emulator',
          botConvoDescription: 'Test your bot live',
          enableReset: true
        });
      };

      window.document.body.appendChild(script);

      var button = document.createElement('li');
      Object.assign(button, {
        role: 'presentation',
        onclick: function onclick() {
          return window.botpressWebChat.sendEvent({ type: 'show' });
        },
        innerHTML: '\n        <a role="button" href="#">\n          <span class="bp-full-screen">\n            <span class="glyphicon glyphicon-comment"></span>\n          </span>\n        </a>\n      '
      });

      var target = document.querySelector('.bp-navbar-module-buttons') || document.querySelector('.nav.navbar-nav');
      target.appendChild(button);
    }
  }, {
    key: 'render',
    value: function render() {
      return null;
    }
  }]);

  return WebBotpressUIInjection;
}(_react2.default.Component);

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _lodash = __webpack_require__(31);

var _lodash2 = _interopRequireDefault(_lodash);

var _resizer = __webpack_require__(34);

var _resizer2 = _interopRequireDefault(_resizer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/sort-comp */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable max-len */
/* eslint-disable no-bitwise */
/* eslint-disable react/no-did-mount-set-state */

var userSelectNone = {
  userSelect: 'none',
  MozUserSelect: 'none',
  WebkitUserSelect: 'none',
  MsUserSelect: 'none'
};

var userSelectAuto = {
  userSelect: 'auto',
  MozUserSelect: 'auto',
  WebkitUserSelect: 'auto',
  MsUserSelect: 'auto'
};

var clamp = function clamp(n, min, max) {
  return Math.max(Math.min(n, max), min);
};
var snap = function snap(n, size) {
  return Math.round(n / size) * size;
};

var Resizable = function (_Component) {
  _inherits(Resizable, _Component);

  function Resizable(props) {
    _classCallCheck(this, Resizable);

    var _this = _possibleConstructorReturn(this, (Resizable.__proto__ || Object.getPrototypeOf(Resizable)).call(this, props));

    var width = props.width,
        height = props.height;

    _this.state = {
      isResizing: false,
      width: typeof width === 'undefined' ? 'auto' : width,
      height: typeof height === 'undefined' ? 'auto' : height,
      direction: 'right',
      original: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    };
    _this.onResizeStart = _this.onResizeStart.bind(_this);
    _this.onMouseMove = _this.onMouseMove.bind(_this);
    _this.onMouseUp = _this.onMouseUp.bind(_this);

    if (typeof window !== 'undefined') {
      window.addEventListener('mouseup', _this.onMouseUp);
      window.addEventListener('mousemove', _this.onMouseMove);
      window.addEventListener('touchmove', _this.onMouseMove);
      window.addEventListener('touchend', _this.onMouseUp);
    }
    return _this;
  }

  _createClass(Resizable, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var size = this.size;
      // If props.width or height is not defined, set default size when mounted.
      this.setState({
        width: this.state.width || size.width,
        height: this.state.height || size.height
      });
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(_ref) {
      var width = _ref.width,
          height = _ref.height;

      if (width !== this.props.width) {
        this.setState({ width: width });
      }
      if (height !== this.props.height) {
        this.setState({ height: height });
      }
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      return !(0, _lodash2.default)(this.props, nextProps) || !(0, _lodash2.default)(this.state, nextState);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
        window.removeEventListener('touchend', this.onMouseUp);
      }
    }
  }, {
    key: 'onResizeStart',
    value: function onResizeStart(event, direction) {
      var clientX = 0;
      var clientY = 0;
      if (event.nativeEvent instanceof MouseEvent) {
        clientX = event.nativeEvent.clientX;
        clientY = event.nativeEvent.clientY;
      } else if (event.nativeEvent instanceof TouchEvent) {
        clientX = event.nativeEvent.touches[0].clientX;
        clientY = event.nativeEvent.touches[0].clientY;
      }
      if (this.props.onResizeStart) {
        this.props.onResizeStart(event, direction, this.resizable);
      }
      var size = this.size;
      this.setState({
        original: {
          x: clientX,
          y: clientY,
          width: size.width,
          height: size.height
        },
        isResizing: true,
        direction: direction
      });
    }
  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      if (!this.state.isResizing) return;
      var clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      var clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      var _state = this.state,
          direction = _state.direction,
          original = _state.original,
          width = _state.width,
          height = _state.height;
      var _props = this.props,
          lockAspectRatio = _props.lockAspectRatio,
          minWidth = _props.minWidth,
          minHeight = _props.minHeight;
      var _props2 = this.props,
          maxWidth = _props2.maxWidth,
          maxHeight = _props2.maxHeight;

      var ratio = original.height / original.width;
      var newWidth = original.width;
      var newHeight = original.height;
      if (/right/i.test(direction)) {
        newWidth = original.width + (clientX - original.x);
        if (lockAspectRatio) newHeight = newWidth * ratio;
      }
      if (/left/i.test(direction)) {
        newWidth = original.width - (clientX - original.x);
        if (lockAspectRatio) newHeight = newWidth * ratio;
      }
      if (/bottom/i.test(direction)) {
        newHeight = original.height + (clientY - original.y);
        if (lockAspectRatio) newWidth = newHeight / ratio;
      }
      if (/top/i.test(direction)) {
        newHeight = original.height - (clientY - original.y);
        if (lockAspectRatio) newWidth = newHeight / ratio;
      }

      if (this.props.bounds === 'parent') {
        var parent = this.resizable.parentNode;
        if (parent instanceof HTMLElement) {
          var parentRect = parent.getBoundingClientRect();
          var parentLeft = parentRect.left;
          var parentTop = parentRect.top;

          var _resizable$getBoundin = this.resizable.getBoundingClientRect(),
              _left = _resizable$getBoundin.left,
              _top = _resizable$getBoundin.top;

          var boundWidth = parent.offsetWidth + (parentLeft - _left);
          var boundHeight = parent.offsetHeight + (parentTop - _top);
          maxWidth = maxWidth && maxWidth < boundWidth ? maxWidth : boundWidth;
          maxHeight = maxHeight && maxHeight < boundHeight ? maxHeight : boundHeight;
        }
      } else if (this.props.bounds === 'window') {
        if (typeof window !== 'undefined') {
          var _resizable$getBoundin2 = this.resizable.getBoundingClientRect(),
              _left2 = _resizable$getBoundin2.left,
              _top2 = _resizable$getBoundin2.top;

          var _boundWidth = window.innerWidth - _left2;
          var _boundHeight = window.innerHeight - _top2;
          maxWidth = maxWidth && maxWidth < _boundWidth ? maxWidth : _boundWidth;
          maxHeight = maxHeight && maxHeight < _boundHeight ? maxHeight : _boundHeight;
        }
      } else if (this.props.bounds instanceof HTMLElement) {
        var targetRect = this.props.bounds.getBoundingClientRect();
        var targetLeft = targetRect.left;
        var targetTop = targetRect.top;

        var _resizable$getBoundin3 = this.resizable.getBoundingClientRect(),
            _left3 = _resizable$getBoundin3.left,
            _top3 = _resizable$getBoundin3.top;

        if (!(this.props.bounds instanceof HTMLElement)) return;
        var _boundWidth2 = this.props.bounds.offsetWidth + (targetLeft - _left3);
        var _boundHeight2 = this.props.bounds.offsetHeight + (targetTop - _top3);
        maxWidth = maxWidth && maxWidth < _boundWidth2 ? maxWidth : _boundWidth2;
        maxHeight = maxHeight && maxHeight < _boundHeight2 ? maxHeight : _boundHeight2;
      }

      var computedMinWidth = typeof minWidth === 'undefined' || minWidth < 0 ? 0 : minWidth;
      var computedMaxWidth = typeof maxWidth === 'undefined' || maxWidth < 0 ? newWidth : maxWidth;
      var computedMinHeight = typeof minHeight === 'undefined' || minHeight < 0 ? 0 : minHeight;
      var computedMaxHeight = typeof maxHeight === 'undefined' || maxHeight < 0 ? newHeight : maxHeight;

      if (lockAspectRatio) {
        var lockedMinWidth = computedMinWidth > computedMinHeight / ratio ? computedMinWidth : computedMinHeight / ratio;
        var lockedMaxWidth = computedMaxWidth < computedMaxHeight / ratio ? computedMaxWidth : computedMaxHeight / ratio;
        var lockedMinHeight = computedMinHeight > computedMinWidth * ratio ? computedMinHeight : computedMinWidth * ratio;
        var lockedMaxHeight = computedMaxHeight < computedMaxWidth * ratio ? computedMaxHeight : computedMaxWidth * ratio;
        newWidth = clamp(newWidth, lockedMinWidth, lockedMaxWidth);
        newHeight = clamp(newHeight, lockedMinHeight, lockedMaxHeight);
      } else {
        newWidth = clamp(newWidth, computedMinWidth, computedMaxWidth);
        newHeight = clamp(newHeight, computedMinHeight, computedMaxHeight);
      }
      if (this.props.grid) {
        newWidth = snap(newWidth, this.props.grid[0]);
      }
      if (this.props.grid) {
        newHeight = snap(newHeight, this.props.grid[1]);
      }

      this.setState({
        width: width !== 'auto' ? newWidth : 'auto',
        height: height !== 'auto' ? newHeight : 'auto'
      });
      var delta = {
        width: newWidth - original.width,
        height: newHeight - original.height
      };
      if (this.props.onResize) {
        this.props.onResize(event, direction, this.resizable, delta);
      }
    }
  }, {
    key: 'onMouseUp',
    value: function onMouseUp(event) {
      var _state2 = this.state,
          isResizing = _state2.isResizing,
          direction = _state2.direction,
          original = _state2.original;

      if (!isResizing) return;
      var delta = {
        width: this.size.width - original.width,
        height: this.size.height - original.height
      };
      if (this.props.onResizeStop) {
        this.props.onResizeStop(event, direction, this.resizable, delta);
      }
      this.setState({ isResizing: false });
    }
  }, {
    key: 'setSize',
    value: function setSize(size) {
      this.setState({
        width: this.state.width || size.width,
        height: this.state.height || size.height
      });
    }
  }, {
    key: 'updateSize',
    value: function updateSize(size) {
      this.setState({ width: size.width, height: size.height });
    }
  }, {
    key: 'renderResizer',
    value: function renderResizer() {
      var _this2 = this;

      var _props3 = this.props,
          enable = _props3.enable,
          handlerStyles = _props3.handlerStyles,
          handlerClasses = _props3.handlerClasses;

      if (!enable) return null;
      return Object.keys(enable).map(function (dir) {
        if (enable[dir] !== false) {
          return _react2.default.createElement(_resizer2.default, {
            key: dir,
            direction: dir,
            onResizeStart: _this2.onResizeStart,
            replaceStyles: handlerStyles && handlerStyles[dir],
            className: handlerClasses && handlerClasses[dir]
          });
        }
        return null;
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var userSelect = this.state.isResizing ? userSelectNone : userSelectAuto;
      var _props4 = this.props,
          style = _props4.style,
          className = _props4.className;

      return _react2.default.createElement(
        'div',
        _extends({
          ref: function ref(c) {
            _this3.resizable = c;
          },
          style: _extends({
            position: 'relative'
          }, userSelect, style, this.style, {
            boxSizing: 'border-box'
          }),
          className: className
        }, this.props.extendsProps),
        this.props.children,
        this.renderResizer()
      );
    }
  }, {
    key: 'size',
    get: function get() {
      var width = 0;
      var height = 0;
      if (typeof window !== 'undefined') {
        var _style = window.getComputedStyle(this.resizable, null);
        width = ~~_style.getPropertyValue('width').replace('px', '');
        height = ~~_style.getPropertyValue('height').replace('px', '');
      }
      return { width: width, height: height };
    }
  }, {
    key: 'style',
    get: function get() {
      var _this4 = this;

      var size = function size(key) {
        if (typeof _this4.state[key] === 'undefined' || _this4.state[key] === 'auto') return 'auto';else if (/px$/.test(_this4.state[key].toString())) return _this4.state[key].toString();else if (/%$/.test(_this4.state[key].toString())) return _this4.state[key].toString();
        return _this4.state[key] + 'px';
      };
      return {
        width: size('width'),
        height: size('height')
      };
    }
  }]);

  return Resizable;
}(_react.Component);

Resizable.defaultProps = {
  onResizeStart: function onResizeStart() {},
  onResize: function onResize() {},
  onResizeStop: function onResizeStop() {},
  enable: {
    top: true,
    right: true,
    bottom: true,
    left: true,
    topRight: true,
    bottomRight: true,
    bottomLeft: true,
    topLeft: true
  },
  style: {},
  grid: [1, 1],
  lockAspectRatio: false
};
exports.default = Resizable;

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, module) {/**
 * Lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    asyncTag = '[object AsyncFunction]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    nullTag = '[object Null]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    proxyTag = '[object Proxy]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    undefinedTag = '[object Undefined]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    Symbol = root.Symbol,
    Uint8Array = root.Uint8Array,
    propertyIsEnumerable = objectProto.propertyIsEnumerable,
    splice = arrayProto.splice,
    symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols,
    nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
    nativeKeys = overArg(Object.keys, Object);

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView'),
    Map = getNative(root, 'Map'),
    Promise = getNative(root, 'Promise'),
    Set = getNative(root, 'Set'),
    WeakMap = getNative(root, 'WeakMap'),
    nativeCreate = getNative(Object, 'create');

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = isEqual;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(32), __webpack_require__(33)(module)))

/***/ }),
/* 32 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-filename-extension */

exports.default = ResizeHandler;

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var styles = {
  base: {
    position: 'absolute'
  },
  top: {
    width: '100%',
    height: '10px',
    top: '-5px',
    left: '0px',
    cursor: 'row-resize'
  },
  right: {
    width: '10px',
    height: '100%',
    top: '0px',
    right: '-5px',
    cursor: 'col-resize'
  },
  bottom: {
    width: '100%',
    height: '10px',
    bottom: '-5px',
    left: '0px',
    cursor: 'row-resize'
  },
  left: {
    width: '10px',
    height: '100%',
    top: '0px',
    left: '-5px',
    cursor: 'col-resize'
  },
  topRight: {
    width: '20px',
    height: '20px',
    position: 'absolute',
    right: '-10px',
    top: '-10px',
    cursor: 'ne-resize'
  },
  bottomRight: {
    width: '20px',
    height: '20px',
    position: 'absolute',
    right: '-10px',
    bottom: '-10px',
    cursor: 'se-resize'
  },
  bottomLeft: {
    width: '20px',
    height: '20px',
    position: 'absolute',
    left: '-10px',
    bottom: '-10px',
    cursor: 'sw-resize'
  },
  topLeft: {
    width: '20px',
    height: '20px',
    position: 'absolute',
    left: '-10px',
    top: '-10px',
    cursor: 'nw-resize'
  }
};

function ResizeHandler(props) {
  return _react2.default.createElement('div', {
    className: props.className,
    style: _extends({}, styles.base, styles[props.direction], props.replaceStyles || {}),
    onMouseDown: function onMouseDown(e) {
      return props.onResizeStart(e, props.direction);
    },
    onTouchStart: function onTouchStart(e) {
      return props.onResizeStart(e, props.direction);
    }
  });
}

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _add_milliseconds = __webpack_require__(36);

var _add_milliseconds2 = _interopRequireDefault(_add_milliseconds);

var _is_before = __webpack_require__(37);

var _is_before2 = _interopRequireDefault(_is_before);

var _queryString = __webpack_require__(38);

var _queryString2 = _interopRequireDefault(_queryString);

var _convo = __webpack_require__(41);

var _convo2 = _interopRequireDefault(_convo);

var _side = __webpack_require__(50);

var _side2 = _interopRequireDefault(_side);

var _style = __webpack_require__(20);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* global: window */

// import { Emoji } from 'emoji-mart'

if (!window.location.origin) {
  window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}

var BOT_HOSTNAME = window.location.origin;
var ANIM_DURATION = 300;

var MIN_TIME_BETWEEN_SOUNDS = 10000; // 10 seconds

var defaultOptions = {
  locale: 'en-US',
  botName: 'Bot',
  backgroundColor: '#ffffff',
  textColorOnBackground: '#666666',
  foregroundColor: '#000000',
  textColorOnForeground: '#ffffff',
  enableReset: false,
  botConvoTitle: 'Botpress Webchat'
};

var Web = function (_React$Component) {
  _inherits(Web, _React$Component);

  function Web(props) {
    _classCallCheck(this, Web);

    var _this = _possibleConstructorReturn(this, (Web.__proto__ || Object.getPrototypeOf(Web)).call(this, props));

    _this.handleIframeApi = function (_ref) {
      var _ref$data = _ref.data,
          action = _ref$data.action,
          payload = _ref$data.payload;

      if (action === 'configure') {
        _this.setState({ config: Object.assign({}, defaultOptions, payload) });
      } else if (action === 'event') {
        var type = payload.type,
            text = payload.text;

        if (type === 'show') {
          _this.handleSwitchView('side');
        } else if (type === 'hide') {
          _this.handleSwitchView('widget');
        } else if (type === 'message') {
          _this.setState({ textToSend: text });
          _this.handleSendMessage();
        } else {
          var userId = window.__BP_VISITOR_ID;
          var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/events/' + userId;
          return _this.props.bp.axios.post(url, { type: type, payload: payload });
        }
      }
    };

    var _queryString$parse = _queryString2.default.parse(location.search),
        options = _queryString$parse.options;

    var _JSON$parse = JSON.parse(decodeURIComponent(options || '{}')),
        hideWidget = _JSON$parse.hideWidget,
        config = _JSON$parse.config;

    _this.state = {
      view: null,
      textToSend: '',
      loading: true,
      played: false,
      opened: false,
      config: Object.assign({}, defaultOptions, config),
      conversations: [],
      currentConversation: null,
      currentConversationId: null,
      unreadCount: 0,
      isButtonHidden: hideWidget
    };
    return _this;
  }

  _createClass(Web, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.setupSocket();
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this2 = this;

      this.setUserId().then(this.fetchData.bind(this)).then(function () {
        _this2.handleSwitchView('widget');
        if (!_this2.state.isButtonHidden) {
          _this2.showConvoPopUp();
        }

        _this2.setState({ loading: false });
      });

      window.addEventListener('message', this.handleIframeApi);

      this.props.bp.axios.interceptors.request.use(function (config) {
        if (/\/api\/botpress-platform-webchat\//i.test(config.url)) {
          var prefix = config.url.indexOf('?') > 0 ? '&' : '?';
          config.url += prefix + '__ts=' + new Date().getTime();
        }
        return config;
      }, function (error) {
        return Promise.reject(error);
      });
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('message', this.handleIframeApi);
      this.isUnmounted = true;
    }
  }, {
    key: 'setUserId',
    value: function setUserId() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var interval = setInterval(function () {
          if (window.__BP_VISITOR_ID) {
            clearInterval(interval);
            _this3.userId = window.__BP_VISITOR_ID;
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
    key: 'showConvoPopUp',
    value: function showConvoPopUp() {
      var _this4 = this;

      if (this.state.config.welcomeMsgEnable) {
        setTimeout(function () {
          if (!_this4.state.opened) {
            _this4.handleSwitchView('convo');
          }
        }, this.state.config.welcomeMsgDelay || 5000);
      }
    }
  }, {
    key: 'handleSwitchView',
    value: function handleSwitchView(view) {
      var _this5 = this;

      if (view === 'side' && this.state.view !== 'side') {
        this.setState({
          opened: true,
          unreadCount: 0,
          convoTransition: 'fadeOut',
          widgetTransition: 'fadeOut'
        });

        setTimeout(function () {
          _this5.setState({
            sideTransition: 'fadeIn',
            view: view
          });
        }, ANIM_DURATION + 10);
      }

      if (view === 'convo') {
        setTimeout(function () {
          _this5.setState({
            convoTransition: 'fadeIn',
            view: view
          });
        }, ANIM_DURATION);
      }

      if (view === 'widget') {
        this.setState({
          convoTransition: 'fadeOut',
          sideTransition: 'fadeOut'
        });

        if (!this.state.view || this.state.view === 'side') {
          setTimeout(function () {
            _this5.setState({
              widgetTransition: 'fadeIn',
              view: view
            });
          }, ANIM_DURATION);
        }
      }

      setTimeout(function () {
        _this5.setState({
          view: view
        });
      }, ANIM_DURATION);

      setTimeout(function () {
        _this5.setState({
          widgetTransition: null,
          convoTransition: null,
          sideTransition: _this5.state.sideTransition === 'fadeIn' ? 'fadeIn' : null
        });
      }, ANIM_DURATION * 2.1);
    }
  }, {
    key: 'handleButtonClicked',
    value: function handleButtonClicked() {
      if (this.state.view === 'convo') {
        this.handleSwitchView('widget');
      } else {
        this.handleSwitchView('side');
      }
    }
  }, {
    key: 'setupSocket',
    value: function setupSocket() {
      // Connect the Botpress's Web Socket to the server
      if (this.props.bp && this.props.bp.events) {
        this.props.bp.events.setup();
      }

      this.props.bp.events.on('guest.webchat.message', this.handleNewMessage.bind(this));
      this.props.bp.events.on('guest.webchat.typing', this.handleBotTyping.bind(this));
    }
  }, {
    key: 'fetchData',
    value: function fetchData() {
      return this.fetchConversations().then(this.fetchCurrentConversation.bind(this));
    }
  }, {
    key: 'fetchConversations',
    value: function fetchConversations() {
      var _this6 = this;

      var axios = this.props.bp.axios;
      var userId = this.userId;
      var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/conversations/' + userId;

      return axios.get(url).then(function (_ref2) {
        var data = _ref2.data;
        return new Promise(function (resolve) {
          return !_this6.isUnmounted && _this6.setState({ conversations: data }, resolve);
        });
      });
    }
  }, {
    key: 'fetchCurrentConversation',
    value: function fetchCurrentConversation(convoId) {
      var _this7 = this;

      var axios = this.props.bp.axios;
      var userId = this.userId;

      var conversationIdToFetch = convoId || this.state.currentConversationId;
      if (this.state.conversations.length > 0 && !conversationIdToFetch) {
        conversationIdToFetch = this.state.conversations[0].id;
        this.setState({ currentConversationId: conversationIdToFetch });
      }

      var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/conversations/' + userId + '/' + conversationIdToFetch;

      return axios.get(url).then(function (_ref3) {
        var data = _ref3.data;

        // Possible race condition if the current conversation changed while fetching
        if (_this7.state.currentConversationId !== conversationIdToFetch) {
          // In which case we simply restart fetching
          return _this7.fetchCurrentConversation();
        }

        _this7.setState({ currentConversation: data });
      });
    }
  }, {
    key: 'handleNewMessage',
    value: function handleNewMessage(event) {
      this.safeUpdateCurrentConvo(event.conversationId, true, function (convo) {
        return Object.assign({}, convo, {
          messages: [].concat(_toConsumableArray(convo.messages), [event]),
          typingUntil: event.userId ? convo.typingUntil : null
        });
      });
    }
  }, {
    key: 'handleBotTyping',
    value: function handleBotTyping(event) {
      this.safeUpdateCurrentConvo(event.conversationId, false, function (convo) {
        return Object.assign({}, convo, {
          typingUntil: (0, _add_milliseconds2.default)(new Date(), event.timeInMs)
        });
      });

      setTimeout(this.expireTyping.bind(this), event.timeInMs + 50);
    }
  }, {
    key: 'expireTyping',
    value: function expireTyping() {
      var currentTypingUntil = this.state.currentConversation && this.state.currentConversation.typingUntil;

      var timerExpired = currentTypingUntil && (0, _is_before2.default)(new Date(currentTypingUntil), new Date());
      if (timerExpired) {
        this.safeUpdateCurrentConvo(this.state.currentConversationId, false, function (convo) {
          return Object.assign({}, convo, { typingUntil: null });
        });
      }
    }
  }, {
    key: 'safeUpdateCurrentConvo',
    value: function safeUpdateCurrentConvo(convoId, addToUnread, updater) {
      // there's no conversation to update or our convo changed
      if (!this.state.currentConversation || this.state.currentConversationId !== convoId) {
        this.fetchConversations().then(this.fetchCurrentConversation.bind(this));

        return;
      }

      // there's no focus on the actual conversation
      if (document.hasFocus && !document.hasFocus() || this.state.view !== 'side') {
        this.playSound();

        if (addToUnread) {
          this.increaseUnreadCount();
        }
      }

      this.handleResetUnreadCount();

      var newConvo = updater && updater(this.state.currentConversation);

      if (newConvo) {
        this.setState({ currentConversation: newConvo });
      }
    }
  }, {
    key: 'playSound',
    value: function playSound() {
      var _this8 = this;

      if (!this.state.played && this.state.view !== 'convo') {
        // TODO: Remove this condition (view !== 'convo') and fix transition sounds
        var audio = new Audio('/api/botpress-platform-webchat/static/notification.mp3');
        audio.play();

        this.setState({
          played: true
        });

        setTimeout(function () {
          _this8.setState({
            played: false
          });
        }, MIN_TIME_BETWEEN_SOUNDS);
      }
    }
  }, {
    key: 'increaseUnreadCount',
    value: function increaseUnreadCount() {
      this.setState({
        unreadCount: this.state.unreadCount + 1
      });
    }
  }, {
    key: 'handleResetUnreadCount',
    value: function handleResetUnreadCount() {
      if (document.hasFocus && document.hasFocus() && this.state.view === 'side') {
        this.setState({
          unreadCount: 0
        });
      }
    }
  }, {
    key: 'handleSendMessage',
    value: function handleSendMessage() {
      var _this9 = this;

      var userId = window.__BP_VISITOR_ID;
      var config = { params: { conversationId: this.state.currentConversationId } };

      return this.handleSendData({ type: 'text', text: this.state.textToSend }).then(function () {
        _this9.handleSwitchView('side');
        _this9.setState({ textToSend: '' });
      });
    }
  }, {
    key: 'handleTextChanged',
    value: function handleTextChanged(event) {
      this.setState({
        textToSend: event.target.value
      });
    }
  }, {
    key: 'handleAddEmoji',
    value: function handleAddEmoji(emoji, event) {
      this.setState({
        textToSend: this.state.textToSend + emoji.native + ' '
      });
    }
  }, {
    key: 'handleSendQuickReply',
    value: function handleSendQuickReply(title, payload) {
      return this.handleSendData({
        type: 'quick_reply',
        text: title,
        data: { payload: payload }
      });
    }
  }, {
    key: 'handleSendForm',
    value: function handleSendForm(fields, formId, repr) {
      return this.handleSendData({
        type: 'form',
        formId: formId,
        text: repr,
        data: fields
      });
    }
  }, {
    key: 'handleLoginPrompt',
    value: function handleLoginPrompt(username, password) {
      return this.handleSendData({
        type: 'login_prompt',
        text: 'Provided login information',
        data: { username: username, password: password }
      });
    }
  }, {
    key: 'handleFileUploadSend',
    value: function handleFileUploadSend(title, payload, file) {
      var userId = window.__BP_VISITOR_ID;
      var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/messages/' + userId + '/files';
      var config = { params: { conversationId: this.state.currentConversationId } };

      var data = new FormData();
      data.append('file', file);

      return this.props.bp.axios.post(url, data, config).then();
    }
  }, {
    key: 'handleSendData',
    value: function handleSendData(data) {
      var userId = window.__BP_VISITOR_ID;
      var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/messages/' + userId;
      var config = { params: { conversationId: this.state.currentConversationId } };
      return this.props.bp.axios.post(url, data, config).then();
    }
  }, {
    key: 'handleSwitchConvo',
    value: function handleSwitchConvo(convoId) {
      this.setState({
        currentConversation: null,
        currentConversationId: convoId
      });

      this.fetchCurrentConversation(convoId);
    }
  }, {
    key: 'handleClosePanel',
    value: function handleClosePanel() {
      this.handleSwitchView('widget');
    }
  }, {
    key: 'handleSessionReset',
    value: function handleSessionReset() {
      var userId = window.__BP_VISITOR_ID;
      var url = BOT_HOSTNAME + '/api/botpress-platform-webchat/conversations/' + userId + '/' + this.state.currentConversationId + '/reset';
      return this.props.bp.axios.post(url).then();
    }
  }, {
    key: 'renderOpenIcon',
    value: function renderOpenIcon() {
      return _react2.default.createElement(
        'svg',
        { width: '20', height: '20', viewBox: '0 0 20 20', xmlns: 'http://www.w3.org/2000/svg' },
        _react2.default.createElement('path', {
          d: 'M4.583 14.894l-3.256 3.78c-.7.813-1.26.598-1.25-.46a10689.413 10689.413 0 0 1 .035-4.775V4.816a3.89 3.89 0 0 1 3.88-3.89h12.064a3.885 3.885 0 0 1 3.882 3.89v6.185a3.89 3.89 0 0 1-3.882 3.89H4.583z',
          fill: '#FFF',
          fillRule: 'evenodd'
        })
      );
    }
  }, {
    key: 'renderCloseIcon',
    value: function renderCloseIcon() {
      return _react2.default.createElement(
        'svg',
        { width: '17', height: '17', viewBox: '0 0 17 17', xmlns: 'http://www.w3.org/2000/svg' },
        _react2.default.createElement('path', {
          d: 'M16.726 15.402c.365.366.365.96 0 1.324-.178.178-.416.274-.663.274-.246 0-.484-.096-.663-.274L8.323 9.648h.353L1.6 16.726c-.177.178-.416.274-.663.274-.246 0-.484-.096-.663-.274-.365-.365-.365-.958 0-1.324L7.35 8.324v.35L.275 1.6C-.09 1.233-.09.64.274.274c.367-.365.96-.365 1.326 0l7.076 7.078h-.353L15.4.274c.366-.365.96-.365 1.326 0 .365.366.365.958 0 1.324L9.65 8.675v-.35l7.076 7.077z',
          fill: '#FFF',
          fillRule: 'evenodd'
        })
      );
    }
  }, {
    key: 'renderUncountMessages',
    value: function renderUncountMessages() {
      return _react2.default.createElement(
        'span',
        { className: _style2.default.unread },
        this.state.unreadCount
      );
    }
  }, {
    key: 'renderButton',
    value: function renderButton() {
      if (this.state.isButtonHidden) {
        return null;
      }
      return _react2.default.createElement(
        'button',
        {
          className: _style2.default[this.state.widgetTransition],
          onClick: this.handleButtonClicked.bind(this),
          style: { backgroundColor: this.state.config.foregroundColor }
        },
        _react2.default.createElement(
          'i',
          null,
          this.state.view === 'convo' ? this.renderCloseIcon() : this.renderOpenIcon()
        ),
        this.state.unreadCount > 0 ? this.renderUncountMessages() : null
      );
    }
  }, {
    key: 'renderWidget',
    value: function renderWidget() {
      return _react2.default.createElement(
        'div',
        { className: (0, _classnames2.default)(_style2.default['container']) },
        _react2.default.createElement(
          'div',
          { className: (0, _classnames2.default)(_style2.default['widget-container']) },
          _react2.default.createElement(
            'span',
            null,
            this.state.view === 'convo' ? _react2.default.createElement(_convo2.default, {
              transition: this.state.convoTransition,
              change: this.handleTextChanged.bind(this),
              send: this.handleSendMessage.bind(this),
              config: this.state.config,
              text: this.state.textToSend
            }) : null,
            this.renderButton()
          )
        )
      );
    }
  }, {
    key: 'renderSide',
    value: function renderSide() {
      return _react2.default.createElement(_side2.default, {
        config: this.state.config,
        text: this.state.textToSend,
        fullscreen: this.props.fullscreen,
        transition: !this.props.fullscreen ? this.state.sideTransition : null,
        unreadCount: this.state.unreadCount,
        currentConversation: this.state.currentConversation,
        conversations: this.state.conversations,
        addEmojiToText: this.handleAddEmoji.bind(this),
        onClose: !this.props.fullscreen ? this.handleClosePanel.bind(this) : null,
        onResetSession: this.handleSessionReset.bind(this),
        onSwitchConvo: this.handleSwitchConvo.bind(this),
        onTextSend: this.handleSendMessage.bind(this),
        onTextChanged: this.handleTextChanged.bind(this),
        onQuickReplySend: this.handleSendQuickReply.bind(this),
        onFormSend: this.handleSendForm.bind(this),
        onFileUploadSend: this.handleFileUploadSend.bind(this),
        onLoginPromptSend: this.handleLoginPrompt.bind(this),
        onSendData: this.handleSendData.bind(this)
      });
    }
  }, {
    key: 'render',
    value: function render() {
      if (this.state.loading || !this.state.view) {
        return null;
      }

      window.parent && window.parent.postMessage({ type: 'setClass', value: 'bp-widget-web bp-widget-' + this.state.view }, '*');

      var view = this.state.view !== 'side' && !this.props.fullscreen ? this.renderWidget() : this.renderSide();

      return _react2.default.createElement(
        'div',
        { className: _style2.default.web, onFocus: this.handleResetUnreadCount.bind(this) },
        view
      );
    }
  }]);

  return Web;
}(_react2.default.Component);

exports.default = Web;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Millisecond Helpers
 * @summary Add the specified number of milliseconds to the given date.
 *
 * @description
 * Add the specified number of milliseconds to the given date.
 *
 * @param {Date|String|Number} date - the date to be changed
 * @param {Number} amount - the amount of milliseconds to be added
 * @returns {Date} the new date with the milliseconds added
 *
 * @example
 * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
 * var result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
 * //=> Thu Jul 10 2014 12:45:30.750
 */
function addMilliseconds (dirtyDate, dirtyAmount) {
  var timestamp = parse(dirtyDate).getTime()
  var amount = Number(dirtyAmount)
  return new Date(timestamp + amount)
}

module.exports = addMilliseconds


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

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
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strictUriEncode = __webpack_require__(39);
var objectAssign = __webpack_require__(5);
var decodeComponent = __webpack_require__(40);

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

exports.extract = function (str) {
	var queryStart = str.indexOf('?');
	if (queryStart === -1) {
		return '';
	}
	return str.slice(queryStart + 1);
};

exports.parse = function (str, opts) {
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
};

exports.stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort().map(function (key) {
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


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = function (str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
	});
};


/***/ }),
/* 40 */
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
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _send = __webpack_require__(18);

var _send2 = _interopRequireDefault(_send);

var _input = __webpack_require__(19);

var _input2 = _interopRequireDefault(_input);

var _bot_avatar = __webpack_require__(10);

var _bot_avatar2 = _interopRequireDefault(_bot_avatar);

var _style = __webpack_require__(48);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEFAULT_NAME = 'Bot';
var DEFAULT_WELCOME_MESSAGE = 'Hello!\n  Curious about our offer?\n  It will be a pleasure to help you getting started.\n';

var Convo = function (_React$Component) {
  _inherits(Convo, _React$Component);

  function Convo(props) {
    _classCallCheck(this, Convo);

    var _this = _possibleConstructorReturn(this, (Convo.__proto__ || Object.getPrototypeOf(Convo)).call(this, props));

    _this.state = {
      text: ''
    };
    return _this;
  }

  _createClass(Convo, [{
    key: 'handleTextChanged',
    value: function handleTextChanged(event) {
      this.setState({
        text: event.target.value
      });
    }
  }, {
    key: 'renderSendButton',
    value: function renderSendButton() {
      return _react2.default.createElement(
        'span',
        null,
        _react2.default.createElement(
          'div',
          { className: _style2.default['enter-prompt'] },
          _react2.default.createElement(
            'a',
            null,
            _react2.default.createElement(
              'i',
              { 'class': 'flex' },
              _react2.default.createElement(
                'svg',
                { width: '13', height: '13', viewBox: '0 0 13 13', xmlns: 'http://www.w3.org/2000/svg' },
                _react2.default.createElement('path', {
                  d: 'M12.975.38c.014.043.02.087.024.132v.06c-.004.048-.014.095-.03.14-.006.017-.007.032-.014.046L7.252 12.692c-.09.19-.28.308-.49.308-.216-.002-.406-.127-.493-.32l-.537-3.41C5.56 8.18 4.55 7.1 3.478 6.86l-3.2-.72c-.18-.1-.287-.293-.277-.5.012-.206.138-.39.328-.47L12.248.04 12.3.026c.05-.015.098-.025.148-.026.02 0 .038 0 .058.003.046.004.09.013.132.028l.055.02c.056.027.11.06.154.107.053.053.085.11.11.168.008.018.013.036.018.055z',
                  fillRule: 'evenodd'
                })
              )
            ),
            _react2.default.createElement(
              'span',
              null,
              'Send Message'
            )
          )
        )
      );
    }
  }, {
    key: 'renderPromoElement',
    value: function renderPromoElement() {
      var platform = 'Botpress';
      var link = 'https://botpress.io';

      return _react2.default.createElement(
        'span',
        null,
        _react2.default.createElement(
          'div',
          { className: _style2.default['flex-minimal'] },
          _react2.default.createElement(
            'div',
            { className: _style2.default.element },
            _react2.default.createElement(
              'span',
              null,
              "We're ",
              _react2.default.createElement(
                'i',
                null,
                _react2.default.createElement(
                  'svg',
                  { width: '7', height: '13', viewBox: '0 0 7 13', xmlns: 'http://www.w3.org/2000/svg' },
                  _react2.default.createElement(
                    'g',
                    { fill: 'none', fillRule: 'evenodd' },
                    _react2.default.createElement('path', {
                      d: 'M4.127.496C4.51-.12 5.37.356 5.16 1.07L3.89 5.14H6.22c.483 0 .757.616.464 1.044l-4.338 6.34c-.407.595-1.244.082-1.01-.618L2.72 7.656H.778c-.47 0-.748-.59-.48-1.02L4.13.495z',
                      fill: '#F6A623'
                    }),
                    _react2.default.createElement('path', { fill: '#FEF79E', d: 'M4.606.867L.778 7.007h2.807l-1.7 5.126 4.337-6.34H3.16' })
                  )
                )
              ),
              ' by ',
              _react2.default.createElement(
                'a',
                { href: link, target: '_blank' },
                platform
              )
            )
          )
        )
      );
    }
  }, {
    key: 'renderName',
    value: function renderName() {
      var name = this.props.config.botName || DEFAULT_NAME;

      return _react2.default.createElement(
        'div',
        {
          className: _style2.default.name,
          style: {
            color: this.props.config.textColorOnForeground
          }
        },
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'span',
            null,
            name
          )
        )
      );
    }
  }, {
    key: 'renderAvatar',
    value: function renderAvatar() {
      var content = _react2.default.createElement(_bot_avatar2.default, { foregroundColor: this.props.config.foregroundColor });

      if (this.props.config.botAvatarUrl) {
        content = _react2.default.createElement('div', { className: _style2.default.picture, style: { backgroundImage: 'url(' + this.props.config.botAvatarUrl + ')' } });
      }

      return _react2.default.createElement(
        'div',
        { className: _style2.default.avatar },
        _react2.default.createElement(
          'div',
          { className: _style2.default.square },
          _react2.default.createElement(
            'div',
            {
              className: _style2.default.circle,
              style: {
                borderColor: this.props.config.foregroundColor,
                color: this.props.config.foregroundColor
              }
            },
            content
          )
        )
      );
    }
  }, {
    key: 'renderWelcomeMessage',
    value: function renderWelcomeMessage() {
      var message = this.props.config.welcomeMsgText || DEFAULT_WELCOME_MESSAGE;

      return _react2.default.createElement(
        'div',
        { className: _style2.default.paragraph },
        message
      );
    }
  }, {
    key: 'renderHeader',
    value: function renderHeader() {
      return _react2.default.createElement(
        'div',
        {
          className: _style2.default.header,
          style: {
            color: this.props.config.textColorOnForeground,
            backgroundColor: this.props.config.foregroundColor
          }
        },
        _react2.default.createElement(
          'div',
          { className: _style2.default.line },
          _react2.default.createElement(
            'div',
            { className: _style2.default.title },
            this.renderAvatar(),
            this.renderName()
          )
        ),
        _react2.default.createElement(
          'div',
          { className: _style2.default.text },
          this.renderWelcomeMessage()
        )
      );
    }
  }, {
    key: 'renderComposer',
    value: function renderComposer() {
      return _react2.default.createElement(
        'div',
        { className: (0, _classnames2.default)(_style2.default.composer) },
        _react2.default.createElement(
          'div',
          { className: _style2.default['flex-column'] },
          _react2.default.createElement(_input2.default, {
            send: this.props.send,
            change: this.props.change,
            placeholder: 'Type your message...',
            text: this.props.text,
            config: this.props.config
          }),
          _react2.default.createElement(
            'div',
            { className: _style2.default.bottom },
            _react2.default.createElement(_send2.default, { text: this.props.text, send: this.props.send, config: this.props.config })
          )
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var classNames = (0, _classnames2.default)(_style2.default.internal, _style2.default[this.props.transition]);
      return _react2.default.createElement(
        'div',
        { className: _style2.default.external },
        _react2.default.createElement(
          'div',
          {
            className: classNames,
            style: {
              color: this.props.config.textColorOnBackground,
              backgroundColor: this.props.config.backgroundColor
            }
          },
          this.renderHeader(),
          this.renderComposer()
        )
      );
    }
  }]);

  return Convo;
}(_react2.default.Component);

exports.default = Convo;

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(43);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__footer___36Ycj {\n  -webkit-box-flex: 1;\n  -ms-flex: 1;\n  flex: 1;\n  position: relative;\n  height: 20px;\n  font-size: 12px;\n  color: #9a9a9a; }\n  .-botpress-channel-web__style__footer___36Ycj span .-botpress-channel-web__style__flex-minimal___2d_b3 {\n    height: 20px;\n    position: relative;\n    -webkit-box-pack: end;\n    -ms-flex-pack: end;\n    justify-content: flex-end;\n    display: flex; }\n    .-botpress-channel-web__style__footer___36Ycj span .-botpress-channel-web__style__flex-minimal___2d_b3 .-botpress-channel-web__style__element___cUAaK {\n      display: flex;\n      align-items: center; }\n      .-botpress-channel-web__style__footer___36Ycj span .-botpress-channel-web__style__flex-minimal___2d_b3 .-botpress-channel-web__style__element___cUAaK span i {\n        vertical-align: middle;\n        display: inline;\n        margin: -3px 2px;\n        font-style: italic;\n        text-align: center;\n        padding: 0; }\n      .-botpress-channel-web__style__footer___36Ycj span .-botpress-channel-web__style__flex-minimal___2d_b3 .-botpress-channel-web__style__element___cUAaK span a {\n        font-weight: 500;\n        cursor: pointer;\n        text-decoration: none; }\n  .-botpress-channel-web__style__footer___36Ycj .-botpress-channel-web__style__enter-prompt___2A1iw {\n    position: absolute;\n    top: 0;\n    right: 0;\n    height: 20px; }\n    .-botpress-channel-web__style__footer___36Ycj .-botpress-channel-web__style__enter-prompt___2A1iw a {\n      display: flex;\n      font-weight: 500;\n      font-size: 14px;\n      cursor: pointer;\n      text-decoration: none; }\n      .-botpress-channel-web__style__footer___36Ycj .-botpress-channel-web__style__enter-prompt___2A1iw a i {\n        vertical-align: middle;\n        display: inline;\n        margin: 2px 6px;\n        text-align: center;\n        padding: 0; }\n        .-botpress-channel-web__style__footer___36Ycj .-botpress-channel-web__style__enter-prompt___2A1iw a i svg {\n          fill: currentColor; }\n", ""]);

// exports
exports.locals = {
	"footer": "-botpress-channel-web__style__footer___36Ycj",
	"flex-minimal": "-botpress-channel-web__style__flex-minimal___2d_b3",
	"element": "-botpress-channel-web__style__element___cUAaK",
	"enter-prompt": "-botpress-channel-web__style__enter-prompt___2A1iw"
};

/***/ }),
/* 44 */
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
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
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
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(46);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__input___3yaCn {\n  outline: none; }\n  .-botpress-channel-web__style__input___3yaCn textarea {\n    font: inherit;\n    background-color: transparent;\n    min-height: 32px;\n    max-height: 96px;\n    margin-bottom: 0;\n    font-size: 14px;\n    padding: 8px;\n    width: 100%;\n    border: none;\n    resize: none;\n    line-height: 1.2; }\n", ""]);

// exports
exports.locals = {
	"input": "-botpress-channel-web__style__input___3yaCn"
};

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports
exports.push([module.i, "@import url(https://fonts.googleapis.com/css?family=Lato);", ""]);

// module
exports.push([module.i, "body {\n  margin: 0 !important;\n  font-family: 'Lato', sans-serif;\n  overflow: hidden; }\n\n.-botpress-channel-web__style__defaultAvatar___15FYz {\n  background-image: url(\"/api/botpress-platform-webchat/static/avatar_default.png\");\n  background-size: 80%;\n  background-repeat: no-repeat;\n  width: 30px;\n  height: 30px; }\n\n.-botpress-channel-web__style__web___KyLc_ button {\n  float: right;\n  fill: white;\n  cursor: pointer;\n  outline: none;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 1;\n  width: 52px;\n  height: 52px;\n  cursor: pointer;\n  border-radius: 0px;\n  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.4);\n  overflow: hidden;\n  padding: 0;\n  border: none;\n  background-clip: padding-box;\n  transition: width 1s, height 1s; }\n  .-botpress-channel-web__style__web___KyLc_ button i {\n    transition: opacity 0.3s ease;\n    opacity: 1;\n    fill: inherit;\n    stroke: inherit;\n    width: 100%;\n    padding: 0;\n    line-height: 0; }\n  .-botpress-channel-web__style__web___KyLc_ button .-botpress-channel-web__style__unread___23aWv {\n    display: block;\n    position: absolute;\n    right: 2px;\n    bottom: 54px;\n    width: 20px !important;\n    height: 20px !important;\n    border-radius: 50%;\n    line-height: 20px;\n    color: #fff;\n    background-color: #ff5d5d;\n    box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.4); }\n\n.-botpress-channel-web__style__container___LtHgy {\n  overflow: hidden; }\n  .-botpress-channel-web__style__container___LtHgy .-botpress-channel-web__style__widget-container___3GITr {\n    display: flex;\n    justify-content: flex-end;\n    align-items: flex-end;\n    padding: 12px 12px 12px 16px;\n    flex-direction: column; }\n    .-botpress-channel-web__style__container___LtHgy .-botpress-channel-web__style__widget-container___3GITr * {\n      box-sizing: border-box;\n      outline: none; }\n    .-botpress-channel-web__style__container___LtHgy .-botpress-channel-web__style__widget-container___3GITr span {\n      flex: 1 0 auto;\n      width: 100%; }\n\n.-botpress-channel-web__style__fadeIn___2KKLx {\n  -webkit-animation-name: -botpress-channel-web__style__zoomIn___3fpS3;\n  animation-name: -botpress-channel-web__style__zoomIn___3fpS3;\n  -webkit-animation-duration: 0.3s;\n  animation-duration: 0.3s;\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both; }\n\n@-webkit-keyframes -botpress-channel-web__style__zoomIn___3fpS3 {\n  0% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  50% {\n    opacity: 1; } }\n\n@keyframes -botpress-channel-web__style__zoomIn___3fpS3 {\n  0% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  50% {\n    opacity: 1; } }\n\n.-botpress-channel-web__style__fadeOut___HgrS8 {\n  -webkit-animation-name: -botpress-channel-web__style__zoomOut___2YZKl;\n  animation-name: -botpress-channel-web__style__zoomOut___2YZKl;\n  -webkit-animation-duration: 0.3s;\n  animation-duration: 0.3s;\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both; }\n\n@-webkit-keyframes -botpress-channel-web__style__zoomOut___2YZKl {\n  0% {\n    opacity: 1; }\n  50% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  100% {\n    opacity: 0; } }\n\n@keyframes -botpress-channel-web__style__zoomOut___2YZKl {\n  0% {\n    opacity: 1; }\n  50% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  100% {\n    opacity: 0; } }\n", ""]);

// exports
exports.locals = {
	"defaultAvatar": "-botpress-channel-web__style__defaultAvatar___15FYz",
	"web": "-botpress-channel-web__style__web___KyLc_",
	"unread": "-botpress-channel-web__style__unread___23aWv",
	"container": "-botpress-channel-web__style__container___LtHgy",
	"widget-container": "-botpress-channel-web__style__widget-container___3GITr",
	"fadeIn": "-botpress-channel-web__style__fadeIn___2KKLx",
	"zoomIn": "-botpress-channel-web__style__zoomIn___3fpS3",
	"fadeOut": "-botpress-channel-web__style__fadeOut___HgrS8",
	"zoomOut": "-botpress-channel-web__style__zoomOut___2YZKl"
};

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(49);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__external___2svzf {\n  -webkit-box-flex: 1;\n  -ms-flex: 1 0 auto;\n  flex: 1 0 auto;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -ms-flex-direction: column;\n  flex-direction: column;\n  margin: 32px 0 16px 16px;\n  position: relative;\n  height: 100%; }\n  .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy {\n    -webkit-box-flex: 1;\n    -ms-flex: 1 0 auto;\n    flex: 1 0 auto;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-orient: vertical;\n    -webkit-box-direction: normal;\n    -ms-flex-direction: column;\n    flex-direction: column;\n    box-shadow: 0 4px 23px 0 rgba(0, 0, 0, 0.09);\n    border-radius: 5px; }\n    .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr {\n      -webkit-box-flex: 1;\n      -ms-flex: 1 0 auto;\n      flex: 1 0 auto;\n      border-top-left-radius: inherit;\n      border-top-right-radius: inherit; }\n      .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj {\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex;\n        -webkit-box-pack: justify;\n        -ms-flex-pack: justify;\n        justify-content: space-between;\n        -webkit-box-align: center;\n        -ms-flex-align: center;\n        align-items: center;\n        font-weight: 500;\n        margin-bottom: 20px;\n        margin-top: 12px;\n        padding-left: 18px;\n        padding-right: 18px; }\n        .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y {\n          display: -webkit-box;\n          display: -ms-flexbox;\n          display: flex;\n          -webkit-box-flex: 1;\n          -ms-flex: 1 1 auto;\n          flex: 1 1 auto;\n          -webkit-box-align: center;\n          -ms-flex-align: center;\n          align-items: center;\n          font-size: 18px; }\n          .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__avatar___1HWW- {\n            display: -webkit-box;\n            display: -ms-flexbox;\n            display: flex;\n            -webkit-box-orient: horizontal;\n            -webkit-box-direction: reverse;\n            -ms-flex-direction: row-reverse;\n            flex-direction: row-reverse;\n            -webkit-box-align: end;\n            -ms-flex-align: end;\n            align-items: flex-end;\n            height: 1.4em; }\n            .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__avatar___1HWW- .-botpress-channel-web__style__square___3VkAO {\n              -webkit-transform: translate(-10px, 12px);\n              transform: translate(-10px, 12px);\n              margin-right: 4px;\n              position: relative;\n              width: 70px;\n              height: 70px; }\n              .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__avatar___1HWW- .-botpress-channel-web__style__square___3VkAO .-botpress-channel-web__style__circle___aL8KF {\n                position: absolute;\n                top: 0;\n                right: 0;\n                bottom: 0;\n                left: 0;\n                width: auto;\n                height: auto;\n                border-width: 2px;\n                border-style: solid;\n                border-radius: 50%;\n                background-color: #f8f8f8;\n                -ms-flex-negative: 0;\n                flex-shrink: 0; }\n                .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__avatar___1HWW- .-botpress-channel-web__style__square___3VkAO .-botpress-channel-web__style__circle___aL8KF .-botpress-channel-web__style__picture___2ccuR {\n                  border-radius: 4px;\n                  background-size: cover;\n                  background-position: 50%;\n                  width: 100%;\n                  height: 100%; }\n          .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__name___2LQ8g {\n            font-weight: 500; }\n            .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__line___3vtgj .-botpress-channel-web__style__title___2Fr-Y .-botpress-channel-web__style__name___2LQ8g span {\n              color: inherit;\n              opacity: 0.8; }\n      .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__text___12-Rd {\n        font-size: 14px;\n        font-weight: 400;\n        min-height: 50px;\n        max-height: 150px;\n        overflow-x: hidden;\n        overflow-y: auto;\n        word-break: break-word;\n        white-space: pre-line;\n        -webkit-overflow-scrolling: touch;\n        line-height: 30px;\n        margin-top: 4px;\n        margin-bottom: 0;\n        padding-bottom: 12px;\n        padding-left: 18px;\n        padding-right: 18px; }\n        .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__text___12-Rd .-botpress-channel-web__style__paragraph___32PaH {\n          font-weight: 300;\n          font-size: 15px;\n          word-break: break-word;\n          white-space: pre-line; }\n          .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__header___364rr .-botpress-channel-web__style__text___12-Rd .-botpress-channel-web__style__paragraph___32PaH p {\n            margin: 0;\n            display: block; }\n    .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__composer___32VI5 {\n      position: relative;\n      padding: 8px;\n      border-bottom-left-radius: inherit;\n      border-bottom-right-radius: inherit; }\n      .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__composer___32VI5 .-botpress-channel-web__style__flex-column___1yGN9 {\n        -webkit-box-orient: vertical;\n        -webkit-box-direction: normal;\n        -ms-flex-direction: column;\n        flex-direction: column;\n        display: flex; }\n        .-botpress-channel-web__style__external___2svzf .-botpress-channel-web__style__internal___2EJRy .-botpress-channel-web__style__composer___32VI5 .-botpress-channel-web__style__flex-column___1yGN9 .-botpress-channel-web__style__bottom___2tqon {\n          padding: 0 8px;\n          display: flex;\n          padding: 0 16px 12px;\n          justify-content: space-between;\n          -webkit-box-align: center; }\n\n.-botpress-channel-web__style__fadeIn___17jV- {\n  -webkit-animation-name: -botpress-channel-web__style__zoomIn___1zhjI;\n  animation-name: -botpress-channel-web__style__zoomIn___1zhjI;\n  -webkit-animation-duration: 0.3s;\n  animation-duration: 0.3s;\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both; }\n\n@-webkit-keyframes -botpress-channel-web__style__zoomIn___1zhjI {\n  0% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  50% {\n    opacity: 1; } }\n\n@keyframes -botpress-channel-web__style__zoomIn___1zhjI {\n  0% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  50% {\n    opacity: 1; } }\n\n.-botpress-channel-web__style__fadeOut___3_apF {\n  -webkit-animation-name: -botpress-channel-web__style__zoomOut___3vGfo;\n  animation-name: -botpress-channel-web__style__zoomOut___3vGfo;\n  -webkit-animation-duration: 0.3s;\n  animation-duration: 0.3s;\n  -webkit-animation-fill-mode: both;\n  animation-fill-mode: both; }\n\n@-webkit-keyframes -botpress-channel-web__style__zoomOut___3vGfo {\n  0% {\n    opacity: 1; }\n  50% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  100% {\n    opacity: 0; } }\n\n@keyframes -botpress-channel-web__style__zoomOut___3vGfo {\n  0% {\n    opacity: 1; }\n  50% {\n    opacity: 0;\n    -webkit-transform: scale3d(0.3, 0.3, 0.3);\n    transform: scale3d(0.3, 0.3, 0.3); }\n  100% {\n    opacity: 0; } }\n", ""]);

// exports
exports.locals = {
	"external": "-botpress-channel-web__style__external___2svzf",
	"internal": "-botpress-channel-web__style__internal___2EJRy",
	"header": "-botpress-channel-web__style__header___364rr",
	"line": "-botpress-channel-web__style__line___3vtgj",
	"title": "-botpress-channel-web__style__title___2Fr-Y",
	"avatar": "-botpress-channel-web__style__avatar___1HWW-",
	"square": "-botpress-channel-web__style__square___3VkAO",
	"circle": "-botpress-channel-web__style__circle___aL8KF",
	"picture": "-botpress-channel-web__style__picture___2ccuR",
	"name": "-botpress-channel-web__style__name___2LQ8g",
	"text": "-botpress-channel-web__style__text___12-Rd",
	"paragraph": "-botpress-channel-web__style__paragraph___32PaH",
	"composer": "-botpress-channel-web__style__composer___32VI5",
	"flex-column": "-botpress-channel-web__style__flex-column___1yGN9",
	"bottom": "-botpress-channel-web__style__bottom___2tqon",
	"fadeIn": "-botpress-channel-web__style__fadeIn___17jV-",
	"zoomIn": "-botpress-channel-web__style__zoomIn___1zhjI",
	"fadeOut": "-botpress-channel-web__style__fadeOut___3_apF",
	"zoomOut": "-botpress-channel-web__style__zoomOut___3vGfo"
};

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _distance_in_words_to_now = __webpack_require__(51);

var _distance_in_words_to_now2 = _interopRequireDefault(_distance_in_words_to_now);

var _send = __webpack_require__(18);

var _send2 = _interopRequireDefault(_send);

var _messages = __webpack_require__(61);

var _messages2 = _interopRequireDefault(_messages);

var _input = __webpack_require__(19);

var _input2 = _interopRequireDefault(_input);

var _bot_avatar = __webpack_require__(10);

var _bot_avatar2 = _interopRequireDefault(_bot_avatar);

var _style = __webpack_require__(119);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
// import { Picker } from 'emoji-mart'

// require('emoji-mart/css/emoji-mart.css')

var Side = function (_React$Component) {
  _inherits(Side, _React$Component);

  function Side(props) {
    _classCallCheck(this, Side);

    var _this = _possibleConstructorReturn(this, (Side.__proto__ || Object.getPrototypeOf(Side)).call(this, props));

    _this.state = {
      focused: false,
      showEmoji: false,
      showConvos: false
    };
    return _this;
  }

  _createClass(Side, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (!this.props.currentConversation && nextProps.currentConversation) {
        this.setState({ showConvos: false });
      }
    }
  }, {
    key: 'handleFocus',
    value: function handleFocus(value) {
      this.setState({
        focused: value
      });
    }
  }, {
    key: 'handleEmojiClicked',
    value: function handleEmojiClicked() {
      this.setState({
        showEmoji: !this.state.showEmoji
      });
    }
  }, {
    key: 'handleToggleShowConvos',
    value: function handleToggleShowConvos() {
      this.setState({
        showConvos: !this.state.showConvos
      });
    }
  }, {
    key: 'renderAvatar',
    value: function renderAvatar() {
      var content = _react2.default.createElement(_bot_avatar2.default, { foregroundColor: this.props.config.foregroundColor });

      if (this.props.config && this.props.config.botAvatarUrl) {
        content = _react2.default.createElement('div', { className: _style2.default.picture, style: { backgroundImage: 'url(' + this.props.config.botAvatarUrl + ')' } });
      }

      return _react2.default.createElement(
        'div',
        { className: _style2.default.avatar, style: { color: this.props.config.foregroundColor } },
        content
      );
    }
  }, {
    key: 'renderUnreadCount',
    value: function renderUnreadCount() {
      return _react2.default.createElement(
        'span',
        { className: _style2.default.unread },
        this.props.unreadCount
      );
    }
  }, {
    key: 'renderTitle',
    value: function renderTitle() {
      var title = this.props.currentConversation && !this.state.showConvos ? this.props.config.botConvoTitle : 'Conversations';

      var description = this.props.config.botConvoDescription;
      var hasDescription = description && description.length > 0;

      return _react2.default.createElement(
        'div',
        { className: _style2.default.title },
        _react2.default.createElement(
          'div',
          { className: _style2.default.name },
          title,
          this.props.unreadCount > 0 ? this.renderUnreadCount() : null
        ),
        hasDescription && _react2.default.createElement(
          'div',
          { className: _style2.default.status },
          description
        )
      );
    }
  }, {
    key: 'renderConvoButton',
    value: function renderConvoButton() {
      return _react2.default.createElement(
        'span',
        { className: _style2.default.icon },
        _react2.default.createElement(
          'i',
          { onClick: this.handleToggleShowConvos.bind(this) },
          _react2.default.createElement(
            'svg',
            { width: '24', height: '17', viewBox: '0 0 489 489', xmlns: 'http://www.w3.org/2000/svg' },
            _react2.default.createElement(
              'g',
              { xmlns: 'http://www.w3.org/2000/svg' },
              _react2.default.createElement('path', { d: 'M52.7,134.75c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.8-52.7-52.8S0,52.95,0,81.95S23.7,134.75,52.7,134.75z M52.7,53.75    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2S37.2,53.75,52.7,53.75z' }),
              _react2.default.createElement('path', { d: 'M52.7,297.55c29.1,0,52.7-23.7,52.7-52.7s-23.6-52.7-52.7-52.7S0,215.75,0,244.85S23.7,297.55,52.7,297.55z M52.7,216.65    c15.6,0,28.2,12.7,28.2,28.2s-12.7,28.2-28.2,28.2s-28.2-12.6-28.2-28.2S37.2,216.65,52.7,216.65z' }),
              _react2.default.createElement('path', { d: 'M52.7,460.45c29.1,0,52.7-23.7,52.7-52.7c0-29.1-23.7-52.7-52.7-52.7S0,378.75,0,407.75C0,436.75,23.7,460.45,52.7,460.45    z M52.7,379.45c15.6,0,28.2,12.7,28.2,28.2c0,15.6-12.7,28.2-28.2,28.2s-28.2-12.7-28.2-28.2C24.5,392.15,37.2,379.45,52.7,379.45    z' }),
              _react2.default.createElement('path', { d: 'M175.9,94.25h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,94.25,175.9,94.25z' }),
              _react2.default.createElement('path', { d: 'M175.9,257.15h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,257.15,175.9,257.15z' }),
              _react2.default.createElement('path', { d: 'M175.9,419.95h301.5c6.8,0,12.3-5.5,12.3-12.3s-5.5-12.3-12.3-12.3H175.9c-6.8,0-12.3,5.5-12.3,12.3    S169.1,419.95,175.9,419.95z' })
            )
          )
        )
      );
    }
  }, {
    key: 'renderCloseButton',
    value: function renderCloseButton() {
      if (!this.props.onClose) {
        return null;
      }

      return _react2.default.createElement(
        'span',
        { className: _style2.default.icon },
        _react2.default.createElement(
          'i',
          { onClick: this.props.onClose },
          _react2.default.createElement(
            'svg',
            { width: '17', height: '17', viewBox: '0 0 95 95', xmlns: 'http://www.w3.org/2000/svg' },
            _react2.default.createElement(
              'g',
              null,
              _react2.default.createElement('path', {
                xmlns: 'http://www.w3.org/2000/svg',
                d: 'M62.819,47.97l32.533-32.534c0.781-0.781,0.781-2.047,0-2.828L83.333,0.586C82.958,0.211,82.448,0,81.919,0   c-0.53,0-1.039,0.211-1.414,0.586L47.97,33.121L15.435,0.586c-0.75-0.75-2.078-0.75-2.828,0L0.587,12.608   c-0.781,0.781-0.781,2.047,0,2.828L33.121,47.97L0.587,80.504c-0.781,0.781-0.781,2.047,0,2.828l12.02,12.021   c0.375,0.375,0.884,0.586,1.414,0.586c0.53,0,1.039-0.211,1.414-0.586L47.97,62.818l32.535,32.535   c0.375,0.375,0.884,0.586,1.414,0.586c0.529,0,1.039-0.211,1.414-0.586l12.02-12.021c0.781-0.781,0.781-2.048,0-2.828L62.819,47.97   z'
              })
            )
          )
        )
      );
    }
  }, {
    key: 'renderResetButton',
    value: function renderResetButton() {
      if (!this.props.config.enableReset) {
        return null;
      }

      return _react2.default.createElement(
        'span',
        { className: _style2.default.icon },
        _react2.default.createElement(
          'i',
          { onClick: this.props.onResetSession },
          _react2.default.createElement(
            'svg',
            { width: '17', height: '17', viewBox: '0 0 512 512', xmlns: 'http://www.w3.org/2000/svg' },
            _react2.default.createElement(
              'g',
              null,
              _react2.default.createElement('path', {
                xmlns: 'http://www.w3.org/2000/svg',
                d: 'M288.502,32.502c-108.328,0-198.827,77.485-219.166,179.899l-42.482-53.107L0,180.784l68.769,85.961    c3.352,4.178,8.338,6.447,13.427,6.447c2.596,0,5.226-0.585,7.685-1.805l103.153-51.577l-15.387-30.757l-75.8,37.892    c14.063-90.5,92.27-160.059,186.655-160.059c104.271,0,189.114,84.843,189.114,189.114s-84.843,189.114-189.114,189.114v34.384    C411.735,479.498,512,379.233,512,256S411.735,32.502,288.502,32.502z'
              })
            )
          )
        )
      );
    }
  }, {
    key: 'renderHeader',
    value: function renderHeader() {
      var status = _react2.default.createElement(
        'div',
        { className: _style2.default.status },
        _react2.default.createElement(
          'svg',
          { viewBox: '0 0 10 10' },
          _react2.default.createElement('ellipse', { cx: '50%', cy: '50%', rx: '50%', ry: '50%' })
        ),
        _react2.default.createElement(
          'span',
          null,
          'always online'
        )
      );

      return _react2.default.createElement(
        'div',
        { className: _style2.default.header },
        _react2.default.createElement(
          'div',
          { className: _style2.default.left },
          _react2.default.createElement(
            'div',
            { className: _style2.default.line },
            this.renderAvatar(),
            this.renderTitle()
          )
        ),
        this.renderResetButton(),
        this.renderConvoButton(),
        this.renderCloseButton()
      );
    }
  }, {
    key: 'renderAttachmentButton',
    value: function renderAttachmentButton() {
      return null; // Temporary removed this feature (not implemented yet)

      return _react2.default.createElement(
        'li',
        null,
        _react2.default.createElement(
          'a',
          null,
          _react2.default.createElement(
            'i',
            null,
            _react2.default.createElement(
              'svg',
              { width: '18', height: '17', viewBox: '0 0 18 17', xmlns: 'http://www.w3.org/2000/svg' },
              _react2.default.createElement('path', {
                d: 'M8.455 16.5c-.19 0-.378-.076-.522-.226-.29-.303-.29-.792 0-1.093l7.66-8.013c.57-.597.885-1.392.885-2.236 0-.844-.315-1.638-.886-2.235-1.18-1.233-3.097-1.232-4.275 0L2.433 11.99c-.5.525-.742 1.03-.715 1.502.026.46.303.815.467.985.275.29.573.41.908.364.42-.054.903-.356 1.398-.874l6.973-7.295c.288-.3.755-.3 1.043 0 .29.303.29.793 0 1.093l-6.97 7.296c-.74.773-1.5 1.215-2.26 1.314-.797.104-1.535-.175-2.135-.804-.537-.562-.856-1.267-.896-1.985-.054-.933.332-1.836 1.144-2.686l8.885-9.297c1.754-1.836 4.61-1.836 6.363 0 .85.888 1.318 2.07 1.318 3.328s-.468 2.44-1.318 3.33l-7.66 8.014c-.143.15-.332.226-.52.226z',
                'fill-rule': 'evenodd'
              })
            )
          )
        )
      );
    }
  }, {
    key: 'renderEmojiButton',
    value: function renderEmojiButton() {
      return null; // Temporary removed this feature (emoji-mart lib is too big)

      return _react2.default.createElement(
        'li',
        null,
        _react2.default.createElement(
          'a',
          null,
          _react2.default.createElement(
            'i',
            { onClick: this.handleEmojiClicked.bind(this) },
            _react2.default.createElement(
              'svg',
              { preserveAspectRatio: 'xMidYMid', width: '18', height: '18', viewBox: '0 0 24 24' },
              _react2.default.createElement('path', { d: 'M12 24C5.38 24 0 18.62 0 12S5.38 0 12 0s12 5.38 12 12-5.38 12-12 12zm0-22C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-2.9 0-5.56-1.75-6.9-4.57-.24-.5-.03-1.1.47-1.33.5-.24 1.1-.03 1.33.47C7.9 16.67 9.86 18 12 18c2.15 0 4.1-1.3 5.1-3.43.23-.5.83-.7 1.33-.47.5.23.7.83.47 1.33C17.58 18.25 14.93 20 12 20zm4-8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-8 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' })
            )
          )
        )
      );
    }
  }, {
    key: 'renderComposer',
    value: function renderComposer() {
      var name = this.props.config.botName || 'Bot';

      return _react2.default.createElement(
        'div',
        {
          className: _style2.default.composer,
          style: {
            borderColor: this.state.focused ? this.props.config.foregroundColor : null
          }
        },
        _react2.default.createElement(
          'div',
          { className: _style2.default['flex-column'] },
          _react2.default.createElement(_input2.default, {
            placeholder: 'Reply to ' + name,
            send: this.props.onTextSend,
            change: this.props.onTextChanged,
            text: this.props.text,
            focused: this.handleFocus.bind(this),
            config: this.props.config
          }),
          _react2.default.createElement(
            'div',
            { className: _style2.default.line },
            _react2.default.createElement(
              'ul',
              { className: _style2.default.elements },
              this.renderAttachmentButton(),
              this.renderEmojiButton()
            ),
            _react2.default.createElement(_send2.default, { send: this.props.onTextSend, text: this.props.text, config: this.props.config })
          ),
          this.renderEmojiPicker()
        )
      );
    }
  }, {
    key: 'renderEmojiPicker',
    value: function renderEmojiPicker() {
      if (!this.state.showEmoji) {
        return null;
      }

      return null; // Temporary removed this feature (emoji-mart is too big)

      // return <div className={style.emoji}>
      //     <div className={style.inside}>
      //       <Picker
      //         onClick={this.props.addEmojiToText}
      //         set='emojione'
      //         emojiSize={18}
      //         perLine={10}
      //         color={this.props.config.foregroundColor}/>
      //     </div>
      //   </div>
    }
  }, {
    key: 'renderConversation',
    value: function renderConversation() {
      var messagesProps = {
        typingUntil: this.props.currentConversation && this.props.currentConversation.typingUntil,
        messages: this.props.currentConversation && this.props.currentConversation.messages,
        fgColor: this.props.config && this.props.config.foregroundColor,
        textColor: this.props.config && this.props.config.textColorOnForeground,
        avatarUrl: this.props.config && this.props.config.botAvatarUrl,
        onQuickReplySend: this.props.onQuickReplySend,
        onFormSend: this.props.onFormSend,
        onFileUploadSend: this.props.onFileUploadSend,
        onLoginPromptSend: this.props.onLoginPromptSend,
        onSendData: this.props.onSendData
      };

      return _react2.default.createElement(
        'div',
        { className: _style2.default.conversation },
        _react2.default.createElement(_messages2.default, messagesProps),
        _react2.default.createElement(
          'div',
          { className: _style2.default.bottom },
          this.renderComposer()
        )
      );
    }
  }, {
    key: 'renderItemConvos',
    value: function renderItemConvos(convo, key) {
      var _this2 = this;

      var title = convo.title || convo.message_author || 'Untitled Conversation';
      var date = (0, _distance_in_words_to_now2.default)(new Date(convo.message_sent_on || convo.created_on));
      var message = convo.message_text || '...';

      var onClick = function onClick() {
        _this2.props.onSwitchConvo && _this2.props.onSwitchConvo(convo.id);

        _this2.setState({
          showConvos: false
        });
      };

      return _react2.default.createElement(
        'div',
        { className: _style2.default.item, key: key, onClick: onClick },
        _react2.default.createElement(
          'div',
          { className: _style2.default.left },
          this.renderAvatar()
        ),
        _react2.default.createElement(
          'div',
          { className: _style2.default.right },
          _react2.default.createElement(
            'div',
            { className: _style2.default.title },
            _react2.default.createElement(
              'div',
              { className: _style2.default.name },
              title
            ),
            _react2.default.createElement(
              'div',
              { className: _style2.default.date },
              _react2.default.createElement(
                'span',
                null,
                date
              )
            )
          ),
          _react2.default.createElement(
            'div',
            { className: _style2.default.text },
            message
          )
        )
      );
    }
  }, {
    key: 'renderListOfConvos',
    value: function renderListOfConvos() {
      return _react2.default.createElement(
        'div',
        { className: _style2.default.list },
        this.props.conversations.map(this.renderItemConvos.bind(this))
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var fullscreen = this.props.fullscreen ? 'fullscreen' : null;
      var classNames = (0, _classnames2.default)(_style2.default.internal, _style2.default[fullscreen], _style2.default[this.props.transition]);

      return _react2.default.createElement(
        'span',
        { className: _style2.default.external },
        _react2.default.createElement(
          'div',
          {
            className: classNames,
            style: {
              backgroundColor: this.props.config.backgroundColor,
              color: this.props.config.textColorOnBackgound
            }
          },
          this.renderHeader(),
          this.state.showConvos ? this.renderListOfConvos() : this.renderConversation()
        )
      );
    }
  }]);

  return Side;
}(_react2.default.Component);

exports.default = Side;

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

var distanceInWords = __webpack_require__(52)

/**
 * @category Common Helpers
 * @summary Return the distance between the given date and now in words.
 *
 * @description
 * Return the distance between the given date and now in words.
 *
 * | Distance to now                                                   | Result              |
 * |-------------------------------------------------------------------|---------------------|
 * | 0 ... 30 secs                                                     | less than a minute  |
 * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
 * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
 * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
 * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
 * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
 * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
 * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
 * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
 * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
 * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
 * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
 * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
 * | N yrs ... N yrs 3 months                                          | about N years       |
 * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
 * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
 *
 * With `options.includeSeconds == true`:
 * | Distance to now     | Result               |
 * |---------------------|----------------------|
 * | 0 secs ... 5 secs   | less than 5 seconds  |
 * | 5 secs ... 10 secs  | less than 10 seconds |
 * | 10 secs ... 20 secs | less than 20 seconds |
 * | 20 secs ... 40 secs | half a minute        |
 * | 40 secs ... 60 secs | less than a minute   |
 * | 60 secs ... 90 secs | 1 minute             |
 *
 * @param {Date|String|Number} date - the given date
 * @param {Object} [options] - the object with options
 * @param {Boolean} [options.includeSeconds=false] - distances less than a minute are more detailed
 * @param {Boolean} [options.addSuffix=false] - result specifies if the second date is earlier or later than the first
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the distance in words
 *
 * @example
 * // If today is 1 January 2015, what is the distance to 2 July 2014?
 * var result = distanceInWordsToNow(
 *   new Date(2014, 6, 2)
 * )
 * //=> '6 months'
 *
 * @example
 * // If now is 1 January 2015 00:00:00,
 * // what is the distance to 1 January 2015 00:00:15, including seconds?
 * var result = distanceInWordsToNow(
 *   new Date(2015, 0, 1, 0, 0, 15),
 *   {includeSeconds: true}
 * )
 * //=> 'less than 20 seconds'
 *
 * @example
 * // If today is 1 January 2015,
 * // what is the distance to 1 January 2016, with a suffix?
 * var result = distanceInWordsToNow(
 *   new Date(2016, 0, 1),
 *   {addSuffix: true}
 * )
 * //=> 'in about 1 year'
 *
 * @example
 * // If today is 1 January 2015,
 * // what is the distance to 1 August 2016 in Esperanto?
 * var eoLocale = require('date-fns/locale/eo')
 * var result = distanceInWordsToNow(
 *   new Date(2016, 7, 1),
 *   {locale: eoLocale}
 * )
 * //=> 'pli ol 1 jaro'
 */
function distanceInWordsToNow (dirtyDate, dirtyOptions) {
  return distanceInWords(Date.now(), dirtyDate, dirtyOptions)
}

module.exports = distanceInWordsToNow


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

var compareDesc = __webpack_require__(53)
var parse = __webpack_require__(1)
var differenceInSeconds = __webpack_require__(54)
var differenceInMonths = __webpack_require__(55)
var enLocale = __webpack_require__(22)

var MINUTES_IN_DAY = 1440
var MINUTES_IN_ALMOST_TWO_DAYS = 2520
var MINUTES_IN_MONTH = 43200
var MINUTES_IN_TWO_MONTHS = 86400

/**
 * @category Common Helpers
 * @summary Return the distance between the given dates in words.
 *
 * @description
 * Return the distance between the given dates in words.
 *
 * | Distance between dates                                            | Result              |
 * |-------------------------------------------------------------------|---------------------|
 * | 0 ... 30 secs                                                     | less than a minute  |
 * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
 * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
 * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
 * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
 * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
 * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
 * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
 * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
 * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
 * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
 * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
 * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
 * | N yrs ... N yrs 3 months                                          | about N years       |
 * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
 * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
 *
 * With `options.includeSeconds == true`:
 * | Distance between dates | Result               |
 * |------------------------|----------------------|
 * | 0 secs ... 5 secs      | less than 5 seconds  |
 * | 5 secs ... 10 secs     | less than 10 seconds |
 * | 10 secs ... 20 secs    | less than 20 seconds |
 * | 20 secs ... 40 secs    | half a minute        |
 * | 40 secs ... 60 secs    | less than a minute   |
 * | 60 secs ... 90 secs    | 1 minute             |
 *
 * @param {Date|String|Number} dateToCompare - the date to compare with
 * @param {Date|String|Number} date - the other date
 * @param {Object} [options] - the object with options
 * @param {Boolean} [options.includeSeconds=false] - distances less than a minute are more detailed
 * @param {Boolean} [options.addSuffix=false] - result indicates if the second date is earlier or later than the first
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the distance in words
 *
 * @example
 * // What is the distance between 2 July 2014 and 1 January 2015?
 * var result = distanceInWords(
 *   new Date(2014, 6, 2),
 *   new Date(2015, 0, 1)
 * )
 * //=> '6 months'
 *
 * @example
 * // What is the distance between 1 January 2015 00:00:15
 * // and 1 January 2015 00:00:00, including seconds?
 * var result = distanceInWords(
 *   new Date(2015, 0, 1, 0, 0, 15),
 *   new Date(2015, 0, 1, 0, 0, 0),
 *   {includeSeconds: true}
 * )
 * //=> 'less than 20 seconds'
 *
 * @example
 * // What is the distance from 1 January 2016
 * // to 1 January 2015, with a suffix?
 * var result = distanceInWords(
 *   new Date(2016, 0, 1),
 *   new Date(2015, 0, 1),
 *   {addSuffix: true}
 * )
 * //=> 'about 1 year ago'
 *
 * @example
 * // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
 * var eoLocale = require('date-fns/locale/eo')
 * var result = distanceInWords(
 *   new Date(2016, 7, 1),
 *   new Date(2015, 0, 1),
 *   {locale: eoLocale}
 * )
 * //=> 'pli ol 1 jaro'
 */
function distanceInWords (dirtyDateToCompare, dirtyDate, dirtyOptions) {
  var options = dirtyOptions || {}

  var comparison = compareDesc(dirtyDateToCompare, dirtyDate)

  var locale = options.locale
  var localize = enLocale.distanceInWords.localize
  if (locale && locale.distanceInWords && locale.distanceInWords.localize) {
    localize = locale.distanceInWords.localize
  }

  var localizeOptions = {
    addSuffix: Boolean(options.addSuffix),
    comparison: comparison
  }

  var dateLeft, dateRight
  if (comparison > 0) {
    dateLeft = parse(dirtyDateToCompare)
    dateRight = parse(dirtyDate)
  } else {
    dateLeft = parse(dirtyDate)
    dateRight = parse(dirtyDateToCompare)
  }

  var seconds = differenceInSeconds(dateRight, dateLeft)
  var offset = dateRight.getTimezoneOffset() - dateLeft.getTimezoneOffset()
  var minutes = Math.round(seconds / 60) - offset
  var months

  // 0 up to 2 mins
  if (minutes < 2) {
    if (options.includeSeconds) {
      if (seconds < 5) {
        return localize('lessThanXSeconds', 5, localizeOptions)
      } else if (seconds < 10) {
        return localize('lessThanXSeconds', 10, localizeOptions)
      } else if (seconds < 20) {
        return localize('lessThanXSeconds', 20, localizeOptions)
      } else if (seconds < 40) {
        return localize('halfAMinute', null, localizeOptions)
      } else if (seconds < 60) {
        return localize('lessThanXMinutes', 1, localizeOptions)
      } else {
        return localize('xMinutes', 1, localizeOptions)
      }
    } else {
      if (minutes === 0) {
        return localize('lessThanXMinutes', 1, localizeOptions)
      } else {
        return localize('xMinutes', minutes, localizeOptions)
      }
    }

  // 2 mins up to 0.75 hrs
  } else if (minutes < 45) {
    return localize('xMinutes', minutes, localizeOptions)

  // 0.75 hrs up to 1.5 hrs
  } else if (minutes < 90) {
    return localize('aboutXHours', 1, localizeOptions)

  // 1.5 hrs up to 24 hrs
  } else if (minutes < MINUTES_IN_DAY) {
    var hours = Math.round(minutes / 60)
    return localize('aboutXHours', hours, localizeOptions)

  // 1 day up to 1.75 days
  } else if (minutes < MINUTES_IN_ALMOST_TWO_DAYS) {
    return localize('xDays', 1, localizeOptions)

  // 1.75 days up to 30 days
  } else if (minutes < MINUTES_IN_MONTH) {
    var days = Math.round(minutes / MINUTES_IN_DAY)
    return localize('xDays', days, localizeOptions)

  // 1 month up to 2 months
  } else if (minutes < MINUTES_IN_TWO_MONTHS) {
    months = Math.round(minutes / MINUTES_IN_MONTH)
    return localize('aboutXMonths', months, localizeOptions)
  }

  months = differenceInMonths(dateRight, dateLeft)

  // 2 months up to 12 months
  if (months < 12) {
    var nearestMonth = Math.round(minutes / MINUTES_IN_MONTH)
    return localize('xMonths', nearestMonth, localizeOptions)

  // 1 year up to max Date
  } else {
    var monthsSinceStartOfYear = months % 12
    var years = Math.floor(months / 12)

    // N years up to 1 years 3 months
    if (monthsSinceStartOfYear < 3) {
      return localize('aboutXYears', years, localizeOptions)

    // N years 3 months up to N years 9 months
    } else if (monthsSinceStartOfYear < 9) {
      return localize('overXYears', years, localizeOptions)

    // N years 9 months up to N year 12 months
    } else {
      return localize('almostXYears', years + 1, localizeOptions)
    }
  }
}

module.exports = distanceInWords


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Common Helpers
 * @summary Compare the two dates reverse chronologically and return -1, 0 or 1.
 *
 * @description
 * Compare the two dates and return -1 if the first date is after the second,
 * 1 if the first date is before the second or 0 if dates are equal.
 *
 * @param {Date|String|Number} dateLeft - the first date to compare
 * @param {Date|String|Number} dateRight - the second date to compare
 * @returns {Number} the result of the comparison
 *
 * @example
 * // Compare 11 February 1987 and 10 July 1989 reverse chronologically:
 * var result = compareDesc(
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * )
 * //=> 1
 *
 * @example
 * // Sort the array of dates in reverse chronological order:
 * var result = [
 *   new Date(1995, 6, 2),
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * ].sort(compareDesc)
 * //=> [
 * //   Sun Jul 02 1995 00:00:00,
 * //   Mon Jul 10 1989 00:00:00,
 * //   Wed Feb 11 1987 00:00:00
 * // ]
 */
function compareDesc (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var timeLeft = dateLeft.getTime()
  var dateRight = parse(dirtyDateRight)
  var timeRight = dateRight.getTime()

  if (timeLeft > timeRight) {
    return -1
  } else if (timeLeft < timeRight) {
    return 1
  } else {
    return 0
  }
}

module.exports = compareDesc


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

var differenceInMilliseconds = __webpack_require__(21)

/**
 * @category Second Helpers
 * @summary Get the number of seconds between the given dates.
 *
 * @description
 * Get the number of seconds between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of seconds
 *
 * @example
 * // How many seconds are between
 * // 2 July 2014 12:30:07.999 and 2 July 2014 12:30:20.000?
 * var result = differenceInSeconds(
 *   new Date(2014, 6, 2, 12, 30, 20, 0),
 *   new Date(2014, 6, 2, 12, 30, 7, 999)
 * )
 * //=> 12
 */
function differenceInSeconds (dirtyDateLeft, dirtyDateRight) {
  var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / 1000
  return diff > 0 ? Math.floor(diff) : Math.ceil(diff)
}

module.exports = differenceInSeconds


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)
var differenceInCalendarMonths = __webpack_require__(56)
var compareAsc = __webpack_require__(57)

/**
 * @category Month Helpers
 * @summary Get the number of full months between the given dates.
 *
 * @description
 * Get the number of full months between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of full months
 *
 * @example
 * // How many full months are between 31 January 2014 and 1 September 2014?
 * var result = differenceInMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 7
 */
function differenceInMonths (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var sign = compareAsc(dateLeft, dateRight)
  var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight))
  dateLeft.setMonth(dateLeft.getMonth() - sign * difference)

  // Math.abs(diff in full months - diff in calendar months) === 1 if last calendar month is not full
  // If so, result must be decreased by 1 in absolute value
  var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign
  return sign * (difference - isLastMonthNotFull)
}

module.exports = differenceInMonths


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Month Helpers
 * @summary Get the number of calendar months between the given dates.
 *
 * @description
 * Get the number of calendar months between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar months
 *
 * @example
 * // How many calendar months are between 31 January 2014 and 1 September 2014?
 * var result = differenceInCalendarMonths(
 *   new Date(2014, 8, 1),
 *   new Date(2014, 0, 31)
 * )
 * //=> 8
 */
function differenceInCalendarMonths (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var dateRight = parse(dirtyDateRight)

  var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear()
  var monthDiff = dateLeft.getMonth() - dateRight.getMonth()

  return yearDiff * 12 + monthDiff
}

module.exports = differenceInCalendarMonths


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Common Helpers
 * @summary Compare the two dates and return -1, 0 or 1.
 *
 * @description
 * Compare the two dates and return 1 if the first date is after the second,
 * -1 if the first date is before the second or 0 if dates are equal.
 *
 * @param {Date|String|Number} dateLeft - the first date to compare
 * @param {Date|String|Number} dateRight - the second date to compare
 * @returns {Number} the result of the comparison
 *
 * @example
 * // Compare 11 February 1987 and 10 July 1989:
 * var result = compareAsc(
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * )
 * //=> -1
 *
 * @example
 * // Sort the array of dates:
 * var result = [
 *   new Date(1995, 6, 2),
 *   new Date(1987, 1, 11),
 *   new Date(1989, 6, 10)
 * ].sort(compareAsc)
 * //=> [
 * //   Wed Feb 11 1987 00:00:00,
 * //   Mon Jul 10 1989 00:00:00,
 * //   Sun Jul 02 1995 00:00:00
 * // ]
 */
function compareAsc (dirtyDateLeft, dirtyDateRight) {
  var dateLeft = parse(dirtyDateLeft)
  var timeLeft = dateLeft.getTime()
  var dateRight = parse(dirtyDateRight)
  var timeRight = dateRight.getTime()

  if (timeLeft < timeRight) {
    return -1
  } else if (timeLeft > timeRight) {
    return 1
  } else {
    return 0
  }
}

module.exports = compareAsc


/***/ }),
/* 58 */
/***/ (function(module, exports) {

function buildDistanceInWordsLocale () {
  var distanceInWordsLocale = {
    lessThanXSeconds: {
      one: 'less than a second',
      other: 'less than {{count}} seconds'
    },

    xSeconds: {
      one: '1 second',
      other: '{{count}} seconds'
    },

    halfAMinute: 'half a minute',

    lessThanXMinutes: {
      one: 'less than a minute',
      other: 'less than {{count}} minutes'
    },

    xMinutes: {
      one: '1 minute',
      other: '{{count}} minutes'
    },

    aboutXHours: {
      one: 'about 1 hour',
      other: 'about {{count}} hours'
    },

    xHours: {
      one: '1 hour',
      other: '{{count}} hours'
    },

    xDays: {
      one: '1 day',
      other: '{{count}} days'
    },

    aboutXMonths: {
      one: 'about 1 month',
      other: 'about {{count}} months'
    },

    xMonths: {
      one: '1 month',
      other: '{{count}} months'
    },

    aboutXYears: {
      one: 'about 1 year',
      other: 'about {{count}} years'
    },

    xYears: {
      one: '1 year',
      other: '{{count}} years'
    },

    overXYears: {
      one: 'over 1 year',
      other: 'over {{count}} years'
    },

    almostXYears: {
      one: 'almost 1 year',
      other: 'almost {{count}} years'
    }
  }

  function localize (token, count, options) {
    options = options || {}

    var result
    if (typeof distanceInWordsLocale[token] === 'string') {
      result = distanceInWordsLocale[token]
    } else if (count === 1) {
      result = distanceInWordsLocale[token].one
    } else {
      result = distanceInWordsLocale[token].other.replace('{{count}}', count)
    }

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result
      } else {
        return result + ' ago'
      }
    }

    return result
  }

  return {
    localize: localize
  }
}

module.exports = buildDistanceInWordsLocale


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

var buildFormattingTokensRegExp = __webpack_require__(60)

function buildFormatLocale () {
  // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  var months3char = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  var weekdays2char = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  var weekdays3char = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  var weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var meridiemUppercase = ['AM', 'PM']
  var meridiemLowercase = ['am', 'pm']
  var meridiemFull = ['a.m.', 'p.m.']

  var formatters = {
    // Month: Jan, Feb, ..., Dec
    'MMM': function (date) {
      return months3char[date.getMonth()]
    },

    // Month: January, February, ..., December
    'MMMM': function (date) {
      return monthsFull[date.getMonth()]
    },

    // Day of week: Su, Mo, ..., Sa
    'dd': function (date) {
      return weekdays2char[date.getDay()]
    },

    // Day of week: Sun, Mon, ..., Sat
    'ddd': function (date) {
      return weekdays3char[date.getDay()]
    },

    // Day of week: Sunday, Monday, ..., Saturday
    'dddd': function (date) {
      return weekdaysFull[date.getDay()]
    },

    // AM, PM
    'A': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemUppercase[1] : meridiemUppercase[0]
    },

    // am, pm
    'a': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemLowercase[1] : meridiemLowercase[0]
    },

    // a.m., p.m.
    'aa': function (date) {
      return (date.getHours() / 12) >= 1 ? meridiemFull[1] : meridiemFull[0]
    }
  }

  // Generate ordinal version of formatters: M -> Mo, D -> Do, etc.
  var ordinalFormatters = ['M', 'D', 'DDD', 'd', 'Q', 'W']
  ordinalFormatters.forEach(function (formatterToken) {
    formatters[formatterToken + 'o'] = function (date, formatters) {
      return ordinal(formatters[formatterToken](date))
    }
  })

  return {
    formatters: formatters,
    formattingTokensRegExp: buildFormattingTokensRegExp(formatters)
  }
}

function ordinal (number) {
  var rem100 = number % 100
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + 'st'
      case 2:
        return number + 'nd'
      case 3:
        return number + 'rd'
    }
  }
  return number + 'th'
}

module.exports = buildFormatLocale


/***/ }),
/* 60 */
/***/ (function(module, exports) {

var commonFormatterKeys = [
  'M', 'MM', 'Q', 'D', 'DD', 'DDD', 'DDDD', 'd',
  'E', 'W', 'WW', 'YY', 'YYYY', 'GG', 'GGGG',
  'H', 'HH', 'h', 'hh', 'm', 'mm',
  's', 'ss', 'S', 'SS', 'SSS',
  'Z', 'ZZ', 'X', 'x'
]

function buildFormattingTokensRegExp (formatters) {
  var formatterKeys = []
  for (var key in formatters) {
    if (formatters.hasOwnProperty(key)) {
      formatterKeys.push(key)
    }
  }

  var formattingTokens = commonFormatterKeys
    .concat(formatterKeys)
    .sort()
    .reverse()
  var formattingTokensRegExp = new RegExp(
    '(\\[[^\\[]*\\])|(\\\\)?' + '(' + formattingTokens.join('|') + '|.)', 'g'
  )

  return formattingTokensRegExp
}

module.exports = buildFormattingTokensRegExp


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _classnames2 = __webpack_require__(2);

var _classnames3 = _interopRequireDefault(_classnames2);

var _format = __webpack_require__(62);

var _format2 = _interopRequireDefault(_format);

var _difference_in_minutes = __webpack_require__(71);

var _difference_in_minutes2 = _interopRequireDefault(_difference_in_minutes);

var _reactLinkify = __webpack_require__(72);

var _reactLinkify2 = _interopRequireDefault(_reactLinkify);

var _snarkdown = __webpack_require__(84);

var _snarkdown2 = _interopRequireDefault(_snarkdown);

var _bot_avatar = __webpack_require__(10);

var _bot_avatar2 = _interopRequireDefault(_bot_avatar);

var _quick_replies = __webpack_require__(85);

var _quick_replies2 = _interopRequireDefault(_quick_replies);

var _login_prompt = __webpack_require__(88);

var _login_prompt2 = _interopRequireDefault(_login_prompt);

var _file = __webpack_require__(89);

var _file2 = _interopRequireDefault(_file);

var _carousel = __webpack_require__(90);

var _carousel2 = _interopRequireDefault(_carousel);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

var _form = __webpack_require__(118);

var _form2 = _interopRequireDefault(_form);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TIME_BETWEEN_DATES = 10; // 10 minutes

var MessageGroup = function (_Component) {
  _inherits(MessageGroup, _Component);

  function MessageGroup() {
    _classCallCheck(this, MessageGroup);

    return _possibleConstructorReturn(this, (MessageGroup.__proto__ || Object.getPrototypeOf(MessageGroup)).apply(this, arguments));
  }

  _createClass(MessageGroup, [{
    key: 'renderAvatar',
    value: function renderAvatar() {
      var content = _react2.default.createElement(_bot_avatar2.default, { foregroundColor: this.props.fgColor });

      if (this.props.avatarUrl) {
        content = _react2.default.createElement('div', { className: _style2.default.picture, style: { backgroundImage: 'url(' + this.props.avatarUrl + ')' } });
      }

      return _react2.default.createElement(
        'div',
        { className: _style2.default.avatar, style: { color: this.props.fgColor } },
        content
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var sample = this.props.messages[0];
      var isBot = !sample.userId;

      var className = (0, _classnames3.default)(_style2.default.message, _defineProperty({}, _style2.default.user, !isBot));

      var bubbleColor = this.props.fgColor;
      var textColor = this.props.textColor;

      return _react2.default.createElement(
        'div',
        { className: className },
        isBot && this.renderAvatar(),
        _react2.default.createElement(
          'div',
          { className: _style2.default['message-container'] },
          isBot && _react2.default.createElement(
            'div',
            { className: _style2.default['info-line'] },
            sample.full_name
          ),
          _react2.default.createElement(
            'div',
            { className: _style2.default.group },
            this.props.messages.map(function (data, i) {
              return _react2.default.createElement(Message, {
                onLoginPromptSend: _this2.props.onLoginPromptSend,
                textColor: textColor,
                bubbleColor: bubbleColor,
                key: 'msg-' + i,
                isLastOfGroup: i >= _this2.props.messages.length - 1,
                isLastGroup: _this2.props.isLastGroup,
                data: data,
                onSendData: _this2.props.onSendData
              });
            })
          )
        )
      );
    }
  }]);

  return MessageGroup;
}(_react.Component);

var MessageList = function (_Component2) {
  _inherits(MessageList, _Component2);

  function MessageList(props) {
    _classCallCheck(this, MessageList);

    var _this3 = _possibleConstructorReturn(this, (MessageList.__proto__ || Object.getPrototypeOf(MessageList)).call(this, props));

    _this3.messagesDiv = null;
    return _this3;
  }

  _createClass(MessageList, [{
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      this.tryScrollToBottom();
    }
  }, {
    key: 'tryScrollToBottom',
    value: function tryScrollToBottom() {
      try {
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
      } catch (err) {
        // Discard the error
      }
    }
  }, {
    key: 'renderQuickReplies',
    value: function renderQuickReplies() {
      var messages = this.props.messages || [];
      var message = messages[messages.length - 1];
      var quick_replies = message && message['message_raw'] && message['message_raw']['quick_replies'];

      return _react2.default.createElement(_quick_replies2.default, {
        quick_replies: quick_replies,
        fgColor: this.props.fgColor,
        onQuickReplySend: this.props.onQuickReplySend,
        onFileUploadSend: this.props.onFileUploadSend
      });
    }
  }, {
    key: 'renderForm',
    value: function renderForm() {
      var messages = this.props.messages || [];
      var message = messages[messages.length - 1];
      if (message && message['message_raw'] && message['message_raw']['form']) {
        var form = message['message_raw']['form'];
        return _react2.default.createElement(_form2.default, { elements: form.elements, formId: form.id, title: form.title, onFormSend: this.props.onFormSend });
      }
    }
  }, {
    key: 'renderDate',
    value: function renderDate(date) {
      return _react2.default.createElement(
        'div',
        { className: _style2.default.date },
        (0, _format2.default)(new Date(date), 'MMMM Do YYYY, h:mm a'),
        _react2.default.createElement('div', { className: _style2.default.smallLine })
      );
    }
  }, {
    key: 'renderMessageGroups',
    value: function renderMessageGroups() {
      var _this4 = this;

      var messages = this.props.messages || [];
      var groups = [];

      var lastSpeaker = null;
      var lastDate = null;
      var currentGroup = null;

      messages.forEach(function (m) {
        var speaker = !!m.userId ? m.userId : 'bot';
        var date = m.sent_on;

        // Create a new group if messages are separated by more than X minutes or if different speaker
        if (speaker !== lastSpeaker || (0, _difference_in_minutes2.default)(new Date(date), new Date(lastDate)) >= TIME_BETWEEN_DATES) {
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

      return _react2.default.createElement(
        'div',
        null,
        groups.map(function (group, i) {
          var lastGroup = groups[i - 1];
          var lastDate = lastGroup && lastGroup[lastGroup.length - 1] && lastGroup[lastGroup.length - 1].sent_on;
          var groupDate = group && group[0].sent_on;

          var isDateNeeded = !groups[i - 1] || (0, _difference_in_minutes2.default)(new Date(groupDate), new Date(lastDate)) > TIME_BETWEEN_DATES;

          return _react2.default.createElement(
            'div',
            { key: i },
            isDateNeeded ? _this4.renderDate(group[0].sent_on) : null,
            _react2.default.createElement(MessageGroup, {
              avatarUrl: _this4.props.avatarUrl,
              fgColor: _this4.props.fgColor,
              textColor: _this4.props.textColor,
              key: 'msg-group-' + i,
              onLoginPromptSend: _this4.props.onLoginPromptSend,
              isLastGroup: i >= groups.length - 1,
              messages: group,
              onSendData: _this4.props.onSendData
            })
          );
        })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      return _react2.default.createElement(
        'div',
        {
          className: _style2.default.messages,
          ref: function ref(m) {
            _this5.messagesDiv = m;
          }
        },
        this.renderMessageGroups(),
        this.renderForm(),
        this.renderQuickReplies()
      );
    }
  }]);

  return MessageList;
}(_react.Component);

exports.default = MessageList;

var Message = function (_Component3) {
  _inherits(Message, _Component3);

  function Message() {
    _classCallCheck(this, Message);

    return _possibleConstructorReturn(this, (Message.__proto__ || Object.getPrototypeOf(Message)).apply(this, arguments));
  }

  _createClass(Message, [{
    key: 'getAddStyle',
    value: function getAddStyle() {
      return this.props.data.message_raw && this.props.data.message_raw['web-style'];
    }
  }, {
    key: 'getMarkdownElement',
    value: function getMarkdownElement() {
      var html = (0, _snarkdown2.default)(this.props.data.message_text);
      html = html.replace(/<a href/gi, '<a target="_blank" href');

      return _react2.default.createElement('div', { dangerouslySetInnerHTML: { __html: html } });
    }
  }, {
    key: 'render_text',
    value: function render_text() {
      var element = this.props.data.message_raw && this.props.data.message_raw.markdown ? this.getMarkdownElement() : _react2.default.createElement(
        'p',
        { style: this.getAddStyle() },
        this.props.data.message_text
      );
      return _react2.default.createElement(
        _reactLinkify2.default,
        { properties: { target: '_blank' } },
        _react2.default.createElement(
          'div',
          null,
          element
        )
      );
    }
  }, {
    key: 'render_form',
    value: function render_form() {
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'p',
          { style: this.getAddStyle() },
          this.props.data.message_text
        )
      );
    }
  }, {
    key: 'render_quick_reply',
    value: function render_quick_reply() {
      return _react2.default.createElement(
        'div',
        null,
        _react2.default.createElement(
          'p',
          null,
          this.props.data.message_text
        )
      );
    }
  }, {
    key: 'render_login_prompt',
    value: function render_login_prompt() {
      var isLastMessage = this.props.isLastOfGroup && this.props.isLastGroup;
      var isBotMessage = !this.props.data.userId;

      return _react2.default.createElement(
        'div',
        { style: this.getAddStyle() },
        _react2.default.createElement(_login_prompt2.default, {
          isLastMessage: isLastMessage,
          isBotMessage: isBotMessage,
          bgColor: this.props.bubbleColor,
          onLoginPromptSend: this.props.onLoginPromptSend,
          textColor: this.props.textColor
        })
      );
    }
  }, {
    key: 'render_carousel',
    value: function render_carousel() {
      return _react2.default.createElement(_carousel2.default, { onSendData: this.props.onSendData, carousel: this.props.data.message_raw });
    }
  }, {
    key: 'render_typing',
    value: function render_typing() {
      var _this7 = this;

      var bubble = function bubble() {
        return _react2.default.createElement('div', {
          className: _style2.default.typingBubble,
          style: { backgroundColor: _this7.props.bubbleColor, color: _this7.props.textColor }
        });
      };

      return _react2.default.createElement(
        'div',
        { className: _style2.default.typingGroup },
        bubble(),
        bubble(),
        bubble()
      );
    }
  }, {
    key: 'render_file',
    value: function render_file() {
      return _react2.default.createElement(_file2.default, { file: this.props.data.message_data });
    }
  }, {
    key: 'render_custom',
    value: function render_custom() {
      var type = this.props.data.message_raw.custom_type || '';
      var Plugin = ((window.botpress || {})[type] || {})['Plugin'];
      var data = this.props.data.message_raw.custom_data;
      return _react2.default.createElement(
        _reactLinkify2.default,
        null,
        _react2.default.createElement(
          'div',
          null,
          _react2.default.createElement(
            'p',
            { style: this.getAddStyle() },
            this.props.data.message_text
          ),
          Plugin ? _react2.default.createElement(Plugin, _extends({ onSendData: this.props.onSendData }, data)) : this.render_unsupported()
        )
      );
    }
  }, {
    key: 'render_session_reset',
    value: function render_session_reset() {
      return _react2.default.createElement(
        'div',
        { style: this.getAddStyle() },
        this.props.data.message_text
      );
    }
  }, {
    key: 'render_unsupported',
    value: function render_unsupported() {
      return _react2.default.createElement(
        'div',
        { style: this.getAddStyle() },
        _react2.default.createElement(
          'p',
          null,
          '*Unsupported message type*'
        )
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var bubbleStyle = !!this.props.data.userId ? { backgroundColor: this.props.bubbleColor, color: this.props.textColor } : null;

      var renderer = (this['render_' + this.props.data.message_type] || this.render_unsupported).bind(this);

      var className = _style2.default.bubble;

      if (_style2.default[this.props.data.message_type]) {
        className += ' ' + _style2.default[this.props.data.message_type];
      }

      return _react2.default.createElement(
        'div',
        { className: className, style: bubbleStyle },
        renderer()
      );
    }
  }]);

  return Message;
}(_react.Component);

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

var getDayOfYear = __webpack_require__(63)
var getISOWeek = __webpack_require__(67)
var getISOYear = __webpack_require__(23)
var parse = __webpack_require__(1)
var isValid = __webpack_require__(70)
var enLocale = __webpack_require__(22)

/**
 * @category Common Helpers
 * @summary Format the date.
 *
 * @description
 * Return the formatted date string in the given format.
 *
 * Accepted tokens:
 * | Unit                    | Token | Result examples                  |
 * |-------------------------|-------|----------------------------------|
 * | Month                   | M     | 1, 2, ..., 12                    |
 * |                         | Mo    | 1st, 2nd, ..., 12th              |
 * |                         | MM    | 01, 02, ..., 12                  |
 * |                         | MMM   | Jan, Feb, ..., Dec               |
 * |                         | MMMM  | January, February, ..., December |
 * | Quarter                 | Q     | 1, 2, 3, 4                       |
 * |                         | Qo    | 1st, 2nd, 3rd, 4th               |
 * | Day of month            | D     | 1, 2, ..., 31                    |
 * |                         | Do    | 1st, 2nd, ..., 31st              |
 * |                         | DD    | 01, 02, ..., 31                  |
 * | Day of year             | DDD   | 1, 2, ..., 366                   |
 * |                         | DDDo  | 1st, 2nd, ..., 366th             |
 * |                         | DDDD  | 001, 002, ..., 366               |
 * | Day of week             | d     | 0, 1, ..., 6                     |
 * |                         | do    | 0th, 1st, ..., 6th               |
 * |                         | dd    | Su, Mo, ..., Sa                  |
 * |                         | ddd   | Sun, Mon, ..., Sat               |
 * |                         | dddd  | Sunday, Monday, ..., Saturday    |
 * | Day of ISO week         | E     | 1, 2, ..., 7                     |
 * | ISO week                | W     | 1, 2, ..., 53                    |
 * |                         | Wo    | 1st, 2nd, ..., 53rd              |
 * |                         | WW    | 01, 02, ..., 53                  |
 * | Year                    | YY    | 00, 01, ..., 99                  |
 * |                         | YYYY  | 1900, 1901, ..., 2099            |
 * | ISO week-numbering year | GG    | 00, 01, ..., 99                  |
 * |                         | GGGG  | 1900, 1901, ..., 2099            |
 * | AM/PM                   | A     | AM, PM                           |
 * |                         | a     | am, pm                           |
 * |                         | aa    | a.m., p.m.                       |
 * | Hour                    | H     | 0, 1, ... 23                     |
 * |                         | HH    | 00, 01, ... 23                   |
 * |                         | h     | 1, 2, ..., 12                    |
 * |                         | hh    | 01, 02, ..., 12                  |
 * | Minute                  | m     | 0, 1, ..., 59                    |
 * |                         | mm    | 00, 01, ..., 59                  |
 * | Second                  | s     | 0, 1, ..., 59                    |
 * |                         | ss    | 00, 01, ..., 59                  |
 * | 1/10 of second          | S     | 0, 1, ..., 9                     |
 * | 1/100 of second         | SS    | 00, 01, ..., 99                  |
 * | Millisecond             | SSS   | 000, 001, ..., 999               |
 * | Timezone                | Z     | -01:00, +00:00, ... +12:00       |
 * |                         | ZZ    | -0100, +0000, ..., +1200         |
 * | Seconds timestamp       | X     | 512969520                        |
 * | Milliseconds timestamp  | x     | 512969520900                     |
 *
 * The characters wrapped in square brackets are escaped.
 *
 * The result may vary by locale.
 *
 * @param {Date|String|Number} date - the original date
 * @param {String} [format='YYYY-MM-DDTHH:mm:ss.SSSZ'] - the string of tokens
 * @param {Object} [options] - the object with options
 * @param {Object} [options.locale=enLocale] - the locale object
 * @returns {String} the formatted date string
 *
 * @example
 * // Represent 11 February 2014 in middle-endian format:
 * var result = format(
 *   new Date(2014, 1, 11),
 *   'MM/DD/YYYY'
 * )
 * //=> '02/11/2014'
 *
 * @example
 * // Represent 2 July 2014 in Esperanto:
 * var eoLocale = require('date-fns/locale/eo')
 * var result = format(
 *   new Date(2014, 6, 2),
 *   'Do [de] MMMM YYYY',
 *   {locale: eoLocale}
 * )
 * //=> '2-a de julio 2014'
 */
function format (dirtyDate, dirtyFormatStr, dirtyOptions) {
  var formatStr = dirtyFormatStr ? String(dirtyFormatStr) : 'YYYY-MM-DDTHH:mm:ss.SSSZ'
  var options = dirtyOptions || {}

  var locale = options.locale
  var localeFormatters = enLocale.format.formatters
  var formattingTokensRegExp = enLocale.format.formattingTokensRegExp
  if (locale && locale.format && locale.format.formatters) {
    localeFormatters = locale.format.formatters

    if (locale.format.formattingTokensRegExp) {
      formattingTokensRegExp = locale.format.formattingTokensRegExp
    }
  }

  var date = parse(dirtyDate)

  if (!isValid(date)) {
    return 'Invalid Date'
  }

  var formatFn = buildFormatFn(formatStr, localeFormatters, formattingTokensRegExp)

  return formatFn(date)
}

var formatters = {
  // Month: 1, 2, ..., 12
  'M': function (date) {
    return date.getMonth() + 1
  },

  // Month: 01, 02, ..., 12
  'MM': function (date) {
    return addLeadingZeros(date.getMonth() + 1, 2)
  },

  // Quarter: 1, 2, 3, 4
  'Q': function (date) {
    return Math.ceil((date.getMonth() + 1) / 3)
  },

  // Day of month: 1, 2, ..., 31
  'D': function (date) {
    return date.getDate()
  },

  // Day of month: 01, 02, ..., 31
  'DD': function (date) {
    return addLeadingZeros(date.getDate(), 2)
  },

  // Day of year: 1, 2, ..., 366
  'DDD': function (date) {
    return getDayOfYear(date)
  },

  // Day of year: 001, 002, ..., 366
  'DDDD': function (date) {
    return addLeadingZeros(getDayOfYear(date), 3)
  },

  // Day of week: 0, 1, ..., 6
  'd': function (date) {
    return date.getDay()
  },

  // Day of ISO week: 1, 2, ..., 7
  'E': function (date) {
    return date.getDay() || 7
  },

  // ISO week: 1, 2, ..., 53
  'W': function (date) {
    return getISOWeek(date)
  },

  // ISO week: 01, 02, ..., 53
  'WW': function (date) {
    return addLeadingZeros(getISOWeek(date), 2)
  },

  // Year: 00, 01, ..., 99
  'YY': function (date) {
    return addLeadingZeros(date.getFullYear(), 4).substr(2)
  },

  // Year: 1900, 1901, ..., 2099
  'YYYY': function (date) {
    return addLeadingZeros(date.getFullYear(), 4)
  },

  // ISO week-numbering year: 00, 01, ..., 99
  'GG': function (date) {
    return String(getISOYear(date)).substr(2)
  },

  // ISO week-numbering year: 1900, 1901, ..., 2099
  'GGGG': function (date) {
    return getISOYear(date)
  },

  // Hour: 0, 1, ... 23
  'H': function (date) {
    return date.getHours()
  },

  // Hour: 00, 01, ..., 23
  'HH': function (date) {
    return addLeadingZeros(date.getHours(), 2)
  },

  // Hour: 1, 2, ..., 12
  'h': function (date) {
    var hours = date.getHours()
    if (hours === 0) {
      return 12
    } else if (hours > 12) {
      return hours % 12
    } else {
      return hours
    }
  },

  // Hour: 01, 02, ..., 12
  'hh': function (date) {
    return addLeadingZeros(formatters['h'](date), 2)
  },

  // Minute: 0, 1, ..., 59
  'm': function (date) {
    return date.getMinutes()
  },

  // Minute: 00, 01, ..., 59
  'mm': function (date) {
    return addLeadingZeros(date.getMinutes(), 2)
  },

  // Second: 0, 1, ..., 59
  's': function (date) {
    return date.getSeconds()
  },

  // Second: 00, 01, ..., 59
  'ss': function (date) {
    return addLeadingZeros(date.getSeconds(), 2)
  },

  // 1/10 of second: 0, 1, ..., 9
  'S': function (date) {
    return Math.floor(date.getMilliseconds() / 100)
  },

  // 1/100 of second: 00, 01, ..., 99
  'SS': function (date) {
    return addLeadingZeros(Math.floor(date.getMilliseconds() / 10), 2)
  },

  // Millisecond: 000, 001, ..., 999
  'SSS': function (date) {
    return addLeadingZeros(date.getMilliseconds(), 3)
  },

  // Timezone: -01:00, +00:00, ... +12:00
  'Z': function (date) {
    return formatTimezone(date.getTimezoneOffset(), ':')
  },

  // Timezone: -0100, +0000, ... +1200
  'ZZ': function (date) {
    return formatTimezone(date.getTimezoneOffset())
  },

  // Seconds timestamp: 512969520
  'X': function (date) {
    return Math.floor(date.getTime() / 1000)
  },

  // Milliseconds timestamp: 512969520900
  'x': function (date) {
    return date.getTime()
  }
}

function buildFormatFn (formatStr, localeFormatters, formattingTokensRegExp) {
  var array = formatStr.match(formattingTokensRegExp)
  var length = array.length

  var i
  var formatter
  for (i = 0; i < length; i++) {
    formatter = localeFormatters[array[i]] || formatters[array[i]]
    if (formatter) {
      array[i] = formatter
    } else {
      array[i] = removeFormattingTokens(array[i])
    }
  }

  return function (date) {
    var output = ''
    for (var i = 0; i < length; i++) {
      if (array[i] instanceof Function) {
        output += array[i](date, formatters)
      } else {
        output += array[i]
      }
    }
    return output
  }
}

function removeFormattingTokens (input) {
  if (input.match(/\[[\s\S]/)) {
    return input.replace(/^\[|]$/g, '')
  }
  return input.replace(/\\/g, '')
}

function formatTimezone (offset, delimeter) {
  delimeter = delimeter || ''
  var sign = offset > 0 ? '-' : '+'
  var absOffset = Math.abs(offset)
  var hours = Math.floor(absOffset / 60)
  var minutes = absOffset % 60
  return sign + addLeadingZeros(hours, 2) + delimeter + addLeadingZeros(minutes, 2)
}

function addLeadingZeros (number, targetLength) {
  var output = Math.abs(number).toString()
  while (output.length < targetLength) {
    output = '0' + output
  }
  return output
}

module.exports = format


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)
var startOfYear = __webpack_require__(64)
var differenceInCalendarDays = __webpack_require__(65)

/**
 * @category Day Helpers
 * @summary Get the day of the year of the given date.
 *
 * @description
 * Get the day of the year of the given date.
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the day of year
 *
 * @example
 * // Which day of the year is 2 July 2014?
 * var result = getDayOfYear(new Date(2014, 6, 2))
 * //=> 183
 */
function getDayOfYear (dirtyDate) {
  var date = parse(dirtyDate)
  var diff = differenceInCalendarDays(date, startOfYear(date))
  var dayOfYear = diff + 1
  return dayOfYear
}

module.exports = getDayOfYear


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Year Helpers
 * @summary Return the start of a year for the given date.
 *
 * @description
 * Return the start of a year for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a year
 *
 * @example
 * // The start of a year for 2 September 2014 11:55:00:
 * var result = startOfYear(new Date(2014, 8, 2, 11, 55, 00))
 * //=> Wed Jan 01 2014 00:00:00
 */
function startOfYear (dirtyDate) {
  var cleanDate = parse(dirtyDate)
  var date = new Date(0)
  date.setFullYear(cleanDate.getFullYear(), 0, 1)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfYear


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

var startOfDay = __webpack_require__(66)

var MILLISECONDS_IN_MINUTE = 60000
var MILLISECONDS_IN_DAY = 86400000

/**
 * @category Day Helpers
 * @summary Get the number of calendar days between the given dates.
 *
 * @description
 * Get the number of calendar days between the given dates.
 *
 * @param {Date|String|Number} dateLeft - the later date
 * @param {Date|String|Number} dateRight - the earlier date
 * @returns {Number} the number of calendar days
 *
 * @example
 * // How many calendar days are between
 * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
 * var result = differenceInCalendarDays(
 *   new Date(2012, 6, 2, 0, 0),
 *   new Date(2011, 6, 2, 23, 0)
 * )
 * //=> 366
 */
function differenceInCalendarDays (dirtyDateLeft, dirtyDateRight) {
  var startOfDayLeft = startOfDay(dirtyDateLeft)
  var startOfDayRight = startOfDay(dirtyDateRight)

  var timestampLeft = startOfDayLeft.getTime() -
    startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE
  var timestampRight = startOfDayRight.getTime() -
    startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a day is not constant
  // (e.g. it's different in the day of the daylight saving time clock shift)
  return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY)
}

module.exports = differenceInCalendarDays


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Day Helpers
 * @summary Return the start of a day for the given date.
 *
 * @description
 * Return the start of a day for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of a day
 *
 * @example
 * // The start of a day for 2 September 2014 11:55:00:
 * var result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Tue Sep 02 2014 00:00:00
 */
function startOfDay (dirtyDate) {
  var date = parse(dirtyDate)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfDay


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)
var startOfISOWeek = __webpack_require__(11)
var startOfISOYear = __webpack_require__(69)

var MILLISECONDS_IN_WEEK = 604800000

/**
 * @category ISO Week Helpers
 * @summary Get the ISO week of the given date.
 *
 * @description
 * Get the ISO week of the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the given date
 * @returns {Number} the ISO week
 *
 * @example
 * // Which week of the ISO-week numbering year is 2 January 2005?
 * var result = getISOWeek(new Date(2005, 0, 2))
 * //=> 53
 */
function getISOWeek (dirtyDate) {
  var date = parse(dirtyDate)
  var diff = startOfISOWeek(date).getTime() - startOfISOYear(date).getTime()

  // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)
  return Math.round(diff / MILLISECONDS_IN_WEEK) + 1
}

module.exports = getISOWeek


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

var parse = __webpack_require__(1)

/**
 * @category Week Helpers
 * @summary Return the start of a week for the given date.
 *
 * @description
 * Return the start of a week for the given date.
 * The result will be in the local timezone.
 *
 * @param {Date|String|Number} date - the original date
 * @param {Object} [options] - the object with options
 * @param {Number} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
 * @returns {Date} the start of a week
 *
 * @example
 * // The start of a week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
 * //=> Sun Aug 31 2014 00:00:00
 *
 * @example
 * // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
 * var result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), {weekStartsOn: 1})
 * //=> Mon Sep 01 2014 00:00:00
 */
function startOfWeek (dirtyDate, dirtyOptions) {
  var weekStartsOn = dirtyOptions ? (Number(dirtyOptions.weekStartsOn) || 0) : 0

  var date = parse(dirtyDate)
  var day = date.getDay()
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn

  date.setDate(date.getDate() - diff)
  date.setHours(0, 0, 0, 0)
  return date
}

module.exports = startOfWeek


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

var getISOYear = __webpack_require__(23)
var startOfISOWeek = __webpack_require__(11)

/**
 * @category ISO Week-Numbering Year Helpers
 * @summary Return the start of an ISO week-numbering year for the given date.
 *
 * @description
 * Return the start of an ISO week-numbering year,
 * which always starts 3 days before the year's first Thursday.
 * The result will be in the local timezone.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|String|Number} date - the original date
 * @returns {Date} the start of an ISO year
 *
 * @example
 * // The start of an ISO week-numbering year for 2 July 2005:
 * var result = startOfISOYear(new Date(2005, 6, 2))
 * //=> Mon Jan 03 2005 00:00:00
 */
function startOfISOYear (dirtyDate) {
  var year = getISOYear(dirtyDate)
  var fourthOfJanuary = new Date(0)
  fourthOfJanuary.setFullYear(year, 0, 4)
  fourthOfJanuary.setHours(0, 0, 0, 0)
  var date = startOfISOWeek(fourthOfJanuary)
  return date
}

module.exports = startOfISOYear


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

var isDate = __webpack_require__(17)

/**
 * @category Common Helpers
 * @summary Is the given date valid?
 *
 * @description
 * Returns false if argument is Invalid Date and true otherwise.
 * Invalid Date is a Date, whose time value is NaN.
 *
 * Time value of Date: http://es5.github.io/#x15.9.1.1
 *
 * @param {Date} date - the date to check
 * @returns {Boolean} the date is valid
 * @throws {TypeError} argument must be an instance of Date
 *
 * @example
 * // For the valid date:
 * var result = isValid(new Date(2014, 1, 31))
 * //=> true
 *
 * @example
 * // For the invalid date:
 * var result = isValid(new Date(''))
 * //=> false
 */
function isValid (dirtyDate) {
  if (isDate(dirtyDate)) {
    return !isNaN(dirtyDate)
  } else {
    throw new TypeError(toString.call(dirtyDate) + ' is not an instance of Date')
  }
}

module.exports = isValid


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

var differenceInMilliseconds = __webpack_require__(21)

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
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linkify = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _linkifyIt = __webpack_require__(73);

var _linkifyIt2 = _interopRequireDefault(_linkifyIt);

var _tlds = __webpack_require__(79);

var _tlds2 = _interopRequireDefault(_tlds);

var _propTypes = __webpack_require__(80);

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
/* 73 */
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
  var re = self.re = __webpack_require__(74)(self.__opts__);

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
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = function (opts) {
  var re = {};

  // Use direct extract instead of `regenerate` to reduse browserified size
  re.src_Any = __webpack_require__(75).source;
  re.src_Cc  = __webpack_require__(76).source;
  re.src_Z   = __webpack_require__(77).source;
  re.src_P   = __webpack_require__(78).source;

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
/* 75 */
/***/ (function(module, exports) {

module.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/

/***/ }),
/* 76 */
/***/ (function(module, exports) {

module.exports=/[\0-\x1F\x7F-\x9F]/

/***/ }),
/* 77 */
/***/ (function(module, exports) {

module.exports=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/

/***/ }),
/* 78 */
/***/ (function(module, exports) {

module.exports=/[!-#%-\*,-/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E49\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/

/***/ }),
/* 79 */
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
  "boots",
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
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

if (process.env.NODE_ENV !== 'production') {
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
  module.exports = __webpack_require__(81)(isValidElement, throwOnDirectAccess);
} else {
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = __webpack_require__(83)();
}

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */



var emptyFunction = __webpack_require__(12);
var invariant = __webpack_require__(9);
var warning = __webpack_require__(13);

var ReactPropTypesSecret = __webpack_require__(14);
var checkPropTypes = __webpack_require__(82);

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
    shape: createShapeTypeChecker
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
    if (process.env.NODE_ENV !== 'production') {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          invariant(
            false,
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            warning(
              false,
              'You are manually calling a React.PropTypes validation ' +
              'function for the `%s` prop on `%s`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.',
              propFullName,
              componentName
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
    return createChainableTypeChecker(emptyFunction.thatReturnsNull);
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
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
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
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        warning(
          false,
          'Invalid argument supplid to oneOfType. Expected an array of check functions, but ' +
          'received %s at index %s.',
          getPostfixForTypeWarning(checker),
          i
        );
        return emptyFunction.thatReturnsNull;
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

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */



if (process.env.NODE_ENV !== 'production') {
  var invariant = __webpack_require__(9);
  var warning = __webpack_require__(13);
  var ReactPropTypesSecret = __webpack_require__(14);
  var loggedTypeFailures = {};
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
  if (process.env.NODE_ENV !== 'production') {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          invariant(typeof typeSpecs[typeSpecName] === 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'React.PropTypes.', componentName || 'React class', location, typeSpecName);
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error);
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          warning(false, 'Failed %s type: %s%s', location, error.message, stack != null ? stack : '');
        }
      }
    }
  }
}

module.exports = checkPropTypes;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */



var emptyFunction = __webpack_require__(12);
var invariant = __webpack_require__(9);
var ReactPropTypesSecret = __webpack_require__(14);

module.exports = function() {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      // It is still safe when called from React.
      return;
    }
    invariant(
      false,
      'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
      'Use PropTypes.checkPropTypes() to call them. ' +
      'Read more at http://fb.me/use-check-prop-types'
    );
  };
  shim.isRequired = shim;
  function getShim() {
    return shim;
  };
  // Important!
  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
  var ReactPropTypes = {
    array: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,

    any: shim,
    arrayOf: getShim,
    element: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim
  };

  ReactPropTypes.checkPropTypes = emptyFunction;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),
/* 84 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
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
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _misc = __webpack_require__(15);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

var _file_input = __webpack_require__(87);

var _file_input2 = _interopRequireDefault(_file_input);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var QuickReply = function (_Component) {
  _inherits(QuickReply, _Component);

  function QuickReply(props) {
    _classCallCheck(this, QuickReply);

    var _this = _possibleConstructorReturn(this, (QuickReply.__proto__ || Object.getPrototypeOf(QuickReply)).call(this, props));

    _this.state = { hover: false };
    return _this;
  }

  _createClass(QuickReply, [{
    key: 'handleClick',
    value: function handleClick(event) {
      this.props.onQuickReplySend && this.props.onQuickReplySend(this.props.title, this.props.payload);
    }
  }, {
    key: 'handleFileUpload',
    value: function handleFileUpload(event) {
      if (!event.target.files) {
        return;
      }

      this.props.onFileUploadSend && this.props.onFileUploadSend(this.props.title, this.props.payload, event.target.files[0]);
    }
  }, {
    key: 'renderFileUpload',
    value: function renderFileUpload(accept) {
      var _this2 = this;

      var backgroundColor = this.state.hover ? (0, _misc.hexToRGBA)(this.props.fgColor, 0.07) : (0, _misc.hexToRGBA)('#ffffff', 0.9);

      return _react2.default.createElement(
        'button',
        {
          className: _style2.default.bubble,
          style: { color: this.props.fgColor, backgroundColor: backgroundColor },
          onMouseOver: function onMouseOver() {
            return _this2.setState({ hover: true });
          },
          onMouseOut: function onMouseOut() {
            return _this2.setState({ hover: false });
          }
        },
        _react2.default.createElement(
          'span',
          null,
          this.props.title
        ),
        _react2.default.createElement(_file_input2.default, {
          name: 'uploadField',
          accept: accept,
          className: _style2.default.filePicker,
          placeholder: this.props.title,
          onChange: this.handleFileUpload.bind(this)
        })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var backgroundColor = this.state.hover ? (0, _misc.hexToRGBA)(this.props.fgColor, 0.07) : (0, _misc.hexToRGBA)('#ffffff', 0.9);

      if (this.props.payload === 'BOTPRESS.IMAGE_UPLOAD') {
        return this.renderFileUpload('image/*');
      }

      if (this.props.payload === 'BOTPRESS.FILE_UPLOAD') {
        return this.renderFileUpload('*/*');
      }

      return _react2.default.createElement(
        'button',
        {
          className: _style2.default.bubble,
          style: { color: this.props.fgColor, backgroundColor: backgroundColor },
          onClick: this.handleClick.bind(this),
          onMouseOver: function onMouseOver() {
            return _this3.setState({ hover: true });
          },
          onMouseOut: function onMouseOut() {
            return _this3.setState({ hover: false });
          }
        },
        this.props.title
      );
    }
  }]);

  return QuickReply;
}(_react.Component);

var QuickReplies = function QuickReplies(props) {
  if (!props.quick_replies) {
    return null;
  }

  var quick_replies = props.quick_replies.map(function (qr) {
    return _react2.default.createElement(QuickReply, _extends({}, props, qr));
  });

  return _react2.default.createElement(
    'div',
    { className: _style2.default.quickReplyContainer },
    quick_replies
  );
};

exports.default = QuickReplies;

/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__avatar___3fBbF {\n  margin-top: 0.15rem;\n  margin-right: 0.75rem;\n  -ms-flex-negative: 0;\n  flex-shrink: 0;\n  width: 1.25rem;\n  height: 1.25rem; }\n  .-botpress-channel-web__style__avatar___3fBbF .-botpress-channel-web__style__color___1M6jC {\n    fill: currentColor; }\n  .-botpress-channel-web__style__avatar___3fBbF .-botpress-channel-web__style__picture___uiWi7 {\n    border-radius: 50%;\n    background-size: cover;\n    background-position: 50%;\n    width: 100%;\n    height: 100%; }\n\n.-botpress-channel-web__style__date___3RYpm {\n  color: #666;\n  text-align: center;\n  font-size: 12px;\n  margin: 40px 0 20px; }\n  .-botpress-channel-web__style__date___3RYpm .-botpress-channel-web__style__smallLine___3MArC {\n    border-bottom: solid 1px #555;\n    margin: auto;\n    width: 80px;\n    margin-top: 5px; }\n\n.-botpress-channel-web__style__messages___tQB_X {\n  -webkit-box-flex: 1;\n  -ms-flex: 1;\n  flex: 1;\n  overflow-y: auto;\n  -ms-flex-positive: 1;\n  flex-grow: 1;\n  padding: 0 0.65rem 1rem; }\n\n.-botpress-channel-web__style__message___2Z-Wf {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  margin: 1rem 0;\n  -webkit-box-align: end;\n  -ms-flex-align: end;\n  align-items: flex-end;\n  padding-right: 18px;\n  padding-left: 0; }\n  .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq {\n    width: 100%;\n    -webkit-box-orient: vertical;\n    -webkit-box-direction: normal;\n    -ms-flex-direction: column;\n    flex-direction: column;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex; }\n    .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__info-line___2iX2w {\n      margin: 0 12px;\n      -webkit-box-flex: 0;\n      -ms-flex: 0 1 auto;\n      flex: 0 1 auto;\n      padding: 0.3125rem 0;\n      font-size: 12px;\n      color: #9a9a9a;\n      -webkit-box-align: center;\n      -ms-flex-align: center;\n      align-items: center;\n      display: -webkit-box;\n      display: -ms-flexbox;\n      display: flex; }\n    .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE {\n      display: -webkit-box;\n      display: -ms-flexbox;\n      display: flex;\n      -webkit-box-orient: vertical;\n      -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n      flex-direction: column;\n      -webkit-box-align: start;\n      -ms-flex-align: start;\n      align-items: flex-start;\n      width: 100%; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE > :not(:last-child) {\n        margin-bottom: 2px; }\n    .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J {\n      border-top-left-radius: 0px;\n      border-bottom-left-radius: 0px;\n      border-top-right-radius: 0px;\n      border-bottom-right-radius: 0px;\n      max-width: 80%;\n      border: 1px solid #f1f1f1;\n      background-color: rgba(255, 255, 255, 0.9);\n      padding: 0.5rem 0.75rem;\n      white-space: pre-wrap;\n      word-break: break-word; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J:first-of-type {\n        border-top-left-radius: 0px;\n        border-top-right-radius: 0px; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J:last-of-type {\n        border-bottom-left-radius: 0px;\n        border-bottom-right-radius: 0px; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J.-botpress-channel-web__style__file___1q6sA {\n        padding: 0; }\n        .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J.-botpress-channel-web__style__file___1q6sA a {\n          display: block;\n          cursor: pointer;\n          border-top-left-radius: inherit;\n          border-top-right-radius: inherit;\n          border-bottom-right-radius: inherit;\n          border-bottom-left-radius: inherit; }\n          .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J.-botpress-channel-web__style__file___1q6sA a img {\n            max-height: 240px;\n            max-width: 100%;\n            border-top-left-radius: inherit;\n            border-top-right-radius: inherit;\n            border-bottom-right-radius: inherit;\n            border-bottom-left-radius: inherit; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J.-botpress-channel-web__style__carousel___3GAV5 {\n        background: none;\n        padding: 0;\n        margin: 10px 0; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J.-botpress-channel-web__style__session_reset___3_pAT {\n        color: red !important;\n        background: none !important;\n        border: none;\n        border-top: 1px solid red;\n        border-bottom: 1px solid red;\n        margin: 10px 0; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J p {\n        margin: 0; }\n      .-botpress-channel-web__style__message___2Z-Wf .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__bubble___eNt_J .-botpress-channel-web__style__specialAction___2EaSP {\n        opacity: 0.6; }\n\n.-botpress-channel-web__style__otherFile___3yT-c {\n  padding: 0.5rem 0.75rem; }\n\n.-botpress-channel-web__style__user___2KjQ8 {\n  padding-right: 0; }\n  .-botpress-channel-web__style__user___2KjQ8 .-botpress-channel-web__style__message-container___1cLJq {\n    -webkit-box-pack: end;\n    -ms-flex-pack: end;\n    justify-content: flex-end;\n    -webkit-box-align: end;\n    -ms-flex-align: end;\n    align-items: flex-end; }\n    .-botpress-channel-web__style__user___2KjQ8 .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE {\n      padding-left: 60px;\n      -webkit-box-pack: end;\n      -ms-flex-pack: end;\n      justify-content: flex-end;\n      -webkit-box-align: end;\n      -ms-flex-align: end;\n      align-items: flex-end; }\n      .-botpress-channel-web__style__user___2KjQ8 .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE .-botpress-channel-web__style__bubble___eNt_J {\n        color: white;\n        border-top-left-radius: 0px;\n        border-bottom-left-radius: 0px;\n        border-top-right-radius: 0px;\n        border-bottom-right-radius: 0px; }\n        .-botpress-channel-web__style__user___2KjQ8 .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE .-botpress-channel-web__style__bubble___eNt_J:first-of-type {\n          border-top-left-radius: 0px;\n          border-top-right-radius: 0px; }\n        .-botpress-channel-web__style__user___2KjQ8 .-botpress-channel-web__style__message-container___1cLJq .-botpress-channel-web__style__group___1GcAE .-botpress-channel-web__style__bubble___eNt_J:last-of-type {\n          border-bottom-right-radius: 0px;\n          border-bottom-left-radius: 0px; }\n\n.-botpress-channel-web__style__formOverlay___2ycVo {\n  background-color: rgba(0, 0, 0, 0.5);\n  width: 100vw;\n  position: absolute;\n  top: 0;\n  z-index: 1000000;\n  height: 100vh;\n  left: 0;\n  padding: 5%; }\n\n.-botpress-channel-web__style__formContainer___5YpLm {\n  width: 320px;\n  margin: auto;\n  background-color: #fff;\n  padding: 25px;\n  border-radius: 5px; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__formClose___2c2Ll {\n    display: inline-block;\n    float: right;\n    vertical-align: top;\n    position: relative;\n    top: 0;\n    cursor: pointer; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__formTextarea___B0S4a {\n    display: block;\n    width: 100%;\n    height: 80px;\n    min-height: 80px;\n    max-width: 270px;\n    padding: 6px 12px;\n    font-size: 14px;\n    line-height: 1.42857143;\n    color: #555;\n    background-color: #fff;\n    background-image: none;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    -webkit-transition: border-color ease-in-out 0.15s, -webkit-box-shadow ease-in-out 0.15s;\n    -o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;\n    transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__formInput___3nun6 {\n    display: block;\n    width: 100%;\n    height: 34px;\n    padding: 6px 12px;\n    font-size: 14px;\n    line-height: 1.42857143;\n    color: #555;\n    background-color: #fff;\n    background-image: none;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n    -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075);\n    -webkit-transition: border-color ease-in-out 0.15s, -webkit-box-shadow ease-in-out 0.15s;\n    -o-transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s;\n    transition: border-color ease-in-out 0.15s, box-shadow ease-in-out 0.15s; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__formTitle___nj4zQ {\n    color: #000;\n    font-size: 18px; }\n  .-botpress-channel-web__style__formContainer___5YpLm label {\n    display: inline-block;\n    max-width: 100%;\n    margin-bottom: 5px;\n    font-weight: bold;\n    font-size: 14px; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__formGroup___2vIrz {\n    margin-bottom: 15px;\n    margin-top: 10px; }\n  .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__buttonLayer___3KNiC {\n    text-align: right; }\n    .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__buttonLayer___3KNiC .-botpress-channel-web__style__formSubmit___yqm-f {\n      display: inline-block;\n      padding: 6px 12px;\n      margin-bottom: 0;\n      font-size: 14px;\n      font-weight: normal;\n      line-height: 1.42857143;\n      text-align: center;\n      white-space: nowrap;\n      vertical-align: middle;\n      -ms-touch-action: manipulation;\n      touch-action: manipulation;\n      cursor: pointer;\n      -webkit-user-select: none;\n      -moz-user-select: none;\n      -ms-user-select: none;\n      user-select: none;\n      background-image: none;\n      border-radius: 4px;\n      color: #333;\n      background-color: #fff;\n      border: 1px solid #ccc; }\n    .-botpress-channel-web__style__formContainer___5YpLm .-botpress-channel-web__style__buttonLayer___3KNiC .-botpress-channel-web__style__formSubmit___yqm-f:hover {\n      background-color: #ccc; }\n\n.-botpress-channel-web__style__loginPromptContainer___SR5Cp label {\n  display: block; }\n\n.-botpress-channel-web__style__loginPromptContainer___SR5Cp .-botpress-channel-web__style__loginInput___jFL-7 {\n  height: 30px;\n  border: none;\n  outline: none;\n  background-color: #f8f8f8;\n  border-bottom: 1px solid #bbb;\n  width: 200px;\n  text-align: center;\n  margin: 10px;\n  font-size: 14px; }\n\n.-botpress-channel-web__style__loginPromptContainer___SR5Cp .-botpress-channel-web__style__loginButton___i7cOj {\n  display: block;\n  font-size: 16px;\n  height: 30px;\n  width: 130px;\n  text-align: center;\n  margin: auto;\n  margin-top: 10px;\n  margin-bottom: 10px;\n  border: none;\n  outline: none;\n  background-color: black;\n  color: white; }\n\n@keyframes -botpress-channel-web__style__typingAnimation___A3b6N {\n  0% {\n    transform: translateY(0px); }\n  28% {\n    transform: translateY(-6px); }\n  44% {\n    transform: translateY(0px); } }\n\n.-botpress-channel-web__style__typingGroup___3DxRA {\n  align-items: center;\n  display: flex;\n  height: 17px; }\n  .-botpress-channel-web__style__typingGroup___3DxRA .-botpress-channel-web__style__typingBubble___2VoUG {\n    animation: -botpress-channel-web__style__typingAnimation___A3b6N 1s infinite ease-in-out;\n    border-radius: 50%;\n    height: 6px;\n    margin-right: 4px;\n    vertical-align: middle;\n    width: 6px;\n    white-space: pre-wrap;\n    font-size: 16px;\n    direction: ltr; }\n    .-botpress-channel-web__style__typingGroup___3DxRA .-botpress-channel-web__style__typingBubble___2VoUG:nth-child(1) {\n      animation-delay: 200ms; }\n    .-botpress-channel-web__style__typingGroup___3DxRA .-botpress-channel-web__style__typingBubble___2VoUG:nth-child(2) {\n      animation-delay: 300ms; }\n    .-botpress-channel-web__style__typingGroup___3DxRA .-botpress-channel-web__style__typingBubble___2VoUG:nth-child(3) {\n      animation-delay: 400ms; }\n\n.-botpress-channel-web__style__quickReplyContainer___1iL8H {\n  box-sizing: border-box;\n  display: block;\n  text-align: right;\n  text-align: right; }\n  .-botpress-channel-web__style__quickReplyContainer___1iL8H button {\n    display: inline-block;\n    margin: 3px 2px;\n    cursor: pointer;\n    text-transform: none;\n    overflow: visible;\n    align-items: flex-start; }\n    .-botpress-channel-web__style__quickReplyContainer___1iL8H button.-botpress-channel-web__style__bubble___eNt_J {\n      box-shadow: none;\n      background-color: rgba(255, 255, 255, 0.9);\n      font-size: 1rem;\n      padding: 0.4rem 0.8rem;\n      width: initial;\n      min-width: 5rem;\n      height: 40px;\n      text-align: center;\n      border: 1px solid currentColor;\n      border-radius: 0px; }\n    .-botpress-channel-web__style__quickReplyContainer___1iL8H button .-botpress-channel-web__style__filePicker___LVaur {\n      top: -32px !important;\n      height: 38px !important;\n      cursor: pointer; }\n\n.-botpress-channel-web__style__carousel___3GAV5 .slick-arrow {\n  background-color: #fff;\n  border: 1px solid #dddfe2;\n  width: 32px;\n  height: 32px;\n  border-radius: 3px;\n  box-shadow: none;\n  color: #444; }\n  .-botpress-channel-web__style__carousel___3GAV5 .slick-arrow:before {\n    color: #444; }\n\n.-botpress-channel-web__style__carousel-item___ryfbW {\n  margin-right: 0px !important;\n  box-sizing: border-box;\n  color: black;\n  line-height: 1.28em;\n  margin-right: 10px;\n  min-height: 150px;\n  max-height: 410px;\n  border: 1px solid rgba(0, 0, 0, 0.1);\n  border-radius: 4px;\n  overflow: hidden; }\n  .-botpress-channel-web__style__carousel-item___ryfbW .-botpress-channel-web__style__picture___uiWi7 {\n    background-position: 50% 50%;\n    background-size: cover;\n    max-height: 150px;\n    width: 100%; }\n  .-botpress-channel-web__style__carousel-item___ryfbW .-botpress-channel-web__style__info___2ozhR {\n    padding: 6px 12px 12px 12px;\n    min-height: 150px; }\n    .-botpress-channel-web__style__carousel-item___ryfbW .-botpress-channel-web__style__info___2ozhR .-botpress-channel-web__style__title___DZhyN {\n      text-overflow: ellipsis;\n      white-space: normal;\n      font-weight: bold;\n      line-height: 1.28em;\n      max-height: 40px;\n      overflow: hidden; }\n    .-botpress-channel-web__style__carousel-item___ryfbW .-botpress-channel-web__style__info___2ozhR .-botpress-channel-web__style__subtitle___1hsEW {\n      color: rgba(0, 0, 0, 0.4); }\n  .-botpress-channel-web__style__carousel-item___ryfbW .-botpress-channel-web__style__action___2J_jR {\n    font-weight: 500;\n    padding: 0 10px;\n    border-top: 1px solid rgba(0, 0, 0, 0.1);\n    display: block;\n    cursor: pointer;\n    text-decoration: none;\n    line-height: 32px;\n    text-align: center; }\n  .-botpress-channel-web__style__carousel-item___ryfbW i.-botpress-channel-web__style__external___30LPw {\n    background: url(/api/botpress-platform-webchat/static/external_icon.png) no-repeat;\n    width: 16px;\n    height: 16px;\n    display: inline-block;\n    background-size: 100% 100%; }\n\n/* IE10+ CSS styles go here */\n@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {\n  .-botpress-channel-web__style__typingGroup___3DxRA .-botpress-channel-web__style__typingBubble___2VoUG {\n    animation: initial; } }\n", ""]);

// exports
exports.locals = {
	"avatar": "-botpress-channel-web__style__avatar___3fBbF",
	"color": "-botpress-channel-web__style__color___1M6jC",
	"picture": "-botpress-channel-web__style__picture___uiWi7",
	"date": "-botpress-channel-web__style__date___3RYpm",
	"smallLine": "-botpress-channel-web__style__smallLine___3MArC",
	"messages": "-botpress-channel-web__style__messages___tQB_X",
	"message": "-botpress-channel-web__style__message___2Z-Wf",
	"message-container": "-botpress-channel-web__style__message-container___1cLJq",
	"info-line": "-botpress-channel-web__style__info-line___2iX2w",
	"group": "-botpress-channel-web__style__group___1GcAE",
	"bubble": "-botpress-channel-web__style__bubble___eNt_J",
	"file": "-botpress-channel-web__style__file___1q6sA",
	"carousel": "-botpress-channel-web__style__carousel___3GAV5",
	"session_reset": "-botpress-channel-web__style__session_reset___3_pAT",
	"specialAction": "-botpress-channel-web__style__specialAction___2EaSP",
	"otherFile": "-botpress-channel-web__style__otherFile___3yT-c",
	"user": "-botpress-channel-web__style__user___2KjQ8",
	"formOverlay": "-botpress-channel-web__style__formOverlay___2ycVo",
	"formContainer": "-botpress-channel-web__style__formContainer___5YpLm",
	"formClose": "-botpress-channel-web__style__formClose___2c2Ll",
	"formTextarea": "-botpress-channel-web__style__formTextarea___B0S4a",
	"formInput": "-botpress-channel-web__style__formInput___3nun6",
	"formTitle": "-botpress-channel-web__style__formTitle___nj4zQ",
	"formGroup": "-botpress-channel-web__style__formGroup___2vIrz",
	"buttonLayer": "-botpress-channel-web__style__buttonLayer___3KNiC",
	"formSubmit": "-botpress-channel-web__style__formSubmit___yqm-f",
	"loginPromptContainer": "-botpress-channel-web__style__loginPromptContainer___SR5Cp",
	"loginInput": "-botpress-channel-web__style__loginInput___jFL-7",
	"loginButton": "-botpress-channel-web__style__loginButton___i7cOj",
	"typingGroup": "-botpress-channel-web__style__typingGroup___3DxRA",
	"typingBubble": "-botpress-channel-web__style__typingBubble___2VoUG",
	"typingAnimation": "-botpress-channel-web__style__typingAnimation___A3b6N",
	"quickReplyContainer": "-botpress-channel-web__style__quickReplyContainer___1iL8H",
	"filePicker": "-botpress-channel-web__style__filePicker___LVaur",
	"carousel-item": "-botpress-channel-web__style__carousel-item___ryfbW",
	"info": "-botpress-channel-web__style__info___2ozhR",
	"title": "-botpress-channel-web__style__title___DZhyN",
	"subtitle": "-botpress-channel-web__style__subtitle___1hsEW",
	"action": "-botpress-channel-web__style__action___2J_jR",
	"external": "-botpress-channel-web__style__external___30LPw"
};

/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FileInput = function (_Component) {
  _inherits(FileInput, _Component);

  function FileInput() {
    var _ref;

    var _temp, _this, _ret;

    _classCallCheck(this, FileInput);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = FileInput.__proto__ || Object.getPrototypeOf(FileInput)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      value: '',
      styles: {
        parent: { position: 'relative' },
        file: {
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0,
          width: '100%',
          zIndex: 1
        },
        text: { position: 'relative', zIndex: -1 }
      }
    }, _this.handleChange = function (e) {
      _this.setState({
        value: e.target.value.split(/(\\|\/)/g).pop()
      });
      if (_this.props.onChange) {
        _this.props.onChange(e);
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(FileInput, [{
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { style: this.state.styles.parent },
        _react2.default.createElement('input', {
          type: 'file',
          name: this.props.name,
          className: this.props.className,
          onChange: this.handleChange,
          accept: this.props.accept,
          style: this.state.styles.file
        }),
        _react2.default.createElement('input', {
          type: 'text',
          tabIndex: -1,
          name: this.props.name + '_filename',
          className: this.props.className,
          onChange: function onChange() {},
          placeholder: this.props.placeholder,
          disabled: this.props.disabled,
          style: this.state.styles.text
        })
      );
    }
  }]);

  return FileInput;
}(_react.Component);

exports.default = FileInput;

/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _misc = __webpack_require__(15);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LoginPrompt = function (_Component) {
  _inherits(LoginPrompt, _Component);

  function LoginPrompt(props) {
    _classCallCheck(this, LoginPrompt);

    var _this = _possibleConstructorReturn(this, (LoginPrompt.__proto__ || Object.getPrototypeOf(LoginPrompt)).call(this, props));

    _this.state = {
      username: '',
      password: ''
    };
    return _this;
  }

  _createClass(LoginPrompt, [{
    key: 'handleChange',
    value: function handleChange(field) {
      var _this2 = this;

      return function (e) {
        _this2.setState(_defineProperty({}, field, e.target.value));
      };
    }
  }, {
    key: 'handleSubmit',
    value: function handleSubmit(event) {
      if (this.props.onLoginPromptSend) {
        this.props.onLoginPromptSend(this.state.username, this.state.password);
      }

      event.preventDefault();
    }
  }, {
    key: 'render_bot_active',
    value: function render_bot_active() {
      var buttonBackgroundColor = (0, _misc.hexToRGBA)(this.props.bgColor, 1);
      var buttonTextColor = (0, _misc.hexToRGBA)(this.props.textColor, 1);

      var fieldTextColor = (0, _misc.hexToRGBA)(this.props.bgColor, 0.7);
      var usernameLineColor = (0, _misc.hexToRGBA)(this.props.bgColor, 0.07);
      var passwordLineColor = (0, _misc.hexToRGBA)(this.props.bgColor, 0.07);

      return _react2.default.createElement(
        'form',
        { className: _style2.default.loginPromptContainer, onSubmit: this.handleSubmit.bind(this) },
        _react2.default.createElement(
          'label',
          null,
          _react2.default.createElement('input', {
            style: { 'border-bottom-color': usernameLineColor, color: fieldTextColor },
            className: _style2.default.loginInput,
            type: 'input',
            placeholder: 'Username',
            onChange: this.handleChange.call(this, 'username')
          })
        ),
        _react2.default.createElement(
          'label',
          null,
          _react2.default.createElement('input', {
            style: { 'border-bottom-color': passwordLineColor, color: fieldTextColor },
            className: _style2.default.loginInput,
            type: 'password',
            placeholder: 'Password',
            onChange: this.handleChange.call(this, 'password')
          })
        ),
        _react2.default.createElement('input', {
          style: { 'background-color': buttonBackgroundColor, color: buttonTextColor },
          className: _style2.default.loginButton,
          type: 'submit',
          value: 'Submit'
        })
      );
    }
  }, {
    key: 'render_bot_past',
    value: function render_bot_past() {
      return _react2.default.createElement(
        'div',
        { className: _style2.default.specialAction },
        _react2.default.createElement(
          'p',
          null,
          '* Login form *'
        )
      );
    }
  }, {
    key: 'render_user',
    value: function render_user() {
      return _react2.default.createElement(
        'div',
        { className: _style2.default.specialAction },
        _react2.default.createElement(
          'p',
          null,
          '* Provided credentials *'
        )
      );
    }
  }, {
    key: 'render',
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
}(_react.Component);

exports.default = LoginPrompt;

/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _misc = __webpack_require__(15);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FileMessage = function (_Component) {
  _inherits(FileMessage, _Component);

  function FileMessage(props) {
    _classCallCheck(this, FileMessage);

    var _this = _possibleConstructorReturn(this, (FileMessage.__proto__ || Object.getPrototypeOf(FileMessage)).call(this, props));

    _this.state = { hover: false };
    return _this;
  }

  _createClass(FileMessage, [{
    key: 'renderLocalFile',
    value: function renderLocalFile() {
      return _react2.default.createElement(
        'div',
        { className: _style2.default.otherFile },
        _react2.default.createElement(
          'div',
          null,
          this.props.file.name,
          ' (local)'
        )
      );
    }
  }, {
    key: 'renderRemoteFile',
    value: function renderRemoteFile() {
      if (this.props.file && this.props.file.mime) {
        if (this.props.file.mime.includes('image/')) {
          return this.renderRemoteImage();
        } else if (this.props.file.mime.includes('audio/')) {
          return this.renderAudio();
        } else if (this.props.file.mime.includes('video/')) {
          return this.renderVideo();
        } else if (this.props.file.mime.includes('audio/')) {
          return this.renderAudio();
        }
      } else {
        return _react2.default.createElement(
          'div',
          { className: _style2.default.otherFile },
          _react2.default.createElement(
            'a',
            { href: this.props.file.url },
            this.props.file.name
          )
        );
      }
    }
  }, {
    key: 'renderRemoteImage',
    value: function renderRemoteImage() {
      return _react2.default.createElement(
        'a',
        { href: this.props.file.url, target: '_blank' },
        _react2.default.createElement('img', { src: this.props.file.url, title: this.props.file.name })
      );
    }
  }, {
    key: 'renderAudio',
    value: function renderAudio() {
      return _react2.default.createElement(
        'audio',
        { controls: true },
        _react2.default.createElement('source', { src: this.props.file.url, type: this.props.file.mime })
      );
    }
  }, {
    key: 'renderVideo',
    value: function renderVideo() {
      return _react2.default.createElement(
        'video',
        { width: '240', controls: true },
        _react2.default.createElement('source', { src: this.props.file.url, type: this.props.file.mime })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      if (this.props.file.storage !== 'local') {
        return this.renderRemoteFile();
      }

      return this.renderLocalFile();
    }
  }]);

  return FileMessage;
}(_react.Component);

exports.default = FileMessage;

/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _reactSlick = __webpack_require__(91);

var _reactSlick2 = _interopRequireDefault(_reactSlick);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

__webpack_require__(109);
__webpack_require__(111);

var CarouselMessage = function (_Component) {
  _inherits(CarouselMessage, _Component);

  function CarouselMessage(props) {
    _classCallCheck(this, CarouselMessage);

    var _this = _possibleConstructorReturn(this, (CarouselMessage.__proto__ || Object.getPrototypeOf(CarouselMessage)).call(this, props));

    _this.handleSendPostBack = function (text, payload) {
      return _this.props.onSendData({ type: 'quick_reply', text: text, data: { payload: payload } });
    };

    _this.state = { hover: false };
    return _this;
  }

  _createClass(CarouselMessage, [{
    key: 'render',
    value: function render() {
      var _this2 = this;

      var CarouselElement = function CarouselElement(el) {
        return _react2.default.createElement(
          'div',
          { className: _style2.default['carousel-item'] },
          el.picture && _react2.default.createElement('div', { className: _style2.default.picture, style: { backgroundImage: 'url("' + el.picture + '")' } }),
          _react2.default.createElement(
            'div',
            { className: _style2.default.more },
            _react2.default.createElement(
              'div',
              { className: _style2.default.info },
              _react2.default.createElement(
                'div',
                { className: _style2.default.title },
                el.title
              ),
              el.subtitle && _react2.default.createElement(
                'div',
                { className: _style2.default.subtitle },
                el.subtitle
              )
            ),
            _react2.default.createElement(
              'div',
              { className: _style2.default.buttons },
              el.buttons.map(function (btn) {
                if (btn.url) {
                  return _react2.default.createElement(
                    'a',
                    { href: btn.url, target: '_blank', className: _style2.default.action },
                    _react2.default.createElement('i', { className: _style2.default.external }),
                    btn.title || btn
                  );
                } else if (btn.payload) {
                  return _react2.default.createElement(
                    'a',
                    {
                      href: true,
                      onClick: function onClick() {
                        return _this2.handleSendPostBack(btn.text || btn.title, btn.payload);
                      },
                      className: _style2.default.action
                    },
                    btn.title || btn
                  );
                } else {
                  return _react2.default.createElement(
                    'a',
                    { href: '#', target: '_blank', className: _style2.default.action },
                    _react2.default.createElement('i', { className: _style2.default.external }),
                    '[NO LINK] ',
                    btn.title || btn
                  );
                }
              })
            )
          )
        );
      };

      var elements = this.props.carousel.elements || [];
      var defaultSettings = {
        dots: false,
        infinite: false,
        responsive: [{ breakpoint: 550, settings: { slidesToShow: 1 } }, { breakpoint: 1024, settings: { slidesToShow: 2 } }, { breakpoint: 1548, settings: { slidesToShow: 3 } }, { breakpoint: 2072, settings: { slidesToShow: 4 } }, { breakpoint: 10000, settings: 'unslick' }],
        slidesToScroll: 1,
        autoplay: false,
        centerMode: false,
        arrows: elements.length > 1
      };

      var settings = Object.assign({}, defaultSettings, this.props.carousel.settings);

      return _react2.default.createElement(
        _reactSlick2.default,
        settings,
        elements.map(function (el) {
          return CarouselElement(el);
        })
      );
    }
  }]);

  return CarouselMessage;
}(_react.Component);

exports.default = CarouselMessage;

/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = __webpack_require__(92);

/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _innerSlider = __webpack_require__(93);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _json2mq = __webpack_require__(102);

var _json2mq2 = _interopRequireDefault(_json2mq);

var _defaultProps = __webpack_require__(25);

var _defaultProps2 = _interopRequireDefault(_defaultProps);

var _canUseDom = __webpack_require__(104);

var _canUseDom2 = _interopRequireDefault(_canUseDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var enquire = _canUseDom2.default && __webpack_require__(105);

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
    enquire.register(query, handler);
    this._responsiveMediaHandlers.push({ query: query, handler: handler });
  };

  Slider.prototype.componentWillMount = function componentWillMount() {
    var _this2 = this;

    if (this.props.responsive) {
      var breakpoints = this.props.responsive.map(function (breakpt) {
        return breakpt.breakpoint;
      });
      breakpoints.sort(function (x, y) {
        return x - y;
      });

      breakpoints.forEach(function (breakpoint, index) {
        var bQuery;
        if (index === 0) {
          bQuery = (0, _json2mq2.default)({ minWidth: 0, maxWidth: breakpoint });
        } else {
          bQuery = (0, _json2mq2.default)({ minWidth: breakpoints[index - 1], maxWidth: breakpoint });
        }
        _canUseDom2.default && _this2.media(bQuery, function () {
          _this2.setState({ breakpoint: breakpoint });
        });
      });

      // Register media query for full screen. Need to support resize from small to large
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

  Slider.prototype.render = function render() {
    var _this3 = this;

    var settings;
    var newProps;
    if (this.state.breakpoint) {
      newProps = this.props.responsive.filter(function (resp) {
        return resp.breakpoint === _this3.state.breakpoint;
      });
      settings = newProps[0].settings === 'unslick' ? 'unslick' : (0, _objectAssign2.default)({}, this.props, newProps[0].settings);
    } else {
      settings = (0, _objectAssign2.default)({}, _defaultProps2.default, this.props);
    }

    var children = this.props.children;
    if (!Array.isArray(children)) {
      children = [children];
    }

    // Children may contain false or null, so we should filter them
    children = children.filter(function (child) {
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
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

exports.__esModule = true;
exports.InnerSlider = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _eventHandlers = __webpack_require__(94);

var _eventHandlers2 = _interopRequireDefault(_eventHandlers);

var _helpers = __webpack_require__(16);

var _helpers2 = _interopRequireDefault(_helpers);

var _initialState = __webpack_require__(95);

var _initialState2 = _interopRequireDefault(_initialState);

var _defaultProps = __webpack_require__(25);

var _defaultProps2 = _interopRequireDefault(_defaultProps);

var _createReactClass = __webpack_require__(96);

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _track = __webpack_require__(99);

var _dots = __webpack_require__(100);

var _arrows = __webpack_require__(101);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var InnerSlider = exports.InnerSlider = (0, _createReactClass2.default)({
  displayName: 'InnerSlider',

  mixins: [_helpers2.default, _eventHandlers2.default],
  list: null,
  track: null,
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
  getDefaultProps: function getDefaultProps() {
    return _defaultProps2.default;
  },
  componentWillMount: function componentWillMount() {
    if (this.props.init) {
      this.props.init();
    }
    this.setState({
      mounted: true
    });
    var lazyLoadedList = [];
    for (var i = 0; i < _react2.default.Children.count(this.props.children); i++) {
      if (i >= this.state.currentSlide && i < this.state.currentSlide + this.props.slidesToShow) {
        lazyLoadedList.push(i);
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
      if (process.env.NODE_ENV !== 'production') {
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
        customPaging: this.props.customPaging
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
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;

var _trackHelper = __webpack_require__(24);

var _helpers = __webpack_require__(16);

var _helpers2 = _interopRequireDefault(_helpers);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _reactDom = __webpack_require__(7);

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventHandlers = {
  // Event handler for previous and next
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
      if (this.props.lazyLoad) {
        previousInt = currentSlide - slideOffset;
        targetSlide = previousInt === -1 ? slideCount - 1 : previousInt;
      }
    } else if (options.message === 'next') {
      slideOffset = indexOffset === 0 ? slidesToScroll : indexOffset;
      targetSlide = currentSlide + slideOffset;
      if (this.props.lazyLoad) {
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
    var dotCount = Math.ceil(this.state.slideCount / this.props.slidesToScroll);
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
      swipeLeft = curLeft + touchSwipeLength * positionOffset;
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

      var slidesTraversed = Math.abs(swipedSlide.dataset.index - this.state.currentSlide) || 1;

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
/* 95 */
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
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var React = __webpack_require__(0);
var factory = __webpack_require__(97);

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
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var _assign = __webpack_require__(5);

var emptyObject = __webpack_require__(98);
var _invariant = __webpack_require__(9);

if (process.env.NODE_ENV !== 'production') {
  var warning = __webpack_require__(13);
}

var MIXINS_KEY = 'mixins';

// Helper function to allow the creation of anonymous functions which do not
// have .name set to the name of the variable being assigned to.
function identity(fn) {
  return fn;
}

var ReactPropTypeLocationNames;
if (process.env.NODE_ENV !== 'production') {
  ReactPropTypeLocationNames = {
    prop: 'prop',
    context: 'context',
    childContext: 'child context'
  };
} else {
  ReactPropTypeLocationNames = {};
}

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
      if (process.env.NODE_ENV !== 'production') {
        validateTypeDef(Constructor, childContextTypes, 'childContext');
      }
      Constructor.childContextTypes = _assign(
        {},
        Constructor.childContextTypes,
        childContextTypes
      );
    },
    contextTypes: function(Constructor, contextTypes) {
      if (process.env.NODE_ENV !== 'production') {
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
      if (process.env.NODE_ENV !== 'production') {
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
        if (process.env.NODE_ENV !== 'production') {
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
      if (process.env.NODE_ENV !== 'production') {
        var typeofSpec = typeof spec;
        var isMixinValid = typeofSpec === 'object' && spec !== null;

        if (process.env.NODE_ENV !== 'production') {
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
            if (process.env.NODE_ENV !== 'production') {
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

      var isInherited = name in Constructor;
      _invariant(
        !isInherited,
        'ReactClass: You are attempting to define ' +
          '`%s` on your component more than once. This conflict may be ' +
          'due to a mixin.',
        name
      );
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
    if (process.env.NODE_ENV !== 'production') {
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
          if (process.env.NODE_ENV !== 'production') {
            warning(
              false,
              'bind(): React component methods may only be bound to the ' +
                'component instance. See %s',
              componentName
            );
          }
        } else if (!args.length) {
          if (process.env.NODE_ENV !== 'production') {
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
      if (process.env.NODE_ENV !== 'production') {
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

      if (process.env.NODE_ENV !== 'production') {
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
      if (process.env.NODE_ENV !== 'production') {
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

    if (process.env.NODE_ENV !== 'production') {
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

    if (process.env.NODE_ENV !== 'production') {
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

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */



var emptyObject = {};

if (process.env.NODE_ENV !== 'production') {
  Object.freeze(emptyObject);
}

module.exports = emptyObject;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.Track = undefined;

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _objectAssign = __webpack_require__(5);

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getSlideClasses = function getSlideClasses(spec) {
  var slickActive, slickCenter, slickCloned;
  var centerOffset, index;

  if (spec.rtl) {
    index = spec.slideCount - 1 - spec.index;
  } else {
    index = spec.index;
  }
  slickCloned = index < 0 || index >= spec.slideCount;
  if (spec.centerMode) {
    centerOffset = Math.floor(spec.slidesToShow / 2);
    slickCenter = (index - spec.currentSlide) % spec.slideCount === 0;
    if (index > spec.currentSlide - centerOffset - 1 && index <= spec.currentSlide + centerOffset) {
      slickActive = true;
    }
  } else {
    slickActive = spec.currentSlide <= index && index < spec.currentSlide + spec.slidesToShow;
  }
  return (0, _classnames2.default)({
    'slick-slide': true,
    'slick-active': slickActive,
    'slick-center': slickCenter,
    'slick-cloned': slickCloned
  });
};

var getSlideStyle = function getSlideStyle(spec) {
  var style = {};

  if (spec.variableWidth === undefined || spec.variableWidth === false) {
    style.width = spec.slideWidth;
  }

  if (spec.fade) {
    style.position = 'relative';
    style.left = -spec.index * spec.slideWidth;
    style.opacity = spec.currentSlide === spec.index ? 1 : 0;
    style.transition = 'opacity ' + spec.speed + 'ms ' + spec.cssEase;
    style.WebkitTransition = 'opacity ' + spec.speed + 'ms ' + spec.cssEase;
  }

  return style;
};

var getKey = function getKey(child, fallbackKey) {
  // key could be a zero
  return child.key === null || child.key === undefined ? fallbackKey : child.key;
};

var renderSlides = function renderSlides(spec) {
  var key;
  var slides = [];
  var preCloneSlides = [];
  var postCloneSlides = [];
  var count = _react2.default.Children.count(spec.children);

  _react2.default.Children.forEach(spec.children, function (elem, index) {
    var child = void 0;
    var childOnClickOptions = {
      message: 'children',
      index: index,
      slidesToScroll: spec.slidesToScroll,
      currentSlide: spec.currentSlide
    };

    if (!spec.lazyLoad | (spec.lazyLoad && spec.lazyLoadedList.indexOf(index) >= 0)) {
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

    slides.push(_react2.default.cloneElement(child, {
      key: 'original' + getKey(child, index),
      'data-index': index,
      className: (0, _classnames2.default)(getSlideClasses((0, _objectAssign2.default)({ index: index }, spec)), slideClass),
      tabIndex: '-1',
      style: (0, _objectAssign2.default)({ outline: 'none' }, child.props.style || {}, childStyle),
      onClick: onClick
    }));

    // variableWidth doesn't wrap properly.
    if (spec.infinite && spec.fade === false) {
      var infiniteCount = spec.variableWidth ? spec.slidesToShow + 1 : spec.slidesToShow;

      if (index >= count - infiniteCount) {
        key = -(count - index);
        preCloneSlides.push(_react2.default.cloneElement(child, {
          key: 'precloned' + getKey(child, key),
          'data-index': key,
          className: (0, _classnames2.default)(getSlideClasses((0, _objectAssign2.default)({ index: key }, spec)), slideClass),
          style: (0, _objectAssign2.default)({}, child.props.style || {}, childStyle),
          onClick: onClick
        }));
      }

      if (index < infiniteCount) {
        key = count + index;
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
    var slides = renderSlides.call(this, this.props);
    return _react2.default.createElement(
      'div',
      { className: 'slick-track', style: this.props.trackStyle },
      slides
    );
  };

  return Track;
}(_react2.default.Component);

/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.Dots = undefined;

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var getDotCount = function getDotCount(spec) {
  var dots;
  dots = Math.ceil(spec.slideCount / spec.slidesToScroll);
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
      slidesToScroll: this.props.slidesToScroll
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
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.NextArrow = exports.PrevArrow = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _classnames = __webpack_require__(2);

var _classnames2 = _interopRequireDefault(_classnames);

var _helpers = __webpack_require__(16);

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
    var prevArrow;

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
    var nextArrow;

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
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

var camel2hyphen = __webpack_require__(103);

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
/* 103 */
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
/* 104 */
/***/ (function(module, exports) {

var canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

module.exports = canUseDOM;

/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

var MediaQueryDispatch = __webpack_require__(106);
module.exports = new MediaQueryDispatch();


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

var MediaQuery = __webpack_require__(107);
var Util = __webpack_require__(26);
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
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

var QueryHandler = __webpack_require__(108);
var each = __webpack_require__(26).each;

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
/* 108 */
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
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(110);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../css-loader/index.js!./slick.css", function() {
			var newContent = require("!!../../css-loader/index.js!./slick.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, "/* Slider */\n.slick-slider\n{\n    position: relative;\n\n    display: block;\n    box-sizing: border-box;\n\n    -webkit-user-select: none;\n       -moz-user-select: none;\n        -ms-user-select: none;\n            user-select: none;\n\n    -webkit-touch-callout: none;\n    -khtml-user-select: none;\n    -ms-touch-action: pan-y;\n        touch-action: pan-y;\n    -webkit-tap-highlight-color: transparent;\n}\n\n.slick-list\n{\n    position: relative;\n\n    display: block;\n    overflow: hidden;\n\n    margin: 0;\n    padding: 0;\n}\n.slick-list:focus\n{\n    outline: none;\n}\n.slick-list.dragging\n{\n    cursor: pointer;\n    cursor: hand;\n}\n\n.slick-slider .slick-track,\n.slick-slider .slick-list\n{\n    -webkit-transform: translate3d(0, 0, 0);\n       -moz-transform: translate3d(0, 0, 0);\n        -ms-transform: translate3d(0, 0, 0);\n         -o-transform: translate3d(0, 0, 0);\n            transform: translate3d(0, 0, 0);\n}\n\n.slick-track\n{\n    position: relative;\n    top: 0;\n    left: 0;\n\n    display: block;\n    margin-left: auto;\n    margin-right: auto;\n}\n.slick-track:before,\n.slick-track:after\n{\n    display: table;\n\n    content: '';\n}\n.slick-track:after\n{\n    clear: both;\n}\n.slick-loading .slick-track\n{\n    visibility: hidden;\n}\n\n.slick-slide\n{\n    display: none;\n    float: left;\n\n    height: 100%;\n    min-height: 1px;\n}\n[dir='rtl'] .slick-slide\n{\n    float: right;\n}\n.slick-slide img\n{\n    display: block;\n}\n.slick-slide.slick-loading img\n{\n    display: none;\n}\n.slick-slide.dragging img\n{\n    pointer-events: none;\n}\n.slick-initialized .slick-slide\n{\n    display: block;\n}\n.slick-loading .slick-slide\n{\n    visibility: hidden;\n}\n.slick-vertical .slick-slide\n{\n    display: block;\n\n    height: auto;\n\n    border: 1px solid transparent;\n}\n.slick-arrow.slick-hidden {\n    display: none;\n}\n", ""]);

// exports


/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(112);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../css-loader/index.js!./slick-theme.css", function() {
			var newContent = require("!!../../css-loader/index.js!./slick-theme.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

var escape = __webpack_require__(113);
exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, "@charset 'UTF-8';\n/* Slider */\n.slick-loading .slick-list\n{\n    background: #fff url(" + escape(__webpack_require__(114)) + ") center center no-repeat;\n}\n\n/* Icons */\n@font-face\n{\n    font-family: 'slick';\n    font-weight: normal;\n    font-style: normal;\n\n    src: url(" + escape(__webpack_require__(27)) + ");\n    src: url(" + escape(__webpack_require__(27)) + "?#iefix) format('embedded-opentype'), url(" + escape(__webpack_require__(115)) + ") format('woff'), url(" + escape(__webpack_require__(116)) + ") format('truetype'), url(" + escape(__webpack_require__(117)) + "#slick) format('svg');\n}\n/* Arrows */\n.slick-prev,\n.slick-next\n{\n    font-size: 0;\n    line-height: 0;\n\n    position: absolute;\n    top: 50%;\n\n    display: block;\n\n    width: 20px;\n    height: 20px;\n    padding: 0;\n    -webkit-transform: translate(0, -50%);\n    -ms-transform: translate(0, -50%);\n    transform: translate(0, -50%);\n\n    cursor: pointer;\n\n    color: transparent;\n    border: none;\n    outline: none;\n    background: transparent;\n}\n.slick-prev:hover,\n.slick-prev:focus,\n.slick-next:hover,\n.slick-next:focus\n{\n    color: transparent;\n    outline: none;\n    background: transparent;\n}\n.slick-prev:hover:before,\n.slick-prev:focus:before,\n.slick-next:hover:before,\n.slick-next:focus:before\n{\n    opacity: 1;\n}\n.slick-prev.slick-disabled:before,\n.slick-next.slick-disabled:before\n{\n    opacity: .25;\n}\n\n.slick-prev:before,\n.slick-next:before\n{\n    font-family: 'slick';\n    font-size: 20px;\n    line-height: 1;\n\n    opacity: .75;\n    color: white;\n\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n}\n\n.slick-prev\n{\n    left: -25px;\n}\n[dir='rtl'] .slick-prev\n{\n    right: -25px;\n    left: auto;\n}\n.slick-prev:before\n{\n    content: '\\2190';\n}\n[dir='rtl'] .slick-prev:before\n{\n    content: '\\2192';\n}\n\n.slick-next\n{\n    right: -25px;\n}\n[dir='rtl'] .slick-next\n{\n    right: auto;\n    left: -25px;\n}\n.slick-next:before\n{\n    content: '\\2192';\n}\n[dir='rtl'] .slick-next:before\n{\n    content: '\\2190';\n}\n\n/* Dots */\n.slick-dotted.slick-slider\n{\n    margin-bottom: 30px;\n}\n\n.slick-dots\n{\n    position: absolute;\n    bottom: -25px;\n\n    display: block;\n\n    width: 100%;\n    padding: 0;\n    margin: 0;\n\n    list-style: none;\n\n    text-align: center;\n}\n.slick-dots li\n{\n    position: relative;\n\n    display: inline-block;\n\n    width: 20px;\n    height: 20px;\n    margin: 0 5px;\n    padding: 0;\n\n    cursor: pointer;\n}\n.slick-dots li button\n{\n    font-size: 0;\n    line-height: 0;\n\n    display: block;\n\n    width: 20px;\n    height: 20px;\n    padding: 5px;\n\n    cursor: pointer;\n\n    color: transparent;\n    border: 0;\n    outline: none;\n    background: transparent;\n}\n.slick-dots li button:hover,\n.slick-dots li button:focus\n{\n    outline: none;\n}\n.slick-dots li button:hover:before,\n.slick-dots li button:focus:before\n{\n    opacity: 1;\n}\n.slick-dots li button:before\n{\n    font-family: 'slick';\n    font-size: 6px;\n    line-height: 20px;\n\n    position: absolute;\n    top: 0;\n    left: 0;\n\n    width: 20px;\n    height: 20px;\n\n    content: '\\2022';\n    text-align: center;\n\n    opacity: .25;\n    color: black;\n\n    -webkit-font-smoothing: antialiased;\n    -moz-osx-font-smoothing: grayscale;\n}\n.slick-dots li.slick-active button:before\n{\n    opacity: .75;\n    color: black;\n}\n", ""]);

// exports


/***/ }),
/* 113 */
/***/ (function(module, exports) {

module.exports = function escape(url) {
    // If url is already wrapped in quotes, remove them
    if (/^['"].*['"]$/.test(url)) {
        url = url.slice(1, -1);
    }
    // Should url be wrapped?
    // See https://drafts.csswg.org/css-values-3/#urls
    if (/["'() \t\n]/.test(url)) {
        return '"' + url.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
    }

    return url
}


/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "68b0c4fcb84d239f261c1a5e65818142.gif";

/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "../fonts/slick.woff";

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "../fonts/slick.ttf";

/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "../fonts/slick.svg";

/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(0);

var _react2 = _interopRequireDefault(_react);

var _style = __webpack_require__(8);

var _style2 = _interopRequireDefault(_style);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FormElement = function (_Component) {
  _inherits(FormElement, _Component);

  function FormElement(props) {
    _classCallCheck(this, FormElement);

    var _this = _possibleConstructorReturn(this, (FormElement.__proto__ || Object.getPrototypeOf(FormElement)).call(this, props));

    _this.state = { hide: false };
    return _this;
  }

  _createClass(FormElement, [{
    key: 'changeState',
    value: function changeState(field) {
      var _this2 = this;

      return function (e) {
        _this2.props.parent.setState(_defineProperty({}, field, e.target.value));
      };
    }
  }, {
    key: 'render',
    value: function render() {
      switch (this.props.type) {
        case 'input':
          return _react2.default.createElement(
            'div',
            { className: _style2.default.formGroup },
            _react2.default.createElement(
              'label',
              null,
              this.props.label
            ),
            _react2.default.createElement('input', {
              className: _style2.default.formInput,
              type: this.props.subtype,
              placeholder: this.props.placeholder,
              name: this.props.name,
              onChange: this.changeState.call(this, this.props.name),
              maxLength: this.props.maxlength,
              minLength: this.props.minlength,
              required: this.props.required
            })
          );
          break;
        case 'textarea':
          return _react2.default.createElement(
            'div',
            { className: _style2.default.formGroup },
            _react2.default.createElement(
              'label',
              null,
              this.props.label
            ),
            _react2.default.createElement('textarea', {
              type: this.props.subtype,
              className: _style2.default.formTextarea,
              placeholder: this.props.placeholder,
              name: this.props.name,
              onChange: this.changeState.call(this, this.props.name),
              maxLength: this.props.maxlength,
              minLength: this.props.minlength,
              required: this.props.required
            })
          );
          break;
        case 'select':
          var options = this.props.options.map(function (se) {
            return _react2.default.createElement(
              'option',
              { value: se.option.value },
              se.option.label
            );
          });
          var placeholder = '';
          if (this.props.placeholder) {
            placeholder = _react2.default.createElement(
              'option',
              { value: '' },
              this.props.placeholder
            );
          }
          return _react2.default.createElement(
            'div',
            { className: _style2.default.formGroup },
            _react2.default.createElement(
              'label',
              null,
              this.props.label
            ),
            _react2.default.createElement(
              'select',
              {
                className: _style2.default.formInput,
                value: this.state.value,
                onChange: this.changeState.call(this, this.props.name),
                name: this.props.name,
                required: this.props.required
              },
              placeholder,
              options
            )
          );
          break;
      }
    }
  }]);

  return FormElement;
}(_react.Component);

var Form = function (_Component2) {
  _inherits(Form, _Component2);

  function Form(props) {
    _classCallCheck(this, Form);

    var _this3 = _possibleConstructorReturn(this, (Form.__proto__ || Object.getPrototypeOf(Form)).call(this, props));

    _this3.state = {};
    return _this3;
  }

  _createClass(Form, [{
    key: 'handleSubmit',
    value: function handleSubmit(event) {
      event.preventDefault();
      if (this.props.onFormSend) {
        var representation = '';
        for (var key in this.state) {
          representation += key + ': ' + this.state[key] + '\n';
        }
        this.props.onFormSend(this.state, this.props.formId, representation);
      }
    }
  }, {
    key: 'handleClose',
    value: function handleClose(event) {
      this.setState({ hide: true });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      if (this.state.hide) {
        return null;
      }
      if (!this.props.elements) {
        return null;
      }
      var elements = this.props.elements.map(function (fe) {
        return _react2.default.createElement(FormElement, _extends({ parent: _this4 }, _this4.props, fe));
      });
      return _react2.default.createElement(
        'div',
        { className: _style2.default.formOverlay },
        _react2.default.createElement(
          'form',
          { className: _style2.default.formContainer, onSubmit: this.handleSubmit.bind(this) },
          _react2.default.createElement(
            'div',
            { onClick: this.handleClose.bind(this), className: _style2.default.formClose },
            _react2.default.createElement(
              'svg',
              { version: '1.1', width: '15', height: '15', xmlns: 'http://www.w3.org/2000/svg' },
              _react2.default.createElement('line', { x1: '1', y1: '15', x2: '15', y2: '1', stroke: 'grey', 'stroke-width': '2' }),
              _react2.default.createElement('line', { x1: '1', y1: '1', x2: '15', y2: '15', stroke: 'grey', 'stroke-width': '2' })
            )
          ),
          _react2.default.createElement(
            'div',
            { className: _style2.default.formTitle },
            this.props.title
          ),
          elements,
          _react2.default.createElement(
            'div',
            { className: _style2.default.buttonLayer },
            _react2.default.createElement('input', { className: _style2.default.formSubmit, type: 'submit', value: 'Submit' })
          )
        )
      );
    }
  }]);

  return Form;
}(_react.Component);

exports.default = Form;

/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(120);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../../../node_modules/css-loader/index.js??ref--1-1!../../../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__external___1BNU9 * {\n  box-sizing: border-box;\n  outline: none; }\n\n.-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K {\n  position: absolute;\n  bottom: 0;\n  right: 0;\n  width: 100%;\n  height: 100%;\n  border-left: 1px solid #ccc;\n  visibility: hidden;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -ms-flex-direction: column;\n  flex-direction: column;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex; }\n  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K.-botpress-channel-web__style__fullscreen___jVih9 {\n    visibility: visible; }\n  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-pack: justify;\n    -ms-flex-pack: justify;\n    justify-content: space-between;\n    -webkit-box-align: center;\n    -ms-flex-align: center;\n    align-items: center;\n    -ms-flex-negative: 0;\n    flex-shrink: 0;\n    height: 52px;\n    font-weight: 500;\n    border-bottom: 1px solid #ccc;\n    padding: 0 1rem;\n    overflow: hidden; }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu {\n      overflow: hidden;\n      text-overflow: ellipsis;\n      -webkit-box-flex: 1;\n      -ms-flex: 1 1 auto;\n      flex: 1 1 auto; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ {\n        -webkit-box-align: center;\n        -ms-flex-align: center;\n        align-items: center;\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__avatar___Fj3lF {\n          padding-left: 0;\n          overflow: hidden;\n          flex-shrink: 0;\n          width: 1.875rem;\n          height: 1.875rem; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__avatar___Fj3lF .-botpress-channel-web__style__picture___1PvOc {\n            border-radius: 50%;\n            background-size: cover;\n            background-position: 50%;\n            width: 100%;\n            height: 100%; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__title___MJj5o {\n          padding-left: 10px;\n          overflow: hidden;\n          -webkit-box-orient: vertical;\n          -webkit-box-direction: normal;\n          -ms-flex-direction: column;\n          flex-direction: column;\n          -webkit-box-pack: center;\n          -ms-flex-pack: center;\n          justify-content: center;\n          -webkit-box-align: start;\n          -ms-flex-align: start;\n          align-items: flex-start;\n          display: -webkit-box;\n          display: -ms-flexbox;\n          display: flex; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__title___MJj5o .-botpress-channel-web__style__name___2gsld {\n            font-weight: 500;\n            overflow: hidden;\n            white-space: nowrap;\n            text-overflow: ellipsis; }\n            .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__title___MJj5o .-botpress-channel-web__style__name___2gsld .-botpress-channel-web__style__unread___1Ms8n {\n              display: inline-block;\n              width: 20px;\n              height: 20px;\n              margin-left: 5px;\n              text-align: center;\n              vertical-align: top;\n              border-radius: 50%;\n              line-height: 20px;\n              font-size: 12px;\n              color: #fff;\n              background-color: #ff5d5d; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__title___MJj5o .-botpress-channel-web__style__status___J-Mqv {\n            overflow: hidden;\n            white-space: nowrap;\n            text-overflow: ellipsis;\n            font-size: 0.75rem;\n            font-weight: 500;\n            color: #9a9a9a;\n            vertical-align: middle;\n            margin-top: 0px; }\n            .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__title___MJj5o .-botpress-channel-web__style__status___J-Mqv svg {\n              fill: #81d135;\n              height: 8px;\n              width: 8px;\n              margin-right: 3px; }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__icon___3-4NF {\n      color: #bbb;\n      margin-left: 22px;\n      text-align: right;\n      vertical-align: middle;\n      cursor: pointer; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__icon___3-4NF:hover {\n        color: #aaa; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__header___1urkm .-botpress-channel-web__style__icon___3-4NF svg {\n        fill: currentColor; }\n  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj {\n    -webkit-box-flex: 1;\n    -ms-flex: 1;\n    flex: 1;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-orient: vertical;\n    -webkit-box-direction: normal;\n    -ms-flex-direction: column;\n    flex-direction: column;\n    min-height: 1px; }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj:before {\n      content: ' ';\n      position: absolute;\n      top: 50px;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      opacity: 0.05;\n      z-index: -1;\n      background: url(/api/botpress-platform-webchat/static/background_1.png); }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ {\n      border-top-width: 1px;\n      border-top-style: solid;\n      border-top-color: #eee;\n      position: relative;\n      padding: 0.5rem 0 0;\n      background: rgba(255, 255, 255, 0.9);\n      transition: border 0.3s ease; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn {\n        -webkit-box-orient: vertical;\n        -webkit-box-direction: normal;\n        -ms-flex-direction: column;\n        flex-direction: column;\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn textarea {\n          height: 43px;\n          width: 100%;\n          border: none;\n          font-size: 1rem;\n          resize: none;\n          line-height: 1.2;\n          padding: 0.75rem 1rem;\n          margin-bottom: 0.5rem;\n          background-color: transparent;\n          font: inherit; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ {\n          display: -webkit-box;\n          display: -ms-flexbox;\n          display: flex;\n          padding: 0 1rem 0.75rem;\n          -webkit-box-pack: justify;\n          -ms-flex-pack: justify;\n          justify-content: space-between;\n          -webkit-box-align: center;\n          -ms-flex-align: center;\n          align-items: center; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC {\n            display: -webkit-box;\n            display: -ms-flexbox;\n            display: flex;\n            list-style-type: none;\n            margin: 0;\n            padding: 0; }\n            .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC li {\n              margin-left: 0;\n              display: inline-block;\n              margin-right: 1rem; }\n              .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC li a {\n                color: #ccc; }\n                .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC li a:hover {\n                  color: #aaa; }\n                .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC li a i {\n                  -webkit-box-align: center;\n                  -ms-flex-align: center;\n                  align-items: center; }\n                  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__conversation___c85Kj .-botpress-channel-web__style__bottom___1lsNX .-botpress-channel-web__style__composer___IYeWQ .-botpress-channel-web__style__flex-column___1e3hn .-botpress-channel-web__style__line___26cWZ .-botpress-channel-web__style__elements___vP2lC li a i svg {\n                    fill: currentColor; }\n  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU {\n    -webkit-box-flex: 1;\n    -ms-flex-positive: 1;\n    flex-grow: 1;\n    overflow-y: auto;\n    overflow-x: hidden; }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk {\n      height: 4.7rem;\n      border-bottom: 1px solid #eee;\n      cursor: pointer;\n      -webkit-box-align: center;\n      -ms-flex-align: center;\n      align-items: center;\n      display: -webkit-box;\n      display: -ms-flexbox;\n      display: flex; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk:hover {\n        background-color: #fafafa; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__left___3E1xu {\n        position: relative; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__avatar___Fj3lF {\n          margin: 0 0.8rem;\n          width: 3.125rem;\n          height: 3.125rem;\n          -ms-flex-negative: 0;\n          flex-shrink: 0; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__left___3E1xu .-botpress-channel-web__style__avatar___Fj3lF .-botpress-channel-web__style__picture___1PvOc {\n            background-size: cover;\n            background-position: 50%;\n            border-radius: 50%;\n            width: 100%;\n            height: 100%; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__right___2li81 {\n        -webkit-box-flex: 1;\n        -ms-flex: 1;\n        flex: 1;\n        padding-right: 1rem;\n        -webkit-box-orient: vertical;\n        -webkit-box-direction: normal;\n        -ms-flex-direction: column;\n        flex-direction: column;\n        display: -webkit-box;\n        display: -ms-flexbox;\n        display: flex; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__right___2li81 .-botpress-channel-web__style__title___MJj5o {\n          -webkit-box-align: center;\n          -ms-flex-align: center;\n          align-items: center;\n          display: -webkit-box;\n          display: -ms-flexbox;\n          display: flex;\n          position: relative; }\n          .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__right___2li81 .-botpress-channel-web__style__title___MJj5o .-botpress-channel-web__style__date___HhsxQ {\n            text-align: right;\n            font-size: 0.875rem;\n            color: #9a9a9a;\n            position: absolute;\n            right: 0; }\n        .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__list___3AhoU .-botpress-channel-web__style__item___3h7Uk .-botpress-channel-web__style__right___2li81 .-botpress-channel-web__style__text___38Uzh {\n          font-size: 0.875rem;\n          color: #9a9a9a;\n          max-width: 15rem;\n          overflow: hidden;\n          white-space: nowrap;\n          text-overflow: ellipsis; }\n  .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    -webkit-box-orient: vertical;\n    -webkit-box-direction: normal;\n    -ms-flex-direction: column;\n    flex-direction: column;\n    -webkit-box-align: stretch;\n    -ms-flex-align: stretch;\n    align-items: stretch;\n    overflow: hidden;\n    max-height: 230px; }\n    .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y {\n      display: -webkit-box;\n      display: -ms-flexbox;\n      display: flex;\n      -webkit-box-flex: 1;\n      -ms-flex: 1 1 auto;\n      flex: 1 1 auto;\n      background: #f8f8f8;\n      box-shadow: inset 0 5px 9px -3px rgba(0, 0, 0, 0.3); }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y .emoji-mart {\n        width: 100% !important;\n        border: none;\n        border-radius: 0;\n        margin-top: 6px; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y .emoji-mart-anchors {\n        background-color: #f8f8f8; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y .emoji-mart-search input {\n        font-size: 14px; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y .emoji-mart-scroll {\n        height: 146px; }\n      .-botpress-channel-web__style__external___1BNU9 .-botpress-channel-web__style__internal___2QK5K .-botpress-channel-web__style__emoji___1xld9 .-botpress-channel-web__style__inside___2-82Y .emoji-mart-category-label {\n        font-size: 12px; }\n\n.-botpress-channel-web__style__fadeIn___3ow2P {\n  animation-name: -botpress-channel-web__style__slideInRight___3SrSu;\n  animation-duration: 0.3s;\n  animation-fill-mode: both;\n  animation-iteration-count: 1; }\n\n@keyframes -botpress-channel-web__style__slideInRight___3SrSu {\n  0% {\n    visibility: visible;\n    transform: translateX(100%); }\n  100% {\n    transform: translateX(0);\n    visibility: visible; } }\n\n.-botpress-channel-web__style__fadeOut___P1Cdp {\n  animation-name: -botpress-channel-web__style__slideOutRight___3XL1L;\n  animation-duration: 0.3s;\n  animation-fill-mode: both;\n  animation-iteration-count: 1; }\n\n@-webkit-keyframes -botpress-channel-web__style__slideOutRight___3XL1L {\n  0% {\n    transform: translateX(0);\n    visibility: visible; }\n  100% {\n    visibility: hidden;\n    transform: translateX(100%); } }\n\n@keyframes -botpress-channel-web__style__slideOutRight___3XL1L {\n  0% {\n    transform: translateX(0);\n    visibility: visible; }\n  100% {\n    visibility: hidden;\n    transform: translateX(100%); } }\n", ""]);

// exports
exports.locals = {
	"external": "-botpress-channel-web__style__external___1BNU9",
	"internal": "-botpress-channel-web__style__internal___2QK5K",
	"fullscreen": "-botpress-channel-web__style__fullscreen___jVih9",
	"header": "-botpress-channel-web__style__header___1urkm",
	"left": "-botpress-channel-web__style__left___3E1xu",
	"line": "-botpress-channel-web__style__line___26cWZ",
	"avatar": "-botpress-channel-web__style__avatar___Fj3lF",
	"picture": "-botpress-channel-web__style__picture___1PvOc",
	"title": "-botpress-channel-web__style__title___MJj5o",
	"name": "-botpress-channel-web__style__name___2gsld",
	"unread": "-botpress-channel-web__style__unread___1Ms8n",
	"status": "-botpress-channel-web__style__status___J-Mqv",
	"icon": "-botpress-channel-web__style__icon___3-4NF",
	"conversation": "-botpress-channel-web__style__conversation___c85Kj",
	"bottom": "-botpress-channel-web__style__bottom___1lsNX",
	"composer": "-botpress-channel-web__style__composer___IYeWQ",
	"flex-column": "-botpress-channel-web__style__flex-column___1e3hn",
	"elements": "-botpress-channel-web__style__elements___vP2lC",
	"list": "-botpress-channel-web__style__list___3AhoU",
	"item": "-botpress-channel-web__style__item___3h7Uk",
	"right": "-botpress-channel-web__style__right___2li81",
	"date": "-botpress-channel-web__style__date___HhsxQ",
	"text": "-botpress-channel-web__style__text___38Uzh",
	"emoji": "-botpress-channel-web__style__emoji___1xld9",
	"inside": "-botpress-channel-web__style__inside___2-82Y",
	"fadeIn": "-botpress-channel-web__style__fadeIn___3ow2P",
	"slideInRight": "-botpress-channel-web__style__slideInRight___3SrSu",
	"fadeOut": "-botpress-channel-web__style__fadeOut___P1Cdp",
	"slideOutRight": "-botpress-channel-web__style__slideOutRight___3XL1L"
};

/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(122);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js??ref--1-1!../../node_modules/sass-loader/lib/loader.js!./style.scss", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js??ref--1-1!../../node_modules/sass-loader/lib/loader.js!./style.scss");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(false);
// imports


// module
exports.push([module.i, ".-botpress-channel-web__style__emulator___2OaKd {\n  background-color: white;\n  z-index: 1000;\n  position: absolute;\n  bottom: 0px;\n  right: 200px;\n  border-top-left-radius: 5px;\n  border-top-right-radius: 5px;\n  border: 1px solid #46cba0;\n  border-bottom: none; }\n  .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP {\n    width: 100%;\n    height: 40px;\n    background-color: #46cba0;\n    padding: 0 15px;\n    color: white;\n    position: relative;\n    cursor: pointer; }\n    .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP:hover,\n    .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP:hover .-botpress-channel-web__style__left___3m7qz {\n      background-color: #47d3a9; }\n    .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__left___3m7qz {\n      float: left;\n      line-height: 40px;\n      padding: 0 10px;\n      z-index: 100;\n      position: relative;\n      background-color: #46cba0; }\n    .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__right___3dYWY {\n      position: absolute;\n      right: -12px;\n      top: -5px;\n      z-index: 99;\n      height: 40px; }\n    .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__button___2CpBv {\n      cursor: pointer; }\n      .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__button___2CpBv:hover {\n        color: #c9ffdc; }\n      .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__button___2CpBv + .-botpress-channel-web__style__button___2CpBv {\n        margin-left: 5px; }\n      .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__header___3vZKP .-botpress-channel-web__style__button___2CpBv i {\n        vertical-align: middle !important; }\n  .-botpress-channel-web__style__emulator___2OaKd .-botpress-channel-web__style__chat___31MQH {\n    height: calc(100% - 50px);\n    width: 100%;\n    display: flex;\n    flex-direction: column;\n    justify-content: flex-start;\n    /* align items in Main Axis */\n    align-items: stretch;\n    /* align items in Cross Axis */\n    align-content: stretch; }\n  .-botpress-channel-web__style__emulator___2OaKd.-botpress-channel-web__style__hidden___AJRCW .-botpress-channel-web__style__chat___31MQH {\n    display: none !important; }\n\n.-botpress-channel-web__style__embedded___2oY8s .-botpress-channel-web__style__chat___31MQH {\n  height: calc(100vh);\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n  /* align items in Main Axis */\n  align-items: stretch;\n  /* align items in Cross Axis */\n  align-content: stretch; }\n", ""]);

// exports
exports.locals = {
	"emulator": "-botpress-channel-web__style__emulator___2OaKd",
	"header": "-botpress-channel-web__style__header___3vZKP",
	"left": "-botpress-channel-web__style__left___3m7qz",
	"right": "-botpress-channel-web__style__right___3dYWY",
	"button": "-botpress-channel-web__style__button___2CpBv",
	"chat": "-botpress-channel-web__style__chat___31MQH",
	"hidden": "-botpress-channel-web__style__hidden___AJRCW",
	"embedded": "-botpress-channel-web__style__embedded___2oY8s"
};

/***/ })
/******/ ]);
//# sourceMappingURL=web.bundle.js.map