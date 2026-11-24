import assert from 'node:assert/strict';
import test from 'node:test';
import { totalWeight } from './ponderacion.js';

test('adds decimal weights without floating point comparison errors', () => {
    assert.equal(totalWeight('33.33', { 1: '33.33', 2: '33.34' }), 100);
    assert.equal(totalWeight('30.01', { 1: '69.98' }), 99.99);
    assert.equal(totalWeight('100', {}), 100);
});
