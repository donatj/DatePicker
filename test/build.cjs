const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

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

describe('built packages', function () {
  for (const file of ['lib/datepicker.js', 'lib/datepicker.min.js']) {
    it(`exposes a working browser global in ${file}`, function () {
      const source = fs.readFileSync(file, 'utf8');
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
    });
  }

  it('exports the constructor as an ES module', async function () {
    const { default: DatePicker } = await import('basic-datepicker');
    assert.equal(typeof DatePicker, 'function');
  });
});
