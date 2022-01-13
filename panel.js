/*
*   panel.js
*/

import TabSet from './tabset.js';
import { HeadingsBox } from './listbox.js';
import { LandmarksBox } from './listbox.js';
import { saveOptions } from './storage.js';

var headingsBox = document.querySelector('headings-box');
headingsBox.selectionHandler = enableHeadingsButton;
headingsBox.activationHandler = highlightHeadingElement;
headingsBox.clearHLHandler = removeHighlights;

var landmarksBox = document.querySelector('landmarks-box');
landmarksBox.selectionHandler = enableLandmarksButton;
landmarksBox.activationHandler = highlightLandmarkElement;
landmarksBox.clearHLHandler = removeHighlights;

var contentPort;
var myWindowId;

function logToConsole (...args) {
  if (true) {
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

function addLabelsAndHelpContent () {
  // page-title-label
  document.getElementById('page-title-label').textContent =
    getMessage("pageTitleLabel");

/*
  // help-label, help-highlight, help-active and help-focus content
  document.getElementById('help-label').textContent =
    getMessage("helpLabel");
  document.getElementById('help-highlight').textContent =
    getMessage("helpHighlight");
  document.getElementById('help-activate').textContent =
    getMessage("helpActivate");
  document.getElementById('help-focus').textContent =
    getMessage("helpFocus");
*/
}

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
*   When the sidebar loads, store the ID of the current window; update sidebar
*   labels and help content, and run content scripts to establish connection.
*/
browser.windows.getCurrent({ populate: true }).then( (windowInfo) => {
  myWindowId = windowInfo.id;
  addLabelsAndHelpContent();
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

function highlightHeadingElement (event) {
  const option = headingsBox.selectedOption;
  contentPort.postMessage({
    id: 'highlight',
    dataId: option.id
  });
}

function highlightLandmarkElement (event) {
  const option = landmarksBox.selectedOption;
  contentPort.postMessage({
    id: 'highlight',
    dataId: option.id
  });
}

function removeHighlights () {
  contentPort.postMessage({ id: 'clear' });
}

function enableHeadingsButton (flag) {
  const button = headingsBox.highlightButton;

  if (flag)
    button.removeAttribute('disabled');
  else
    button.setAttribute('disabled', true);
}

function enableLandmarksButton (flag) {
  const button = landmarksBox.highlightButton;

  if (flag)
    button.removeAttribute('disabled');
  else
    button.setAttribute('disabled', true);
}

//-----------------------------------------------
//  Functions that handle tab and window events
//-----------------------------------------------

/*
*   Handle tabs.onUpdated event when status is 'complete'
*/
let timeoutID;
function handleTabUpdated (tabId, changeInfo, tab) {
  // Skip content update when new page is loaded in background tab
  if (!tab.active) return;

  clearTimeout(timeoutID);
  if (changeInfo.status === "complete") {
    runContentScripts('handleTabUpdated');
  }
  else {
    timeoutID = setTimeout(function () {
      updateSidebar(tabIsLoading);
    }, 250);
  }
}

/*
*   Handle tabs.onActivated event
*/
function handleTabActivated (activeInfo) {
  // logToConsole('activeInfo: ', activeInfo);

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

/*
*   getFormattedTitle: Extract page title from the page structure message sent
*   by the content script, and return it embedded in an HTML-formatted string.
*/
function getFormattedTitle (message) {
  return `<p>${message.title}</p>`;
}

/*
*   Display the structure information collected by the content script
*/
function updateSidebar (message) {
  const pageTitle = document.getElementById('page-title-content');

  if (typeof message === 'object') {
    const info = message.info;
    removeHighlights();

    // Update the page-title box
    pageTitle.innerHTML = getFormattedTitle(message);

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

//------------------------------------------------------
//  Functions that run the content scripts to initiate
//  processing of the data to be sent via port message
//------------------------------------------------------

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
