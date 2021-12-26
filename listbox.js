/*
*   listbox.js
*/

import { ListEvents } from './listevents.js';

const getMessage = browser.i18n.getMessage;

const template = document.createElement('template');
template.innerHTML = `
<div role="listbox" class="listbox" aria-activedescendant="" tabindex="0">
</div>
`;

function createLink (cssFile) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssFile);
  return link;
}

/*
*   ListBox
*/
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
    }

    // Append template content as DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Save reference to list container element
    this.container = this.shadowRoot.querySelector('[role="listbox"]');

    // Provide default handler for option selection
    this.onSelected = function (flag) {
      console.log('selected: ', flag);
    };

    // Provide default handler for option activation
    this.onActivated = function (option) {
      console.log('activated: ', option.id);
    };
  }

  createOption (info) {
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    option.setAttribute('class', 'list-option');
    option.setAttribute('id', info.dataId);
    return option;
  }

  clearOptions () {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  get optionsArray () {
    return Array.from(this.shadowRoot.querySelectorAll('[role="option"]'));
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

  set message (msgText) {
    this.clearOptions();
    const div = document.createElement('div');
    div.classList.add('grid-message');
    div.textContent = msgText;
    this.container.appendChild(div);
  }
}

/*
*   HeadingsBox
*/
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

    // Configure each list item with heading info
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

    // All option elements have now been added to the listbox container
    this.listEvents = new ListEvents(this);
  }
}

customElements.define('headings-box', HeadingsBox);
export { HeadingsBox };
