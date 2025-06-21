// Создаёт блок с информацией о человеке
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

// Создаёт узел дерева с человеком и его супругом и детьми
function createTreeNode(person) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  // Человек
  const personDiv = createPersonBlock(person);
  couple.appendChild(personDiv);

  // Супруг(а), если есть
  if (person.spouse) {
    const spouseDiv = createPersonBlock(person.spouse);
    couple.appendChild(spouseDiv);
  }

  container.appendChild(couple);

  // Дети
  if (person.children && person.children.length > 0) {
    const childrenDiv = document.createElement('div');
    childrenDiv.className = 'children';

    person.children.forEach(child => {
      childrenDiv.appendChild(createTreeNode(child));
    });

    container.appendChild(childrenDiv);
  }

  return container;
}

// Загрузка данных и построение дерева
fetch('data.json')
  .then(res => res.json())
  .then(data => {
    // Создаем словарь id → человек
    const peopleById = {};
    data.forEach(p => peopleById[p.id] = {...p});

    // Связываем супругов и детей по id
    data.forEach(p => {
      if (p.spouseId) {
        peopleById[p.id].spouse = peopleById[p.spouseId];
      }
      if (p.childrenIds) {
        peopleById[p.id].children = p.childrenIds.map(id => peopleById[id]);
      }
    });

    // Находим корень — человека у которого нет родителей
    // Для простоты — ищем тех, кто не является чьим-то ребенком
    const allChildrenIds = new Set();
    data.forEach(p => {
      if (p.childrenIds) {
        p.childrenIds.forEach(id => allChildrenIds.add(id));
      }
    });
    const roots = data.filter(p => !allChildrenIds.has(p.id));

    if (roots.length === 0) {
      console.error('Не найден корень дерева');
      return;
    }

    // Для примера берём первого корня
    const root = peopleById[roots[0].id];

    // Рендерим дерево
    const treeContainer = document.getElementById('tree');
    treeContainer.innerHTML = '';
    treeContainer.appendChild(createTreeNode(root));
  })
  .catch(err => {
    console.error('Ошибка загрузки данных:', err);
  });
