/*!
 * savvy-transfer.js v1.0.0
 * (c) 2018-2019 FPG
 * Released under the MIT License.
 */
function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined$1; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = module.exports;

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined$1) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined$1;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined$1;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined$1;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined$1, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined$1;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined$1;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined$1;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined$1;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined$1;
      }

      return ContinueSentinel;
    }
  };
})(
  // In sloppy mode, unbound `this` refers to the global object, fallback to
  // Function constructor if we're in global strict mode. That is sadly a form
  // of indirect eval which violates Content Security Policy.
  (function() {
    return this || (typeof self === "object" && self);
  })() || Function("return this")()
);
});

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g = (function() {
  return this || (typeof self === "object" && self);
})() || Function("return this")();

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

var runtimeModule = runtime;

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}

var regenerator = runtimeModule;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

var asyncToGenerator = _asyncToGenerator;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var classCallCheck = _classCallCheck;

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var createClass = _createClass;

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

var assertThisInitialized = _assertThisInitialized;

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof_1(call) === "object" || typeof call === "function")) {
    return call;
  }

  return assertThisInitialized(self);
}

var possibleConstructorReturn = _possibleConstructorReturn;

var getPrototypeOf = createCommonjsModule(function (module) {
function _getPrototypeOf(o) {
  module.exports = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

module.exports = _getPrototypeOf;
});

var setPrototypeOf = createCommonjsModule(function (module) {
function _setPrototypeOf(o, p) {
  module.exports = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

module.exports = _setPrototypeOf;
});

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) setPrototypeOf(subClass, superClass);
}

var inherits = _inherits;

var IO = function IO() {
  classCallCheck(this, IO);
};

