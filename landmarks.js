/*
*   landmarks.js
*/

import ListBox from './listbox.js';
import ListEvents from './listevents.js';

export default class LandmarksBox extends ListBox {
  constructor () {
    super();
  }

  /*
  *   traverseLandmarks: Recursive method for traversing the landmarks tree
  *   data structure. The 'info' property of the landmarks root node is just
  *   a placeholder, so only its 'descendants' are of interest.
  *   @param treeNode: initial value is the root node of landmarks tree
  *   @param level: initial value should be 0 (integer)
  */
  traverseLandmarks (treeNode, level) {
    let prefix = '\u2014\xa0';

    for (let node of treeNode.descendants) {
      // Configure each list option with landmark info
      let info = node.info;
      let option = this.createOption(info);

      let roleSpan = document.createElement('span');
      roleSpan.classList.add('role');
      roleSpan.textContent = prefix.repeat(level) + info.role;
      option.appendChild(roleSpan);

      if (info.name.length) {
        let nameSpan = document.createElement('span');
        nameSpan.classList.add('name');
        nameSpan.textContent = info.name;
        option.appendChild(nameSpan);
      }

      this.container.appendChild(option);
      this.traverseLandmarks(node, level + 1);
    }
  }

  /*
  *   options: infoNode is the root of the landmarks tree structure. It has
  *   properties 'info' and 'descendants', and each item in its 'descendants'
  *   array has that identical type (same properties). The 'info' property
  *   of each 'descendants' item is a landmarksInfo object.
  */
  set options (infoNode) {
    this.clearOptions();

    // Use recursive method for harvesting data in landmarks tree structure
    this.traverseLandmarks(infoNode, 0);

    // ListBox container is now fully populated with option elements
    this.listEvents = new ListEvents(this);
  }
}

customElements.define('landmarks-box', LandmarksBox);
