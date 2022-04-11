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
      if (isSkippable(element)) continue;

      // Process the element based on criteria defined in callbackFn and
      // the current contextObj
      const newContext = callbackFn(element, storageObj, contextObj);

      // Recursively visit children of element
      traverseDom(element, callbackFn, storageObj, newContext);
    }
}
