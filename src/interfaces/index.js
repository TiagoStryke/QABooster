"use strict";
/**
 * Application data interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestStatus = void 0;
// ====================================================================
// DATABASE-DRIVEN TEST MANAGEMENT (FASE 4 REVISED)
// ====================================================================
/**
 * Test status in database
 */
var TestStatus;
(function (TestStatus) {
    TestStatus["IN_PROGRESS"] = "in-progress";
    TestStatus["COMPLETED"] = "completed";
})(TestStatus || (exports.TestStatus = TestStatus = {}));
