import assert from 'node:assert';
import api from '../api.js';

assert.ok(api);
assert.equal(typeof api.connectLinkedIn, 'function');
assert.equal(typeof api.uploadResume, 'function');
assert.equal(typeof api.connectFinancialAccounts, 'function');
console.log('ApiService imported successfully');
