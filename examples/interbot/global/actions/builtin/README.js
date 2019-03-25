//CHECKSUM:7f3e0f6faa2cd50e2782d0a8092548b857b09a96baa9d970f704f6c025607906
"use strict";

/**
 * This is just an example of how to create custom actions.
 * If you're reading this from the Flow Editor and wonder how you can create an new action,
 * See the `{botpressDir}/data/global/actions/builtin/README.js` file.
 *
 * @title Custom Action Example
 * @category tutorial
 * @param {string} [pageToFetch=https://google.com] - The page to fetch
 */

/** @ignore
 * @var temp
 * @var user
 *
 * ----------------------------
 * ---- Creating an Action ----
 * ----------------------------
 *
 * -- STORAGE --
 * In the global scope you have access to the following storage objects:
 * @var temp     Temporary flow-level storage.  Unique to every flow execution.  Ideal for logic implementation such as data returned from APIs.
 * @var user     Permanent user-level storage.  Unique to every users.  Ideal for remembering things specific to a user such as email, name, customerId, etc.
 * @var session  Temporary session-level storage.  Unique to every dialog sessions, which is time-bound (defaults to 15 minutes).  Ideal for remembering things specific to a conversation.
 *
 * -- CONTEXT --
 * In the global scope you have access to the @var event variable.
 *
 * -- PARAMETERS --
 * In the global scope you have access to the @var args object.
 * The @var args object is a key-value-pair of parameters defined when calling the action from the Flow Editor.
 *
 * -- ASYNC --
 * Actions can run asynchronously by returning a Promise.  If you want to use the `await` keyword, you need to declare an async function
 * and return a call to that function. @file `./builtin/getGlobalVariable.js` for a concrete example.
 *
 * -- REQUIRE MODULES --
 * You can require external modules by using `require('module-name')`.  A `node_modules` directory needs to be present next to the action
 * and the dependency needs to be present in this directory.  You can use npm/yarn inside the actions directory to manage dependencies.
 * Some modules are available by default such as axios and lodash
 *
 * -- REQUIRE FILES --
 * You can require adjacent .js and .json files, simply use `require('./path_to_file.js')`.  If the adjacent file is a .js file and is not intended to be an action in itself,
 * consider prefixing the file with a dot (.) so Botpress ignores it when looking for actions.
 *
 * -- METADATA --
 * You can change how the action will be presented in the Flow Editor by using JSDoc comments.  See example at the top of the file.
 */
const util = require('util');

const axios = require('axios');

console.log('Arguments =', util.inspect(args, false, 2, true));

if ('pageSource' in temp) {
  // Mutate the `temp` object
  delete temp.pageSource;
}

async function makeHttpRequest() {
  // args.pageToFetch is an optional parameter that can be overwritten by the user in the Flow Editor
  const {
    data
  } = await axios.get(args.pageToFetch || 'https://google.com');
  temp.pageSource = data;
} // Making an async HTTP request


