/*
*   utils.js
*/

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
**  getTextContent: called by getAccessibleName
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

/*
*   isNonEmptyString
*/
function isNonEmptyString (str) {
  return typeof str === 'string' && str.length;
}

/*
*   Generate dataId values
*/
function *nextValue () {
  let counter = 0;
  while (true) {
    yield ++counter;
  }
}

var valueIterator = nextValue();

function getDataId (prefix) {
  const suffix = valueIterator.next().value;
  return `${prefix}-${suffix}`;
}
