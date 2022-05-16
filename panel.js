/*
*   panel.js
*/

import TabSet from './tabset.js';
import { HeadingsBox } from './listbox.js';
import { LandmarksBox } from './listbox.js';
import ListControls from './listcontrols.js';
import { getOptions, saveOptions } from './storage.js';

// Initialize the ListBox elements

var headingsBox = document.querySelector('headings-box');
headingsBox.selectionHandler  = handleSelection;
headingsBox.activationHandler = highlightElement;

var landmarksBox = document.querySelector('landmarks-box');
landmarksBox.selectionHandler  = handleSelection;
landmarksBox.activationHandler = highlightElement;

// Initialize the ListControls elements

var listControls = document.querySelector('list-controls');
var autoHighlight   = listControls.autoCheckbox;
var highlightButton = listControls.highlightButton;
var clearButton     = listControls.clearButton;

getOptions().then( options => {
  autoHighlight.checked = options.autoHighlight;
});

autoHighlight.addEventListener('change', (event) => {
  const value = event.target.checked;
  listControls.enableHighlightButton(!value);
  const obj = { autoHighlight: value };
  saveOptions(obj);
});

highlightButton.addEventListener('click', (event) => {
  highlightElement();
});

clearButton.addEventListener('click', (event) => {
  removeHighlights();
});

// currentList is updated whenever 'tabSelect' event is fired
var currentList = headingsBox;

// Initialize the TabSet elements

var tabSet = document.querySelector('tab-set');

tabSet.addEventListener('tabSelect', (event) => {
  removeHighlights();
  const tabId = event.detail;
  const scrollOptions = { behavior: "smooth", block: "center" };

  switch (tabId) {
    case 'tab-1':
      currentList = headingsBox;
      break;

    case 'tab-2':
      currentList = landmarksBox;
      break;
  }

  if (currentList.listEvents.selectedOption) {
    currentList.listEvents.selectedOption.scrollIntoView(scrollOptions);
    if (autoHighlight.checked) {
      highlightSelected();
    }
  }
});

// Other initializations

var selectionDelay = 200;
var contentPort;
var myWindowId;

function logToConsole (...args) {
  if (false) {
    if (args.length === 1) console.debug(args[0]);
    else console.debug(args);
  }
}

// Get message strings from locale-specific messages.json file
const getMessage = browser.i18n.getMessage;
const noHeadingElements    = getMessage("noHeadingElements");
const noLandmarkElements   = getMessage("noLandmarkElements");
const tabIsLoading         = getMessage("tabIsLoading");
const protocolNotSupported = getMessage("protocolNotSupported");

/*
**  Set up listeners/handlers for connection and messages from content script
*/
browser.runtime.onConnect.addListener(connectionHandler);

function connectionHandler (port) {
  contentPort = port;
  contentPort.onMessage.addListener(portMessageHandler);
  contentPort.postMessage({ id: 'getInfo' });
}

function portMessageHandler (message) {
  switch (message.id) {
    case 'info':
      updateSidebar(message);
      break;
  }
}

/*
*   When the sidebar loads, store the ID of the current window; update the
*   sidebar labels, and run the content scripts to establish connection.
*/
browser.windows.getCurrent({ populate: true }).then( (windowInfo) => {
  myWindowId = windowInfo.id;
  document.getElementById('page-title-label').textContent = getMessage("pageTitleLabel");
  runContentScripts('windows.getCurrent');
});

/*
*   Generic error handler
*/
function onError (error) {
  console.error(`Error: ${error}`);
}

//--------------------------------------------------------------
//  HeadingsBox and LandmarksBox handler functions
//--------------------------------------------------------------

function removeHighlights () {
  contentPort.postMessage({ id: 'clear' });
}

function handleSelection () {
  if (autoHighlight.checked) {
    listControls.enableHighlightButton(false);
    highlightSelected();
  }
  else {
    listControls.enableHighlightButton(true);
  }
}

var selTimeoutID;

function highlightSelected () {
  clearTimeout(selTimeoutID);
  selTimeoutID = setTimeout(() => {
    highlightElement();
  }, selectionDelay);
}

function highlightElement () {
  const option = currentList.selectedOption;
  contentPort.postMessage({
    id: 'highlight',
    dataId: option.id
  });
}

//---------------------------------------------------------------
//  Functions that handle browser tab and window events
//---------------------------------------------------------------

