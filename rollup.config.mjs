import terser from '@rollup/plugin-terser';

const input = '.build/datepicker.js';

export default [
  {
    input,
    output: { file: 'lib/datepicker.js', format: 'iife', name: 'DatePicker' },
  },
  {
    input,
    output: { file: 'lib/datepicker.min.js', format: 'iife', name: 'DatePicker' },
    plugins: [terser()],
  },
  {
    input,
    output: { file: 'lib/datepicker.mjs', format: 'es' },
  },
];
