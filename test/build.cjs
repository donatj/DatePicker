const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const acorn = require('acorn');

function element() {
  return {
    style: {},
    addEventListener() {},
    appendChild() {},
    focus() {},
  };
}

function context() {
  return {
    document: {
      body: element(),
      documentElement: { lang: 'en' },
      createElement: element,
      addEventListener() {},
    },
    setTimeout,
    clearTimeout,
  };
}

for (const file of ['lib/datepicker.js', 'lib/datepicker.min.js']) {
  const source = fs.readFileSync(file, 'utf8');
  acorn.parse(source, { ecmaVersion: 2018 });
  const browser = vm.createContext(context());
  browser.window = browser;
  vm.runInContext(source, browser);
  const input = element();
  input.value = '';
  const picker = new browser.DatePicker(input, {
    parseUserInput: false,
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  });
  picker.setPickerDate(new Date(Date.UTC(2024, 0, 2)));
  assert.equal(input.value, '2024-01-02');
}

import('basic-datepicker').then(({ default: DatePicker }) => {
  assert.equal(typeof DatePicker, 'function');
});