return makeHttpRequest();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlJFQURNRS5qcyJdLCJuYW1lcyI6WyJ1dGlsIiwicmVxdWlyZSIsImF4aW9zIiwiY29uc29sZSIsImxvZyIsImluc3BlY3QiLCJhcmdzIiwidGVtcCIsInBhZ2VTb3VyY2UiLCJtYWtlSHR0cFJlcXVlc3QiLCJkYXRhIiwiZ2V0IiwicGFnZVRvRmV0Y2giXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7QUFVQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNDQSxNQUFNQSxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxNQUFELENBQXBCOztBQUNBLE1BQU1DLEtBQUssR0FBR0QsT0FBTyxDQUFDLE9BQUQsQ0FBckI7O0FBRUFFLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLGFBQVosRUFBMkJKLElBQUksQ0FBQ0ssT0FBTCxDQUFhQyxJQUFiLEVBQW1CLEtBQW5CLEVBQTBCLENBQTFCLEVBQTZCLElBQTdCLENBQTNCOztBQUVBLElBQUksZ0JBQWdCQyxJQUFwQixFQUEwQjtBQUN4QjtBQUNBLFNBQU9BLElBQUksQ0FBQ0MsVUFBWjtBQUNEOztBQUVELGVBQWVDLGVBQWYsR0FBaUM7QUFDL0I7QUFDQSxRQUFNO0FBQUVDLElBQUFBO0FBQUYsTUFBVyxNQUFNUixLQUFLLENBQUNTLEdBQU4sQ0FBVUwsSUFBSSxDQUFDTSxXQUFMLElBQW9CLG9CQUE5QixDQUF2QjtBQUNBTCxFQUFBQSxJQUFJLENBQUNDLFVBQUwsR0FBa0JFLElBQWxCO0FBQ0QsQyxDQUVEOzs7QUFDQSxPQUFPRCxlQUFlLEVBQXRCIiwic291cmNlUm9vdCI6Ii9Wb2x1bWVzL2JwL2JvdHByZXNzL21vZHVsZXMvYnVpbHRpbi9zcmMvYmFja2VuZCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBpcyBqdXN0IGFuIGV4YW1wbGUgb2YgaG93IHRvIGNyZWF0ZSBjdXN0b20gYWN0aW9ucy5cbiAqIElmIHlvdSdyZSByZWFkaW5nIHRoaXMgZnJvbSB0aGUgRmxvdyBFZGl0b3IgYW5kIHdvbmRlciBob3cgeW91IGNhbiBjcmVhdGUgYW4gbmV3IGFjdGlvbixcbiAqIFNlZSB0aGUgYHtib3RwcmVzc0Rpcn0vZGF0YS9nbG9iYWwvYWN0aW9ucy9idWlsdGluL1JFQURNRS5qc2AgZmlsZS5cbiAqXG4gKiBAdGl0bGUgQ3VzdG9tIEFjdGlvbiBFeGFtcGxlXG4gKiBAY2F0ZWdvcnkgdHV0b3JpYWxcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFnZVRvRmV0Y2g9aHR0cHM6Ly9nb29nbGUuY29tXSAtIFRoZSBwYWdlIHRvIGZldGNoXG4gKi9cblxuLyoqIEBpZ25vcmVcbiAqIEB2YXIgdGVtcFxuICogQHZhciB1c2VyXG4gKlxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogLS0tLSBDcmVhdGluZyBhbiBBY3Rpb24gLS0tLVxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICpcbiAqIC0tIFNUT1JBR0UgLS1cbiAqIEluIHRoZSBnbG9iYWwgc2NvcGUgeW91IGhhdmUgYWNjZXNzIHRvIHRoZSBmb2xsb3dpbmcgc3RvcmFnZSBvYmplY3RzOlxuICogQHZhciB0ZW1wICAgICBUZW1wb3JhcnkgZmxvdy1sZXZlbCBzdG9yYWdlLiAgVW5pcXVlIHRvIGV2ZXJ5IGZsb3cgZXhlY3V0aW9uLiAgSWRlYWwgZm9yIGxvZ2ljIGltcGxlbWVudGF0aW9uIHN1Y2ggYXMgZGF0YSByZXR1cm5lZCBmcm9tIEFQSXMuXG4gKiBAdmFyIHVzZXIgICAgIFBlcm1hbmVudCB1c2VyLWxldmVsIHN0b3JhZ2UuICBVbmlxdWUgdG8gZXZlcnkgdXNlcnMuICBJZGVhbCBmb3IgcmVtZW1iZXJpbmcgdGhpbmdzIHNwZWNpZmljIHRvIGEgdXNlciBzdWNoIGFzIGVtYWlsLCBuYW1lLCBjdXN0b21lcklkLCBldGMuXG4gKiBAdmFyIHNlc3Npb24gIFRlbXBvcmFyeSBzZXNzaW9uLWxldmVsIHN0b3JhZ2UuICBVbmlxdWUgdG8gZXZlcnkgZGlhbG9nIHNlc3Npb25zLCB3aGljaCBpcyB0aW1lLWJvdW5kIChkZWZhdWx0cyB0byAxNSBtaW51dGVzKS4gIElkZWFsIGZvciByZW1lbWJlcmluZyB0aGluZ3Mgc3BlY2lmaWMgdG8gYSBjb252ZXJzYXRpb24uXG4gKlxuICogLS0gQ09OVEVYVCAtLVxuICogSW4gdGhlIGdsb2JhbCBzY29wZSB5b3UgaGF2ZSBhY2Nlc3MgdG8gdGhlIEB2YXIgZXZlbnQgdmFyaWFibGUuXG4gKlxuICogLS0gUEFSQU1FVEVSUyAtLVxuICogSW4gdGhlIGdsb2JhbCBzY29wZSB5b3UgaGF2ZSBhY2Nlc3MgdG8gdGhlIEB2YXIgYXJncyBvYmplY3QuXG4gKiBUaGUgQHZhciBhcmdzIG9iamVjdCBpcyBhIGtleS12YWx1ZS1wYWlyIG9mIHBhcmFtZXRlcnMgZGVmaW5lZCB3aGVuIGNhbGxpbmcgdGhlIGFjdGlvbiBmcm9tIHRoZSBGbG93IEVkaXRvci5cbiAqXG4gKiAtLSBBU1lOQyAtLVxuICogQWN0aW9ucyBjYW4gcnVuIGFzeW5jaHJvbm91c2x5IGJ5IHJldHVybmluZyBhIFByb21pc2UuICBJZiB5b3Ugd2FudCB0byB1c2UgdGhlIGBhd2FpdGAga2V5d29yZCwgeW91IG5lZWQgdG8gZGVjbGFyZSBhbiBhc3luYyBmdW5jdGlvblxuICogYW5kIHJldHVybiBhIGNhbGwgdG8gdGhhdCBmdW5jdGlvbi4gQGZpbGUgYC4vYnVpbHRpbi9nZXRHbG9iYWxWYXJpYWJsZS5qc2AgZm9yIGEgY29uY3JldGUgZXhhbXBsZS5cbiAqXG4gKiAtLSBSRVFVSVJFIE1PRFVMRVMgLS1cbiAqIFlvdSBjYW4gcmVxdWlyZSBleHRlcm5hbCBtb2R1bGVzIGJ5IHVzaW5nIGByZXF1aXJlKCdtb2R1bGUtbmFtZScpYC4gIEEgYG5vZGVfbW9kdWxlc2AgZGlyZWN0b3J5IG5lZWRzIHRvIGJlIHByZXNlbnQgbmV4dCB0byB0aGUgYWN0aW9uXG4gKiBhbmQgdGhlIGRlcGVuZGVuY3kgbmVlZHMgdG8gYmUgcHJlc2VudCBpbiB0aGlzIGRpcmVjdG9yeS4gIFlvdSBjYW4gdXNlIG5wbS95YXJuIGluc2lkZSB0aGUgYWN0aW9ucyBkaXJlY3RvcnkgdG8gbWFuYWdlIGRlcGVuZGVuY2llcy5cbiAqIFNvbWUgbW9kdWxlcyBhcmUgYXZhaWxhYmxlIGJ5IGRlZmF1bHQgc3VjaCBhcyBheGlvcyBhbmQgbG9kYXNoXG4gKlxuICogLS0gUkVRVUlSRSBGSUxFUyAtLVxuICogWW91IGNhbiByZXF1aXJlIGFkamFjZW50IC5qcyBhbmQgLmpzb24gZmlsZXMsIHNpbXBseSB1c2UgYHJlcXVpcmUoJy4vcGF0aF90b19maWxlLmpzJylgLiAgSWYgdGhlIGFkamFjZW50IGZpbGUgaXMgYSAuanMgZmlsZSBhbmQgaXMgbm90IGludGVuZGVkIHRvIGJlIGFuIGFjdGlvbiBpbiBpdHNlbGYsXG4gKiBjb25zaWRlciBwcmVmaXhpbmcgdGhlIGZpbGUgd2l0aCBhIGRvdCAoLikgc28gQm90cHJlc3MgaWdub3JlcyBpdCB3aGVuIGxvb2tpbmcgZm9yIGFjdGlvbnMuXG4gKlxuICogLS0gTUVUQURBVEEgLS1cbiAqIFlvdSBjYW4gY2hhbmdlIGhvdyB0aGUgYWN0aW9uIHdpbGwgYmUgcHJlc2VudGVkIGluIHRoZSBGbG93IEVkaXRvciBieSB1c2luZyBKU0RvYyBjb21tZW50cy4gIFNlZSBleGFtcGxlIGF0IHRoZSB0b3Agb2YgdGhlIGZpbGUuXG4gKi9cblxuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKVxuY29uc3QgYXhpb3MgPSByZXF1aXJlKCdheGlvcycpXG5cbmNvbnNvbGUubG9nKCdBcmd1bWVudHMgPScsIHV0aWwuaW5zcGVjdChhcmdzLCBmYWxzZSwgMiwgdHJ1ZSkpXG5cbmlmICgncGFnZVNvdXJjZScgaW4gdGVtcCkge1xuICAvLyBNdXRhdGUgdGhlIGB0ZW1wYCBvYmplY3RcbiAgZGVsZXRlIHRlbXAucGFnZVNvdXJjZVxufVxuXG5hc3luYyBmdW5jdGlvbiBtYWtlSHR0cFJlcXVlc3QoKSB7XG4gIC8vIGFyZ3MucGFnZVRvRmV0Y2ggaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyIHRoYXQgY2FuIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSB1c2VyIGluIHRoZSBGbG93IEVkaXRvclxuICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IGF4aW9zLmdldChhcmdzLnBhZ2VUb0ZldGNoIHx8ICdodHRwczovL2dvb2dsZS5jb20nKVxuICB0ZW1wLnBhZ2VTb3VyY2UgPSBkYXRhXG59XG5cbi8vIE1ha2luZyBhbiBhc3luYyBIVFRQIHJlcXVlc3RcbnJldHVybiBtYWtlSHR0cFJlcXVlc3QoKVxuIl19