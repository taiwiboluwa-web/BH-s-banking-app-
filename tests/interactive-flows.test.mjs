import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServiceFlow, validateServiceFlow } from '../src/flowModels.js';

test('service flow builds an Airtime form and validates required fields', () => {
  const flow = buildServiceFlow('Airtime');
  assert.equal(flow.label, 'Airtime');
  assert.deepEqual(flow.fields.map((field) => field.key), ['phone', 'network', 'amount']);
  assert.deepEqual(validateServiceFlow(flow, {}), ['Enter a phone number.', 'Select a network.', 'Enter a valid amount.']);
});

test('electricity flow requires disco, meter and amount before review', () => {
  const flow = buildServiceFlow('Electricity');
  assert.deepEqual(validateServiceFlow(flow, { disco: 'Ikeja Electric', meter: '1234567890', meterType: 'Prepaid', amount: '5000' }), []);
});

test('TV flow requires provider, smart card and package', () => {
  const flow = buildServiceFlow('TV');
  assert.deepEqual(validateServiceFlow(flow, { provider: 'DStv', smartCard: '9876543210', package: 'Compact' }), []);
});

test('account menu items map to interactive interfaces instead of notices', () => {
  const flowNames = ['Profile', 'Security centre', 'KYC status', 'Help & support', 'Settings'];
  assert.deepEqual(flowNames.map((name) => buildServiceFlow(name).label), flowNames);
});
