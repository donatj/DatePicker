const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const acorn = require('acorn');

const source = fs.readFileSync('lib/datepicker.js', 'utf8');
acorn.parse(source, { ecmaVersion: 2017 });

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

const commonjs = vm.createContext({ module: { exports: {} } });
vm.runInContext(source, commonjs);
assert.equal(typeof commonjs.module.exports, 'function');

let amdExport;
const amd = vm.createContext({ define: (dependencies, factory) => { amdExport = factory(); } });
vm.runInContext(source, amd);
assert.equal(typeof amdExport, 'function');
