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
  if (skippableNames.includes(element.tagName)) {
    console.debug(`Skipping element: ${element.tagName}`);
    return true;
  }
  return false;
}

/*
*   getChildren: Return an array of HTMLElement children based on criteria
*   related to whether @param element is (or is part of) a custom element.
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
    console.debug(`<slot> name: ${element.name || 'null'}, items: ${assignedElements.length}`);
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
*   traverseDom: Called fn. getChildren to recursively process each element
*   in the DOM tree that is a descendant of @param startElement.
*
*   @param startElement { DOM element }
*     The start or next element to recursively process.
*
*   @param callbackFn { function }
*     Function called on each element (its first argment); may be used for
*     modifying the DOM or saving app-specific element information. For each
*     invocation of callbackFn, the storageObj and contextObj are passed as
*     its second and third arguments, respectively.
*
*   @param storageObj { object }
*     Reference to the data structure where element info will be stored.
*
*   @param contextObj { object } [ optional ]
*     Contains context info and possibly a storage data structure needed
*     for processing each element. Its value defaults to null.
*/
function traverseDom (startElement, callbackFn, storageObj, contextObj = null) {

    const children = getChildren(startElement);

    for (const element of children) {
      if (isSkippable(element)) continue;

      // Process the element based on criteria defined in callbackFn and
      // the current contextObj
      const newContext = callbackFn(element, storageObj, contextObj);

      // Recursively visit children of element
      traverseDom(element, callbackFn, storageObj, newContext);
    }
}
