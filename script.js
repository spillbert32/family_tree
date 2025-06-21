fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const peopleById = {};
    data.forEach(person => {
      peopleById[person.id] = person;
      person.children = [];
    });

    // Связываем детей с родителями
    data.forEach(person => {
      if (person.parents) {
        person.parents.forEach(parentId => {
          const parent = peopleById[parentId];
          if (parent) parent.children.push(person);
        });
      }
    });

    // Находим корневых предков (без родителей)
    const roots = data.filter(person => !person.parents || person.parents.length === 0);

    const treeContainer = document.getElementById('tree');
    roots.forEach(root => {
      const node = createTreeNode(root, peopleById);
      treeContainer.appendChild(node);
    });
  });

// Создание блока с человеком
function createPersonBlock(person) {
  const personDiv = document.createElement('div');
  personDiv.className = 'person';

  const fullName = document.createElement('div');
  fullName.textContent = `${person.name} ${person.patronymic || ''}`.trim();
  fullName.className = 'person-name';

  const birthdate = document.createElement('div');
  birthdate.textContent = person.birthdate || '';
  birthdate.className = 'person-birthdate';

  personDiv.appendChild(fullName);
  if (birthdate.textContent) {
    personDiv.appendChild(birthdate);
  }

  return personDiv;
}

// Рекурсивное создание дерева
function createTreeNode(person, peopleById) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  const personDiv = createPersonBlock(person);
  couple.appendChild(personDiv);

  if (person.spouseId) {
    const spouse = peopleById[person.spouseId];
    if (spouse) {
      const spouseDiv = createPersonBlock(spouse);
      couple.appendChild(spouseDiv);
    }
  }

  container.appendChild(couple);

  if (person.children && person.children.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';

    person.children.forEach(child => {
      const childNode = createTreeNode(child, peopleById);
      childrenDiv.appendChild(childNode);
    });

    container.appendChild(childrenDiv);
  }

  return container;
}
