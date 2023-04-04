/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dataAttribName": () => (/* binding */ dataAttribName),
/* harmony export */   "debug": () => (/* binding */ debug)
/* harmony export */ });
/*
*   constants.js
*/

const dataAttribName = 'data-ilps';
const debug = false;


/***/ }),
/* 2 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ traverseDom)
/* harmony export */ });
/*
*   traversal.js
*/

function isSkippable (element) {
  const skippableNames = [
    'BASE',
    'LINK',
    'META',
    'NOSCRIPT',
    'SCRIPT',
    'STYLE',
    'TEMPLATE',
    'TITLE'
  ];

  return skippableNames.includes(element.tagName);
}

/*
*   getChildren: Return an array of HTMLElement children based on criteria
*   related to the type (regular, slot, custom) of @param element.
*/
function getChildren (element) {

  function isCustomElement () {
    return (element.tagName.indexOf('-') > 0);
  }

  function isSlotElement () {
    return (element instanceof HTMLSlotElement);
  }

  if (isSlotElement()) {
    const assignedElements = (element.assignedElements().length)
      ? element.assignedElements()
      : element.assignedElements({ flatten: true });
    return assignedElements;
  }

  if (isCustomElement()) {
    if (element.shadowRoot !== null) {
      return Array.from(element.shadowRoot.children);
    }
    else {
      return [];
    }
  }

  // default
  return Array.from(element.children);
}

/*
*   traverseDom: Calls the getChildren fn. to recursively process each non-
*   skippable element in the DOM tree that is a descendant of startElement.
*
*   @param startElement { DOM element }
*     The start or next element to recursively process.
*
*   @param callbackFn { function }
*     Function called on each non-skippable element (see fn. isSkippable),
*     which is passed as its first argument. May be used for modifying the DOM
*     or saving app-specific element data. For each invocation of callbackFn,
*     storageObj and contextObj are passed as its second and third arguments.
*
*   @param storageObj { object }
*     Reference to the data structure where element data may be stored when
*     callbackFn is invoked.
*
*   @param contextObj { object } [ optional ]
*     Context information needed for processing each element. Its default
*     value is null.
*/
function traverseDom (startElement, callbackFn, storageObj, contextObj = null) {

  const children = getChildren(startElement);

  for (const element of children) {
    if (isSkippable(element)) { continue; }

    // Process the element based on criteria defined in callbackFn and
    // the current contextObj
    const newContext = callbackFn(element, storageObj, contextObj);

    // Recursively visit children of element
    traverseDom(element, callbackFn, storageObj, newContext);
  }
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addHighlightStyle": () => (/* binding */ addHighlightStyle),
/* harmony export */   "clearHighlights": () => (/* binding */ clearHighlights),
/* harmony export */   "highlightElement": () => (/* binding */ highlightElement)
/* harmony export */ });
/* harmony import */ var _traversal_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/*
*   highlight.js
*/





var currentHighlight = {};

const highlightClass = 'ilps-highlight';
const focusClass = 'ilps-focus';
const styleName = 'ilps-styles';

