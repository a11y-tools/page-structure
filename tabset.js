/*
*   tabset.js
*/

const template = document.createElement('template');
template.innerHTML = `
<div class="tabset">
  <div role="tablist">
    <button role="tab" id="tab-1" type="button" aria-controls="panel-1" aria-selected="true">
      <slot name="tab-1"></slot>
    </button>
    <button role="tab" id="tab-2" type="button" aria-controls="panel-2" aria-selected="false" tabindex="-1">
      <slot name="tab-2"></slot>
    </button>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
    <slot name="panel-1"></slot>
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" tabindex="0" class="is-hidden">
    <slot name="panel-2"></slot>
  </div>
</div>
`;

function createLink (cssFile) {
  const link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssFile);
  return link;
}

class TabSet extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    this.shadowRoot.appendChild(createLink('tabset.css'));

    // Add template content DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  get tabs () {
    return Array.from(this.shadowRoot.querySelectorAll('[role="tab"]'));
  }

  get panels () {
    return Array.from(this.shadowRoot.querySelectorAll('[role="tabpanel"]'));
  }
}

customElements.define('tab-set', TabSet);
export { TabSet as default };
