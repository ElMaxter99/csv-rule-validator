import required from './required.js';
import number from './number.js';
import inRule from './in.js';
import requiredIf from './requiredIf.js';
import custom from './custom.js';
import stringValidator from './string.js';
import compare from './compare.js';

export default {
  required,
  number,
  in: inRule,
  requiredIf,
  custom,
  string: stringValidator,
  compare,
};
