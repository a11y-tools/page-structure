/*
*   tabset.js
*/

const getMessage = browser.i18n.getMessage;

const template = document.createElement('template');
template.innerHTML = `
<div class="tabset">
  <div role="tablist">
    <div role="tab" id="tab-1" aria-controls="panel-1">
      <span>Tab 1</span>
    </div>
    <div role="tab" id="tab-2" aria-controls="panel-2">
      <span>Tab 2</span>
    </div>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
    <slot name="panel-1"></slot>
  </div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2">
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

export default class TabSet extends HTMLElement {
  constructor () {
    super();
    this.attachShadow({ mode: 'open' });

    // Use external CSS stylesheet
    this.shadowRoot.appendChild(createLink('tabset.css'));

    // Add template content DOM nodes
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.tabs = Array.from(this.shadowRoot.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.shadowRoot.querySelectorAll('[role="tabpanel"]'));
    this.initTabs();
  }

  initTabs () {
    this.tabs[0].firstElementChild.textContent = getMessage('headingsLabel');
    this.tabs[1].firstElementChild.textContent = getMessage('landmarksLabel');

    for (let tab of this.tabs) {
      tab.addEventListener('click', this.clickHandler.bind(this));
      tab.addEventListener('keydown', this.keydownHandler.bind(this));
    }
  }

  selectTab (id) {
    for (const tab of this.tabs) {
      if (tab.id === id) {
        this.showPanel(tab.getAttribute('aria-controls'));
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        tab.focus();
      }
      else {
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      }
    }
    this.dispatchEvent(new CustomEvent('tabSelect',
      { detail: id }));
  }

  showPanel (id) {
    for (let panel of this.panels) {
      if (panel.id === id) {
        panel.classList.add('show');
      }
      else {
        panel.classList.remove('show');
      }
    }
  }

  connectedCallback () {
    this.selectTab('tab-1');
  }

  get selectedId () {
    for (const tab of this.tabs) {
      if (tab.getAttribute('aria-selected') === 'true') {
        return tab.id;
      }
    }
    return '';
  }

  // Event handlers

  clickHandler (event) {
    let tab = event.currentTarget;
    this.selectTab(tab.id);
  }

  keydownHandler (event) {
    let tab = event.currentTarget;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        const otherId = tab.id === 'tab-1' ? 'tab-2' : 'tab-1';
        this.selectTab(otherId);
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }
}

customElements.define('tab-set', TabSet);
