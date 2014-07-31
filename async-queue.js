/********************\
* Asynchronous Queue *
\********************/

(function() {
  "use strict";
  var root = this.window || this.global;
  var internals = {};

  //
  // Enable the passage of the 'this' object through the JavaScript timers
  //
  if (root.setTimeout) {
    var __nativeST__ = root.setTimeout;

    internals.setTimeout = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeST__((vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback), nDelay);
    };
  }

  if (root.setInterval) {
    var __nativeSI__ = root.setInterval;

    internals.setInterval = function(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
      var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
      return __nativeSI__((vCallback instanceof Function ? function() {
        vCallback.apply(oThis, aArgs);
      } : vCallback), nDelay);
    };
  }

  // Asynchronous Queue Object
  var AsyncQueue = function() {
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
      Object.defineProperty(this, '_started', {
        value: false,
        writable: true,
        enumerable: false,
        configurable: false
      });
    } catch (ignore) {
      this._valArray = [];
      this._queue = [];
      this._numToComplete = 0;
      this._progress = progressFn;
      this._started = false;
    }
  };

  AsyncQueue.prototype = {
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
      if (this.finished()) {
        this.pop();
      } else {
        this._numToComplete += 1;
      }
      return this._queue.length;
    },
    pop: function(sequential) {
      internals.setTimeout.call(this, this._queue.shift(), 0, sequential);
    },
    start: function(sequential) {
      this._started = true;
      if (sequential) {
        this.pop(true);
      } else {
        var l = this._queue.length;
        while (--l >= 0) { this.pop(); }
      }
    },
    finished: function() {
      return !!(this._started) && (this._queue.length === 0);
    },
    started: function() {
      return !!(this._started);
    }
  };

  //
  // Export
  //

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = AsyncQueue;
    }
    exports.AsyncQueue = AsyncQueue;
  } else if (root.window) {
    root.window.AsyncQueue = AsyncQueue;
  } else {
    this.AsyncQueue = AsyncQueue;
  }
}).call(this);