var extmime = {
  '3ds': 'image/x-3ds',
  '3g2': 'video/3gpp2',
  '3gp': 'video/3gpp',
  '7z': 'application/x-7z-compressed',
  aac: 'audio/x-aac',
  abw: 'application/x-abiword',
  ace: 'application/x-ace-compressed',
  adp: 'audio/adpcm',
  aif: 'audio/x-aiff',
  aifc: 'audio/x-aiff',
  aiff: 'audio/x-aiff',
  apk: 'application/vnd.android.package-archive',
  asf: 'video/x-ms-asf',
  asx: 'video/x-ms-asf',
  atom: 'application/atom+xml',
  au: 'audio/basic',
  avi: 'video/x-msvideo',
  bat: 'application/x-msdownload',
  bmp: 'image/bmp',
  btif: 'image/prs.btif',
  bz: 'application/x-bzip',
  bz2: 'application/x-bzip2',
  caf: 'audio/x-caf',
  cgm: 'image/cgm',
  cmx: 'image/x-cmx',
  com: 'application/x-msdownload',
  conf: 'text/plain',
  css: 'text/css',
  csv: 'text/csv',
  dbk: 'application/docbook+xml',
  deb: 'application/x-debian-package',
  def: 'text/plain',
  djv: 'image/vnd.djvu',
  djvu: 'image/vnd.djvu',
  dll: 'application/x-msdownload',
  dmg: 'application/x-apple-diskimage',
  doc: 'application/msword',
  docm: 'application/vnd.ms-word.document.macroenabled.12',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  dot: 'application/msword',
  dotm: 'application/vnd.ms-word.template.macroenabled.12',
  dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  dra: 'audio/vnd.dra',
  dtd: 'application/xml-dtd',
  dts: 'audio/vnd.dts',
  dtshd: 'audio/vnd.dts.hd',
  dvb: 'video/vnd.dvb.file',
  dwg: 'image/vnd.dwg',
  dxf: 'image/vnd.dxf',
  ecelp4800: 'audio/vnd.nuera.ecelp4800',
  ecelp7470: 'audio/vnd.nuera.ecelp7470',
  ecelp9600: 'audio/vnd.nuera.ecelp9600',
  emf: 'application/x-msmetafile',
  emz: 'application/x-msmetafile',
  eol: 'audio/vnd.digital-winds',
  epub: 'application/epub+zip',
  exe: 'application/x-msdownload',
  f4v: 'video/x-f4v',
  fbs: 'image/vnd.fastbidsheet',
  fh: 'image/x-freehand',
  fh4: 'image/x-freehand',
  fh5: 'image/x-freehand',
  fh7: 'image/x-freehand',
  fhc: 'image/x-freehand',
  flac: 'audio/x-flac',
  fli: 'video/x-fli',
  flv: 'video/x-flv',
  fpx: 'image/vnd.fpx',
  fst: 'image/vnd.fst',
  fvt: 'video/vnd.fvt',
  g3: 'image/g3fax',
  gif: 'image/gif',
  h261: 'video/h261',
  h263: 'video/h263',
  h264: 'video/h264',
  heif: 'image/heif',
  heic: 'image/heic',
  htm: 'text/html',
  html: 'text/html',
  ico: 'image/x-icon',
  ief: 'image/ief',
  iso: 'application/x-iso9660-image',
  jpe: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  jpgm: 'video/jpm',
  jpgv: 'video/jpeg',
  jpm: 'video/jpm',
  json: 'application/json',
  jsonml: 'application/jsonml+json',
  kar: 'audio/midi',
  ktx: 'image/ktx',
  list: 'text/plain',
  log: 'text/plain',
  lvp: 'audio/vnd.lucent.voice',
  m13: 'application/x-msmediaview',
  m14: 'application/x-msmediaview',
  m1v: 'video/mpeg',
  m21: 'application/mp21',
  m2a: 'audio/mpeg',
  m2v: 'video/mpeg',
  m3a: 'audio/mpeg',
  m3u: 'audio/x-mpegurl',
  m3u8: 'application/vnd.apple.mpegurl',
  m4a: 'audio/mp4',
  m4u: 'video/vnd.mpegurl',
  m4v: 'video/x-m4v',
  mdi: 'image/vnd.ms-modi',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mj2: 'video/mj2',
  mjp2: 'video/mj2',
  mk3d: 'video/x-matroska',
  mka: 'audio/x-matroska',
  mks: 'video/x-matroska',
  mkv: 'video/x-matroska',
  mmr: 'image/vnd.fujixerox.edmics-mmr',
  mng: 'video/x-mng',
  mov: 'video/quicktime',
  movie: 'video/x-sgi-movie',
  mp2: 'audio/mpeg',
  mp21: 'application/mp21',
  mp2a: 'audio/mpeg',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mp4a: 'audio/mp4',
  mp4s: 'application/mp4',
  mp4v: 'video/mp4',
  mpe: 'video/mpeg',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mpg4: 'video/mp4',
  mpga: 'audio/mpeg',
  mpkg: 'application/vnd.apple.installer+xml',
  msi: 'application/x-msdownload',
  mvb: 'application/x-msmediaview',
  mxf: 'application/mxf',
  mxml: 'application/xv+xml',
  mxu: 'video/vnd.mpegurl',
  npx: 'image/vnd.net-fpx',
  odb: 'application/vnd.oasis.opendocument.database',
  odc: 'application/vnd.oasis.opendocument.chart',
  odf: 'application/vnd.oasis.opendocument.formula',
  odft: 'application/vnd.oasis.opendocument.formula-template',
  odg: 'application/vnd.oasis.opendocument.graphics',
  odi: 'application/vnd.oasis.opendocument.image',
  odm: 'application/vnd.oasis.opendocument.text-master',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  ogv: 'video/ogg',
  ogx: 'application/ogg',
  otc: 'application/vnd.oasis.opendocument.chart-template',
  otg: 'application/vnd.oasis.opendocument.graphics-template',
  oth: 'application/vnd.oasis.opendocument.text-web',
  oti: 'application/vnd.oasis.opendocument.image-template',
  otp: 'application/vnd.oasis.opendocument.presentation-template',
  ots: 'application/vnd.oasis.opendocument.spreadsheet-template',
  ott: 'application/vnd.oasis.opendocument.text-template',
  oxt: 'application/vnd.openofficeorg.extension',
  pbm: 'image/x-portable-bitmap',
  pct: 'image/x-pict',
  pcx: 'image/x-pcx',
  pdf: 'application/pdf',
  pgm: 'image/x-portable-graymap',
  pic: 'image/x-pict',
  plb: 'application/vnd.3gpp.pic-bw-large',
  png: 'image/png',
  pnm: 'image/x-portable-anymap',
  pot: 'application/vnd.ms-powerpoint',
  potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
  ppm: 'image/x-portable-pixmap',
  pps: 'application/vnd.ms-powerpoint',
  ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  psb: 'application/vnd.3gpp.pic-bw-small',
  psd: 'image/vnd.adobe.photoshop',
  pvb: 'application/vnd.3gpp.pic-bw-var',
  pya: 'audio/vnd.ms-playready.media.pya',
  pyv: 'video/vnd.ms-playready.media.pyv',
  qt: 'video/quicktime',
  ra: 'audio/x-pn-realaudio',
  ram: 'audio/x-pn-realaudio',
  ras: 'image/x-cmu-raster',
  rgb: 'image/x-rgb',
  rip: 'audio/vnd.rip',
  rlc: 'image/vnd.fujixerox.edmics-rlc',
  rmi: 'audio/midi',
  rmp: 'audio/x-pn-realaudio-plugin',
  s3m: 'audio/s3m',
  sgi: 'image/sgi',
  sgm: 'text/sgml',
  sgml: 'text/sgml',
  sid: 'image/x-mrsid-image',
  sil: 'audio/silk',
  sldx: 'application/vnd.openxmlformats-officedocument.presentationml.slide',
  smv: 'video/x-smv',
  snd: 'audio/basic',
  spx: 'audio/ogg',
  srt: 'application/x-subrip',
  sub: 'text/vnd.dvb.subtitle',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  swf: 'application/x-shockwave-flash',
  tcap: 'application/vnd.3gpp2.tcap',
  text: 'text/plain',
  tga: 'image/x-tga',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  torrent: 'application/x-bittorrent',
  tsv: 'text/tab-separated-values',
  ttl: 'text/turtle',
  txt: 'text/plain',
  udeb: 'application/x-debian-package',
  uva: 'audio/vnd.dece.audio',
  uvg: 'image/vnd.dece.graphic',
  uvh: 'video/vnd.dece.hd',
  uvi: 'image/vnd.dece.graphic',
  uvm: 'video/vnd.dece.mobile',
  uvp: 'video/vnd.dece.pd',
  uvs: 'video/vnd.dece.sd',
  uvu: 'video/vnd.uvvu.mp4',
  uvv: 'video/vnd.dece.video',
  uvva: 'audio/vnd.dece.audio',
  uvvg: 'image/vnd.dece.graphic',
  uvvh: 'video/vnd.dece.hd',
  uvvi: 'image/vnd.dece.graphic',
  uvvm: 'video/vnd.dece.mobile',
  uvvp: 'video/vnd.dece.pd',
  uvvs: 'video/vnd.dece.sd',
  uvvu: 'video/vnd.uvvu.mp4',
  uvvv: 'video/vnd.dece.video',
  viv: 'video/vnd.vivo',
  vob: 'video/x-ms-vob',
  wav: 'audio/x-wav',
  wax: 'audio/x-ms-wax',
  wbmp: 'image/vnd.wap.wbmp',
  wdp: 'image/vnd.ms-photo',
  weba: 'audio/webm',
  webm: 'video/webm',
  webp: 'image/webp',
  wm: 'video/x-ms-wm',
  wma: 'audio/x-ms-wma',
  wmf: 'application/x-msmetafile',
  wmv: 'video/x-ms-wmv',
  wmx: 'video/x-ms-wmx',
  wvx: 'video/x-ms-wvx',
  xap: 'application/x-silverlight-app',
  xbm: 'image/x-xbitmap',
  xht: 'application/xhtml+xml',
  xhtml: 'application/xhtml+xml',
  xhvml: 'application/xv+xml',
  xif: 'image/vnd.xiff',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  xm: 'audio/xm',
  xml: 'application/xml',
  xop: 'application/xop+xml',
  xpl: 'application/xproc+xml',
  xpm: 'image/x-xpixmap',
  xsl: 'application/xml',
  xslt: 'application/xslt+xml',
  xspf: 'application/xspf+xml',
  xvm: 'application/xv+xml',
  xvml: 'application/xv+xml',
  xwd: 'image/x-xwindowdump',
  zip: 'application/zip'
};
function filemime(name) {
  var fext = fileext(name);
  return extmime[fext] || 'application/octet-stream';
}
function fileext(name) {
  var uppercase = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var iknowwhatimdoing = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  name = String(name || '');

  if (!name) {
    name = 'unknown';
  }

  var ext = name.substr(name.lastIndexOf('.') + 1);

  if (ext === name) {
    ext = '';
  } else if (!iknowwhatimdoing) {
    ext = ext.replace(/<[^>]*>/g, '').replace(/[^\w+]/g, '');

    if (ext.length > 9) {
      ext = ext.substr(0, 9);
    }
  }

  return uppercase ? ext.toUpperCase() : ext.toLowerCase();
}

