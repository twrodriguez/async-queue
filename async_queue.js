/********************\
* Asynchronous Queue *
\********************/

(function(undefined) {
  "use strict";
  //
  // Environment Check
  //
  // root == window **Client-side**, root == global **Server-side**
  if (typeof(JsEnv) === "undefined" && typeof(require) === "function") { require("JsEnv").exportGlobally(); }

  var root = JsEnv.globalScope,
      window = root.window,
      includedModules = {};

  //
  // Enable the passage of the 'this' object through the JavaScript timers
  //
  if (root.setTimeout) {
    var __nativeST__ = root.setTimeout;

    root.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeST__((vCallback instanceof Function ? (function () {
        vCallback.apply(oThis, aArgs);
      }) : (vCallback)), nDelay);
    };
  }

  if (root.setInterval) {
    var __nativeSI__ = root.setInterval;

    root.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeSI__((vCallback instanceof Function ? (function () {
        vCallback.apply(oThis, aArgs);
      }) : (vCallback)), nDelay);
    };
  }

  // Asynchronous Queue Object
  var asyncQueue = function() {
    Object.defineProperty(this, '_valArray', {
      value: new Array(),
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(this, '_queue', {
      value: new Array(),
      writable: false,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(this, '_numToComplete', {
      value: 0,
      writable: true,
      enumerable: false,
      configurable: false
    });
    Object.defineProperty(this, '_progress', {
      value: function(ret, sequential) {
        this._numToComplete -= 1;
        if (this.progress) { this.progress(ret); }
        if (this._numToComplete <= 0 && this.done) { this.done(this._valArray); }
        if (sequential && this._queue.length > 0) { this.pop(sequential); }
      },
      writable: false,
      enumerable: false,
      configurable: false
    });
  }

  asyncQueue.prototype = {
    enqueue: function(that, opts) {
      opts = opts || {};
      var aArgs = Array.prototype.slice.call(opts.args || []),
          qThis = this;

      qThis._queue.push(function(sequential) {
        if (opts.callback_required) {
          aArgs.push(function(ret) {
            qThis._valArray.push(ret);
            qThis._progress(ret, sequential);
          });
          opts.fn.apply(that, aArgs);
        } else {
          var ret = opts.fn.apply(that, aArgs);
          qThis._valArray.push(ret);
          qThis._progress(ret, sequential);
        }
      });
      this._numToComplete += 1;
      return this._queue.length;
    },
    pop: function(sequential) {
      setTimeout(this._queue.shift(), 0, sequential);
    },
    start: function(sequential) {
      if (sequential) {
        this.pop(true);
      } else {
        var l = this._queue.length;
        while (--l >= 0) { this.pop(); }
      }
    },
  }

  //
  // Export
  //

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = asyncQueue;
    }
    exports.asyncQueue = asyncQueue;
  } else if (window) {
    window.asyncQueue = asyncQueue;
  } else {
    this.asyncQueue = asyncQueue;
  }
}).call(this);
