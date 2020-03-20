/*!
 * savvy-transfer.js v1.0.0
 * (c) 2018-2020 FPG
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

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

var arrayWithoutHoles = _arrayWithoutHoles;

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

var iterableToArray = _iterableToArray;

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

var nonIterableSpread = _nonIterableSpread;

function _toConsumableArray(arr) {
  return arrayWithoutHoles(arr) || iterableToArray(arr) || nonIterableSpread();
}

var toConsumableArray = _toConsumableArray;

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

var SavvyIO = function SavvyIO() {
  classCallCheck(this, SavvyIO);
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
var ext = {};
function filemime(name) {
  var fext = fileext(name);
  return extmime[fext] || 'application/octet-stream';
}
function filetype(name) {
  var fext = fileext(name);

  if (ext[fext]) {
    return ext[fext][1];
  } else if (fext && fext.length > 1) {
    return '%1 File'.replace('%1', fext.toUpperCase());
  } else {
    return 'File';
  }
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

var crc32table = [0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f, 0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9, 0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d];
function crc32(data, crc, len) {
  if (typeof crc === 'undefined') {
    crc = 0;
  }

  if (typeof len === 'undefined') {
    len = data.length;
  }

  var x = 0;
  var y = 0;
  var off = data.length - len;
  crc = crc ^ -1;

  for (var i = 0; i < len; i++) {
    y = (crc ^ data[i + off]) & 0xff;
    x = crc32table[y];
    crc = crc >>> 8 ^ x;
  }

  return crc ^ -1;
}

var VAL32 = 0x100000000; // Map for converting hex octets to strings

var _HEX = [];

for (var i = 0; i < 256; i++) {
  _HEX[i] = (i > 0xf ? '' : '0') + i.toString(16);
}

var hasBuffer = typeof Buffer !== 'undefined'; //
// Int64
//

/**
 * Constructor accepts any of the following argument types:
 *
 * new Int64(buffer[, offset=0]) - Existing Buffer with byte offset
 * new Int64(Uint8Array[, offset=0]) - Existing Uint8Array with a byte offset
 * new Int64(string)             - Hex string (throws if n is outside int64 range)
 * new Int64(number)             - Number (throws if n is outside int64 range)
 * new Int64(hi, lo)             - Raw bits as two 32-bit values
 */

var Int64 = // Max integer value that JS can accurately represent
// Min integer value that JS can accurately represent
function Int64(a1, a2) {
  var _this = this;

  classCallCheck(this, Int64);

  this.buffer = void 0;
  this.offset = void 0;

  this._2scomp = function () {
    var b = _this.buffer,
        o = _this.offset,
        carry = 1;

    for (var i = o + 7; i >= o; i--) {
      var v = (b[i] ^ 0xff) + carry;
      b[i] = v & 0xff;
      carry = v >> 8;
    }
  };

  this.setValue = function (hi, lo) {
    var negate = false;

    if (!lo) {
      if (typeof hi == 'number') {
        // Simplify bitfield retrieval by using abs() value.  We restore sign
        // later
        negate = hi < 0;
        hi = Math.abs(hi);
        lo = hi % VAL32;
        hi = hi / VAL32;
        if (hi > VAL32) throw new RangeError(hi + ' is outside Int64 range');
        hi = hi | 0;
      } else if (typeof hi == 'string') {
        hi = (hi + '').replace(/^0x/, '');
        lo = hi.substr(-8);
        hi = hi.length > 8 ? hi.substr(0, hi.length - 8) : '';
        hi = parseInt(hi, 16);
        lo = parseInt(lo, 16);
      } else {
        throw new Error(hi + ' must be a Number or String');
      }
    } // Technically we should throw if hi or lo is outside int32 range here, but
    // it's not worth the effort. Anything past the 32'nd bit is ignored.
    // Copy bytes to buffer


    var b = _this.buffer,
        o = _this.offset;

    for (var i = 7; i >= 0; i--) {
      b[o + i] = lo & 0xff;
      lo = i == 4 ? hi : lo >>> 8;
    } // Restore sign of passed argument


    if (negate) _this._2scomp();
  };

  this.toNumber = function (allowImprecise) {
    var b = _this.buffer,
        o = _this.offset; // Running sum of octets, doing a 2's complement

    var negate = b[o] & 0x80,
        x = 0,
        carry = 1;

    for (var i = 7, m = 1; i >= 0; i--, m *= 256) {
      var v = b[o + i]; // 2's complement for negative numbers

      if (negate) {
        v = (v ^ 0xff) + carry;
        carry = v >> 8;
        v = v & 0xff;
      }

      x += v * m;
    } // Return Infinity if we've lost integer precision


    if (!allowImprecise && x >= Int64.MAX_INT) {
      return negate ? -Infinity : Infinity;
    }

    return negate ? -x : x;
  };

  this.valueOf = function () {
    return _this.toNumber(false);
  };

  this.toString = function (radix) {
    return _this.valueOf().toString(radix || 10);
  };

  this.toOctetString = function (sep) {
    var out = new Array(8);
    var b = _this.buffer,
        o = _this.offset;

    for (var i = 0; i < 8; i++) {
      out[i] = _HEX[b[o + i]];
    }

    return out.join(sep || '');
  };

  this.toBuffer = function (rawBuffer) {
    if (rawBuffer && _this.offset === 0) return _this.buffer;
    var out = new Buffer(8);

    _this.buffer.copy(out, 0, _this.offset, _this.offset + 8);

    return out;
  };

  this.copy = function (targetBuffer, targetOffset) {
    _this.buffer.copy(targetBuffer, targetOffset || 0, _this.offset, _this.offset + 8);
  };

  this.compare = function (other) {
    // If sign bits differ ...
    if ((_this.buffer[_this.offset] & 0x80) != (other.buffer[other.offset] & 0x80)) {
      return other.buffer[other.offset] - _this.buffer[_this.offset];
    } // otherwise, compare bytes lexicographically


    for (var i = 0; i < 8; i++) {
      if (_this.buffer[_this.offset + i] !== other.buffer[other.offset + i]) {
        return _this.buffer[_this.offset + i] - other.buffer[other.offset + i];
      }
    }

    return 0;
  };

  this.equals = function (other) {
    return _this.compare(other) === 0;
  };

  this.inspect = function () {
    return '[Int64 value:' + _this + ' octets:' + _this.toOctetString(' ') + ']';
  };

  var asIs = hasBuffer ? a1 instanceof Buffer : a1 instanceof Uint8Array;

  if (asIs) {
    this.buffer = a1;
    this.offset = a2 || 0;
  } else if (Object.prototype.toString.call(a1) == '[object Uint8Array]') {
    // Under Browserify, Buffers can extend Uint8Arrays rather than an
    // instance of Buffer. We could assume the passed in Uint8Array is actually
    // a buffer but that won't handle the case where a raw Uint8Array is passed
    // in. We construct a new Buffer just in case.
    this.buffer = new Buffer(a1);
    this.offset = a2 || 0;
  } else {
    this.buffer = this.buffer || (hasBuffer ? new Buffer(8) : new Uint8Array(8));
    this.offset = 0;
    this.setValue(a1, a2);
  }
}
/**
 * Do in-place 2's compliment.  See
 * http://en.wikipedia.org/wiki/Two's_complement
 */