var customWindow = window;
var TEMPORARY = 0;

var FilesystemIO =
/*#__PURE__*/
function (_IO) {
  inherits(FilesystemIO, _IO);

  function FilesystemIO(fileSize, name, fd_cb) {
    var _this;

    classCallCheck(this, FilesystemIO);

    _this = possibleConstructorReturn(this, getPrototypeOf(FilesystemIO).call(this));
    _this.size = void 0;
    _this.downloadSize = 0;
    _this.fileName = void 0;
    _this.fileWriter = null;
    _this.fileEntry = null;
    _this.bufferCache = [];
    _this.fullyDownloadCallback = void 0;
    _this.writing = false;

    _this.handleFileSystemRequestSuccess = function (fs) {
      fs.root.getDirectory('savvy', {
        create: true
      }, function (directoryEntry) {
        var dirReader = directoryEntry.createReader();
        dirReader.readEntries(function (entries) {
          console.log(entries); // 在这里执行一些清除任务.
        });
        fs.root.getFile('savvy/' + _this.fileName, {
          create: true
        }, function (fileEntry) {
          _this.fileEntry = fileEntry;
          fileEntry.createWriter(function (fw) {
            _this.fileWriter = fw;
            _this.fileWriter.onwritestart = _this.handleFileWriteStart;
            _this.fileWriter.onprogress = _this.handleFileWriteProgress;
            _this.fileWriter.onerror = _this.handleFileWriteError;
            _this.fileWriter.onwriteend = _this.handleFileWriteEnd;

            if (_this.bufferCache.length > 0) {
              _this.write(_this.bufferCache.shift());
            }
          });
        });
      });
    };

    _this.handleFileWriteStart = function (event) {
      console.log(event);
      _this.writing = true;
    };

    _this.handleFileWriteProgress = function (event) {
      console.log(event);
    };

    _this.handleFileWriteError = function (event) {
      console.log(event);
      _this.writing = false;
    };

    _this.handleFileWriteEnd = function (event) {
      console.log(event);
      console.log(_this.fileWriter.position);
      _this.writing = false;
      console.log(_this.bufferCache);

      if (_this.bufferCache.length > 0) {
        _this.write(_this.bufferCache.shift());
      }

      if (_this.fileWriter.position === _this.size) {
        if (_this.fullyDownloadCallback) {
          _this.fullyDownloadCallback();
        }

        _this.download('');
      }
    };

    _this.saveLink = function (err, objectURL) {
      var link = typeof objectURL === 'string' && objectURL;
      var dlLinkNode = document.createElement('a');
      dlLinkNode.download = _this.fileName;
      dlLinkNode.href = link || _this.fileEntry.toURL();
      dlLinkNode.click();
    };

    _this.saveFile = function (file) {
      try {
        var _file = new File([file], _this.fileName, {
          type: filemime(_this.fileName)
        });

        _this.saveLink(undefined, window.URL.createObjectURL(_file));
      } catch (ex) {
        console.log(ex);

        _this.saveLink();
      }
    };

    _this.size = fileSize;
    _this.fileName = name;
    _this.fullyDownloadCallback = fd_cb;
    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem; // 创建文件系统, 临时空间会被浏览器自行判断, 在需要时删除, 永久空间不会, 但申请时需要用户允许.
    // window.requestFileSystem(type, size, successCallback[, errorCallback]);

    customWindow.requestFileSystem(TEMPORARY, fileSize, _this.handleFileSystemRequestSuccess);
    return _this;
  }

  createClass(FilesystemIO, [{
    key: "free_space",
    // Try to free space before starting the download.
    // 需要考虑是否存在当前有文件正在从沙盒环境写入本地文件系统, 在这个过程中不能删除这个空间.
    value: function free_space(callback, ms, delta) {}
  }, {
    key: "write",
    value: function write(buffer) {
      console.log('filesystem write');

      if (this.fileWriter && !this.writing) {
        try {
          this.fileWriter.write(new Blob([buffer]));
        } catch (e) {
          console.log(e);
        }
      } else {
        this.bufferCache.push(buffer);
      }
    }
  }, {
    key: "download",
    value: function download(name) {
      console.log('filesystem download');

      if (typeof this.fileEntry.file === 'function') {
        try {
          this.fileEntry.file(this.saveFile, this.saveLink);
        } catch (e) {
          console.log(e);
        }
      } else {
        this.saveLink();
      }
    }
  }]);

  return FilesystemIO;
}(IO);

