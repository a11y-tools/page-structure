/* constants.js */

/*
*   Generate dataId values
*/

function *nextValue () {
  let counter = 0;
  while (true) {
    yield ++counter;
  }
}

function getDataId (prefix) {
  const suffix = valueIterator.next().value;
  return `${prefix}-${suffix}`;
}

var dataAttribName = 'data-ilps';
var separator = '--------------------------------';
var valueIterator = nextValue();
var debug = false;