/*
*   Handle tabs.onUpdated event when status is 'complete'
*/
var statusTimeoutID;

function handleTabUpdated (tabId, changeInfo, tab) {
  // Skip content update when new page is loaded in background tab
  if (!tab.active) return;

  clearTimeout(statusTimeoutID);
  if (changeInfo.status === "complete") {
    runContentScripts('handleTabUpdated');
  }
  else {
    statusTimeoutID = setTimeout(function () {
      updateSidebar(tabIsLoading);
    }, 250);
  }
}

/*
*   Handle tabs.onActivated event
*/
function handleTabActivated (activeInfo) {
  runContentScripts('handleTabActivated');
}

/*
*   Handle window focus change events: If the sidebar is open in the newly
*   focused window, save the new window ID and update the sidebar content.
*/
function handleWindowFocusChanged (windowId) {
  if (windowId !== myWindowId) {
    browser.sidebarAction.isOpen({ windowId })
    .then(isOpen => {
      if (isOpen) {
        myWindowId = windowId;
        runContentScripts('onFocusChanged');
        logToConsole(`Focus changed to window: ${myWindowId}`);
      }
    })
    .catch(onInvalidId);
  }

  function onInvalidId (error) {
    console.error(`onInvalidId: ${error}`);
  }
}

//---------------------------------------------------------------
//  Functions that process and display data from content script
//---------------------------------------------------------------

function updatePageTitle (container, message) {
  const p = document.createElement('p');
  p.textContent = message.title;

  while (container.firstChild) {
    container.removeChild(container.lastChild);
  }
  container.appendChild(p);
}

/*
*   Display the structure information collected by the content script
*/
function updateSidebar (message) {
  const pageTitle = document.getElementById('page-title-content');

  if (typeof message === 'object') {
    const info = message.info;
    removeHighlights();
    updatePageTitle(pageTitle, message);

    // TODO: Move the checking for visible and/or empty list to
    // respective custom elements: HeadingsBox and LandmarksBox

    // Update the headings listbox
    if (info.headings.filter(item => item.visible).length) {
      headingsBox.options = info.headings;
    }
    else {
      headingsBox.message = noHeadingElements;
    }

    // Update the landmarks listbox
    if (info.landmarks.descendants.length) {
      landmarksBox.options = info.landmarks;
    }
    else {
      landmarksBox.message = noLandmarkElements;
    }
  }
  else {
    pageTitle.textContent = message;
    headingsBox.clearOptions();
    landmarksBox.clearOptions();
  }
}

//---------------------------------------------------------------
//  Functions for running content scripts to initiate the
//  processing of data in the active browser tab
//---------------------------------------------------------------

/*
*   runContentScripts: When content.js is executed, it established a port
*   connection with this script (panel.js), which in turn has a port message
*   handler listening for the 'info' message. When that message is received,
*   the handler calls the updateSidebar function with the structure info.
*/
function runContentScripts (callerFn) {
  logToConsole(`runContentScripts invoked by ${callerFn}`);

  getActiveTabFor(myWindowId).then(tab => {
    if (tab.url.indexOf('http:') === 0 || tab.url.indexOf('https:') === 0) {
      browser.tabs.executeScript(tab.id, { file: 'scripts/utils.js' });
      browser.tabs.executeScript(tab.id, { file: 'scripts/traversal.js' });
      browser.tabs.executeScript(tab.id, { file: 'scripts/content.js' });
      browser.tabs.executeScript(tab.id, { file: 'scripts/highlight.js' });
    }
    else {
      updateSidebar (protocolNotSupported);
    }
  });
}

/*
*   getActiveTabFor: expected argument is ID of window with focus. The module
*   variable myWindowId is updated by handleWindowFocusChanged event handler.
*/
function getActiveTabFor (windowId) {
  return new Promise (function (resolve, reject) {
    const promise = browser.tabs.query({ windowId: windowId, active: true });
    promise.then(
      tabs => { resolve(tabs[0]) },
      msg => { reject(new Error(`getActiveTabInWindow: ${msg}`)); }
    )
  });
}

/*
*   Add event listeners when sidebar loads
*/
window.addEventListener("load", function (e) {
  browser.tabs.onUpdated.addListener(handleTabUpdated, { properties: ["status"] });
  browser.tabs.onActivated.addListener(handleTabActivated);
  browser.windows.onFocusChanged.addListener(handleWindowFocusChanged);
});
