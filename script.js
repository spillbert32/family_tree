function createTreeNode(person) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  const personDiv = document.createElement('div');
  personDiv.className = 'person';
  personDiv.textContent = person.name;

  couple.appendChild(personDiv);

  if (person.spouse) {
    const spouseDiv = document.createElement('div');
    spouseDiv.className = 'person';
    spouseDiv.textContent = person.spouse;
    couple.appendChild(spouseDiv);
  }

  container.appendChild(couple);

  if (person.children && person.children.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';

    person.children.forEach(child => {
      const childNode = createTreeNode(child);
      childrenDiv.appendChild(childNode);
    });

    container.appendChild(childrenDiv);
  }

  return container;
}

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const treeContainer = document.getElementById('tree');
    const tree = createTreeNode(data);
    treeContainer.appendChild(tree);
  });
