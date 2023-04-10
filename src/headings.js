/*
*   headings.js
*/

import ListBox from './listbox.js';
import ListEvents from './listevents.js';

const getMessage = browser.i18n.getMessage;

export default class HeadingsBox extends ListBox {
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

customElements.define('headings-box', HeadingsBox);
