/*
*   ListEvents: Class that handles mouse and keyboard events of a listbox
*   container with 'option' role elements. Provides keyboard support as
*   recommended by ARIA Authoring Practices.
*
*   Desired behavior:
*   1. Handle focus of the listbox container
*   2. Handle up-arrow, down-arrow, left-arrow, right-arrow, home, end,
*      page-up and page-down key presses to move selection among options.
*   3. Handle mouse click for selecting an option.
*   4. Handle return and space key presses to initiate the desired action
*      associated with the selected option.
*
*   Functionality/methods:
*   1. Initialize the DOM elements (the container and its children) with the
*      proper ARIA roles.
*   2. Create and assign necessary event handlers for the ListBox container.
*   3. Maintain state information needed for the event handlers and set or
*      remove ARIA attributes such as aria-activedescendant and aria-selected
*      to reflect the listbox state.
*/

export class ListEvents {
  constructor (listbox) {
    this.listbox        = listbox;
    this.container      = listbox.container;
    this.onSelected     = listbox.onSelected;
    this.onActivated    = listbox.onActivated;

    this.optionsList    = [];
    this.selectedOption = null;
    this.firstOption    = null;
    this.lastOption     = null;
    this.increment      = 6;

    this.initOptions();
    this.assignEventHandlers();
  }

  initOptions () {
    this.optionsList = Array.from(this.listbox.optionsList);

    // Initialize firstOption and lastOption
    const length = this.optionsList.length;
    this.firstOption = this.optionsList[0];
    this.lastOption  = this.optionsList[length - 1];
  }

  assignEventHandlers () {
    this.container.addEventListener('focus', this.handleFocus.bind(this));
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.container.addEventListener('dblclick', this.handleDblClick.bind(this));
  }

  handleFocus (event) {
    if (this.selectedOption === null) {
      this.setSelected(this.firstOption);
    }
    else {
      this.setSelected(this.selectedOption);
    }
  }

  handleKeyDown (event) {
    let flag = false;

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
        this.onActivated();
        flag = true;
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  handleMouseUp (event) {
    let parentElement = event.target.parentElement;
    if (parentElement && parentElement.getAttribute('role') === 'option') {
      this.setSelected(parentElement);
    }
  }

  handleDblClick (event) {
    this.onActivated();
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
    this.onSelected(true);
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
    if (this.selectedOption === this.firstOption) return;

    let index = this.optionsList.indexOf(this.selectedOption);
    this.setSelected(this.optionsList[index - 1]);
  }

  selectNextOption () {
    if (this.selectedOption === this.lastOption) return;

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
