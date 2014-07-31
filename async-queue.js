/********************\
* Asynchronous Queue *
\********************/

(function() {
  "use strict";
  var root = this.window || this.global;

  //
  // Enable the passage of the 'this' object through the JavaScript timers
  //
  if (root.setTimeout) {
    var __nativeST__ = root.setTimeout;

    root.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeST__((vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback), nDelay);
    };
  }

  if (root.setInterval) {
    var __nativeSI__ = root.setInterval;

    root.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeSI__((vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback), nDelay);
    };
  }

  // Asynchronous Queue Object
  var asyncQueue = function() {
    var that = this;
    function progressFn(ret, sequential) {
      that._numToComplete -= 1;
      if (that.progress) { that.progress(ret); }
      if (that._numToComplete <= 0 && that.done) { that.done(that._valArray); }
      if (sequential && that._queue.length > 0) { that.pop(sequential); }
    }

    try {
      Object.defineProperty(this, '_valArray', {
        value: [],
        writable: false,
        enumerable: false,
        configurable: false
      });
      Object.defineProperty(this, '_queue', {
        value: [],
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
        value: progressFn,
        writable: false,
        enumerable: false,
        configurable: false
      });
    } catch (ignore) {
      this._valArray = [];
      this._queue = [];
      this._numToComplete = 0;
      this._progress = progressFn;
    }
  };

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
  };

  //
  // Export
  //

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = asyncQueue;
    }
    exports.asyncQueue = asyncQueue;
  } else if (root.window) {
    root.window.asyncQueue = asyncQueue;
  } else {
    this.asyncQueue = asyncQueue;
  }
}).call(this);