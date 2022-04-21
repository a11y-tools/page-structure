/* constants.js */

var dataAttribName = 'data-ilps';

var debug = new DebugLogger('ilps');

/*
*   DebugLogger
*/
class DebugLogger {
  _flag  = false;
  _label = '';

  constructor (...args) {
    for (const [index, arg] of args.entries()) {
      if (index < 2) {
        switch (typeof arg) {
          case 'boolean':
            this._flag = arg;
            break;
          case 'string':
            this._label = arg;
            break;
        }
      }
    }
  }

  get flag () { return this._flag; }

  set flag (value) {
    if (typeof value === 'boolean') {
      this._flag = value;
    }
  }

  log (message, label = this._label) {
    const prefix = this._label ? `[${this._label}] ` : '';
    console.log(`${prefix}${message}`);
  }

  tag (element) {
    if (element && element.tagName) {
      const text = element.textContent.trim().replace(/\s+/g, ' ');
      this.log(`[${element.tagName}]: ${text.substring(0, 32)}`);
    }
  }

  separator () { this.log('--------------------------------'); }
}
