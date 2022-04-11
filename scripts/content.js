/*
*   content.js
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

var headingColor  = '#ff552e';
var landmarkColor = '#2e55ff';

console.debug('------------------------');
console.debug(`URL: ${document.URL}`);

/*
**  Connect to panel.js script and set up listener/handler
*/
var panelPort = browser.runtime.connect({ name: 'content' });

panelPort.onMessage.addListener(messageHandler);

function messageHandler (message) {
  switch (message.id) {
    case 'getInfo':
      getStructureInfo(panelPort);
      break;

    case 'highlight':
      highlightElement(message.dataId);
      break;

    case 'clear':
      clearHighlights();
      break;
  }
}

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

}

function highlightElement (dataId) {
  const prefix = dataId.substring(0, 2);
  const blockVal = prefix === 'h-' ? 'center' : 'start';
  clearHighlights();

  const element = document.querySelector(`[${dataAttribName}="${dataId}"]`);
  if (element && isInPage(element)) {
    addHighlightBox(element, prefix);
    element.scrollIntoView({ behavior: 'smooth', block: blockVal });
    currentHighlight = element;
    document.addEventListener('focus', focusListener);
    document.addEventListener('blur', blurListener);
  }
  else {
    console.log(`Element was removed from DOM: ${dataId}`);
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

/*
*   isInPage: This function checks to see if an element is a descendant of
*   the page's body element. Because 'contains' is inclusive, isInPage returns
*   false when the argument is the body element itself.
*   MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
*/
function isInPage (element) {
  if (element === document.body) return false;
  return document.body.contains(element);
}