;

Int64.MAX_INT = Math.pow(2, 53);
Int64.MIN_INT = -Math.pow(2, 53);

/**
 * get a ziped buffer of origin buffer from http request
 * @param {SavvyFile} currentFile file which being downloaded
 * @param {Transfer} transfer transfer which being ziped (might has multiply files)
 * @param {ArrayBuffer} _buffer buffer which need be processed
 * @param {boolean} isLast indicates if this buffer is the last chunk of the last file belong to current transfer
 *
 * @returns {Promise<ArrayBuffer>}
 */
function zipBuffer(_x, _x2, _x3, _x4) {
  return _zipBuffer.apply(this, arguments);
}

function _zipBuffer() {
  _zipBuffer = asyncToGenerator(
  /*#__PURE__*/
  regenerator.mark(function _callee(currentFile, transfer, _buffer, isLast) {
    var buffer, crc, ziper, fileName, ebuf, header, d, centralDir, centralDirBuffer, _d, dirRecord, end, dirData, tmpSize, tmpOffset, tmpBuf, i, _i;

    return regenerator.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // part of the current file.
            buffer = new Uint8Array(_buffer);
            crc = crc32(buffer, currentFile.crc || 0, buffer.byteLength);
            ziper = new ZIPClass(transfer.fileSize);
            fileName = unescape(encodeURIComponent(currentFile.name));
            currentFile.bufferAcc += buffer.byteLength;
            currentFile.crc = crc;

            if (currentFile.offset === 0) {
              // begin set header
              currentFile.headerPos = transfer.offset;
              ebuf = ezBuffer(1 + 4 + 4 + fileName.length);
              ebuf.i16(zipUtf8ExtraId);
              ebuf.i16(5 + fileName.length); // size

              ebuf.i8(1); // version

              ebuf.i32(crc32(fileName));
              ebuf.appendBytes(fileName);
              header = ziper.ZipHeader(fileName, currentFile.fileSize
              /* TO-DO: add file date */
              , ebuf.getArray());
              d = new Uint8Array(header.byteLength + buffer.byteLength);
              d.set(header, 0);
              d.set(buffer, header.byteLength);
              buffer = d; // console.log('add header');
            } // begin set central directory


            if (currentFile.bufferAcc === currentFile.fileSize) {
              centralDir = ziper.ZipCentralDirectory(fileName, currentFile.fileSize, currentFile.fileSize, crc, false, currentFile.headerPos); // zipFile.dirData.push(centralDir.dirRecord);

              centralDirBuffer = centralDir.dataDescriptor;
              _d = new Uint8Array(buffer.byteLength + centralDirBuffer.byteLength);

              _d.set(buffer, 0);

              _d.set(centralDirBuffer, buffer.byteLength);

              buffer = _d;
            } else {
              currentFile.offset += buffer.byteLength;
            }

            if (isLast) {
              dirRecord = transfer.files.map(function (file) {
                var tmpCentralDir = ziper.ZipCentralDirectory(file.name, file.fileSize, file.fileSize, file.crc, false, file.headerPos);
                return tmpCentralDir.dirRecord;
              });
              end = ziper.ZipSuffix(buffer.byteLength + transfer.offset, dirRecord);
              dirData = transfer.files.map(function (file) {
                return ziper.ZipCentralDirectory(unescape(encodeURIComponent(file.name)), file.fileSize, file.fileSize, file.crc, false, file.headerPos).dirRecord;
              });
              tmpSize = 0, tmpOffset = buffer.byteLength;

              for (i in dirData) {
                tmpSize += dirData[i].byteLength;
              }

              tmpBuf = new Uint8Array(buffer.byteLength + tmpSize + end.byteLength);
              tmpBuf.set(buffer, 0);

              for (_i in dirData) {
                tmpBuf.set(dirData[_i], tmpOffset);
                tmpOffset += dirData[_i].byteLength;
              }

              console.log(end);
              tmpBuf.set(end, tmpOffset);
              buffer = tmpBuf;
            }

            transfer.offset += buffer.byteLength;
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              resolve(buffer);
            }));

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _zipBuffer.apply(this, arguments);
}

var fileHeaderLen = 30;
var noCompression = 0;
var defaultFlags = 0x808;
/* UTF-8 */

var i32max = 0xffffffff;
var i16max = 0xffff;
var zip64ExtraId = 0x0001;
var zipUtf8ExtraId = 0x7075;
var directory64LocLen = 20;
var directory64EndLen = 56;
var fileHeaderSignature = 0x04034b50;
var directory64LocSignature = 0x07064b50;
var directory64EndSignature = 0x06064b50;
var directoryEndSignature = 0x06054b50;
var dataDescriptorSignature = 0x08074b50; // de-facto standard; required by OS X Finder

var directoryHeaderSignature = 0x02014b50;
var dataDescriptorLen = 16;
var dataDescriptor64Len = 24;
var directoryHeaderLen = 46;

