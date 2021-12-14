# README.md

## How messaging works in `structure-4`

The approach to messaging between the extension and its content scripts in
this version makes use of a 'long-lived connection' as opposed to the simpler
'one-time request' approach.

See the browser extension messaging documentation at
* https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts
* https://developer.chrome.com/docs/extensions/mv3/messaging/

for in-depth explanations of the differences.

`panel.js`
* Sets up connection and message handlers for exchanges with `content.js`
* Runs the content scripts

`content.js`
* Sets up message handler for messages from `panel.js`
* Establishes connection with `panel.js`, initializes `panelPort`

`panel.js`
* On connection from `content.js`, initializes `contentPort`
* Sends message on `contentPort` named `getInfo`

`content.js`
* On receiving message `getInfo`, calls `getStructureInfo` with parameter
  `panelPort`
* Upon completion of DOM traversal, `getStructureInfo` sends the `info`
  message to `panel.js`

`panel.js`
* On receiving `info` message from `content.js`, calls `updateSidebar`,
  which populates the title and listbox areas with new data
