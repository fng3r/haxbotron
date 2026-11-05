import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isOvertime, isTimeRunningOut } from './timer.ts';

test('warning starts below 30 displayed seconds remaining and ends at the limit', () => {
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 29 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 30 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 30.999 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 31 }), true);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 59.999 }), true);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 60 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: 61 }), false);
});

test('uses score limits in seconds for longer and short matches', () => {
  assert.equal(isTimeRunningOut({ timeLimit: 300, time: 270 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 300, time: 271 }), true);
  assert.equal(isTimeRunningOut({ timeLimit: 20, time: 0 }), true);
});

test('no warning for untimed, stopped, missing or invalid score data', () => {
  assert.equal(isTimeRunningOut(null), false);
  assert.equal(isTimeRunningOut({ timeLimit: 0, time: 100 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: -1, time: 0 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: NaN }), false);
  assert.equal(isTimeRunningOut({ timeLimit: Infinity, time: 40 }), false);
  assert.equal(isTimeRunningOut({ timeLimit: 60, time: -1 }), false);
});

test('overtime appears only after a finite positive time limit is exceeded', () => {
  assert.equal(isOvertime({ timeLimit: 60, time: 59.999 }), false);
  assert.equal(isOvertime({ timeLimit: 60, time: 60 }), false);
  assert.equal(isOvertime({ timeLimit: 60, time: 60.001 }), true);
  assert.equal(isOvertime({ timeLimit: 300, time: 310 }), true);
  assert.equal(isOvertime(null), false);
  assert.equal(isOvertime({ timeLimit: 0, time: 310 }), false);
  assert.equal(isOvertime({ timeLimit: -1, time: 310 }), false);
  assert.equal(isOvertime({ timeLimit: 60, time: Infinity }), false);
  assert.equal(isOvertime({ timeLimit: NaN, time: 310 }), false);
});
