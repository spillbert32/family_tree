function createPersonBlock(person) {
  const div = document.createElement('div');
  div.className = 'person';

  const nameLine = document.createElement('div');
  nameLine.textContent = `${person.lastName} ${person.firstName}`;

  if (person.maidenName) {
    const maidenSpan = document.createElement('span');
    maidenSpan.className = 'maiden-name';
    maidenSpan.textContent = ` (${person.maidenName})`;
    nameLine.appendChild(maidenSpan);
  }

  div.appendChild(nameLine);

  if (person.patronymic) {
    const patronymicLine = document.createElement('div');
    patronymicLine.className = 'patronymic';
    patronymicLine.textContent = person.patronymic;
    div.appendChild(patronymicLine);
  }

  if (person.birthDate) {
    const bd = document.createElement('div');
    bd.className = 'birth-date';
    bd.textContent = `рожд. ${person.birthDate}`;
    div.appendChild(bd);
  }

  return div;
}

function createTreeNode(person) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  // Блок человека
  const personDiv = createPersonBlock(person);
  couple.appendChild(personDiv);

  // Блок супруга/супруги
  if (person.spouse) {
    const spouseDiv = createPersonBlock(person.spouse);
    couple.appendChild(spouseDiv);
  }

  container.appendChild(couple);

  // Кнопка для раскрытия/сокрытия детей (если есть)
  if (person.children && person.children.length > 0) {
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.textContent = '−'; // минус — показываем детей

    toggleBtn.addEventListener('click', () => {
      if (childrenDiv.classList.contains('hidden')) {
        childrenDiv.classList.remove('hidden');
        toggleBtn.textContent = '−';
      } else {
        childrenDiv.classList.add('hidden');
        toggleBtn.textContent = '+';
      }
    });

    container.appendChild(toggleBtn);

    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';

    person.children.forEach(child => {
      childrenDiv.appendChild(createTreeNode(child));
    });

    container.appendChild(childrenDiv);
  }

  return container;
}

fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const peopleById = {};
    data.forEach(p => peopleById[p.id] = {...p});

    data.forEach(p => {
      if (p.spouseId) peopleById[p.id].spouse = peopleById[p.spouseId];
      if (p.childrenIds) peopleById[p.id].children = p.childrenIds.map(id => peopleById[id]);
    });

    const allChildrenIds = new Set();
    data.forEach(p => {
      if (p.childrenIds) p.childrenIds.forEach(id => allChildrenIds.add(id));
    });

    const roots = data.filter(p => !allChildrenIds.has(p.id));
    if (roots.length === 0) {
      console.error('Не найден корень дерева');
      return;
    }
    const root = peopleById[roots[0].id];

    const treeContainer = document.getElementById('tree');
    treeContainer.innerHTML = '';
    treeContainer.appendChild(createTreeNode(root));
  })
  .catch(err => console.error('Ошибка загрузки данных:', err));
