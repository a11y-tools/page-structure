# README

## How it works

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
