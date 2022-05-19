/*
*   listbox.js
*/

const template = document.createElement('template');
template.innerHTML = `
<div role="listbox" aria-activedescendant="" tabindex="0">
</div>
`;

function createLink (cssFile) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssFile);
  return link;
}

export default class ListBox extends HTMLElement {
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

    // Initialize properties
    this.container   = this.shadowRoot.querySelector('[role="listbox"]');
    this.selected    = null;
    this.onSelected  = null;
    this.onActivated = null;
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
    this.selectedOption = null;
  }

  get optionsList () {
    return this.shadowRoot.querySelectorAll('[role="option"]');
  }

  get selectedOption () {
    return this.selected;
  }

  set selectedOption (option) {
    this.selected = option;
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
