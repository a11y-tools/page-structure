/*
*   ListEvents: class that handles events for ListBox custom elements
*/

export default class ListEvents {
  constructor (listbox) {
    this.listbox        = listbox;
    this.container      = listbox.container;
    this.onSelected     = listbox.onSelected;
    this.onActivated    = listbox.onActivated;
    this.onClearHL      = listbox.onClearHL;

    this.optionsList    = [];
    this.selectedOption = null;
    this.firstOption    = null;
    this.lastOption     = null;
    this.increment      = 6;
    this.autoSelect     = false;

    this.assignEventHandlers();
    this.initOptions();
  }

  assignEventHandlers () {
    this.container.addEventListener('focus', this.handleFocus.bind(this));
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.listbox.highlightButton.addEventListener('click', this.onActivated);
    this.listbox.clearHLButton.addEventListener('click', this.onClearHL);
  }

  initOptions () {
    // Add event listeners; populate this.optionsList array
    for (let option of this.listbox.optionsList) {
      option.addEventListener('click', this.handleClick.bind(this));
      option.addEventListener('dblclick', this.handleDblClick.bind(this));
      this.optionsList.push(option);
    }

    // Initialize firstOption and lastOption
    const length = this.optionsList.length;
    this.firstOption = this.optionsList[0];
    this.lastOption  = this.optionsList[length - 1];

    // Automatically set selection to firstOption
    if (this.autoSelect && length) {
      this.selectFirstOption();
    }
  }

  handleFocus (event) {
    if (this.selectedOption && this.onSelected) {
      this.onSelected(true);
    }
  }

  handleKeyDown (event) {
    let flag = false;

    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    switch (event.key) {

      // Navigation keys
      case 'ArrowLeft':
      case 'ArrowUp':
        this.selectPrevOption();
        flag = true;
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        this.selectNextOption();
        flag = true;
        break;

      case 'PageUp':
        this.selectPrevPage();
        flag = true;
        break;

      case 'PageDown':
        this.selectNextPage();
        flag = true;
        break;

      case 'Home':
        this.selectFirstOption();
        flag = true;
        break;

      case 'End':
        this.selectLastOption();
        flag = true;
        break;

      // Activation keys
      case 'Enter':
      case ' ':
        if (this.onActivated) this.onActivated();
        flag = true;
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  handleClick (event) {
    this.setSelected(event.currentTarget);
  }

  handleDblClick (event) {
    if (this.onActivated) this.onActivated();
  }

  setSelected (option) {
    if (this.selectedOption) {
      this.selectedOption.removeAttribute('aria-selected')
    }

    this.selectedOption = option;
    this.listbox.selectedOption = option;
    option.setAttribute('aria-selected', 'true');
    this.container.setAttribute('aria-activedescendant', option.id);
    this.scrollSelectedOption();
    if (this.onSelected) this.onSelected(true);
  }

  scrollSelectedOption () {
    let container = this.container;
    let element = this.selectedOption;

    // Note: element.offsetTop is the number of pixels from the top of the
    // closest relatively positioned parent element. Thus the CSS for the
    // ListBox container element must specify 'position: relative'.

    if (container.scrollHeight > container.clientHeight) {

      let elementBottom = element.offsetTop + element.offsetHeight;
      let scrollBottom = container.clientHeight + container.scrollTop;

      if (elementBottom > scrollBottom) {
        container.scrollTop = elementBottom - container.clientHeight;
      }
      else if (element.offsetTop < container.scrollTop) {
        container.scrollTop = element.offsetTop;
      }
    }
  }

  selectFirstOption () {
    this.setSelected(this.firstOption);
  }

  selectLastOption () {
    this.setSelected(this.lastOption);
  }

  selectPrevOption () {
    if (this.selectedOption === this.firstOption) {
      this.setSelected(this.firstOption);
      return;
    }

    let index = this.optionsList.indexOf(this.selectedOption);
    this.setSelected(this.optionsList[index - 1]);
  }

  selectNextOption () {
    if (this.selectedOption === this.lastOption) {
      this.setSelected(this.lastOption);
      return;
    }

    let index = this.optionsList.indexOf(this.selectedOption);
    this.setSelected(this.optionsList[index + 1]);
  }

  selectPrevPage () {
    if (this.selectedOption === this.firstOption) return;

    let index = this.optionsList.indexOf(this.selectedOption);
    let tgtIndex = index - this.increment;

    if (tgtIndex < 0) {
      this.selectFirstOption();
    }
    else {
      this.setSelected(this.optionsList[tgtIndex]);
    }
  }

  selectNextPage () {
    if (this.selectedOption === this.lastOption) return;

    let index = this.optionsList.indexOf(this.selectedOption);
    let tgtIndex = index + this.increment;

    if (tgtIndex > this.optionsList.length - 1) {
      this.selectLastOption();
    }
    else {
      this.setSelected(this.optionsList[tgtIndex]);
    }
  }
}