const styleTemplate = document.createElement('template');
styleTemplate.innerHTML = `
<style title="${styleName}">
  .${highlightClass} {
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
    pointer-events: auto;
    z-index: 10000;
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
  }
}

function getElementWithDataAttrib (dataId) {
  const info = { element: null };

  // Save element if its data attrib. value matches
  function conditionalSave (element, info) {
    if (element.getAttribute(_constants_js__WEBPACK_IMPORTED_MODULE_1__.dataAttribName) === dataId) {
      info.element = element;
    }
  }

  // Use fallback if document does not contain body element
  const documentStart =
    (document.body === null) ? document.documentElement : document.body;

  // Search DOM for element with dataId
  (0,_traversal_js__WEBPACK_IMPORTED_MODULE_0__["default"])(documentStart, conditionalSave, info);
  if (_constants_js__WEBPACK_IMPORTED_MODULE_1__.debug) { console.log(`info.element: ${info.element.tagName}`); }
  return info.element;
}

function highlightElement (dataId) {
  const prefix = dataId.substring(0, 2);
  const blockVal = prefix === 'h-' ? 'center' : 'start';
  clearHighlights();

  if (_constants_js__WEBPACK_IMPORTED_MODULE_1__.debug) { console.debug(`highlightElement: ${_constants_js__WEBPACK_IMPORTED_MODULE_1__.dataAttribName}="${dataId}"`); }
  const element = getElementWithDataAttrib(dataId);
  if (element === null) {
    console.warn(`Unable to find element with attribute: ${_constants_js__WEBPACK_IMPORTED_MODULE_1__.dataAttribName}="${dataId}"`);
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
  const headingColor  = '#ff552e'; // illini-orange
  const landmarkColor = '#1d58a7'; // industrial-blue
  const boxShadowColor = prefix === 'h-' ? headingColor : landmarkColor;
  const boxShadow = `inset 0 0 0 3px ${boxShadowColor}, inset 0 0 0 5px white`;

  const minWidth = 68, minHeight = 27;
  const offset = prefix === 'h-' ? 5 : 0;
  const radius = prefix === 'h-' ? 3 : 0;

  const div = document.createElement('div');
  div.setAttribute('class', highlightClass);
  div.setAttribute('title', `${tagName} element`);

  div.style.setProperty('box-shadow', boxShadow);
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


/***/ }),
/* 4 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getAccessibleName": () => (/* binding */ getAccessibleName),
/* harmony export */   "getDataId": () => (/* binding */ getDataId),
/* harmony export */   "getDescendantTextContent": () => (/* binding */ getDescendantTextContent),
/* harmony export */   "isVisible": () => (/* binding */ isVisible)
/* harmony export */ });
/*
*   utils.js
*/

/*
*   Generator function (constructor)
*/
function *nextValue () {
  let counter = 0;
  while (true) {
    yield ++counter;
  }
}

/*
*   Generator object (instance): used by getDataId
*/
const idGenerator = nextValue();

/*
*   getDataId: return concatenation of prefix and next value of counter
*/
function getDataId (prefix) {
  return `${prefix}-${idGenerator.next().value}`;
}

/*
*   getDescendantTextContent: Collect the textContent values of child text
*   nodes, and descendant text nodes of child elements that meet the predicate
*   condition, by storing the values in the results array.
*/
function getDescendantTextContent (node, predicate, results) {
  // Process the child nodes
  for (let i = 0; i < node.childNodes.length; i++) {
    let child = node.childNodes[i];

    switch (child.nodeType) {
      case (Node.ELEMENT_NODE):
        if (predicate(child)) {
          getDescendantTextContent(child, predicate, results);
        }
        break;
      case (Node.TEXT_NODE):
        let content = child.textContent.trim();
        if (content.length) { results.push(content); }
        break;
    }
  }
}

/*
*   isNonEmptyString: called by getAccessibleName
*/
function isNonEmptyString (str) {
  return typeof str === 'string' && str.length;
}

/*
*   getTextContent: called by getAccessibleName
*/
function getTextContent (elem) {

  function getTextRec (e, strings) {
    // If text node, get the text and return
    if (e.nodeType === Node.TEXT_NODE) {
      strings.push(e.data);
    }
    else {
      // If element node, traverse all child elements looking for text
      if (e.nodeType === Node.ELEMENT_NODE) {
        // If IMG or AREA element, use ALT content if defined
        let tagName = e.tagName.toLowerCase();
        if (tagName === 'img' || tagName === 'area') {
          if (e.alt) {
            strings.push(e.alt);
          }
        }
        else {
          let c = e.firstChild;
          while (c) {
            getTextRec(c, strings);
            c = c.nextSibling;
          } // end loop
        }
      }
    }
  } // end getTextRec

  let strings = [];
  getTextRec(elem, strings);
  if (strings.length) {
    return strings.join(' ');
  }
  return '';
}

/*
*   getAccessibleName
*/
function getAccessibleName (element) {

  // Check for 'aria-labelledby' attribute
  if (element.hasAttribute('aria-labelledby')) {
    const labelledbyValue = element.getAttribute('aria-labelledby');
    if (labelledbyValue.length) {
      const ids = labelledbyValue.split(' '), strings = [];

      for (const id of ids) {
        const elem = document.getElementById(id);
        if (elem) {
          const str = getTextContent(elem);
          if (str && str.length) {
            strings.push(str);
          }
        }
      }
      return strings.join(' ');
    }
  }

  // Check for 'aria-label' attribute
  if (element.hasAttribute('aria-label')) {
    const label = element.getAttribute('aria-label');
    if (isNonEmptyString(label)) {
      return label;
    }
  }

  // Check for 'title' attribute
  if (element.hasAttribute('title')) {
    const title = element.getAttribute('title');
    if (isNonEmptyString(title)) {
      return title;
    }
  }

  return '';
}

/*
*   isVisible: Recursively check element properties from getComputedStyle
*   until document element is reached, to determine whether element or any
*   of its ancestors has properties set that affect its visibility.
*/
function isVisible (element) {
  if (element.nodeType === Node.DOCUMENT_NODE) return true;

  if (element.nodeType === Node.ELEMENT_NODE) {
    let computedStyle = window.getComputedStyle(element, null);
    let display    = computedStyle.getPropertyValue('display');
    let visibility = computedStyle.getPropertyValue('visibility');
    let hidden     = element.getAttribute('hidden');
    let ariaHidden = element.getAttribute('aria-hidden');

    if ((display === 'none') || (visibility === 'hidden') ||
        (hidden !== null) || (ariaHidden === 'true')) {
      return false;
    }
  }
  // If element's parent is a shadowRoot, use the parent's host element
  const parentNode = (element.parentNode instanceof ShadowRoot)
    ? element.parentNode.host : element.parentNode;
  return isVisible(parentNode);
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _traversal_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _highlight_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);
/*
*   main.js
*/






const separator = '--------------------------------';

if (_constants_js__WEBPACK_IMPORTED_MODULE_0__.debug) {
  console.debug(separator);
  console.debug(`URL: ${document.URL}`);
}

/*
*  Connect to panel.js script and set up listener/handler
*/
var panelPort = browser.runtime.connect({ name: 'content' });
panelPort.onMessage.addListener(messageHandler);

/*
*  Add stylesheet to document
*/
(0,_highlight_js__WEBPACK_IMPORTED_MODULE_2__.addHighlightStyle)();

function messageHandler (message) {
  switch (message.id) {
    case 'getInfo':
      getStructureInfo(panelPort);
      break;

    case 'highlight':
      (0,_highlight_js__WEBPACK_IMPORTED_MODULE_2__.highlightElement)(message.dataId);
      break;

    case 'clear':
      (0,_highlight_js__WEBPACK_IMPORTED_MODULE_2__.clearHighlights)();
      break;
  }
}

/*
*   Data collection functions
*/

function isHeading (element) {
  return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName);
}

/*
*   getLandmarkInfo: The 'name' param will be defined when the accessible name
*   was already evaluated as a criterion for determining whether 'element' is
*   to be considered a landmark (based on 'ARIA in HTML' specification).
*/
function getLandmarkInfo (element, role, name) {
  const accessibleName =
    (name === undefined) ? (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getAccessibleName)(element) : name;

  return {
    role: role,
    name: accessibleName,
    visible: (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isVisible)(element)
  }
}

/*
*   testForLandmark: If element is a landmark, return an object with properties
*   'role', 'name' and 'visible'; otherwise return null.
*/
function testForLandmark (element) {
  const roles = [
    'application',
    'banner',
    'complementary',
    'contentinfo',
    'form',
    'main',
    'navigation',
    'search'
  ];

  function isDescendantOfNames (element) {
    const names = ['article', 'aside', 'main', 'nav', 'section'];
    return names.some(name => element.closest(name));
  }

  function isDescendantOfRoles (element) {
    const roles = ['article', 'complementary', 'main', 'navigation', 'region'];
    return roles.some(role => element.closest(`[role="${role}"]`));
  }

  // determination is straightforward for element with 'role' attribute
  if (element.hasAttribute('role')) {
    const roleValue = element.getAttribute('role');
    if (roles.includes(roleValue)) {
      return getLandmarkInfo(element, roleValue);
    }
    if (roleValue === 'region') {
      const name = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getAccessibleName)(element);
      if (name.length) {
        return getLandmarkInfo(element, 'region', name);
      }
      return null;
    }
  }
  else { // element does not have 'role' attribute
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'aside') {
      return getLandmarkInfo(element, 'complementary');
    }

    if (tagName === 'main') {
      return getLandmarkInfo(element, 'main');
    }

    if (tagName === 'nav') {
      return getLandmarkInfo(element, 'navigation');
    }

    if (tagName === 'footer') {
      if (!(isDescendantOfNames(element) || isDescendantOfRoles(element))) {
        return getLandmarkInfo(element, 'contentinfo');
      }
      return null;
    }

    if (tagName === 'header') {
      if (!(isDescendantOfNames(element) || isDescendantOfRoles(element))) {
        return getLandmarkInfo(element, 'banner');
      }
      return null;
    }

    if (tagName === 'form') {
      const name = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getAccessibleName)(element);
      if (name.length) {
        return getLandmarkInfo(element, 'form', name);
      }
      return null;
    }

    if (tagName === 'section') {
      const name = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getAccessibleName)(element);
      if (name.length) {
        return getLandmarkInfo(element, 'region', name);
      }
      return null;
    }

  } // end else

  return null;
}

function getHeadingInfo (element) {
  const contentArray = [];
  (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getDescendantTextContent)(element, _utils_js__WEBPACK_IMPORTED_MODULE_3__.isVisible, contentArray);
  return {
    name: element.tagName,
    text: contentArray.length ? contentArray.join(' ') : '',
    visible: (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.isVisible)(element)
  }
}

function saveHeadingInfo (element, info) {
  if (isHeading(element)) {
    const headingInfo = getHeadingInfo(element);
    if (headingInfo.visible) {
      const dataId = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getDataId)('h');
      headingInfo.dataId = dataId;
      element.setAttribute(_constants_js__WEBPACK_IMPORTED_MODULE_0__.dataAttribName, dataId);
      info.headings.push(headingInfo);
    }
  }
}

function getLandmarkNode (info) {
  return {
    info: info,
    descendants: []
  }
}

function saveLandmarkInfo (element, info, ancestor) {
  let landmarkNode = null;
  const landmarkInfo = testForLandmark(element);
  if (landmarkInfo && landmarkInfo.visible) {
    const dataId = (0,_utils_js__WEBPACK_IMPORTED_MODULE_3__.getDataId)('l');
    landmarkInfo.dataId = dataId;
    element.setAttribute(_constants_js__WEBPACK_IMPORTED_MODULE_0__.dataAttribName, dataId);
    landmarkNode = getLandmarkNode(landmarkInfo);
    if (ancestor === null) {
      info.landmarks.descendants.push(landmarkNode);
    }
    else {
      ancestor.descendants.push(landmarkNode);
    }
  }
  return landmarkNode;
}

function logLandmarkNodes (root) {
  console.debug(separator);
  function traverseNodes (startNode, level) {
    startNode.descendants.forEach(node => {
      const text = `${node.info.role}: ${node.info.name}`;
      console.debug(text.padStart(text.length + (level*2), '-'));
      traverseNodes(node, level+1);
    });
  }
  traverseNodes(root, 0);
  console.debug(separator);
}

function saveInfo (element, info, ancestor) {
  saveHeadingInfo(element, info);
  return saveLandmarkInfo(element, info, ancestor);
}

/*
*   getStructureInfo: Traverse DOM and store relevant info for any elements
*   of interest in the 'info' object; return 'info' object.
*/
function getStructureInfo (panelPort) {
  const info = {
    headings: [],
    landmarks: getLandmarkNode('root') // tree data structure
  };

  removeDataAttributes(); // Clean up from any previous traversal

  // Use fallback if document does not contain body element
  const documentStart =
    (document.body === null) ? document.documentElement : document.body;
  (0,_traversal_js__WEBPACK_IMPORTED_MODULE_1__["default"])(documentStart, saveInfo, info);
  if (_constants_js__WEBPACK_IMPORTED_MODULE_0__.debug) { logLandmarkNodes(info.landmarks); }

  // Send structure info to the panel.js script
  const message = {
    id: 'info',
    info: info,
    title: document.title
  };

  panelPort.postMessage(message);
}

/*
*   removeDataAttributes: Prevent attribute values from being out-of-sync
*/
function removeDataAttributes () {
  const dataElements = document.querySelectorAll(`[${_constants_js__WEBPACK_IMPORTED_MODULE_0__.dataAttribName}]`);
  if (_constants_js__WEBPACK_IMPORTED_MODULE_0__.debug) { console.debug(`removeDataAttributes: ${dataElements.length}`); }
  dataElements.forEach(elem => {
    elem.removeAttribute(_constants_js__WEBPACK_IMPORTED_MODULE_0__.dataAttribName);
  })
}

})();

/******/ })()
;