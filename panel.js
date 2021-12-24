/*
*   panel.js
*/

// import TabSet from './tabset.js';
// import TabEvents from './tabevents.js';
import { HeadingsBox } from './listbox.js';
import { saveOptions } from './storage.js';

// var tabSet = document.querySelector('tab-set');
// var tabEvents = new TabEvents(tabSet.tabs, tabSet.panels);
var headingsBox = document.querySelector('headings-box');
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

const emptyContent         = getMessage("emptyContent");
const noHeadingElements    = getMessage("noHeadingElements");
const tabIsLoading         = getMessage("tabIsLoading");
const protocolNotSupported = getMessage("protocolNotSupported");

function addLabelsAndHelpContent () {
  // page-title-label and headings-label
  document.getElementById('page-title-label').textContent =
    getMessage("pageTitleLabel");
/*
  document.getElementById('headings-label').textContent =
    getMessage("headingsLabel");
*/

  // button labels
  document.getElementById('search-button').textContent =
    getMessage("searchButtonLabel");
  document.getElementById('clear-button').textContent =
    getMessage("clearButtonLabel");

  // help-label, help-highlight, help-active and help-focus content
  document.getElementById('help-label').textContent =
    getMessage("helpLabel");
  document.getElementById('help-highlight').textContent =
    getMessage("helpHighlight");
  document.getElementById('help-activate').textContent =
    getMessage("helpActivate");
  document.getElementById('help-focus').textContent =
    getMessage("helpFocus");
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
//  Functions that handle ListBox selection and button actions
//--------------------------------------------------------------

/*
*   onListBoxAction: Called from ListBox event handlers
*/
function onListBoxAction (data) {
  if (data.index < 0) return;

  switch (data.action) {
    case 'navigate':
      logToConsole(`navigate: ${data.index}`);
      updateButton(false);
      break;
    case 'activate':
      logToConsole(`activate: ${data.index}`)
      sendButtonActivationMessage({
        id: 'find',
        index: data.index
      });
      break;
  }
}

/*
*   updateButton
*/
function updateButton (flag) {
  const button = document.getElementById('search-button');

  if (flag) {
    button.setAttribute('disabled', true);
  }
  else {
    button.removeAttribute('disabled');
  }
}

/*
*   highlightSelectedOption
*/
function highlightSelectedOption (event) {
  sendButtonActivationMessage({
    id: 'find',
    index: listBox.optionsList.indexOf(listBox.selectedOption)
  });
}

/*
*   removeHighlighting
*/
function removeHighlighting (event) {
  sendButtonActivationMessage({
    id: 'clear'
  });
}

/*
*   sendButtonActivationMessage
*/
function sendButtonActivationMessage (data) {
  getActiveTabFor(myWindowId).then(tab => {
    browser.tabs.sendMessage(tab.id, data);
  });
}

/*
*   Add listeners for the search and clear buttons.
*/
document.getElementById('search-button').addEventListener('click', highlightSelectedOption);
document.getElementById('clear-button').addEventListener('click', removeHighlighting);

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
*   Format the heading info as HTML, with the appropriate class names for
*   the grid layout.
*/
function getClassNames (name) {
  switch (name) {
    case 'H1': return ['h1-name', 'h1-text'];
    case 'H2': return ['h2-name', 'h2-text'];
    case 'H3': return ['h3-name', 'h3-text'];
    case 'H4': return ['h4-name', 'h4-text'];
    case 'H5': return ['h5-name', 'h5-text'];
    case 'H6': return ['h6-name', 'h6-text'];
  }
}

function getFormattedHeadings (infoList) {
  let html = '';
  for (let i = 0; i < infoList.length; i++) {
    if (!(infoList[i].visible)) continue;
    let name = infoList[i].name, text = infoList[i].text;
    if (text.trim() === '') text = `<span class="empty">${emptyContent}</span>`;
    const classNames = getClassNames(name);
    html += `<div class="list-option"><div class="${classNames[0]}">${name}</div><div \
    class="${classNames[1]}">${text}</div></div>`;
  }
  return html;
}

/*
*   Display the structure information collected by the content script
*/
function updateSidebar (message) {
  const pageTitle = document.getElementById('page-title-content');
  // const headingsDiv = document.getElementById('listbox-1');
  // headingsDiv.classList.add('listbox');

  if (typeof message === 'object') {
    const info = message.info;

    // Update the page-title box
    pageTitle.innerHTML = getFormattedTitle(message);

    // Update the headings box
    if (info.headings.filter(item => item.visible).length) {
      // headingsDiv.innerHTML = getFormattedHeadings(info.headings);
      // listBox = new ListBox(headingsDiv, onListBoxAction);
      headingsBox.options = info.headings;
      updateButton(true);
    }
    else {
      headingsDiv.innerHTML = `<div class="grid-message">${noHeadingElements}</div>`;
    }
  }
  else {
    pageTitle.textContent = message;
    headingsBox.clearOptions();
    // headingsDiv.textContent = '';
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
