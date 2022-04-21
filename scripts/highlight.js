/*
*   highlight.js
*/

var currentHighlight;

var highlightClass = 'ilps-highlight';
var highlightProperties = `{
  position: absolute;
  overflow: hidden;
  box-sizing: border-box;
  border-style: solid;
  border-width: 3px;
  pointer-events: none;
  z-index: 10000;
}`;

var focusClass = 'ilps-focus';
var focusProperties = `{
  outline: 3px dotted purple;
}`;

var headingColor  = '#ff552e'; // illini-orange
var landmarkColor = '#1d58a7'; // industrial-blue

// Add highlighting stylesheet to document
(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    .${highlightClass} ${highlightProperties}
    .${focusClass}:focus ${focusProperties}
  `;
  document.body.appendChild(style);
})();

function getElementWithDataAttrib (dataId) {
  const info = { element: null };

  // Save element if its data attrib. value matches
  function conditionalSave (element, info) {
    if (element.getAttribute(dataAttribName) === dataId) {
      info.element = element;
    }
  }

  // Use fallback if document does not contain body element
  const documentStart =
    (document.body === null) ? document.documentElement : document.body;

  // Search DOM for element with dataId
  traverseDom(documentStart, conditionalSave, info);
  return info.element;
}

function highlightElement (dataId) {
  const prefix = dataId.substring(0, 2);
  const blockVal = prefix === 'h-' ? 'center' : 'start';
  clearHighlights();

  if (debug.flag) { debug.log(`hightlightElement: ${dataAttribName}="${dataId}"`); }
  const element = getElementWithDataAttrib(dataId);
  if (element) {
    addHighlightBox(element, prefix);
    element.scrollIntoView({ behavior: 'smooth', block: blockVal });
    currentHighlight = element;
    document.addEventListener('focus', focusListener);
    document.addEventListener('blur', blurListener);
  }
  else {
    debug.log(`Unable to find element with attribute: ${dataAttribName}="${dataId}"`);
  }
}

function clearHighlights () {
  removeOverlays();
  document.removeEventListener('focus', focusListener);
  document.removeEventListener('blur', blurListener);
}

function focusListener (event) {
  setFocus(currentHighlight);
}

function blurListener (event) {
  addHighlightBox(currentHighlight);
}

/*
*   setFocus: Used by 'focus' event handler for the document after selected
*   heading has been highlighted and page has been scrolled to bring it into
*   view. When the user changes focus from the sidebar to the page, add CSS
*   class for focus styling and set focus to specified heading element.
*/
function setFocus (element) {
  removeOverlays();
  element.classList.add(focusClass);
  element.setAttribute('tabindex', -1);
  element.focus({
    preventScroll: false
  });
}

/*
*   addHighlightBox: Clear previous highlighting and add highlight border box
*   to specified element.
*/
function addHighlightBox (element, prefix) {
  removeOverlays();

  const boundingRect = element.getBoundingClientRect();
  const overlayDiv = createOverlay(boundingRect, prefix);
  document.body.appendChild(overlayDiv);
}

/*
*   createOverlay: Use bounding client rectangle and offsets to create an element
*   that appears as a highlighted border around element corresponding to 'rect'.
*/
function createOverlay (rect, prefix) {
  const minWidth = 68, minHeight = 27;
  const offset = prefix === 'h-' ? 4 : 0;

  const div = document.createElement('div');
  div.setAttribute('class', highlightClass);
  div.style.setProperty('border-color', prefix === 'h-' ? headingColor : landmarkColor);

  div.style.left   = Math.round(rect.left - offset + window.scrollX) + 'px';
  div.style.top    = Math.round(rect.top  - offset + window.scrollY) + 'px';

  div.style.width  = Math.max(rect.width  + offset * 2, minWidth)  + 'px';
  div.style.height = Math.max(rect.height + offset * 2, minHeight) + 'px';

  return div;
}

/*
*   removeOverlays: Utilize 'highlightClass' to remove highlight overlays created
*   by previous calls to 'addHighlightBox'.
*/
function removeOverlays () {
  let selector = `div.${highlightClass}`;
  let elements = document.querySelectorAll(selector);
  Array.prototype.forEach.call(elements, function (element) {
    document.body.removeChild(element);
  });
}
