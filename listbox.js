/*
*   listbox.js
*/

import ListEvents from './listevents.js';

const getMessage = browser.i18n.getMessage;

const template = document.createElement('template');
template.innerHTML = `
<div role="listbox" aria-activedescendant="" tabindex="0">
</div>
<div class="buttons-box">
  <button id="highlight" disabled></button>
  <button id="clearHL"></button>
</div>
`;

function createLink (cssFile) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssFile);
  return link;
}

//----------------------------------------------------------------
//  ListBox
//----------------------------------------------------------------

class ListBox extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Append link elements for external CSS stylesheets
    this.shadowRoot.appendChild(createLink('listbox.css'));

    switch (this.constructor.name) {
      case 'HeadingsBox':
        this.shadowRoot.appendChild(createLink('headings.css'));
        break;
      case 'LandmarksBox':
        this.shadowRoot.appendChild(createLink('landmarks.css'));
        break;
    }

    // Append template content as DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Save references to list container element and buttons
    this.container = this.shadowRoot.querySelector('[role="listbox"]');
    this.highlightButton = this.shadowRoot.querySelector('#highlight');
    this.clearHLButton = this.shadowRoot.querySelector('#clearHL');

    // Init. handler function references and button labels
    this.onSelected  = null;
    this.onActivated = null;
    this.onClearHL   = null;
    this.initButtons();
  }

  initButtons () {
    this.highlightButton.textContent = getMessage('highlightButtonLabel');
    this.clearHLButton.textContent = getMessage('clearHLButtonLabel');
  }

  createOption (info) {
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    option.setAttribute('id', info.dataId);
    return option;
  }

  clearOptions () {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  get optionsList () {
    return this.shadowRoot.querySelectorAll('[role="option"]');
  }

  set selectedOption (option) {
    this.selected = option;
  }

  get selectedOption () {
    return this.selected;
  }

  set selectionHandler (handlerFn) {
    this.onSelected = handlerFn;
  }

  set activationHandler (handlerFn) {
    this.onActivated = handlerFn;
  }

  set clearHLHandler (handlerFn) {
    this.onClearHL = handlerFn;
  }

  set message (msgText) {
    this.clearOptions();
    const div = document.createElement('div');
    div.classList.add('grid-message');
    div.textContent = msgText;
    this.container.appendChild(div);
  }
}

//----------------------------------------------------------------
//  HeadingsBox
//----------------------------------------------------------------

class HeadingsBox extends ListBox {
  constructor () {
    super();
    this.emptyMessage = getMessage("emptyContent");
  }

  getClassNames (info) {
    const classNames = [];
    const prefix = info.name.toLowerCase();
    classNames.push(`${prefix}-name`);
    classNames.push(`${prefix}-text`);
    return classNames;
  }

  set options (infoArray) {
    this.clearOptions();

    // Configure each list option with heading info
    infoArray.forEach(info => {
      let option = this.createOption(info);
      let classNames = this.getClassNames(info);

      let nameSpan = document.createElement('span');
      nameSpan.classList.add(classNames[0]);
      nameSpan.textContent = info.name;
      option.appendChild(nameSpan);

      let textSpan = document.createElement('span');
      textSpan.classList.add(classNames[1]);
      // Check for empty heading content
      if (info.text.trim() === '') {
        textSpan.classList.add('empty');
        textSpan.textContent = this.emptyMessage;
      }
      else {
        textSpan.textContent = info.text;
      }
      option.appendChild(textSpan);

      this.container.appendChild(option);
    });

    // ListBox container is now fully populated with option elements
    this.listEvents = new ListEvents(this);
  }
}

//----------------------------------------------------------------
//  LandmarksBox
//----------------------------------------------------------------

class LandmarksBox extends ListBox {
  constructor () {
    super();
  }

  /*
  *   traverseLandmarks: Recursive method for traversing the landmarks tree
  *   data structure. The 'value' property of the landmarks root node is just
  *   a placeholder, so only its 'descendants' are of interest.
  *   @param treeNode: initial value is the root node of landmarks tree
  *   @param level: initial value should be 0 (integer)
  */
  traverseLandmarks (treeNode, level) {
    let prefix = '\u2014\xa0';

    for (let node of treeNode.descendants) {
      // Configure each list option with landmark info
      let info = node.value;
      let option = this.createOption(info);

      let roleSpan = document.createElement('span');
      roleSpan.classList.add('role');
      roleSpan.textContent = prefix.repeat(level) + info.role;
      option.appendChild(roleSpan);

      if (info.name.length) {
        let nameSpan = document.createElement('span');
        nameSpan.classList.add('name');
        nameSpan.textContent = info.name;
        option.appendChild(nameSpan);
      }

      this.container.appendChild(option);
      this.traverseLandmarks(node, level + 1);
    }
  }

  /*
  *   options: infoNode is the root of the landmarks tree structure. It has
  *   properties 'value' and 'descendants', and each item in its 'descendants'
  *   array has that identical type (same properties). The 'value' property
  *   of each 'descendants' item is a landmarksInfo object.
  */
  set options (infoNode) {
    this.clearOptions();

    // Use recursive method for harvesting data in landmarks tree structure
    this.traverseLandmarks(infoNode, 0);

    // ListBox container is now fully populated with option elements
    this.listEvents = new ListEvents(this);
  }
}

customElements.define('headings-box', HeadingsBox);
customElements.define('landmarks-box', LandmarksBox);
export { HeadingsBox, LandmarksBox };