var SavvyFile =
/*#__PURE__*/
function () {
  function SavvyFile(path, name, fileSize, chunkSize, IOMethod) {
    classCallCheck(this, SavvyFile);

    this.chunklist = [];
    this.status = void 0;
    this.filePath = void 0;
    this.name = void 0;
    this.nowChunkIndex = 0;
    this.IO = void 0;
    this.status = 'initializing';
    this.filePath = path;
    this.name = name;
    this.IO = new IOMethod(fileSize, name, this.fullyDownloadCallback);
    var tmpStart = 0,
        tmpEnd = 0;

    while (tmpEnd < fileSize) {
      tmpEnd = tmpStart + chunkSize;
      tmpEnd = tmpEnd > fileSize ? fileSize : tmpEnd;
      this.chunklist.push({
        start: tmpStart,
        end: tmpEnd
      });
      tmpStart = tmpEnd + 1;
    }

    this.status = 'inited';
  }

  createClass(SavvyFile, [{
    key: "nextChunk",
    value: function nextChunk() {
      // make sure next chunk is available when status not chunk_empty
      if (!this.chunklist[this.nowChunkIndex + 1]) {
        this.status = 'chunk_empty';
      }

      console.log(this.chunklist, this.nowChunkIndex);
      return this.chunklist[this.nowChunkIndex++];
    }
  }, {
    key: "write",
    value: function () {
      var _write = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee(response) {
        var buffer, fullyDownload;
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return response.arrayBuffer();

              case 2:
                buffer = _context.sent;
                fullyDownload = this.IO.write(buffer);

                if (fullyDownload) {
                  this.status = 'chunk_empty';
                }

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function write(_x) {
        return _write.apply(this, arguments);
      }

      return write;
    }()
  }, {
    key: "fullyDownloadCallback",
    value: function fullyDownloadCallback() {
      this.status = 'chunk_empty';
    }
  }, {
    key: "download",
    value: function download() {
      this.status = 'downloading';
      this.IO.download(this.name);
      this.status = 'complete';
    }
  }]);

  return SavvyFile;
}();

var IS64BIT = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);