var ZIPClass =
/*#__PURE__*/
function () {
  function ZIPClass(totalSize) {
    classCallCheck(this, ZIPClass);

    this.maxZipSize = Math.pow(2, 31) * 0.9;
    this.isZip64 = false;
    this.zipVersion = 20;
    this.isZip64 = totalSize > this.maxZipSize || localStorage.zip64 === 1;
    this.zipVersion = this.isZip64 ? 45 : 20;
  }

  createClass(ZIPClass, [{
    key: "ZipHeader",
    value: function ZipHeader(fileName, fileSize, extra) {
      var readerVersion = this.zipVersion,
          Flags = defaultFlags,
          Method = noCompression,
          date = 0,
          crc32 = 0,
          unsize = 0;
      var buf = ezBuffer(fileHeaderLen + fileName.length + extra.length);
      buf.i32(fileHeaderSignature);
      buf.i16(readerVersion);
      buf.i16(Flags);
      buf.i16(Method);
      DosDateTime(date, buf);
      buf.i32(crc32); // crc32

      buf.i32(fileSize); // compress size

      buf.i32(unsize); // uncompress size

      buf.i16(fileName.length);
      buf.i16(extra.length);
      buf.appendBytes(fileName);
      buf.appendBytes(extra);
      return buf.getBytes();
    }
    /**
     * @param {number} size compressed size
     * @param {number} unsize uncompress size
     * @param {number} crc32
     * @param {boolean} directory
     * @param {number} headerpos header position
     */

  }, {
    key: "ZipCentralDirectory",
    value: function ZipCentralDirectory(filename, size, unsize, crc32, directory, headerpos) {
      var creatorVersion = this.zipVersion;
      var readerVersion = this.zipVersion;
      var Flags = defaultFlags;
      var Method = noCompression;
      var date = 0;
      var externalAttr = directory ? 1 : 0;
      var extra = [],
          ebuf;

      if (this.isZip64) {
        ebuf = ezBuffer(28); // 2xi16 + 3xi64

        ebuf.i16(zip64ExtraId);
        ebuf.i16(24);
        ebuf.i64(size);
        ebuf.i64(unsize);
        ebuf.i64(headerpos);
        extra = extra.concat(ebuf.getArray());
      }

      var centralDirectoryBuf = ezBuffer(directoryHeaderLen + filename.length + extra.length);
      centralDirectoryBuf.i32(directoryHeaderSignature);
      centralDirectoryBuf.i16(creatorVersion);
      centralDirectoryBuf.i16(readerVersion);
      centralDirectoryBuf.i16(Flags);
      centralDirectoryBuf.i16(Method);
      DosDateTime(date, centralDirectoryBuf);
      centralDirectoryBuf.i32(crc32);
      centralDirectoryBuf.i32(this.isZip64 ? i32max : size);
      centralDirectoryBuf.i32(this.isZip64 ? i32max : unsize);
      centralDirectoryBuf.i16(filename.length);
      centralDirectoryBuf.i16(extra.length);
      centralDirectoryBuf.i16(0); // no comments

      centralDirectoryBuf.i32(0); // disk number

      centralDirectoryBuf.i32(externalAttr);
      centralDirectoryBuf.i32(this.isZip64 ? i32max : headerpos);
      centralDirectoryBuf.appendBytes(filename);
      centralDirectoryBuf.appendBytes(extra);
      var dataDescriptorBuf = ezBuffer(this.isZip64 ? dataDescriptor64Len : dataDescriptorLen);
      dataDescriptorBuf.i32(dataDescriptorSignature);
      dataDescriptorBuf.i32(crc32);

      if (this.isZip64) {
        dataDescriptorBuf.i64(size);
        dataDescriptorBuf.i64(unsize);
      } else {
        dataDescriptorBuf.i32(size);
        dataDescriptorBuf.i32(unsize);
      }

      return {
        dirRecord: centralDirectoryBuf.getBytes(),
        dataDescriptor: dataDescriptorBuf.getBytes()
      };
    }
  }, {
    key: "ZipSuffix",
    value: function ZipSuffix(pos, dirData) {
      var dirDatalength = 0;

      for (var i in dirData) {
        dirDatalength += dirData[i].length;
      }

      var buf = ezBuffer(22);

      if (this.isZip64) {
        var xbuf = ezBuffer(directory64EndLen + directory64LocLen);
        xbuf.i32(directory64EndSignature); // directory64EndLen - 4 bytes - 8 bytes

        xbuf.i64(directory64EndLen - 4 - 8);
        xbuf.i16(this.zipVersion);
        xbuf.i16(this.zipVersion);
        xbuf.i32(0); // disk number

        xbuf.i32(0); // number of the disk with the start of the central directory

        xbuf.i64(dirData.length);
        xbuf.i64(dirData.length);
        xbuf.i64(dirDatalength);
        xbuf.i64(pos);
        xbuf.i32(directory64LocSignature);
        xbuf.i32(0);
        xbuf.i64(pos + dirDatalength);
        xbuf.i32(1); // total number of disks

        buf.resize(22 + xbuf.getBytes().length);
        buf.appendBytes(xbuf.getBytes());
      }

      buf.i32(directoryEndSignature);
      buf.i32(0); // skip

      buf.i16(this.isZip64 ? i16max : dirData.length);
      buf.i16(this.isZip64 ? i16max : dirData.length);
      buf.i32(this.isZip64 ? i32max : dirDatalength);
      buf.i32(this.isZip64 ? i32max : pos);
      buf.i16(0); // no comments

      return buf.getBytes();
    }
  }]);

  return ZIPClass;
}();

function ezBuffer(size) {
  var obj = new Uint8Array(size),
      buffer = new DataView(obj.buffer),
      offset = 0;
  return {
    debug: function debug() {
      console.error(['DEBUG', offset, obj.length]);
    },
    getArray: function getArray() {
      var bytes = [];
      obj.map(function (val, i, array) {
        bytes.push(val);
        return val;
      });
      return bytes;
    },
    getBytes: function getBytes() {
      return obj;
    },
    appendBytes: function appendBytes(text) {
      var isArray = typeof text != 'string';

      for (var i = text.length; i--;) {
        if (isArray) {
          obj[offset + i] = text[i];
        } else {
          // We assume it is an string
          obj[offset + i] = text.charCodeAt(i);
        }
      }

      offset += text.length;
    },
    i64: function i64(number, bigendian) {
      var buffer = new Int64(number, null).buffer;

      if (!bigendian) {
        // swap the by orders
        var nbuffer = new Uint8Array(buffer.length),
            len = buffer.length - 1;

        for (var i = len; i >= 0; i--) {
          nbuffer[i] = buffer[len - i];
        }

        buffer = nbuffer;
      } // append the buffer


      this.appendBytes(buffer);
    },
    i32: function i32(number, bigendian) {
      buffer.setInt32(offset, number, !bigendian);
      offset += 4;
    },
    i16: function i16(number, bigendian) {
      buffer.setInt16(offset, number, !bigendian);
      offset += 2;
    },
    i8: function i8(number, bigendian) {
      buffer.setInt8(offset, number);
      offset += 1;
    },
    resize: function resize(newsize) {
      var zobj = new Uint8Array(newsize);
      zobj.set(obj, 0);
      obj = zobj;
      buffer = new DataView(obj.buffer);
      return obj;
    },

    /**
     *  Check if the current bytestream has enough
     *  size to add "size" more bytes. If it doesn't have
     *  we return a new bytestream object
     */
    resizeIfNeeded: function resizeIfNeeded(size) {
      if (obj.length < size + offset) {
        return this.resize(size + offset);
      }

      return obj;
    }
  };
}
/**
 *  Set an unix time (or now if missing) in the zip
 *  expected format
 */


function DosDateTime(sec, buf) {
  var date = new Date(),
      dosTime,
      dosDate;

  if (sec) {
    date = new Date(sec * 1000);
  }

  dosTime = date.getHours();
  dosTime = dosTime << 6;
  dosTime = dosTime | date.getMinutes();
  dosTime = dosTime << 5;
  dosTime = dosTime | date.getSeconds() / 2;
  dosDate = date.getFullYear() - 1980;
  dosDate = dosDate << 4;
  dosDate = dosDate | date.getMonth() + 1;
  dosDate = dosDate << 5;
  dosDate = dosDate | date.getDate();
  buf.i16(dosTime);
  buf.i16(dosDate);
}

var customWindow = window;
var TEMPORARY = 0;

