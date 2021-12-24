/*
*   listbox.js
*/

const template = document.createElement('template');
template.innerHTML = `
<div class="listbox-container">
  <div role="listbox" tabindex="0">
  </div>
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

    // Use external CSS stylesheet
    this.shadowRoot.appendChild(createLink('listbox.css'));

    // Add template content DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Reference to list container element
    this.list = this.shadowRoot.querySelector('[role="listbox"]');
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

  get options () {
    return Array.from(this.list.children);
  }
}

/*
*   HeadingsBox
*/
class HeadingsBox extends ListBox {
  constructor () {
    super();
    // Use external CSS stylesheet
    this.shadowRoot.appendChild(createLink('headings.css'));
  }

  getClassNames (info) {
    const classNames = [];
    const prefix = info.name.toLowerCase();
    classNames.push(`${prefix}-name`);
    classNames.push(`${prefix}-text`);
    return classNames;
  }

  set options (infoArray) {
    const emptyMessage = browser.i18n.getMessage("emptyContent");
    this.clearOptions();

    // Configure each list item with heading info
    infoArray.forEach(info => {
      console.log(info);
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
        textSpan.textContent = emptyMessage;
      }
      else {
        textSpan.textContent = info.text;
      }
      option.appendChild(textSpan);

      this.list.appendChild(option);
    });
  }
}

customElements.define('headings-box', HeadingsBox);
export { HeadingsBox };
