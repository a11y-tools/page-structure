/*
*   listbox.js
*/

import { ListEvents } from './listevents.js';

const template = document.createElement('template');
template.innerHTML = `
<div role="listbox" class="listbox" aria-activedescendant="" tabindex="0">
</div>
`;

const dataAttribName = 'data-ilps';
const getMessage = browser.i18n.getMessage;

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
    this.list = this.shadowRoot.querySelector('[role="listbox"]');

    // Provide default handler for option selection
    this.onSelected = function (flag) {
      console.log('selected: ', flag);
    };

    // Provide default handler for option activation
    this.onActivated = function (option) {
      console.log('activated: ', option.getAttribute(dataAttribName));
    };
  }

  createOption (info) {
    const option = document.createElement('div');
    option.setAttribute('role', 'option');
    option.setAttribute('class', 'list-option');
    option.setAttribute(dataAttribName, info.dataId);
    return option;
  }

  clearOptions () {
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }
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
    this.list.appendChild(div);
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

      this.list.appendChild(option);
    });

    // this.list has now been populated
    this.listEvents =
      new ListEvents(this.list, this.onSelected, this.onActivated);
  }
}

customElements.define('headings-box', HeadingsBox);
export { HeadingsBox };
