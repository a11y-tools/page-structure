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
    this.shadowRoot.appendChild(createLink('listbox.css'));
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Save reference to list container element
    this.list = this.shadowRoot.querySelector('[role="listbox"]');

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
    this.shadowRoot.appendChild(createLink('headings.css'));
    this.emptyMessage = browser.i18n.getMessage("emptyContent");
    this.listEvents = null;
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
    this.listEvents = new ListEvents(this.list, this.onActivated);
  }
}

customElements.define('headings-box', HeadingsBox);
export { HeadingsBox };
