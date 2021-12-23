/*
*   traversal.js
*/

const dataAttribName = 'data-ilps';
var counter = 0;

function isCustom (element) {
  return (element.tagName.indexOf('-') > 0);
}

function isHeading (element) {
  return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName);
}

function isSlot (element) {
  return (element instanceof HTMLSlotElement);
}

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
*   getLandmarkInfo: The 'name' param will be defined when the accessible name
*   was already evaluated as a criterion for determining whether 'element' is
*   to be considered a landmark (based on 'ARIA in HTML' specification).
*/
function getLandmarkInfo (element, role, name) {
  const accessibleName =
    (name === undefined) ? getAccessibleName(element) : name;

  return {
    role: role,
    name: accessibleName,
    visible: isVisible(element)
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
    const value = element.getAttribute('role');
    if (roles.includes(value)) {
      return getLandmarkInfo(element, value);
    }
    if (value === 'region') {
      const name = getAccessibleName(element);
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
      const name = getAccessibleName(element);
      if (name.length) {
        return getLandmarkInfo(element, 'form', name);
      }
      return null;
    }

    if (tagName === 'section') {
      const name = getAccessibleName(element);
      if (name.length) {
        return getLandmarkInfo(element, 'region', name);
      }
      return null;
    }

  } // end else

  return null;
}

/*
*   getChildren: Return an array of HTMLElement children based on element's
*   properties related to web components.
*/
function getChildren (element) {
  // slot element
  if (isSlot(element)) {
    const assignedElements = (element.assignedElements().length)
      ? element.assignedElements()
      : element.assignedElements({ flatten: true });
    console.debug(`<slot> name: ${element.name || 'null'}, items: ${assignedElements.length}`);
    return assignedElements;
  }
  // custom element
  if (isCustom(element)) {
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

function getHeadingInfo (element) {
  const contentArray = [];
  getDescendantTextContent(element, isVisible, contentArray);
  return {
    name: element.tagName,
    text: contentArray.length ? contentArray.join(' ') : '',
    visible: isVisible(element)
  }
}

function saveHeadingInfo (element, info) {
  if (isHeading(element)) {
    const dataId = `h-${++counter}`;
    const headingInfo = getHeadingInfo(element);
    headingInfo.dataId = dataId;
    element.setAttribute(dataAttribName, dataId);
    info.headings.push(headingInfo);
  }
}

function getLandmarkNode (value) {
  return {
    value: value,
    descendants: []
  }
}

function saveLandmarkInfo (element, info, ancestor) {
  let landmarkNode = null;
  const landmarkInfo = testForLandmark(element);
  if (landmarkInfo && landmarkInfo.visible) {
    const dataId = `l-${++counter}`;
    landmarkInfo.dataId = dataId;
    element.setAttribute(dataAttribName, dataId);
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
  console.debug('------------------------');
  function traverseNodes (startNode, level) {
    startNode.descendants.forEach(node => {
      const text = `${node.value.role}: ${node.value.name}`;
      console.debug(text.padStart(text.length + (level*2), '-'));
      traverseNodes(node, level+1);
    });
  }
  traverseNodes(root, 0);
  console.debug('------------------------');
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

  // Reset headingRefs array (defined in content.js)
  headingRefs = [];

  function traverseDom (startElement, ancestor) {
    // getChildren returns an array of elements based on criteria related
    // to whether startElement is (or is part of) a custom element
    const children = getChildren(startElement);

    for (const element of children) {
      if (isSkippable(element)) continue;

      // Save information if element meets certain criteria
      saveHeadingInfo(element, info);
      const landmarkNode = saveLandmarkInfo(element, info, ancestor);

      // Recursively visit children of element
      traverseDom(element, landmarkNode);
    }
  }

  const documentStart =
    (document.body === null) ? document.documentElement : document.body;
  traverseDom(documentStart, null);
  logLandmarkNodes(info.landmarks);

  // Send structure info to the panel.js script
  const message = {
    id: 'info',
    info: info,
    title: document.title
  };

  panelPort.postMessage(message);
}
