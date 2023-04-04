/*
*   highlight.js
*/

import traverseDom from './traversal.js';
import { dataAttribName, debug } from './constants.js';
export { addHighlightStyle, highlightElement, clearHighlights };

var currentHighlight = {};

const highlightClass = 'ilps-highlight';
const focusClass     = 'ilps-focus';
const styleName      = 'ilps-styles';
const headingColor   = '#ff552e'; // illini-orange
const landmarkColor  = '#1d58a7'; // industrial-blue

const styleTemplate = document.createElement('template');
styleTemplate.innerHTML = `
<style title="${styleName}">
  .${highlightClass} {
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
    pointer-events: none;
    z-index: 10000;
  }
  .${highlightClass}:after {
    color: white;
    font-family: sans-serif;
    font-size: 1.2em;
    font-weight: bold;
    position: absolute;
    overflow: visible;
    top: 3px;
    right: 0;
    z-index: 20000;
  }
  .${highlightClass}[data-heading] {
    box-shadow: inset 0 0 0 3px ${headingColor}, inset 0 0 0 5px white;
  }
  .${highlightClass}[data-heading]:after {
    content: attr(data-heading);
    background-color: ${headingColor};
    padding: 2px 7px 2px 8px;
  }
  .${highlightClass}[data-landmark] {
    box-shadow: inset 0 0 0 3px ${landmarkColor}, inset 0 0 0 5px white;
  }
  .${highlightClass}[data-landmark]:after {
    content: attr(data-landmark);
    background-color: ${landmarkColor};
    padding: 3px 8px 4px;
  }
  .${focusClass}:focus {
    outline: 3px dotted purple;
  }
</style>
`;

// Add highlighting stylesheet to document if not already there
function addHighlightStyle () {
  if (document.querySelector(`style[title="${styleName}"]`) === null) {
    document.body.appendChild(styleTemplate.content.cloneNode(true));
    if (debug) { console.debug(`Added style element (${styleName}) to document`); }
  }
}

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
  if (debug) { console.debug(`info.element: ${info.element.tagName}`); }
  return info.element;
}

function highlightElement (dataId) {
  const prefix = dataId.substring(0, 2);
  const blockVal = prefix === 'h-' ? 'center' : 'start';
  clearHighlights();

  if (debug) { console.debug(`highlightElement: ${dataAttribName}="${dataId}"`); }
  const element = getElementWithDataAttrib(dataId);
  if (element === null) {
    console.warn(`Unable to find element with attribute: ${dataAttribName}="${dataId}"`);
    return;
  }

  const elementInfo = { element: element, prefix: prefix };
  currentHighlight = elementInfo;
  addHighlightBox(elementInfo);
  element.scrollIntoView({ behavior: 'smooth', block: blockVal });
  document.addEventListener('focus', focusListener);
  document.addEventListener('blur', blurListener);
}

function clearHighlights () {
  removeOverlays();
  removeFocusOutlines();
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
*   class for focus styling and set focus to specified element.
*/
function setFocus (elementInfo) {
  removeOverlays();
  const { element } = elementInfo;
  if (element) {
    element.classList.add(focusClass);
    element.setAttribute('tabindex', -1);
    element.focus({ preventScroll: false });
  }
}

/*
*   addHighlightBox: Clear previous highlighting and add highlight border box
*   to specified element.
*/
function addHighlightBox (elementInfo) {
  removeOverlays();
  removeFocusOutlines();
  const { element, prefix } = elementInfo;
  if (element) {
    const boundingRect = element.getBoundingClientRect();
    const overlayDiv = createOverlay(boundingRect, prefix, element.tagName);
    document.body.appendChild(overlayDiv);
  }
}

/*
*   createOverlay: Use bounding client rectangle and offsets to create an element
*   that appears as a highlighted border around element corresponding to 'rect'.
*/
function createOverlay (rect, prefix, tagName) {
  const dataAttrib = prefix === 'h-' ? 'data-heading' : 'data-landmark';

  const minWidth = 68, minHeight = 27;
  const offset = prefix === 'h-' ? 5 : 0;
  const radius = prefix === 'h-' ? 3 : 0;

  const div = document.createElement('div');
  div.setAttribute('class', highlightClass);
  div.setAttribute(dataAttrib, tagName.toLowerCase());
  div.style.setProperty('border-radius', radius + 'px');

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
  const selector = `div.${highlightClass}`;
  const elements = document.querySelectorAll(selector);
  Array.prototype.forEach.call(elements, function (element) {
    document.body.removeChild(element);
  });
}

/*
*   removeFocusOutlines: Remove CSS class that displays a focus outline for
*   the currently highlighted element (when the user transfers focus from the
*   sidebar to the page), from all elements that currently have the class.
*/
function removeFocusOutlines () {
  const elements = document.querySelectorAll(`.${focusClass}`);
  Array.prototype.forEach.call(elements, function (element) {
    if (debug) { console.debug(`focusOutline: ${element.tagName}`); }
    element.classList.remove(focusClass);
  });
}