var FilesystemIO =
/*#__PURE__*/
function (_SavvyIO) {
  inherits(FilesystemIO, _SavvyIO);

  function FilesystemIO() {
    var _this;

    classCallCheck(this, FilesystemIO);

    _this = possibleConstructorReturn(this, getPrototypeOf(FilesystemIO).call(this));
    _this.freeSpaceRequest = false;
    _this.entrtiesReaded = false;
    _this.allEntries = [];
    _this.allResumeFiles = [];

    _this.saveLink = function (transfer, objectURL) {
      var link = typeof objectURL === 'string' && objectURL;
      var dlLinkNode = document.createElement('a');
      dlLinkNode.download = transfer.name;
      dlLinkNode.href = link || transfer.fileEntry.toURL();
      dlLinkNode.click();
    };

    _this.saveFile = function (transfer, file) {
      try {
        var _file = new File([file], transfer.name, {
          type: filemime(transfer.name)
        });

        _this.saveLink(transfer, window.URL.createObjectURL(_file));
      } catch (ex) {
        console.log(ex);

        _this.saveLink(transfer);
      }
    };

    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem; // window.requestFileSystem(type, size, successCallback[, errorCallback]);

    customWindow.requestFileSystem(TEMPORARY, 0x10000, function (fs) {
      // free space....
      fs.root.getDirectory('savvy', {
        create: true
      }, function (directoryEntry) {
        var dirReader = directoryEntry.createReader();
        dirReader.readEntries(function (entries) {
          // TO-DO: can not just simply clear all old files, need to keep files which are not completely downloaded.
          // console.log(entries);
          _this.allEntries = entries;
          _this.entrtiesReaded = true;

          if (_this.freeSpaceRequest) {
            _this.freeSpace(_this.allResumeFiles);
          }
        });
      });
    });
    return _this;
  }

  createClass(FilesystemIO, [{
    key: "removeFile",
    value: function removeFile(transfer) {
      return new Promise(function (resolve, reject) {
        customWindow.requestFileSystem(TEMPORARY, 0x10000, function (fs) {
          fs.root.getDirectory('savvy', {
            create: true
          }, function (directoryEntry) {
            var dirReader = directoryEntry.createReader();
            dirReader.readEntries(function (entries) {
              entries.forEach(function (entry) {
                // TO-DO: need check if this file is being write to filesystem...
                if (entry.name === transfer.name + transfer.id) {
                  entry.remove(function () {
                    console.log('remove file [' + entry.name + '] from filesystem successful.');
                    resolve();
                  });
                }
              });
            });
          });
        });
      });
    }
  }, {
    key: "removeAll",
    value: function removeAll() {
      customWindow.requestFileSystem(TEMPORARY, 0x10000, function (fs) {
        // free space....
        fs.root.getDirectory('savvy', {
          create: true
        }, function (directoryEntry) {
          var dirReader = directoryEntry.createReader();
          dirReader.readEntries(function (entries) {
            // TO-DO: can not just simply clear all old files, need to keep files which are not completely downloaded.
            entries.map(function (entry) {
              entry.remove(function () {
                console.log('remove file [' + entry.name + '] from filesystem successful.');
              });
            });
          });
        });
      });
    }
    /**
     * @param {Transfer} transfer
     * @param {Function} successCallback
     * @param {Function} errorCallback
     */

  }, {
    key: "getFileWriter",
    value: function getFileWriter(transfer, successCallback, errorCallback) {
      customWindow.requestFileSystem(TEMPORARY, transfer.fileSize, function (fs) {
        fs.root.getDirectory('savvy', {
          create: true
        }, function (directoryEntry) {
          fs.root.getFile('savvy/' + transfer.name + transfer.id, {
            create: true
          }, function (fileEntry) {
            fileEntry.getMetadata(function (metadata) {
              // console.log(metadata);
              fileEntry.createWriter(function (fw) {
                if (metadata.size && metadata.size !== 0) {
                  // set offset as file size, the plus op may not effective
                  if (transfer.offset === metadata.size) {
                    // console.log(file.offset, metadata.size);
                    fw.seek(transfer.offset + 1);
                  } else if (transfer.offset < metadata.size) {
                    // console.log(file.offset + ' ,' + metadata.size + ' - finally find u!');
                    fw.onwriteend = function () {
                      fw.seek(transfer.offset + 1);
                      successCallback({
                        fileEntry: fileEntry,
                        fileWriter: fw
                      });
                      return;
                    };

                    fw.truncate(transfer.offset);
                  } else {
                    fw.seek(0);
                    transfer.abortAllResumeData();
                  }
                }

                successCallback({
                  fileEntry: fileEntry,
                  fileWriter: fw
                });
              });
            });
          });
        });
      });
    }
  }, {
    key: "freeSpace",
    value: function freeSpace(transfers) {
      if (this.entrtiesReaded) {
        this.freeSpaceRequest = false;
        this.allEntries.forEach(function (entry) {
          var tmpTransfer = transfers.find(function (transfer) {
            return transfer.name + transfer.id === entry.name;
          }); // this file need be remove.

          if (tmpTransfer === undefined) {
            entry.remove(function () {
              console.log(entry.name + ' removed.');
            }, function (err) {});
          }
        });
      } else {
        this.allResumeFiles = transfers;
        this.freeSpaceRequest = true;
      }
    }
    /**
     * @param {Transfer} transfer
     * @param {ArrayBuffer} buffer
     */

  }, {
    key: "write",
    value: function write(transfer, buffer) {
      return new Promise(function (resolve, reject) {
        if (transfer.fileWriter) {
          var fileWriter = transfer.fileWriter;

          if (transfer.zip) {
            // get processed data from zip writer
            zipBuffer(transfer.currentFile, transfer, buffer, transfer.chunkIndex === transfer.chunkList.length).then(function (zipBuffer) {
              try {
                fileWriter.onwriteend = function (e) {
                  resolve();
                };

                fileWriter.write(new Blob([zipBuffer]));
              } catch (e) {
                console.log(e);
                reject();
              }
            });
          } else {
            try {
              fileWriter.onwriteend = function (e) {
                resolve();
              };

              fileWriter.write(new Blob([buffer]));
            } catch (e) {
              console.log(e);
              reject();
            }
          }
        } else {
          console.log('file has no file writer');
          reject();
        }
      });
    }
    /**
     * do not delete file while it's being copied from FS to DL folder
     * conservative assumption that a file is being written at 1024 bytes per ms
     * add 30000 ms margin
     */

  }, {
    key: "deleteFile",
    value: function deleteFile(transfer) {
      // let assume
      if (transfer.fileEntry) {
        var _file = transfer.fileEntry;

        if (_file.isFile) {
          _file.getMetadata(function (metadata) {
            var delTime = metadata.size / 1024 + 30000;
            setTimeout(function () {
              _file.remove(function () {
                console.log('file ' + transfer.name + ' being removed from filesystem...');
              });
            }, delTime);
          }, function (err) {
            console.log(err);
          });
        }
        /* (file.fileEntry as FileEntry).file((_file: File) =>{
          _file.get
        }, (err: DOMError) =>{
          console.log(err);
        }) */

      }
    }
    /**
     * @param {Transfer[]}transfers
     * @public
     */

  }, {
    key: "download",
    value: function download(transfers) {
      var _this2 = this;

      var _loop = function _loop(i, l) {
        var fileEntry = transfers[i].fileEntry;

        if (typeof transfers[i].fileEntry.file === 'function') {
          try {
            fileEntry.file(function (file) {
              _this2.saveFile(transfers[i], file);
            }, function () {
              _this2.saveLink(transfers[i]);
            });
          } catch (e) {
            console.log(e);
          }
        } else {
          _this2.saveLink(transfers[i]);
        }
      };

      for (var i = 0, l = transfers.length; i < l; i++) {
        _loop(i, l);
      }
    }
    /**
     * @param {Transfer}transfer
     * @param {String?}objectURL
     * @private
     */

  }]);

  return FilesystemIO;
}(SavvyIO);

