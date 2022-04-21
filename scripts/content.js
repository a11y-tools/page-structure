/*
*   content.js
*/

if (debug.flag) {
  debug.separator();
  debug.log(`URL: ${document.URL}`);
}

/*
*  Connect to panel.js script and set up listener/handler
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
    const roleValue = element.getAttribute('role');
    if (roles.includes(roleValue)) {
      return getLandmarkInfo(element, roleValue);
    }
    if (roleValue === 'region') {
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
    const headingInfo = getHeadingInfo(element);
    if (headingInfo.visible) {
      const dataId = getDataId('h');
      headingInfo.dataId = dataId;
      element.setAttribute(dataAttribName, dataId);
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
    const dataId = getDataId('l');
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
  debug.separator();
  function traverseNodes (startNode, level) {
    startNode.descendants.forEach(node => {
      const text = `${node.info.role}: ${node.info.name}`;
      debug.log(text.padStart(text.length + (level*2), '-'));
      traverseNodes(node, level+1);
    });
  }
  traverseNodes(root, 0);
  debug.separator();
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
  traverseDom(documentStart, saveInfo, info);
  if (debug.flag) { logLandmarkNodes(info.landmarks); }

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
  const dataElements = document.querySelectorAll(`[${dataAttribName}]`);
  if (debug.flag) { debug.log(`removeDataAttributes: ${dataElements.length}`); }
  dataElements.forEach(elem => {
    elem.removeAttribute(dataAttribName);
  })
}