var SavvyTransfer =
/*#__PURE__*/
function () {
  function SavvyTransfer() {
    classCallCheck(this, SavvyTransfer);

    this.IOMethod = void 0;
    this.size = 0;
    this.files = [];
    // this.setIOMethod();
    // this.IOMethod = MemoryIO;
    this.IOMethod = FilesystemIO;
  }

  createClass(SavvyTransfer, [{
    key: "setIOMethod",
    value: function setIOMethod() {
      /* if ((window as any).requestFileSystem || (window as any).webkitRequestFileSystem) {
        this.IOMethod = new filesystemIO();
      } else {
        this.IOMethod = new memoryIO();
      } */
      // this.IOMethod = MemoryIO;
    }
  }, {
    key: "addFile",
    value: function () {
      var _addFile = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee(path, name) {
        var response, fileSize, tmpFile;
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                console.log('begin download: ' + path);

                if (path) {
                  _context.next = 4;
                  break;
                }

                console.log('file path invalid.');
                return _context.abrupt("return");

              case 4:
                _context.next = 6;
                return fetch(path, {
                  method: 'GET',
                  headers: {
                    Range: 'bytes=0-1'
                  }
                });

              case 6:
                response = _context.sent;

                if (response.headers.get('content-range')) {
                  _context.next = 10;
                  break;
                }

                console.log('can not get file size, check file path or contact service provider.');
                return _context.abrupt("return");

              case 10:
                // calculate whether the size limit is exceeded
                fileSize = parseInt(response.headers.get('content-range').split('/')[1]);
                /*if (fileSize > SavvyTransfer.SIZE_LIMIT || fileSize + this.size > SavvyTransfer.SIZE_LIMIT) {
                  console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');
                   return;
                } */
                // create new file

                tmpFile = new SavvyFile(path, name, fileSize, SavvyTransfer.CHUNK_SIZE, this.IOMethod);
                this.files.push(tmpFile);
                this.ScheduleDownload();
                return _context.abrupt("return", tmpFile);

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function addFile(_x, _x2) {
        return _addFile.apply(this, arguments);
      }

      return addFile;
    }()
  }, {
    key: "ScheduleDownload",
    value: function ScheduleDownload() {
      console.log('ScheduleDownload', this.files);

      if (this.files.length > 0) {
        var nextFile = this.files.find(function (file) {
          return file.status === 'inited';
        });

        if (nextFile) {
          this.fetchData(nextFile);
        }
      }
    }
  }, {
    key: "fetchData",
    value: function () {
      var _fetchData = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee2(file) {
        var nextChunk, response;
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                console.log('fetchData');
                nextChunk = file.nextChunk();

                if (!nextChunk) {
                  _context2.next = 9;
                  break;
                }

                console.log('downloading chunk: ' + nextChunk.start + '-' + nextChunk.end);
                _context2.next = 6;
                return fetch(file.filePath, {
                  method: 'GET',
                  headers: {
                    Range: "bytes=".concat(nextChunk.start, "-").concat(nextChunk.end)
                  }
                });

              case 6:
                response = _context2.sent;
                _context2.next = 9;
                return file.write(response);

              case 9:
                this.ScheduleDownload();
                return _context2.abrupt("return");

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fetchData(_x3) {
        return _fetchData.apply(this, arguments);
      }

      return fetchData;
    }()
  }, {
    key: "downloadFile",
    value: function downloadFile(files) {
      for (var i = 0, l = files.length; i < l; i++) {
        files[i].download();
      }
    }
  }, {
    key: "upload",
    value: function upload(name) {
      console.log('upload');
    }
  }]);

  return SavvyTransfer;
}();

SavvyTransfer.SIZE_LIMIT = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
SavvyTransfer.CHUNK_SIZE = 1024 * 1024 * 16;

export default SavvyTransfer;
