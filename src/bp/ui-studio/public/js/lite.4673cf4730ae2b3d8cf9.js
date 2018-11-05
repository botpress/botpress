/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"lite": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
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
/******/ 	__webpack_require__.p = "$$BP_BASE_URL$$/js/";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./src/lite.jsx","commons"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/lite.jsx":
/*!**********************!*\
  !*** ./src/lite.jsx ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if(\"value\"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();__webpack_require__(/*! babel-polyfill */ \"./node_modules/babel-polyfill/lib/index.js\");var _exposeLoaderReactReact=__webpack_require__(/*! expose-loader?React!react */ \"./node_modules/expose-loader/index.js?React!./node_modules/react/index.js-exposed\");var _exposeLoaderReactReact2=_interopRequireDefault(_exposeLoaderReactReact);var _exposeLoaderReactDOMReactDom=__webpack_require__(/*! expose-loader?ReactDOM!react-dom */ \"./node_modules/expose-loader/index.js?ReactDOM!./node_modules/react-dom/index.js-exposed\");var _exposeLoaderReactDOMReactDom2=_interopRequireDefault(_exposeLoaderReactDOMReactDom);var _exposeLoaderPropTypesPropTypes=__webpack_require__(/*! expose-loader?PropTypes!prop-types */ \"./node_modules/expose-loader/index.js?PropTypes!./node_modules/prop-types/index.js-exposed\");var _exposeLoaderPropTypesPropTypes2=_interopRequireDefault(_exposeLoaderPropTypesPropTypes);var _exposeLoaderReactBootstrapReactBootstrap=__webpack_require__(/*! expose-loader?ReactBootstrap!react-bootstrap */ \"./node_modules/expose-loader/index.js?ReactBootstrap!./node_modules/react-bootstrap/es/index.js-exposed\");var _exposeLoaderReactBootstrapReactBootstrap2=_interopRequireDefault(_exposeLoaderReactBootstrapReactBootstrap);var _reactRedux=__webpack_require__(/*! react-redux */ \"./node_modules/react-redux/es/index.js\");var _queryString=__webpack_require__(/*! query-string */ \"./node_modules/query-string/index.js\");var _queryString2=_interopRequireDefault(_queryString);var _axios=__webpack_require__(/*! axios */ \"./node_modules/axios/index.js\");var _axios2=_interopRequireDefault(_axios);var _store=__webpack_require__(/*! ./store */ \"./src/store.js\");var _store2=_interopRequireDefault(_store);var _actions=__webpack_require__(/*! ./actions */ \"./src/actions/index.js\");var _module=__webpack_require__(/*! ~/components/PluginInjectionSite/module */ \"./src/components/PluginInjectionSite/module.jsx\");var _module2=_interopRequireDefault(_module);var _Modules=__webpack_require__(/*! ~/util/Modules */ \"./src/util/Modules.js\");var _Auth=__webpack_require__(/*! ~/util/Auth */ \"./src/util/Auth.js\");function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError(\"Cannot call a class as a function\");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\");}return call&&(typeof call===\"object\"||typeof call===\"function\")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!==\"function\"&&superClass!==null){throw new TypeError(\"Super expression must either be null or a function, not \"+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}var token=(0,_Auth.getToken)();if(token){_axios2.default.defaults.headers.common['Authorization']='Bearer '+token.token;}var _queryString$parse=_queryString2.default.parse(location.search),m=_queryString$parse.m,v=_queryString$parse.v,ref=_queryString$parse.ref;var alternateModuleNames={'platform-webchat':'channel-web'};var moduleName=alternateModuleNames[m]||m;var LiteView=function(_React$Component){_inherits(LiteView,_React$Component);function LiteView(){_classCallCheck(this,LiteView);return _possibleConstructorReturn(this,(LiteView.__proto__||Object.getPrototypeOf(LiteView)).apply(this,arguments));}_createClass(LiteView,[{key:'componentDidMount',value:function componentDidMount(){this.props.fetchModules();this.sendQueries();}},{key:'sendQueries',value:function sendQueries(){if(!ref){return;}var userId=window.__BP_VISITOR_ID||(0,_Auth.getUniqueVisitorId)();// TODO: why don't we have module-specific code inside of that module?\n_axios2.default.get('/api/botpress-platform-webchat/'+userId+'/reference?ref='+ref);}},{key:'render',value:function render(){var modules=(0,_Modules.moduleViewNames)(this.props.modules.filter(function(module){return module.isPlugin;}));var onNotFound=function onNotFound(){return _exposeLoaderReactReact2.default.createElement('h1',null,'Module $',moduleName,' with view $',v,' not found');};return _exposeLoaderReactReact2.default.createElement('div',null,_exposeLoaderReactReact2.default.createElement(_module2.default,{moduleName:moduleName,viewName:v,lite:true,onNotFound:onNotFound}),modules.map(function(_ref,i){var moduleName=_ref.moduleName,viewName=_ref.viewName;return _exposeLoaderReactReact2.default.createElement(_module2.default,{key:i,moduleName:moduleName,viewName:viewName,onNotFound:onNotFound});}));}}]);return LiteView;}(_exposeLoaderReactReact2.default.Component);var mapDispatchToProps={fetchModules:_actions.fetchModules};var mapStateToProps=function mapStateToProps(state){return{modules:state.modules};};var LiteViewConnected=(0,_reactRedux.connect)(mapStateToProps,mapDispatchToProps)(LiteView);_exposeLoaderReactDOMReactDom2.default.render(_exposeLoaderReactReact2.default.createElement(_reactRedux.Provider,{store:_store2.default},_exposeLoaderReactReact2.default.createElement(LiteViewConnected,null)),document.getElementById('app'));//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvbGl0ZS5qc3g/MDI1MSJdLCJuYW1lcyI6WyJ0b2tlbiIsImF4aW9zIiwiZGVmYXVsdHMiLCJoZWFkZXJzIiwiY29tbW9uIiwicXVlcnlTdHJpbmciLCJwYXJzZSIsImxvY2F0aW9uIiwic2VhcmNoIiwibSIsInYiLCJyZWYiLCJhbHRlcm5hdGVNb2R1bGVOYW1lcyIsIm1vZHVsZU5hbWUiLCJMaXRlVmlldyIsInByb3BzIiwiZmV0Y2hNb2R1bGVzIiwic2VuZFF1ZXJpZXMiLCJ1c2VySWQiLCJ3aW5kb3ciLCJfX0JQX1ZJU0lUT1JfSUQiLCJnZXQiLCJtb2R1bGVzIiwiZmlsdGVyIiwibW9kdWxlIiwiaXNQbHVnaW4iLCJvbk5vdEZvdW5kIiwibWFwIiwiaSIsInZpZXdOYW1lIiwiUmVhY3QiLCJDb21wb25lbnQiLCJtYXBEaXNwYXRjaFRvUHJvcHMiLCJtYXBTdGF0ZVRvUHJvcHMiLCJzdGF0ZSIsIkxpdGVWaWV3Q29ubmVjdGVkIiwiUmVhY3RET00iLCJyZW5kZXIiLCJzdG9yZSIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiXSwibWFwcGluZ3MiOiI4ZkFBQSx3RkFDQSxzSyw2RUFDQSwwTCx5RkFDQSxnTSw2RkFDQSxpTyxpSEFDQSxpR0FFQSxpRyx1REFDQSw2RSwyQ0FFQSxnRSwyQ0FDQSw0RUFDQSxrSSw2Q0FDQSxnRkFDQSx1RSxpNEJBRUEsR0FBTUEsT0FBUSxvQkFBZCxDQUNBLEdBQUlBLEtBQUosQ0FBVyxDQUNUQyxnQkFBTUMsUUFBTixDQUFlQyxPQUFmLENBQXVCQyxNQUF2QixDQUE4QixlQUE5QixZQUEyREosTUFBTUEsS0FBakUsQ0FDRCxDLHVCQUVxQkssc0JBQVlDLEtBQVosQ0FBa0JDLFNBQVNDLE1BQTNCLEMsQ0FBZEMsQyxvQkFBQUEsQyxDQUFHQyxDLG9CQUFBQSxDLENBQUdDLEcsb0JBQUFBLEcsQ0FFZCxHQUFNQyxzQkFBdUIsQ0FDM0IsbUJBQW9CLGFBRE8sQ0FBN0IsQ0FHQSxHQUFNQyxZQUFhRCxxQkFBcUJILENBQXJCLEdBQTJCQSxDQUE5QyxDLEdBRU1LLFMsMlRBQ2dCLENBQ2xCLEtBQUtDLEtBQUwsQ0FBV0MsWUFBWCxHQUNBLEtBQUtDLFdBQUwsR0FDRCxDLGlEQUVhLENBQ1osR0FBSSxDQUFDTixHQUFMLENBQVUsQ0FDUixPQUNELENBRUQsR0FBTU8sUUFBU0MsT0FBT0MsZUFBUCxFQUEwQiw4QkFBekMsQ0FFQTtBQUNBbkIsZ0JBQU1vQixHQUFOLG1DQUE0Q0gsTUFBNUMsbUJBQW9FUCxHQUFwRSxFQUNELEMsdUNBRVEsQ0FDUCxHQUFNVyxTQUFVLDZCQUFnQixLQUFLUCxLQUFMLENBQVdPLE9BQVgsQ0FBbUJDLE1BQW5CLENBQTBCLHVCQUFVQyxRQUFPQyxRQUFqQixFQUExQixDQUFoQixDQUFoQixDQUNBLEdBQU1DLFlBQWEsUUFBYkEsV0FBYSxTQUNqQixxRUFDV2IsVUFEWCxnQkFDbUNILENBRG5DLGNBRGlCLEVBQW5CLENBTUEsTUFDRSwyREFDRSwrQ0FBQyxnQkFBRCxFQUFvQixXQUFZRyxVQUFoQyxDQUE0QyxTQUFVSCxDQUF0RCxDQUF5RCxLQUFNLElBQS9ELENBQXFFLFdBQVlnQixVQUFqRixFQURGLENBRUdKLFFBQVFLLEdBQVIsQ0FBWSxjQUEyQkMsQ0FBM0IsS0FBR2YsV0FBSCxNQUFHQSxVQUFILENBQWVnQixRQUFmLE1BQWVBLFFBQWYsT0FDWCxnREFBQyxnQkFBRCxFQUFvQixJQUFLRCxDQUF6QixDQUE0QixXQUFZZixVQUF4QyxDQUFvRCxTQUFVZ0IsUUFBOUQsQ0FBd0UsV0FBWUgsVUFBcEYsRUFEVyxFQUFaLENBRkgsQ0FERixDQVFELEMsc0JBakNvQkksaUNBQU1DLFMsRUFvQzdCLEdBQU1DLG9CQUFxQixDQUFFaEIsa0NBQUYsQ0FBM0IsQ0FDQSxHQUFNaUIsaUJBQWtCLFFBQWxCQSxnQkFBa0IsY0FBVSxDQUFFWCxRQUFTWSxNQUFNWixPQUFqQixDQUFWLEVBQXhCLENBQ0EsR0FBTWEsbUJBQW9CLHdCQUFRRixlQUFSLENBQXlCRCxrQkFBekIsRUFBNkNsQixRQUE3QyxDQUExQixDQUVBc0IsdUNBQVNDLE1BQVQsQ0FDRSwrQ0FBQyxvQkFBRCxFQUFVLE1BQU9DLGVBQWpCLEVBQ0UsK0NBQUMsaUJBQUQsTUFERixDQURGLENBSUVDLFNBQVNDLGNBQVQsQ0FBd0IsS0FBeEIsQ0FKRiIsImZpbGUiOiIuL3NyYy9saXRlLmpzeC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnYmFiZWwtcG9seWZpbGwnXG5pbXBvcnQgUmVhY3QgZnJvbSAnZXhwb3NlLWxvYWRlcj9SZWFjdCFyZWFjdCdcbmltcG9ydCBSZWFjdERPTSBmcm9tICdleHBvc2UtbG9hZGVyP1JlYWN0RE9NIXJlYWN0LWRvbSdcbmltcG9ydCBQcm9wVHlwZXMgZnJvbSAnZXhwb3NlLWxvYWRlcj9Qcm9wVHlwZXMhcHJvcC10eXBlcydcbmltcG9ydCBSZWFjdEJvb3RzdHJhcCBmcm9tICdleHBvc2UtbG9hZGVyP1JlYWN0Qm9vdHN0cmFwIXJlYWN0LWJvb3RzdHJhcCdcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCdcbmltcG9ydCB7IFByb3ZpZGVyIH0gZnJvbSAncmVhY3QtcmVkdXgnXG5pbXBvcnQgcXVlcnlTdHJpbmcgZnJvbSAncXVlcnktc3RyaW5nJ1xuaW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJ1xuXG5pbXBvcnQgc3RvcmUgZnJvbSAnLi9zdG9yZSdcbmltcG9ydCB7IGZldGNoTW9kdWxlcyB9IGZyb20gJy4vYWN0aW9ucydcbmltcG9ydCBJbmplY3RlZE1vZHVsZVZpZXcgZnJvbSAnfi9jb21wb25lbnRzL1BsdWdpbkluamVjdGlvblNpdGUvbW9kdWxlJ1xuaW1wb3J0IHsgbW9kdWxlVmlld05hbWVzIH0gZnJvbSAnfi91dGlsL01vZHVsZXMnXG5pbXBvcnQgeyBnZXRUb2tlbiwgZ2V0VW5pcXVlVmlzaXRvcklkIH0gZnJvbSAnfi91dGlsL0F1dGgnXG5cbmNvbnN0IHRva2VuID0gZ2V0VG9rZW4oKVxuaWYgKHRva2VuKSB7XG4gIGF4aW9zLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBgQmVhcmVyICR7dG9rZW4udG9rZW59YFxufVxuXG5jb25zdCB7IG0sIHYsIHJlZiB9ID0gcXVlcnlTdHJpbmcucGFyc2UobG9jYXRpb24uc2VhcmNoKVxuXG5jb25zdCBhbHRlcm5hdGVNb2R1bGVOYW1lcyA9IHtcbiAgJ3BsYXRmb3JtLXdlYmNoYXQnOiAnY2hhbm5lbC13ZWInXG59XG5jb25zdCBtb2R1bGVOYW1lID0gYWx0ZXJuYXRlTW9kdWxlTmFtZXNbbV0gfHwgbVxuXG5jbGFzcyBMaXRlVmlldyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMucHJvcHMuZmV0Y2hNb2R1bGVzKClcbiAgICB0aGlzLnNlbmRRdWVyaWVzKClcbiAgfVxuXG4gIHNlbmRRdWVyaWVzKCkge1xuICAgIGlmICghcmVmKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB1c2VySWQgPSB3aW5kb3cuX19CUF9WSVNJVE9SX0lEIHx8IGdldFVuaXF1ZVZpc2l0b3JJZCgpXG5cbiAgICAvLyBUT0RPOiB3aHkgZG9uJ3Qgd2UgaGF2ZSBtb2R1bGUtc3BlY2lmaWMgY29kZSBpbnNpZGUgb2YgdGhhdCBtb2R1bGU/XG4gICAgYXhpb3MuZ2V0KGAvYXBpL2JvdHByZXNzLXBsYXRmb3JtLXdlYmNoYXQvJHt1c2VySWR9L3JlZmVyZW5jZT9yZWY9JHtyZWZ9YClcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCBtb2R1bGVzID0gbW9kdWxlVmlld05hbWVzKHRoaXMucHJvcHMubW9kdWxlcy5maWx0ZXIobW9kdWxlID0+IG1vZHVsZS5pc1BsdWdpbikpXG4gICAgY29uc3Qgb25Ob3RGb3VuZCA9ICgpID0+IChcbiAgICAgIDxoMT5cbiAgICAgICAgTW9kdWxlICR7bW9kdWxlTmFtZX0gd2l0aCB2aWV3ICR7dn0gbm90IGZvdW5kXG4gICAgICA8L2gxPlxuICAgIClcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8SW5qZWN0ZWRNb2R1bGVWaWV3IG1vZHVsZU5hbWU9e21vZHVsZU5hbWV9IHZpZXdOYW1lPXt2fSBsaXRlPXt0cnVlfSBvbk5vdEZvdW5kPXtvbk5vdEZvdW5kfSAvPlxuICAgICAgICB7bW9kdWxlcy5tYXAoKHsgbW9kdWxlTmFtZSwgdmlld05hbWUgfSwgaSkgPT4gKFxuICAgICAgICAgIDxJbmplY3RlZE1vZHVsZVZpZXcga2V5PXtpfSBtb2R1bGVOYW1lPXttb2R1bGVOYW1lfSB2aWV3TmFtZT17dmlld05hbWV9IG9uTm90Rm91bmQ9e29uTm90Rm91bmR9IC8+XG4gICAgICAgICkpfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNvbnN0IG1hcERpc3BhdGNoVG9Qcm9wcyA9IHsgZmV0Y2hNb2R1bGVzIH1cbmNvbnN0IG1hcFN0YXRlVG9Qcm9wcyA9IHN0YXRlID0+ICh7IG1vZHVsZXM6IHN0YXRlLm1vZHVsZXMgfSlcbmNvbnN0IExpdGVWaWV3Q29ubmVjdGVkID0gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoTGl0ZVZpZXcpXG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFByb3ZpZGVyIHN0b3JlPXtzdG9yZX0+XG4gICAgPExpdGVWaWV3Q29ubmVjdGVkIC8+XG4gIDwvUHJvdmlkZXI+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJylcbilcbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/lite.jsx\n");

/***/ })

/******/ });