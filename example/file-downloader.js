(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global['savvy-transfer'] = factory());
}(this, function () { 'use strict';

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

	/* export default class Crc32 {
	  private crc: number = -1;
	  // Uint32Array is actually slower than []
	  static table: any[] = getCrcTable();
	  public append(data: any) {
	    var crc = this.crc | 0,
	      table = Crc32.table;
	    for (var offset = 0, len = data.length | 0; offset < len; offset++) crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xff];
	    this.crc = crc;
	  }
	  public get() {
	    return ~this.crc;
	  }
	}

	function getCrcTable() {
	  var i,
	    j,
	    t,
	    table = [];
	  for (i = 0; i < 256; i++) {
	    t = i;
	    for (j = 0; j < 8; j++) {
	      if (t & 1) {
	        t = (t >>> 1) ^ 0xedb88320;
	      } else {
	        t = t >>> 1;
	      }
	    }

	    table[i] = t;
	  }

	  return table;
	}
	 */
	// crc32
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

	//     Int64.js
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

	var Int64 = function Int64(a1, a2) {
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
	    this.setValue.apply(this, arguments);
	  }
	}; // Max integer value that JS can accurately represent


	Int64.MAX_INT = Math.pow(2, 53); // Min integer value that JS can accurately represent

	Int64.MIN_INT = -Math.pow(2, 53);
	Int64.prototype = {
	  constructor: Int64,

	  /**
	   * Do in-place 2's compliment.  See
	   * http://en.wikipedia.org/wiki/Two's_complement
	   */
	  _2scomp: function _2scomp() {
	    var b = this.buffer,
	        o = this.offset,
	        carry = 1;

	    for (var i = o + 7; i >= o; i--) {
	      var v = (b[i] ^ 0xff) + carry;
	      b[i] = v & 0xff;
	      carry = v >> 8;
	    }
	  },

	  /**
	   * Set the value. Takes any of the following arguments:
	   *
	   * setValue(string) - A hexidecimal string
	   * setValue(number) - Number (throws if n is outside int64 range)
	   * setValue(hi, lo) - Raw bits as two 32-bit values
	   */
	  setValue: function setValue(hi, lo) {
	    var negate = false;

	    if (arguments.length == 1) {
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


	    var b = this.buffer,
	        o = this.offset;

	    for (var i = 7; i >= 0; i--) {
	      b[o + i] = lo & 0xff;
	      lo = i == 4 ? hi : lo >>> 8;
	    } // Restore sign of passed argument


	    if (negate) this._2scomp();
	  },

	  /**
	   * Convert to a native JS number.
	   *
	   * WARNING: Do not expect this value to be accurate to integer precision for
	   * large (positive or negative) numbers!
	   *
	   * @param allowImprecise If true, no check is performed to verify the
	   * returned value is accurate to integer precision.  If false, imprecise
	   * numbers (very large positive or negative numbers) will be forced to +/-
	   * Infinity.
	   */
	  toNumber: function toNumber(allowImprecise) {
	    var b = this.buffer,
	        o = this.offset; // Running sum of octets, doing a 2's complement

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
	  },

	  /**
	   * Convert to a JS Number. Returns +/-Infinity for values that can't be
	   * represented to integer precision.
	   */
	  valueOf: function valueOf() {
	    return this.toNumber(false);
	  },

	  /**
	   * Return string value
	   *
	   * @param radix Just like Number#toString()'s radix
	   */
	  toString: function toString(radix) {
	    return this.valueOf().toString(radix || 10);
	  },

	  /**
	   * Return a string showing the buffer octets, with MSB on the left.
	   *
	   * @param sep separator string. default is '' (empty string)
	   */
	  toOctetString: function toOctetString(sep) {
	    var out = new Array(8);
	    var b = this.buffer,
	        o = this.offset;

	    for (var i = 0; i < 8; i++) {
	      out[i] = _HEX[b[o + i]];
	    }

	    return out.join(sep || '');
	  },

	  /**
	   * Returns the int64's 8 bytes in a buffer.
	   *
	   * @param {bool} [rawBuffer=false]  If no offset and this is true, return the internal buffer.  Should only be used if
	   *                                  you're discarding the Int64 afterwards, as it breaks encapsulation.
	   */
	  toBuffer: function toBuffer(rawBuffer) {
	    if (rawBuffer && this.offset === 0) return this.buffer;
	    var out = new Buffer(8);
	    this.buffer.copy(out, 0, this.offset, this.offset + 8);
	    return out;
	  },

	  /**
	   * Copy 8 bytes of int64 into target buffer at target offset.
	   *
	   * @param {Buffer} targetBuffer       Buffer to copy into.
	   * @param {number} [targetOffset=0]   Offset into target buffer.
	   */
	  copy: function copy(targetBuffer, targetOffset) {
	    this.buffer.copy(targetBuffer, targetOffset || 0, this.offset, this.offset + 8);
	  },

	  /**
	   * Returns a number indicating whether this comes before or after or is the
	   * same as the other in sort order.
	   *
	   * @param {Int64} other  Other Int64 to compare.
	   */
	  compare: function compare(other) {
	    // If sign bits differ ...
	    if ((this.buffer[this.offset] & 0x80) != (other.buffer[other.offset] & 0x80)) {
	      return other.buffer[other.offset] - this.buffer[this.offset];
	    } // otherwise, compare bytes lexicographically


	    for (var i = 0; i < 8; i++) {
	      if (this.buffer[this.offset + i] !== other.buffer[other.offset + i]) {
	        return this.buffer[this.offset + i] - other.buffer[other.offset + i];
	      }
	    }

	    return 0;
	  },

	  /**
	   * Returns a boolean indicating if this integer is equal to other.
	   *
	   * @param {Int64} other  Other Int64 to compare.
	   */
	  equals: function equals(other) {
	    return this.compare(other) === 0;
	  },

	  /**
	   * Pretty output in console.log
	   */
	  inspect: function inspect() {
	    return '[Int64 value:' + this + ' octets:' + this.toOctetString(' ') + ']';
	  }
	};

	var appendABViewSupported = false;

	try {
	  appendABViewSupported = new Blob([new DataView(new ArrayBuffer(0))]).size === 0;
	} catch (e) {
	  console.log(e);
	}
	var ZipWriter =
	/*#__PURE__*/
	function () {
	  function ZipWriter() {
	    classCallCheck(this, ZipWriter);

	    this.writer = void 0;
	    this.fileNames = [];
	    this.files = {};
	    this.dataLength = 0;
	    this.offset = 0;
	    this.dirData = [];
	  }

	  createClass(ZipWriter, [{
	    key: "add",
	    value: function () {
	      var _add = asyncToGenerator(
	      /*#__PURE__*/
	      regenerator.mark(function _callee(currentFile, zipFile, _buffer, isLast) {
	        var buffer, crc, ziper, fileName, ebuf, header, d, centralDir, centralDirBuffer, _d, end, tmpSize, tmpOffset, tmpBuf, i, _i;

	        return regenerator.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                // part of the current file.
	                buffer = new Uint8Array(_buffer);
	                crc = crc32(buffer, currentFile.crc || 0, buffer.byteLength);
	                ziper = new ZIPClass(zipFile.fileSize);
	                fileName = unescape(encodeURIComponent(currentFile.name));
	                currentFile.bufferAcc += buffer.byteLength;

	                if (currentFile.offset === 0) {
	                  // begin set header
	                  currentFile.headerPos = zipFile.offset;
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
	                  buffer = d;
	                  console.log('add header');
	                } // begin set central directory


	                if (currentFile.bufferAcc === currentFile.fileSize) {
	                  centralDir = ziper.ZipCentralDirectory(fileName, currentFile.fileSize, currentFile.fileSize, crc, false, currentFile.headerPos);
	                  zipFile.dirData.push(centralDir.dirRecord);
	                  centralDirBuffer = centralDir.dataDescriptor;
	                  _d = new Uint8Array(buffer.byteLength + centralDirBuffer.byteLength);

	                  _d.set(buffer, 0);

	                  _d.set(centralDirBuffer, buffer.byteLength);

	                  buffer = _d;
	                } else {
	                  currentFile.offset += buffer.byteLength;
	                }

	                if (isLast) {
	                  end = ziper.ZipSuffix(buffer.byteLength + zipFile.offset, this.dirData);
	                  console.log('this file is the last to be added to this zip, add end.');
	                  tmpSize = 0, tmpOffset = buffer.byteLength;

	                  for (i in zipFile.dirData) {
	                    tmpSize += zipFile.dirData[i].byteLength;
	                  }

	                  tmpBuf = new Uint8Array(buffer.byteLength + tmpSize + end.byteLength);
	                  tmpBuf.set(buffer, 0);

	                  for (_i in zipFile.dirData) {
	                    // console.log(this.dirData[i], tmpOffset);
	                    tmpBuf.set(zipFile.dirData[_i], tmpOffset);
	                    tmpOffset += zipFile.dirData[_i].byteLength;
	                  }

	                  tmpBuf.set(end, tmpOffset);
	                  buffer = tmpBuf;
	                }

	                zipFile.offset += buffer.byteLength;
	                console.log('get a finalliy buffer, length: ' + buffer.byteLength);
	                return _context.abrupt("return", new Promise(function (resolve, reject) {
	                  var tmpWrite = zipFile.fileWriter;

	                  tmpWrite.onwriteend = function (e) {
	                    resolve();
	                  };

	                  tmpWrite.onerror = function () {
	                    reject();
	                  };

	                  tmpWrite.write(new Blob([buffer]));
	                }));

	              case 11:
	              case "end":
	                return _context.stop();
	            }
	          }
	        }, _callee, this);
	      }));

	      function add(_x, _x2, _x3, _x4) {
	        return _add.apply(this, arguments);
	      }

	      return add;
	    }()
	    /* private writeHeader(name: string, fileName: number[]): Promise<any> {
	      let data: { buffer: ArrayBuffer; array: Uint8Array; view: DataView };
	      let date: Date = new Date();
	      let header = getDataHelper(26);
	      this.files[name] = {
	        headerArray: header.array,
	        directory: false,
	        filename: fileName,
	        offset: this.dataLength,
	        comment: getBytes(encodeUTF8(''))
	      };
	      header.view.setUint32(0, 0x14000808);
	      header.view.setUint16(6, (((date.getHours() << 6) | date.getMinutes()) << 5) | (date.getSeconds() / 2), true);
	      header.view.setUint16(8, ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(), true);
	      header.view.setUint16(22, fileName.length, true);
	      data = getDataHelper(30 + fileName.length);
	      data.view.setUint32(0, 0x504b0304);
	      data.array.set(header.array, 4);
	      data.array.set(fileName, 30);
	      this.dataLength += data.array.length;
	       return new Promise((resolve: Function, reject: Function) => {
	        let tmpWrite: FileWriter = this.writer;
	        tmpWrite.onwriteend = (e: ProgressEvent) => {
	          resolve(header);
	        };
	        tmpWrite.onerror = () => {
	          reject();
	        };
	        tmpWrite.write(new Blob([appendABViewSupported ? data.array : data.array.buffer]));
	      });
	      // this.writer.writeUint8Array(data.array, callback, onwriteerror);
	    } 
	    private writeFooter(compressedLength: number, crc32: number, reader: BlobReader, header: THeadAndFooter): Promise<any> {
	      var footer: THeadAndFooter = getDataHelper(16);
	      this.dataLength += compressedLength || 0;
	      footer.view.setUint32(0, 0x504b0708);
	      if (typeof crc32 != 'undefined') {
	        header.view.setUint32(10, crc32, true);
	        footer.view.setUint32(4, crc32, true);
	      }
	      if (reader) {
	        footer.view.setUint32(8, compressedLength, true);
	        header.view.setUint32(14, compressedLength, true);
	        footer.view.setUint32(12, reader.size, true);
	        header.view.setUint32(18, reader.size, true);
	      }
	       return new Promise((resolve: Function, reject: Function) => {
	        let tmpWrite: FileWriter = this.writer;
	        tmpWrite.onwriteend = (e: ProgressEvent) => {
	          resolve();
	        };
	        tmpWrite.onerror = () => {
	          reject();
	        };
	        tmpWrite.write(new Blob([appendABViewSupported ? footer.array : footer.array.buffer]));
	      });
	    }
	     private async copy(reader: BlobReader, offset: number, size: number, computeCrc32: boolean): Promise<number> {
	      let chunkIndex = 0,
	        index,
	        outputSize = 0,
	        crcInput: boolean = true;
	      let crc = new Crc32();
	       // let outputData;
	      // index = chunkIndex * CHUNK_SIZE;
	      // if (index < size) {
	      //   let inputData = await reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index));
	       //   if(inputData){
	      //     outputSize += inputData.length;
	      //     await this.writer.writeUint8Array()
	      //   }
	      // } else {
	      // }
	      // get all content once.
	      let inputData: Uint8Array = await reader.readUint8Array();
	      crc.append(inputData);
	      await new Promise((resolve: Function, reject: Function) => {
	        let tmpWrite: FileWriter = this.writer;
	        tmpWrite.onwriteend = (e: ProgressEvent) => {
	          resolve();
	        };
	        tmpWrite.onerror = () => {
	          reject();
	        };
	        tmpWrite.write(new Blob([appendABViewSupported ? inputData : inputData.buffer]));
	      });
	       return crc.get();
	    } */

	  }]);

	  return ZipWriter;
	}();
	var BlobReader =
	/*#__PURE__*/
	function () {
	  function BlobReader(_file) {
	    classCallCheck(this, BlobReader);

	    this.file = void 0;
	    this.size = void 0;
	    this.file = _file;
	    this.size = _file.size;
	  }

	  createClass(BlobReader, [{
	    key: "readUint8Array",
	    value: function readUint8Array() {
	      var _this = this;

	      return new Promise(function (resolve, reject) {
	        var reader = new FileReader(); // TO-DO: may be wrong

	        reader.onload = function (e) {
	          resolve(new Uint8Array(reader.result));
	        };

	        reader.onerror = function () {
	          reject();
	        };

	        try {
	          reader.readAsArrayBuffer(_this.file);
	        } catch (e) {
	          reject();
	        }
	      });
	    }
	  }]);

	  return BlobReader;
	}();
	function createZipWriter() {
	  return new ZipWriter();
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
	      var buffer = new Int64(number).buffer;

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
	function (_IO) {
	  inherits(FilesystemIO, _IO);

	  function FilesystemIO() {
	    var _this;

	    classCallCheck(this, FilesystemIO);

	    _this = possibleConstructorReturn(this, getPrototypeOf(FilesystemIO).call(this));

	    _this.saveLink = function (file, objectURL) {
	      var link = typeof objectURL === 'string' && objectURL;
	      var dlLinkNode = document.createElement('a');
	      dlLinkNode.download = file.name;
	      dlLinkNode.href = link || file.fileEntry.toURL();
	      dlLinkNode.click();
	    };

	    _this.saveFile = function (savvyFile, file) {
	      try {
	        var _file = new File([file], savvyFile.name, {
	          type: filemime(savvyFile.name)
	        });

	        _this.saveLink(savvyFile, window.URL.createObjectURL(_file));
	      } catch (ex) {
	        console.log(ex);

	        _this.saveLink(savvyFile);
	      }
	    };

	    customWindow.requestFileSystem = customWindow.requestFileSystem || customWindow.webkitRequestFileSystem; // 创建文件系统, 临时空间会被浏览器自行判断, 在需要时删除, 永久空间不会, 但申请时需要用户允许.
	    // window.requestFileSystem(type, size, successCallback[, errorCallback]);

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
	    return _this;
	  }
	  /**
	   * @param {SavvyFile} file
	   * @param {Function} successCallback
	   * @param {Function} errorCallback
	   */


	  createClass(FilesystemIO, [{
	    key: "getFileWriter",
	    value: function getFileWriter(file, successCallback, errorCallback) {
	      customWindow.requestFileSystem(TEMPORARY, file.fileSize, function (fs) {
	        fs.root.getDirectory('savvy', {
	          create: true
	        }, function (directoryEntry) {
	          fs.root.getFile('savvy/' + file.name, {
	            create: true
	          }, function (fileEntry) {
	            fileEntry.createWriter(function (fw) {
	              successCallback({
	                fileEntry: fileEntry,
	                fileWriter: fw
	              });
	            });
	          });
	        });
	      });
	    }
	    /* private handleFileWriteStart = (event: ProgressEvent): void => {
	      console.log(event);
	       this.writing = true;
	    };
	    private handleFileWriteProgress = (event: ProgressEvent): void => {
	      console.log(event);
	    };
	    private handleFileWriteError = (event: ProgressEvent): void => {
	      console.log(event);
	       this.writing = false;
	    };
	    private handleFileWriteEnd = (event: ProgressEvent): void => {
	      console.log(event);
	      console.log(this.fileWriter!.position);
	      this.writing = false;
	       if (this.writeEndResolve) {
	        this.writeEndResolve();
	         this.writeEndReject = null;
	        this.writeEndResolve = null;
	      }
	    }; */
	    // Try to free space before starting the download.
	    // 需要考虑是否存在当前有文件正在从沙盒环境写入本地文件系统, 在这个过程中不能删除这个空间.

	  }, {
	    key: "free_space",
	    value: function free_space(callback, ms, delta) {}
	  }, {
	    key: "createTmpFile",
	    value: function createTmpFile() {
	      var _this2 = this;

	      var tmpFileName = 'tmp.zip';
	      return new Promise(function (resolve, reject) {
	        customWindow.requestFileSystem(TEMPORARY, 4 * 1024 * 1024 * 1024, function (fs) {
	          fs.root.getFile(tmpFileName, undefined, function (file) {
	            file.remove(function () {
	              _this2.create(fs, tmpFileName, resolve, reject);
	            }, function () {
	              _this2.create(fs, tmpFileName, resolve, reject);
	            });
	          }, function () {
	            _this2.create(fs, tmpFileName, resolve, reject);
	          });
	        });
	      });
	    }
	  }, {
	    key: "create",
	    value: function create(fs, tmpFileName, resolve, reject) {
	      fs.root.getFile(tmpFileName, {
	        create: true
	      }, function (tmpFile) {
	        resolve(tmpFile);
	      }, function () {
	        reject();
	      });
	    }
	    /**
	     * @param {SavvyFile} file
	     * @param {ArrayBuffer} buffer
	     */

	  }, {
	    key: "write",
	    value: function write(file, buffer) {
	      return new Promise(function (resolve, reject) {
	        if (file.fileWriter) {
	          var fileWriter = file.fileWriter;

	          if (file.isZip) {
	            var tmpZipFile = file;
	            var zipWriter = createZipWriter();
	            var currentFile = tmpZipFile.currentFile;
	            zipWriter.add(currentFile, tmpZipFile, buffer, tmpZipFile.nowChunkIndex === tmpZipFile.chunklist.length).then(function () {
	              resolve();
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
	     * @param {SavvyFile}File
	     * @param {SavvyFile[]}Files
	     * @public
	     */

	  }, {
	    key: "download",
	    value: function download(files) {
	      var _this3 = this;

	      var _loop = function _loop(i, l) {
	        var fileEntry = files[i].fileEntry;

	        if (typeof files[i].fileEntry.file === 'function') {
	          try {
	            fileEntry.file(function (file) {
	              _this3.saveFile(files[i], file);
	            }, function () {
	              _this3.saveLink(files[i]);
	            });
	          } catch (e) {
	            console.log(e);
	          }
	        } else {
	          _this3.saveLink(files[i]);
	        }
	      };

	      for (var i = 0, l = files.length; i < l; i++) {
	        _loop(i, l);
	      }
	    }
	    /* private async downloadAsZip(files: SavvyFile[]): Promise<undefined> {
	      // create a tmpFile for zip buffer.
	      let tmpZipFile: FileEntry = await this.createTmpFile();
	       let totalFileSize: number = files.reduce((prev: number, cur: SavvyFile, curIndex: number, arr: SavvyFile[]) => prev + cur.fileSize, 0);
	       // creative a zip writer(a zip writer need a reader to provide data, and a writer to writer zip data to zip file.)
	      let writer: FileWriter = await new Promise((resolve: Function, reject: Function) => {
	        tmpZipFile.createWriter(
	          (fileWriter: FileWriter) => {
	            resolve(fileWriter);
	          },
	          () => {
	            reject();
	          }
	        );
	      });
	       let zipWriter: ZipWriter = createZipWriter(writer);
	       // add all files into zip writer, and writer to fs://root/tmp.zip
	      for (let i: number = 0, l: number = files.length; i < l; i++) {
	        // get File Obj
	        // TO-DO: stupid thing is, we use Filesystem to store the file but at here we read it to memory again!
	        // WHATEVER SOMETHING MUST BE FOUND TO SOLVE THIS SHIT!
	        let tmpFile: File = await new Promise((resolve: FileCallback, reject: ErrorCallback) => {
	          (files[i].fileEntry as FileEntry).file(resolve, reject);
	        });
	        await zipWriter.add(files[i].name, new BlobReader(tmpFile), files[i].fileSize, totalFileSize, i === l - 1);
	      }
	       // download this zip file
	      if (typeof tmpZipFile.file === 'function') {
	        try {
	          tmpZipFile.file(
	            (file: File) => {
	              console.log(file);
	              let _file: File = new File([file], 'tmp.zip', {
	                type: filemime('tmp.zip')
	              });
	               this.saveLink(new SavvyFile('', 'tmp.zip', 0, 0, this), window.URL.createObjectURL(_file));
	              // this.saveFile(files[0], file);
	            },
	            () => {
	              this.saveLink(files[0]);
	            }
	          );
	        } catch (e) {
	          console.log(e);
	        }
	      } else {
	        this.saveLink(files[0]);
	      }
	       return;
	    } */

	    /**
	     * @param {SavvyFile}file
	     * @param {String?}objectURL
	     * @private
	     */

	  }]);

	  return FilesystemIO;
	}(IO);

	var MSIE = typeof MSBlobBuilder === 'function';

	var MemoryIO =
	/*#__PURE__*/
	function (_IO) {
	  inherits(MemoryIO, _IO);

	  // private size: number;
	  function MemoryIO() {
	    var _this;

	    classCallCheck(this, MemoryIO);

	    _this = possibleConstructorReturn(this, getPrototypeOf(MemoryIO).call(this));
	    _this.downloadSize = 0;
	    return _this;
	  }

	  createClass(MemoryIO, [{
	    key: "getFileWriter",
	    value: function getFileWriter(file, successCallback, errorCallback) {
	      successCallback({
	        fileEntry: null,
	        fileWriter: new MemoryWrite()
	      });
	    }
	  }, {
	    key: "write",
	    value: function write(file, buffer) {
	      return new Promise(function (resolve, reject) {
	        console.log('memory write');

	        if (file.isZip) {
	          var tmpZipFile = file;
	          var zipWriter = createZipWriter();
	          var currentFile = tmpZipFile.currentFile;
	          zipWriter.add(currentFile, tmpZipFile, buffer, tmpZipFile.nowChunkIndex === tmpZipFile.chunklist.length).then(function () {
	            resolve();
	          });
	        } else {
	          file.fileWriter.onwriteend = function () {
	            resolve();
	          };

	          file.fileWriter.onerror = function (e) {
	            reject();
	          };

	          file.fileWriter.write(new Blob([buffer]));
	        }
	      });
	    }
	  }, {
	    key: "download",
	    value: function download(files) {
	      for (var i = 0, l = files.length; i < l; i++) {
	        var blob = files[i].fileWriter.getBlob(files[i].name);
	        var blob_url = '';

	        if (MSIE) {
	          navigator.msSaveOrOpenBlob(blob, name);
	        } else {
	          blob_url = window.URL.createObjectURL(blob);
	          var dlLinkNode = document.createElement('a');
	          dlLinkNode.download = files[i].name;
	          dlLinkNode.href = blob_url; // this click may triggers beforeunload...

	          dlLinkNode.click();
	        }
	      }
	    }
	  }]);

	  return MemoryIO;
	}(IO);

	var MemoryWrite =
	/*#__PURE__*/
	function () {
	  function MemoryWrite() {
	    classCallCheck(this, MemoryWrite);

	    this.blobList = void 0;
	    this.onwriteend = void 0;
	    this.onerror = void 0;

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
	  }]);

	  return MemoryWrite;
	}();

	var SavvyFile =
	/*#__PURE__*/
	function () {
	  function SavvyFile(path, name, fileSize, chunkSize, IO_instance) {
	    var _this = this;

	    classCallCheck(this, SavvyFile);

	    this.isZip = false;
	    this.chunklist = [];
	    this.status = void 0;
	    this.filePath = void 0;
	    this.name = void 0;
	    this.fileSize = void 0;
	    this.chunkSize = void 0;
	    this.fileWriter = void 0;
	    this.fileEntry = void 0;
	    this.nowChunkIndex = 0;
	    this.IO = void 0;
	    this.offset = 0;
	    this.crc = 0;
	    this.headerPos = 0;
	    this.bufferAcc = 0;

	    this.init = function () {
	      return new Promise(function (resolve, reject) {
	        _this.IO.getFileWriter(_this, function (result) {
	          _this.fileWriter = result.fileWriter;
	          _this.fileEntry = result.fileEntry;
	          _this.status = 'inited';
	          resolve();
	        }, reject);
	      });
	    };

	    this.status = 'initializing';
	    this.filePath = path;
	    this.name = name;
	    this.fileSize = fileSize;
	    this.chunkSize = chunkSize;
	    this.IO = IO_instance;
	    var tmpStart = 0,
	        tmpEnd = 0;

	    while (tmpEnd < this.fileSize) {
	      tmpEnd = tmpStart + this.chunkSize;
	      tmpEnd = tmpEnd > this.fileSize ? this.fileSize : tmpEnd;
	      this.chunklist.push({
	        filePath: this.filePath,
	        start: tmpStart,
	        end: tmpEnd
	      });
	      tmpStart = tmpEnd + 1;
	    }
	  }

	  createClass(SavvyFile, [{
	    key: "nextChunk",
	    value: function nextChunk() {
	      // make sure next chunk is available when status not chunk_empty
	      if (!this.chunklist[this.nowChunkIndex + 1]) {
	        this.status = 'chunk_empty';
	      }

	      return this.chunklist[this.nowChunkIndex++];
	    }
	  }]);

	  return SavvyFile;
	}();

	var SavvyZipFile =
	/*#__PURE__*/
	function () {
	  function SavvyZipFile(files, name, IO_instance) {
	    var _this = this;

	    classCallCheck(this, SavvyZipFile);

	    this.chunklist = [];
	    this.status = void 0;
	    this.isZip = true;
	    this.fileWriter = void 0;
	    this.fileEntry = void 0;
	    this.name = void 0;
	    this.fileSize = 0;
	    this.totalSize = void 0;
	    this.files = void 0;
	    this.nowChunkIndex = 0;
	    this.IO = void 0;
	    this.offset = 0;
	    this.dirData = [];

	    this.init = function () {
	      return new Promise(function (resolve, reject) {
	        _this.IO.getFileWriter(_this, function (result) {
	          _this.fileWriter = result.fileWriter;
	          _this.fileEntry = result.fileEntry;
	          _this.status = 'inited';
	          resolve();
	        }, reject);
	      });
	    };

	    this.status = 'initializing';
	    this.IO = IO_instance;
	    this.name = name;
	    this.files = files;
	    this.totalSize = files.reduce(function (prev, cur) {
	      return prev + cur.fileSize;
	    }, 0);

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
	    this.chunklist = files.reduce(function (pre, file) {
	      return pre.concat(file.chunklist);
	    }, []);
	  }

	  createClass(SavvyZipFile, [{
	    key: "nextChunk",
	    value: function nextChunk() {
	      // make sure next chunk is available when status not chunk_empty
	      if (!this.chunklist[this.nowChunkIndex + 1]) {
	        this.status = 'chunk_empty';
	      }

	      return this.chunklist[this.nowChunkIndex++];
	    }
	  }, {
	    key: "currentFile",
	    get: function get() {
	      var tmpNowChunkIndex = this.nowChunkIndex - 1;
	      var numChunks = 0;
	      var tmpNowFile = this.files[0];

	      for (var i = 0, l = this.files.length; i < l; i++) {
	        numChunks += this.files[i].chunklist.length;

	        if (tmpNowChunkIndex < numChunks) {
	          tmpNowFile = this.files[i];
	          break;
	        }
	      }

	      return tmpNowFile;
	    }
	  }]);

	  return SavvyZipFile;
	}();

	var IS64BIT = /\b(WOW64|x86_64|Win64|intel mac os x 10.(9|\d{2,}))/i.test(navigator.userAgent);

	var SavvyTransfer =
	/*#__PURE__*/
	function () {
	  function SavvyTransfer() {
	    var _this = this;

	    classCallCheck(this, SavvyTransfer);

	    this.IO = void 0;
	    this.size = 0;
	    this.fileInited = 0;
	    this.fileAllAdded = false;
	    this.readyForDownload = false;
	    this.waitReadyAndDownload = false;
	    this.files = [];

	    this.scheduleDownload = function (fileForZip) {
	      if (_this.readyForDownload) {
	        if (fileForZip) {
	          if (fileForZip.status === 'inited') {
	            _this.fetchData(fileForZip);
	          } else {
	            _this.IO.download([fileForZip]);
	          }
	        } else {
	          // normal download, as sperate files.
	          if (_this.files.length > 0) {
	            var nextFile = _this.files.find(function (file) {
	              return file.status === 'inited';
	            }); // 还有等待下载的文件


	            if (nextFile) {
	              _this.fetchData(nextFile);
	            } else {
	              _this.IO.download(_this.files.filter(function (file) {
	                return file.status === 'chunk_empty';
	              }));
	            }
	          }
	        }
	      } else {
	        _this.waitReadyAndDownload = true;
	      }
	    };

	    this.fetchData =
	    /*#__PURE__*/
	    function () {
	      var _ref = asyncToGenerator(
	      /*#__PURE__*/
	      regenerator.mark(function _callee(file) {
	        var nextChunk, response, buffer;
	        return regenerator.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                // here must be an unprocessed block, cos file.status is not 'chunk_empty'
	                nextChunk = file.nextChunk(); // console.log(file.name + ' downloading chunk: ' + nextChunk.start + '-' + nextChunk.end);

	                _context.next = 3;
	                return fetch(nextChunk.filePath, {
	                  method: 'GET',
	                  headers: {
	                    Range: "bytes=".concat(nextChunk.start, "-").concat(nextChunk.end)
	                  }
	                });

	              case 3:
	                response = _context.sent;
	                _context.next = 6;
	                return response.arrayBuffer();

	              case 6:
	                buffer = _context.sent;
	                _context.next = 9;
	                return _this.IO.write(file, buffer);

	              case 9:
	                if (file.isZip) {
	                  _this.scheduleDownload(file);
	                } else {
	                  _this.scheduleDownload();
	                }

	                return _context.abrupt("return");

	              case 11:
	              case "end":
	                return _context.stop();
	            }
	          }
	        }, _callee, this);
	      }));

	      return function (_x) {
	        return _ref.apply(this, arguments);
	      };
	    }();

	    this.setIOMethod(); // this.IO = new MemoryIO();
	    // this.IO = new FilesystemIO();
	  }

	  createClass(SavvyTransfer, [{
	    key: "setIOMethod",
	    value: function setIOMethod() {
	      if (window.requestFileSystem || window.webkitRequestFileSystem) {
	        this.IO = new FilesystemIO();
	      } else {
	        this.IO = new MemoryIO();
	      }
	    }
	  }, {
	    key: "addFiles",
	    value: function () {
	      var _addFiles = asyncToGenerator(
	      /*#__PURE__*/
	      regenerator.mark(function _callee2(files) {
	        var asZip,
	            savvyFiles,
	            i,
	            l,
	            tmpFile,
	            zipFile,
	            _args2 = arguments;
	        return regenerator.wrap(function _callee2$(_context2) {
	          while (1) {
	            switch (_context2.prev = _context2.next) {
	              case 0:
	                asZip = _args2.length > 1 && _args2[1] !== undefined ? _args2[1] : false;
	                savvyFiles = [];
	                i = 0, l = files.length;

	              case 3:
	                if (!(i < l)) {
	                  _context2.next = 11;
	                  break;
	                }

	                _context2.next = 6;
	                return this._addFile(files[i].path, files[i].name, asZip);

	              case 6:
	                tmpFile = _context2.sent;

	                if (tmpFile) {
	                  savvyFiles.push(tmpFile);
	                }

	              case 8:
	                i++;
	                _context2.next = 3;
	                break;

	              case 11:
	                zipFile = null;

	                if (!asZip) {
	                  _context2.next = 16;
	                  break;
	                }

	                // create a zip file
	                zipFile = new SavvyZipFile(savvyFiles, 'test.zip', this.IO);
	                _context2.next = 16;
	                return zipFile.init();

	              case 16:
	                this.readyForDownload = true;

	                if (this.waitReadyAndDownload) {
	                  this.waitReadyAndDownload = false;
	                  this.scheduleDownload();
	                }

	                if (!asZip) {
	                  _context2.next = 22;
	                  break;
	                }

	                return _context2.abrupt("return", zipFile);

	              case 22:
	                return _context2.abrupt("return", savvyFiles);

	              case 23:
	              case "end":
	                return _context2.stop();
	            }
	          }
	        }, _callee2, this);
	      }));

	      function addFiles(_x2) {
	        return _addFiles.apply(this, arguments);
	      }

	      return addFiles;
	    }()
	  }, {
	    key: "addFile",
	    value: function () {
	      var _addFile2 = asyncToGenerator(
	      /*#__PURE__*/
	      regenerator.mark(function _callee3(path, name) {
	        var tmpFile;
	        return regenerator.wrap(function _callee3$(_context3) {
	          while (1) {
	            switch (_context3.prev = _context3.next) {
	              case 0:
	                _context3.next = 2;
	                return this._addFile(path, name);

	              case 2:
	                tmpFile = _context3.sent;
	                this.readyForDownload = true;

	                if (this.waitReadyAndDownload) {
	                  this.waitReadyAndDownload = false;
	                  this.scheduleDownload();
	                }

	                return _context3.abrupt("return", tmpFile);

	              case 6:
	              case "end":
	                return _context3.stop();
	            }
	          }
	        }, _callee3, this);
	      }));

	      function addFile(_x3, _x4) {
	        return _addFile2.apply(this, arguments);
	      }

	      return addFile;
	    }()
	  }, {
	    key: "showFiles",
	    value: function showFiles() {
	      console.log('show files');
	    }
	  }, {
	    key: "_addFile",
	    value: function () {
	      var _addFile3 = asyncToGenerator(
	      /*#__PURE__*/
	      regenerator.mark(function _callee4(path, name) {
	        var asZip,
	            response,
	            fileSize,
	            tmpFile,
	            _args4 = arguments;
	        return regenerator.wrap(function _callee4$(_context4) {
	          while (1) {
	            switch (_context4.prev = _context4.next) {
	              case 0:
	                asZip = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : false;

	                if (path) {
	                  _context4.next = 4;
	                  break;
	                }

	                console.log('file path invalid.');
	                return _context4.abrupt("return");

	              case 4:
	                _context4.next = 6;
	                return fetch(path, {
	                  method: 'GET',
	                  headers: {
	                    Range: 'bytes=0-1'
	                  }
	                });

	              case 6:
	                response = _context4.sent;

	                if (response.headers.get('content-range')) {
	                  _context4.next = 10;
	                  break;
	                }

	                console.log('can not get file size, check file path or contact service provider.');
	                return _context4.abrupt("return");

	              case 10:
	                // calculate whether the size limit is exceeded
	                fileSize = parseInt(response.headers.get('content-range').split('/')[1]);
	                /*if (fileSize > SavvyTransfer.SIZE_LIMIT || fileSize + this.size > SavvyTransfer.SIZE_LIMIT) {
	                  console.log('The download size exceeds the maximum size supported by the browser. You can use savvy-cli to proceed with the download.');
	                   return;
	                } */
	                // create new file

	                tmpFile = new SavvyFile(path, name, fileSize, SavvyTransfer.CHUNK_SIZE, this.IO); // ensure each file get it's writer from IO
	                // `asZip` flag indicate this SavvyFile where belong another SavvyFile which will actually being download as a zip file
	                //  in other word, this savvyfile does not need a writer(init);

	                if (asZip) {
	                  _context4.next = 15;
	                  break;
	                }

	                _context4.next = 15;
	                return tmpFile.init();

	              case 15:
	                this.files.push(tmpFile);
	                return _context4.abrupt("return", tmpFile);

	              case 17:
	              case "end":
	                return _context4.stop();
	            }
	          }
	        }, _callee4, this);
	      }));

	      function _addFile(_x5, _x6) {
	        return _addFile3.apply(this, arguments);
	      }

	      return _addFile;
	    }() // add file 之后手动调用, 此时如果files还没有准备好, 则设置变量等待.

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

	return SavvyTransfer;

}));
//# sourceMappingURL=savvy-transfer.js.map
