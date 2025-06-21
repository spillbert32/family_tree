function createPersonBlock(person) {
  const div = document.createElement('div');
  div.className = 'person';

  let fullName = `${person.firstName} ${person.patronymic} `;
  if (person.maidenName) {
    fullName += `${person.lastName} <span class="maiden-name">(${person.maidenName})</span>`;
  } else {
    fullName += person.lastName;
  }
  div.innerHTML = fullName;

  if (person.birthDate) {
    const bd = document.createElement('div');
    bd.className = 'birth-date';
    bd.textContent = `рожд. ${person.birthDate}`;
    div.appendChild(bd);
  }

  return div;
}

function createTreeNode(person, peopleMap) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  couple.appendChild(createPersonBlock(person));

  if (person.spouseId) {
    const spouse = peopleMap.get(person.spouseId);
    if (spouse) {
      couple.appendChild(createPersonBlock(spouse));
    }
  }

  container.appendChild(couple);

  if (person.childrenIds && person.childrenIds.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';

    person.childrenIds.forEach(childId => {
      const child = peopleMap.get(childId);
      if (child) {
        const childNode = createTreeNode(child, peopleMap);
        childrenDiv.appendChild(childNode);
      }
    });

    container.appendChild(childrenDiv);

    // Добавляем кнопку раскрытия/сворачивания
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.textContent = '-';
    toggleBtn.title = 'Свернуть/развернуть детей';

    toggleBtn.onclick = () => {
      if (childrenDiv.classList.contains('hidden')) {
        childrenDiv.classList.remove('hidden');
        toggleBtn.textContent = '-';
      } else {
        childrenDiv.classList.add('hidden');
        toggleBtn.textContent = '+';
      }
    };

    container.appendChild(toggleBtn);
  }

  return container;
}

fetch('data.json')
  .then(resp => resp.json())
  .then(data => {
    const treeContainer = document.getElementById('tree');
    const peopleMap = new Map();
    data.forEach(p => peopleMap.set(p.id, p));

    // Ищем корня - того, кто не является чьим-либо ребенком
    const allIds = new Set(data.map(p => p.id));
    const childIds = new Set();
    data.forEach(p => {
      if (p.childrenIds) p.childrenIds.forEach(id => childIds.add(id));
    });
    const rootCandidates = [...allIds].filter(id => !childIds.has(id));
    if (rootCandidates.length === 0) {
      treeContainer.textContent = 'Корень не найден';
      return;
    }

    const root = peopleMap.get(rootCandidates[0]);
    const tree = createTreeNode(root, peopleMap);
    treeContainer.appendChild(tree);
  })
  .catch(err => {
    console.error(err);
    document.getElementById('tree').textContent = 'Ошибка загрузки данных';
  });
