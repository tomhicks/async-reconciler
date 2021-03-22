"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.makeAsyncReconciler = void 0;
function makeAsyncReconciler(params) {
    var currentState = params.initialState;
    var targetState = params.initialState;
    var isBusy = false;
    function isReconcileRequired() {
        var _a;
        if (params.statesAreEqual(currentState, targetState)) {
            (_a = params.log) === null || _a === void 0 ? void 0 : _a.call(params, prefixLog("Reconcile not required - states are equal"), {
                currentState: currentState,
                targetState: targetState
            });
            return false;
        }
        return true;
    }
    function reconcile() {
        var _a;
        isBusy = true;
        (_a = params.log) === null || _a === void 0 ? void 0 : _a.call(params, prefixLog("Reconciling"), {
            currentState: currentState,
            targetState: targetState
        });
        params
            .reconcile(currentState, targetState)
            .then(function (resultingState) {
            var _a, _b, _c;
            (_a = params.log) === null || _a === void 0 ? void 0 : _a.call(params, prefixLog("Reconciled"), {
                currentState: currentState,
                targetState: targetState,
                resultingState: resultingState
            });
            currentState = resultingState;
            (_b = params.onStateUpdate) === null || _b === void 0 ? void 0 : _b.call(params, currentState);
            isBusy = false;
            if (isReconcileRequired()) {
                reconcile();
            }
            else {
                (_c = params.onSettle) === null || _c === void 0 ? void 0 : _c.call(params, currentState);
            }
        })["catch"](function (e) {
            var _a;
            isBusy = false;
            (_a = params.onError) === null || _a === void 0 ? void 0 : _a.call(params, e instanceof Error
                ? e
                : new Error(prefixLog("Reconcile function caused an error")));
        });
    }
    return {
        requestState: function (requestedState) {
            var _a, _b;
            var previousTargetState = targetState;
            targetState = __assign(__assign({}, targetState), requestedState);
            if (isReconcileRequired()) {
                (_a = params.log) === null || _a === void 0 ? void 0 : _a.call(params, prefixLog("Target state added"), {
                    previousTargetState: previousTargetState,
                    targetState: targetState,
                    currentState: currentState
                });
                if (isBusy) {
                    (_b = params.log) === null || _b === void 0 ? void 0 : _b.call(params, prefixLog("Busy - skipping reconciliation"), {
                        currentState: currentState,
                        targetState: targetState
                    });
                    return;
                }
                reconcile();
            }
        }
    };
}
exports.makeAsyncReconciler = makeAsyncReconciler;
function prefixLog(str) {
    return "AsyncReconciler: " + str;
}
