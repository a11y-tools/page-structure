/*
*   TabEvents
*
*   Handle the click and keyboard events for a tabbed interface, or tab set.
*   Based on WAI-ARIA Authoring Practices 1.2 'Example of Tabs with Automatic
*   Activation': w3c.github.io/aria-practices/examples/tabs/tabs-1/tabs.html
*
*   Note: constructor @params 'tabs' and 'panels' are JavaScript arrays.
*/

export default class TabEvents {
  constructor (tabs, panels) {
    this.tabs = tabs;
    this.panels = panels;

    for (let tab of this.tabs) {
      tab.addEventListener('click', this.clickHandler.bind(this));
      tab.addEventListener('keydown', this.keydownHandler.bind(this));
    }

    this.firstTab  = this.tabs[0];
    this.lastIndex = this.tabs.length - 1;
    this.lastTab   = this.tabs[this.lastIndex];

    // Make firstTab focusable prior to any tab activations
    this.firstTab.removeAttribute('tabindex');
  }

  clickHandler (event) {
    let tab = event.currentTarget;
    console.log(`clickHandler: ${tab.id}`);
    this.activate(tab);
  }

  keydownHandler (event) {
    let key = event.key,
        tab = event.currentTarget;

    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    switch (key) {
      case 'Home':
        event.preventDefault();
        this.activate(this.firstTab);
        break;

      case 'End':
        event.preventDefault();
        this.activate(this.lastTab);
        break;

      case 'ArrowLeft':
        this.activate(this.getPrevious(tab));
        break;

      case 'ArrowRight':
        this.activate(this.getNext(tab));
        break;

      // Prevent page scrolling
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        break;
    }
  }

  findPanel (id) {
    return this.panels.find(panel => id === panel.id);
  }

  activate (tab) {
    this.deactivateTabs();
    tab.removeAttribute('tabindex');
    tab.setAttribute('aria-selected', 'true');
    tab.focus();

    const panelId = tab.getAttribute('aria-controls');
    console.log(`aria-controls: ${panelId}`);
    this.findPanel(panelId).classList.remove('is-hidden');
  }

  deactivateTabs () {
    for (let tab of this.tabs) {
      tab.setAttribute('tabindex', '-1');
      tab.setAttribute('aria-selected', 'false');
    }

    for (let panel of this.panels) {
      panel.classList.add('is-hidden');
    }
  }

  getPrevious (tab) {
    let index = this.tabs.indexOf(tab);
    // Implement wraparound behavior
    index = (index === 0) ? this.lastIndex : index - 1;
    return this.tabs[index]
  }

  getNext (tab) {
    let index = this.tabs.indexOf(tab);
    // Implement wraparound behavior
    index = (index === this.lastIndex) ? 0 : index + 1;
    return this.tabs[index];
  }
}