var MSIE = typeof MSBlobBuilder === 'function';

var MemoryIO =
/*#__PURE__*/
function (_SavvyIO) {
  inherits(MemoryIO, _SavvyIO);

  function MemoryIO() {
    classCallCheck(this, MemoryIO);

    return possibleConstructorReturn(this, getPrototypeOf(MemoryIO).apply(this, arguments));
  }

  createClass(MemoryIO, [{
    key: "getFileWriter",
    value: function getFileWriter(transfer, successCallback, errorCallback) {
      successCallback({
        fileEntry: null,
        fileWriter: new MemoryWrite()
      });
    }
    /**
     * write buffer to memory (just simply push to an array)
     * @param {Transfer} transfer
     * @param {ArrayBuffer} buffer
     */

  }, {
    key: "write",
    value: function write(transfer, buffer) {
      return new Promise(function (resolve, reject) {
        var fileWriter = transfer.fileWriter;

        if (transfer.zip) {
          zipBuffer(transfer.currentFile, transfer, buffer, transfer.chunkIndex === transfer.chunkList.length).then(function (zipBuffer) {
            try {
              fileWriter.onwriteend = function (e) {
                resolve();
              };

              fileWriter.write(new Blob([zipBuffer]));
            } catch (e) {
              console.log(e);
              reject();
            }
          });
        } else {
          fileWriter.onwriteend = function () {
            resolve();
          };

          fileWriter.onerror = function (e) {
            reject();
          };

          fileWriter.write(new Blob([buffer]));
        }
      });
    }
    /**
     * empty buffer array.
     * @param {Transfer} transfer
     */

  }, {
    key: "deleteFile",
    value: function deleteFile(transfer) {
      transfer.fileWriter.clear();
      transfer.fileWriter = null;
    }
    /**
     * 1. get Blob from buffer array
     * 2. generate an `<a>` tag and trigger click event to download Blob as file.
     * @param {Array<Transfer>} transfers
     */

  }, {
    key: "download",
    value: function download(transfers) {
      for (var i = 0, l = transfers.length; i < l; i++) {
        var blob = transfers[i].fileWriter.getBlob(transfers[i].name);
        var blob_url = '';

        if (MSIE) {
          navigator.msSaveOrOpenBlob(blob, name);
        } else {
          blob_url = window.URL.createObjectURL(blob);
          var dlLinkNode = document.createElement('a');
          dlLinkNode.download = transfers[i].name;
          dlLinkNode.href = blob_url;
          document.body.appendChild(dlLinkNode); // this click may triggers beforeunload...

          dlLinkNode.click();
        }
      }
    }
  }]);

  return MemoryIO;
}(SavvyIO);
var MemoryWrite =
/*#__PURE__*/
function () {
  function MemoryWrite() {
    classCallCheck(this, MemoryWrite);

    this.blobList = void 0;
    this.onwriteend = void 0;
    this.onerror = void 0;
    this.position = 0;

    if (MSIE) {
      this.blobList = new MSBlobBuilder();
    } else {
      this.blobList = [];
    }

    this.onwriteend = null;
    this.onerror = null;
  }

  createClass(MemoryWrite, [{
    key: "getBlob",
    value: function getBlob(name) {
      if (MSIE) {
        return this.blobList.getBlob();
      }

      try {
        return new File(this.blobList, name, {
          type: filemime(name)
        });
      } catch (ex) {
        console.log(ex);
      }

      return new Blob(this.blobList || [], {
        type: filemime(name)
      });
    }
  }, {
    key: "write",
    value: function write(buffer) {
      try {
        if (MSIE) {
          this.blobList.append(buffer);
        } else {
          this.blobList.push(buffer);
        }

        this.onwriteend && this.onwriteend();
      } catch (e) {
        console.log(e);
        this.onerror && this.onerror(e);
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      this.blobList = [];
    }
  }]);

  return MemoryWrite;
}();

var SavvyFile = function SavvyFile(path, name, fileSize, chunkSize, buffacc, offset, crc) {
  classCallCheck(this, SavvyFile);

  this.chunkList = [];
  this.filePath = void 0;
  this.name = void 0;
  this.fileSize = void 0;
  this.offset = 0;
  this.crc = 0;
  this.headerPos = 0;
  this.bufferAcc = 0;
  this.filePath = path;
  this.name = name;
  this.fileSize = fileSize;
  this.bufferAcc = buffacc || 0;
  this.offset = offset || 0;
  this.crc = crc || 0;
  var tmpStart = 0,
      tmpEnd = 0;

  while (tmpEnd < this.fileSize) {
    tmpEnd = tmpStart + chunkSize;
    tmpEnd = tmpEnd > this.fileSize ? this.fileSize : tmpEnd;
    this.chunkList.push({
      filePath: this.filePath,
      start: tmpStart,
      end: tmpEnd
    });
    tmpStart = tmpEnd + 1;
  }
};

var Transfer =
/*#__PURE__*/
function () {
  //include
  function Transfer(files, name, IO, progressHandle, statusUpdateHandle, zip, chunkIndex, id, offset, resumed) {
    var _this = this;

    classCallCheck(this, Transfer);

    this.files = void 0;
    this.name = void 0;
    this.fileType = 'File';
    this.IO = void 0;
    this._status = 'initializing';
    this.zip = void 0;
    this.id = void 0;
    this.offset = void 0;
    this.chunkIndex = void 0;
    this.chunkList = void 0;
    this.totalSize = void 0;
    this.fileSize = void 0;
    this.remainSize = void 0;
    this.fileWriter = null;
    this.fileEntry = void 0;
    this.progressHandle = void 0;
    this.statusUpdateHandle = void 0;
    this.processer = null;
    this.lock = false;
    this.paused = false;
    this.speed = 0;
    this.startTime = 0;

    this.init = function () {
      return new Promise(function (resolve, reject) {
        _this.IO.getFileWriter(_this, function (result) {
          _this.fileWriter = result.fileWriter;
          _this.fileEntry = result.fileEntry;
          console.log('fileWriter position' + result.fileWriter.position);

          if (_this.status !== 'abort') {
            _this.status = 'inited';
          }

          resolve();
        }, reject);
      });
    };

    this.update = function (length) {
      if (_this.status === 'inited') {
        _this.status = 'downloading';
      }

      var tmpEndTime = new Date().getTime();
      var duration = tmpEndTime - _this.startTime; // console.log('chunk ' + this.chunklist[this.nowChunkIndex - 1].start + '-' + this.chunklist[this.nowChunkIndex - 1].end + ' request complete at ' + tmpEndTime);

      _this.speed = length / duration * 1000;
      _this.remainSize -= length;
      _this.progressHandle && _this.progressHandle(_this.id, _this.speed, _this.remainSize, _this.status);
    };

    this.getStatus = function () {
      return _this._status;
    };

    this.files = files;
    this.name = name;
    this.fileType = filetype(this.name);
    this.IO = IO;
    this.id = id || new Date().getTime();
    this.zip = zip; // set file size
    // -----------------------------------------------------------------

    this.totalSize = files.reduce(function (prev, cur) {
      return prev + cur.fileSize;
    }, 0);
    this.fileSize = 0;

    if (zip) {
      for (var i = 0, l = files.length; i < l; i++) {
        this.fileSize += files[i].fileSize + 30 + 9 + 2 * files[i].name.length
        /* header */
        + 46 + files[i].name.length
        /* dirRecord */
        ;
      } // extra bytes for each ZipCentralDirectory


      this.fileSize += files.length * 28; // extra bytes for each dataDescriptor

      this.fileSize += files.length * 24; // final bytes

      this.fileSize += 98;
    } else {
      this.fileSize = this.totalSize;
    } // -----------------------------------------------------------------


    this.chunkList = files.reduce(function (pre, file) {
      return pre.concat(file.chunkList);
    }, []);
    this.offset = offset || 0;
    this.chunkIndex = chunkIndex || 0;

    if (this.chunkIndex === this.chunkList.length) {
      this.remainSize = 0;
    } else if (this.chunkIndex !== 0) {
      this.remainSize = this.totalSize - this.chunkList.reduce(function (acc, cur, index) {
        if (index < _this.chunkIndex) {
          acc += cur.end - (cur.start === 0 ? 0 : cur.start - 1);
        } else {
          acc += 0;
        }

        return acc;
      }, 0);
    } else {
      this.remainSize = this.totalSize;
    }

    this.progressHandle = progressHandle;
    this.statusUpdateHandle = statusUpdateHandle;
  }

  createClass(Transfer, [{
    key: "abortAllResumeData",
    value: function abortAllResumeData() {
      this.chunkIndex = 0;
      this.remainSize = this.totalSize;
      this.offset = 0;
      this.files.forEach(function (file) {
        file.offset = file.bufferAcc = 0;
      });
    }
  }, {
    key: "nextChunk",
    value: function nextChunk() {
      this.startTime = new Date().getTime(); // make sure next chunk is available when status not chunk_empty

      if (!this.chunkList[this.chunkIndex + 1]) {
        this.status = 'chunk_empty';
      } // console.log('request chunk: ' + this.chunklist[this.nowChunkIndex].start + '-' + this.chunklist[this.nowChunkIndex].end + ' at ' + this.startTime);


      return this.chunkList[this.chunkIndex++];
    }
  }, {
    key: "resumePreChunk",
    value: function resumePreChunk() {
      if (this.status === 'chunk_empty') {
        this.status = 'downloading';
      }

      this.chunkIndex -= 1;
    }
  }, {
    key: "status",
    get: function get() {
      return this._status;
    },
    set: function set(new_status) {
      this._status = new_status;
      this.statusUpdateHandle && this.statusUpdateHandle(this.id, new_status);
    }
    /**
     * use @function getStatus() to get file's current status instead of accessing it directly
     * so this is done to avoid errors during ts static checking
     * @ref https://github.com/Microsoft/TypeScript/issues/29155
     */

  }, {
    key: "currentFile",
    get: function get() {
      var tmpNowChunkIndex = this.chunkIndex - 1;
      var numChunks = 0;
      var tmpNowFile = this.files[0];

      for (var i = 0, l = this.files.length; i < l; i++) {
        numChunks += this.files[i].chunkList.length;

        if (tmpNowChunkIndex < numChunks) {
          tmpNowFile = this.files[i];
          break;
        }
      }

      return tmpNowFile;
    }
  }]);

  return Transfer;
}();

var TransferProcesser =
/*#__PURE__*/
function () {
  function TransferProcesser() {
    var _this = this;

    classCallCheck(this, TransferProcesser);

    this.idle = true;
    this.transfer = null;

    this.process =
    /*#__PURE__*/
    function () {
      var _ref = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee(transfer, scheduler) {
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (transfer.paused) {
                  _context.next = 31;
                  break;
                }

                if (!(transfer.getStatus() === 'abort')) {
                  _context.next = 9;
                  break;
                }

                // delete this file.
                scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex(function (_transfer) {
                  return _transfer.id === _transfer.id;
                }), 1);
                _this.idle = true;
                _this.transfer = null;
                transfer.lock = false;
                transfer.processer = null;
                scheduler.distributeToProcessers();
                return _context.abrupt("return");

              case 9:
                if (!(transfer.chunkIndex >= transfer.chunkList.length)) {
                  _context.next = 22;
                  break;
                }

                scheduler.IO.download([transfer]);
                transfer.status = 'complete';
                scheduler.storeFileForResume(transfer);
                scheduler.IO.deleteFile(transfer);
                scheduler.totalSize -= transfer.fileSize; // delete this file.

                scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex(function (_transfer) {
                  return _transfer.id === _transfer.id;
                }), 1);
                _this.idle = true;
                _this.transfer = null;
                transfer.lock = false;
                transfer.processer = null;
                scheduler.distributeToProcessers();
                return _context.abrupt("return");

              case 22:
                if (transfer.fileWriter) {
                  _context.next = 27;
                  break;
                }

                _context.next = 25;
                return transfer.init();

              case 25:
                _this.run(transfer, scheduler);

                return _context.abrupt("return");

              case 27:
                // file.status should be inited
                _this.fetchChunk(transfer, scheduler).catch(function (error) {
                  console.log(error);
                  transfer.resumePreChunk();
                  transfer.paused = true;
                  transfer.lock = false;
                  transfer.processer = null;
                  _this.idle = true;

                  if (transfer.status !== 'abort') {
                    transfer.status = 'error';
                  }
                });

                return _context.abrupt("return");

              case 31:
                if (transfer.status !== 'abort') {
                  transfer.status = 'paused';
                }

                transfer.processer = null;
                transfer.lock = false;
                _this.idle = true;

              case 35:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();
  }

  createClass(TransferProcesser, [{
    key: "run",

    /**
     * use @function getStatus() to get file's current status instead of accessing it directly
     * so this is done to avoid errors during ts static checking
     * @ref https://github.com/Microsoft/TypeScript/issues/29155
     */
    value: function run(transfer, scheduler) {
      transfer.processer = this;
      this.transfer = transfer;
      this.idle = false;

      if (!transfer.lock) {
        transfer.lock = true;
      }

      if (!transfer.paused) {
        transfer.status = 'downloading';
        this.process(transfer, scheduler);
      } else {
        transfer.lock = false;
        transfer.processer = null;
        this.idle = true;

        if (transfer.status !== 'abort') {
          transfer.status = 'paused';
        }
      }
    }
  }, {
    key: "fetchChunk",
    value: function () {
      var _fetchChunk = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee2(transfer, scheduler) {
        var nextChunk, response, buffer;
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                nextChunk = transfer.nextChunk();
                _context2.next = 3;
                return fetch(nextChunk.filePath, {
                  method: 'GET',
                  headers: {
                    Range: "bytes=".concat(nextChunk.start, "-").concat(nextChunk.end)
                  }
                });

              case 3:
                response = _context2.sent;

                if (!transfer.paused) {
                  _context2.next = 7;
                  break;
                }

                // throw this chunk
                this.pausedDuringFetch(transfer);
                return _context2.abrupt("return");

              case 7:
                _context2.next = 9;
                return response.arrayBuffer();

              case 9:
                buffer = _context2.sent;

                if (!transfer.paused) {
                  _context2.next = 13;
                  break;
                }

                // throw this chunk
                this.pausedDuringFetch(transfer);
                return _context2.abrupt("return");

              case 13:
                _context2.next = 15;
                return scheduler.IO.write(transfer, buffer);

              case 15:
                if (!(transfer.getStatus() === 'abort')) {
                  _context2.next = 23;
                  break;
                }

                // delete this file.
                scheduler.schedulingFiles.splice(scheduler.schedulingFiles.findIndex(function (_transfer) {
                  return _transfer.id === _transfer.id;
                }), 1);
                this.idle = true;
                this.transfer = null;
                transfer.lock = false;
                transfer.processer = null;
                scheduler.distributeToProcessers();
                return _context2.abrupt("return");

              case 23:
                transfer.update(nextChunk.end - (nextChunk.start === 0 ? 0 : nextChunk.start - 1)); // console.log(file.name + ' write ' + (file.nowChunkIndex - 1) + ' chunk, scope: ' + nextChunk.start + '-' + nextChunk.end);

                scheduler.storeFileForResume(transfer);
                this.run(transfer, scheduler);
                return _context2.abrupt("return");

              case 27:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fetchChunk(_x3, _x4) {
        return _fetchChunk.apply(this, arguments);
      }

      return fetchChunk;
    }()
  }, {
    key: "pausedDuringFetch",
    value: function pausedDuringFetch(transfer) {
      transfer.resumePreChunk();
      transfer.paused = true;
      transfer.lock = false;
      transfer.processer = null;
      this.idle = true;

      if (transfer.status !== 'abort') {
        transfer.status = 'paused';
      }
    }
  }]);

  return TransferProcesser;
}();

var IS64BIT = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);

var SavvyTransfer =
/*#__PURE__*/
function () {
  // public files: Array<SavvyFile | SavvyZipFile> = [];
  function SavvyTransfer(onProgress, onStatusUpdate) {
    var _this = this;

    classCallCheck(this, SavvyTransfer);

    this.SIZE_LIMIT = 1024 * 1024 * 1024 * (1 + (IS64BIT ? 1 : 0));
    this.CHUNK_SIZE = 1024 * 1024 * 1;
    this.HTTP_NUM = 5;
    this.totalSize = 0;
    this.IO = void 0;
    this.IO_IS_FS = false;
    this.progressHandle = void 0;
    this.statusUpdateHandle = void 0;
    this.running = false;
    this.transfers = [];
    this.schedulingFiles = [];
    this.processers = [];

    this.schedule = function (ids) {
      // fill into schedulingFiles
      var tmpIds = ids || _this.transfers.map(function (transfer) {
        return transfer.id;
      });

      var nonRepeatIds = Array.from(new Set(tmpIds));

      var _loop = function _loop(i, l) {
        var tmpTransfer = _this.transfers.find(function (transfer) {
          return transfer.id === nonRepeatIds[i];
        });

        if (tmpTransfer && _this.schedulingFiles.filter(function (transfer) {
          return transfer.id === nonRepeatIds[i];
        }).length <= 0) {
          tmpTransfer.status = 'queue';

          _this.schedulingFiles.push(tmpTransfer);
        }
      };

      for (var i = 0, l = nonRepeatIds.length; i < l; i++) {
        _loop(i, l);
      }

      _this.distributeToProcessers();
    };

    if (window.requestFileSystem || window.webkitRequestFileSystem) {
      this.IO = new FilesystemIO();
      this.IO_IS_FS = true; // fs has a largeeeee size limit, up to 200GB

      this.SIZE_LIMIT = 1024 * 1024 * 1024 * 200; // this.SIZE_LIMIT = 1024 * 1024 * 250;
    } else {
      this.IO = new MemoryIO();
    }

    this.progressHandle = onProgress;
    this.statusUpdateHandle = onStatusUpdate;

    this.processers = new Array(this.HTTP_NUM).fill('').map(function (_) {
      return new TransferProcesser();
    });
  }
  /**
   * resumeData@type TResumeData
   */


  createClass(SavvyTransfer, [{
    key: "retrieveFilesFromLocalStorage",
    value: function retrieveFilesFromLocalStorage() {
      var _this2 = this;

      var rawResumeData = window.localStorage.getItem('savvy_transfers');

      if (rawResumeData) {
        var resumeData;

        try {
          var _this$transfers;

          resumeData = JSON.parse(rawResumeData);

          (_this$transfers = this.transfers).push.apply(_this$transfers, toConsumableArray(resumeData.map(function (data) {
            return new Transfer(data.files.map(function (_file) {
              return new SavvyFile(_file.path, _file.name, _file.size, _this2.CHUNK_SIZE, _file.bufferAcc, _file.offset, _file.crc);
            }), data.name, _this2.IO, _this2.progressHandle, _this2.statusUpdateHandle, true, data.chunkIndex, data.id, data.offset, true);
          })));
        } catch (e) {
          console.log(e);
        }
      }

      if (this.IO_IS_FS) {
        this.IO.freeSpace(this.transfers);
      }

      return this.transfers;
    }
    /**
     * resumeData@type TResumeData
     * @param {Transfer} transferForUpdate
     */

  }, {
    key: "storeFileForResume",
    value: function storeFileForResume(transferForUpdate) {
      if (transferForUpdate.status === 'complete') {
        this.deleteFileFromStore(transferForUpdate);
        return;
      }

      var resumeDataForFile = {
        id: transferForUpdate.id,
        name: transferForUpdate.name,
        type: transferForUpdate.zip ? 'zip' : 'normal',
        chunkIndex: transferForUpdate.chunkIndex,
        tag: transferForUpdate.chunkIndex === transferForUpdate.chunkList.length ? 1 : 0,
        offset: transferForUpdate.offset,
        files: transferForUpdate.files.map(function (_file) {
          return {
            name: _file.name,
            path: _file.filePath,
            size: _file.fileSize,
            bufferAcc: _file.bufferAcc,
            offset: _file.offset,
            crc: _file.crc
          };
        })
      };
      var rawResumeData = window.localStorage.getItem('savvy_transfers');
      var newResumeData = [];

      if (rawResumeData) {
        var tmpResumeData;

        try {
          tmpResumeData = JSON.parse(rawResumeData);
          var index = tmpResumeData.findIndex(function (data) {
            return data.id === resumeDataForFile.id;
          });

          if (index !== -1) {
            tmpResumeData.splice(index, 1, resumeDataForFile);
            newResumeData.push.apply(newResumeData, toConsumableArray(tmpResumeData));
          } else {
            newResumeData.push.apply(newResumeData, toConsumableArray(tmpResumeData).concat([resumeDataForFile]));
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        newResumeData.push(resumeDataForFile);
      }

      window.localStorage.setItem('savvy_transfers', JSON.stringify(newResumeData));
    }
    /**
     * resumeData@type TResumeData
     * @param {Transfer} transferNeedDelete
     */

  }, {
    key: "deleteFileFromStore",
    value: function deleteFileFromStore(transferNeedDelete) {
      var rawResumeData = window.localStorage.getItem('savvy_transfers');

      if (rawResumeData) {
        var tmpResumeData;

        try {
          tmpResumeData = JSON.parse(rawResumeData);
          var index = tmpResumeData.findIndex(function (data) {
            return data.id === transferNeedDelete.id;
          });

          if (index !== -1) {
            tmpResumeData.splice(index, 1);
          }

          window.localStorage.setItem('savvy_transfers', JSON.stringify(tmpResumeData));
        } catch (e) {
          console.log(e);
        }
      }
    } // temporary just on type - zip

  }, {
    key: "addFiles",
    value: function () {
      var _addFiles = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee(files) {
        var _this3 = this;

        var asZip,
            zipName,
            tmpFiles,
            i,
            l,
            tmpFile,
            tmpTransfer,
            _args = arguments;
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                asZip = _args.length > 1 && _args[1] !== undefined ? _args[1] : false;
                zipName = _args.length > 2 ? _args[2] : undefined;
                tmpFiles = [];
                i = 0, l = files.length;

              case 4:
                if (!(i < l)) {
                  _context.next = 18;
                  break;
                }

                _context.prev = 5;
                _context.next = 8;
                return this.addFile(files[i].path, files[i].name);

              case 8:
                tmpFile = _context.sent;

                if (tmpFile && typeof tmpFile !== 'string') {
                  tmpFiles.push(tmpFile);
                }

                _context.next = 15;
                break;

              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](5);
                throw _context.t0;

              case 15:
                i++;
                _context.next = 4;
                break;

              case 18:
                if (!asZip) {
                  _context.next = 25;
                  break;
                }

                // create a zip file
                tmpTransfer = new Transfer(tmpFiles, zipName, this.IO, this.progressHandle, this.statusUpdateHandle, true);
                this.transfers.push(tmpTransfer); // store in locastorage for resume

                this.storeFileForResume(tmpTransfer);
                return _context.abrupt("return", tmpTransfer);

              case 25:
                return _context.abrupt("return", tmpFiles.map(function (file) {
                  return new Transfer([file], file.name, _this3.IO, _this3.progressHandle, _this3.statusUpdateHandle, false);
                }));

              case 26:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[5, 12]]);
      }));

      function addFiles(_x) {
        return _addFiles.apply(this, arguments);
      }

      return addFiles;
    }()
  }, {
    key: "addFile",
    value: function () {
      var _addFile = asyncToGenerator(
      /*#__PURE__*/
      regenerator.mark(function _callee2(path, name) {
        var response, fileSize, tmpFile;
        return regenerator.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (path) {
                  _context2.next = 3;
                  break;
                }

                console.log('file path invalid.');
                throw new Error('Invalid file path');

              case 3:
                _context2.next = 5;
                return fetch(path, {
                  method: 'GET',
                  headers: {
                    Range: 'bytes=0-1'
                  }
                });

              case 5:
                response = _context2.sent;
                console.log(response.headers.forEach(function (value, key) {
                  return console.log("".concat(key, ": ").concat(value));
                }));

                if (response.headers.get('content-range')) {
                  _context2.next = 10;
                  break;
                }

                console.log('can not get file size, check file path or contact service provider.'); // let message = 'can not get file size, check file path or contact service provider.';

                throw new Error('Can not get file size, check file path or contact service provider.');

              case 10:
                // calculate whether the size limit is exceeded
                fileSize = parseInt(response.headers.get('content-range').split('/')[1]);
                console.log(fileSize);

                if (!(fileSize > this.SIZE_LIMIT || fileSize + this.totalSize > this.SIZE_LIMIT)) {
                  _context2.next = 15;
                  break;
                }

                console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.'); // let message = 'The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.';

                throw new Error('exceed');

              case 15:
                // create new file
                tmpFile = new SavvyFile(path, name, fileSize, this.CHUNK_SIZE); // ensure each file get it's writer from IO
                // `asZip` flag indicate this SavvyFile where belong another SavvyFile which will actually being download as a zip file
                //  in other word, this savvyfile does not need a writer(init);

                /* if (!asZip) {
                  this.files.push(tmpFile);
                } */

                this.totalSize += tmpFile.fileSize;
                _context2.next = 19;
                return new Promise(function (resolve, reject) {
                  setTimeout(resolve, 1);
                });

              case 19:
                return _context2.abrupt("return", tmpFile);

              case 20:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function addFile(_x2, _x3) {
        return _addFile.apply(this, arguments);
      }

      return addFile;
    }()
    /**
     * @param {Array<Transfer>[]} transfers
     * pause files' processers which id within ids
     */

  }, {
    key: "pause",
    value: function pause(transfers) {
      if (this.running) {
        transfers.map(function (transfer) {
          // some file in ids may had being resumed.
          // we just need care about those files which have freezed processors.
          if (transfer.processer) {
            // tmpFile.processer.freeze = true;
            transfer.paused = true;
          } else {
            /**
             * two possible conditions:
             * 1. current transfer is not in queue.
             * 2. in queue, waiting for distribute.
             * */
            transfer.paused = true;
            transfer.status = 'paused';
          }
        });
        return true;
      }

      return false;
    }
    /**
     * @param {Array<Transfer>[]} transfers
     * resume files' processers which id within ids.
     */

  }, {
    key: "resume",
    value: function resume(transfers) {
      var _this4 = this;

      transfers.map(function (transfer) {
        transfer.paused = false;

        _this4.schedule([transfer.id]);
      });
    }
    /**
     * @param {Transfer} transfer
     * @returns SavvyFile | SavvyZipFile | undefined
     * remove file
     * 1. pause its processor if there has one.
     * 2. release the processor resource.
     * 3. delete its record in LocalStorage.
     */

  }, {
    key: "removeFile",
    value: function removeFile(transfer) {
      if (transfer && transfer.status !== 'abort') {
        transfer.paused = true;
        transfer.status = 'abort';
        this.totalSize -= transfer.fileSize;
        this.IO.deleteFile(transfer);
        this.deleteFileFromStore(transfer);
      }

      return transfer;
    }
    /**
     * @param {number[]?} ids
     * get files which id within ids, deduplication and then push into <schedulingFiles>
     */

  }, {
    key: "distributeToProcessers",

    /**
     * query the current idle state of all processors
     * distribute a file which is **not complete** and **not abort** and **not locked**
     * to a processor in idle state.
     */
    value: function distributeToProcessers() {
      if (this.schedulingFiles.length > 0) {
        this.running = true;

        for (var i = 0, l = this.processers.length; i < l; i++) {
          if (this.processers[i].idle) {
            var currentTransfer = this.schedulingFiles.find(function (transfer) {
              return transfer && transfer.status !== 'abort' && transfer.status !== 'complete' && !transfer.lock && !transfer.paused || false;
            });

            if (currentTransfer) {
              this.processers[i].run(currentTransfer, this);
            }
          }
        }
      } else {
        this.running = false;
        console.log('all files are in complete state, transfer stop.');
      }
    }
  }]);

  return SavvyTransfer;
}();

export default SavvyTransfer;
