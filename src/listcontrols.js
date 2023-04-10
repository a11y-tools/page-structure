/*
*   listcontrols.js
*/

const getMessage = browser.i18n.getMessage;

const template = document.createElement('template');
template.innerHTML = `
<div>
  <div class="buttons-box">
    <button id="highlight" disabled></button>
    <button id="clear"></button>
  </div>
  <div class="auto-highlight">
    <div>
      <input type="checkbox" id="auto-checkbox"></input>
      <label for="auto-checkbox"></label>
    </div>
  </div>
</div>
`;

function createLink (cssFile) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssFile);
  return link;
}

//----------------------------------------------------------------
//  ListControls
//----------------------------------------------------------------

export default class ListControls extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Append link elements for external CSS stylesheets
    this.shadowRoot.appendChild(createLink('listcontrols.css'));

    // Append template content as DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Save references to list container element and buttons
    this._highlightButton = this.shadowRoot.querySelector('button#highlight');
    this._clearButton = this.shadowRoot.querySelector('button#clear');
    this._autoCheckbox = this.shadowRoot.querySelector('input');
    this.checkboxLabel = this.shadowRoot.querySelector('label');

    this.initButtons();
  }

  get autoCheckbox    () { return this._autoCheckbox; }
  get highlightButton () { return this._highlightButton; }
  get clearButton     () { return this._clearButton; }

  initButtons () {
    this.highlightButton.textContent = getMessage('highlightButtonLabel');
    this.clearButton.textContent     = getMessage('clearButtonLabel');
    this.checkboxLabel.textContent   = getMessage('autoHighlightLabel');
  }

  enableHighlightButton (value) {
    this.highlightButton.disabled = !value;
  }
}

customElements.define('list-controls', ListControls);
