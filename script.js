// Функция создания блока с информацией о человеке
function createPersonBlock(person) {
  const div = document.createElement('div');
  div.className = 'person';

  // Фамилия и имя в одной строке
  const nameLine = document.createElement('div');
  nameLine.textContent = `${person.lastName} ${person.firstName}`;

  // Девичья фамилия в скобках, если есть
  if (person.maidenName) {
    const maidenSpan = document.createElement('span');
    maidenSpan.className = 'maiden-name';
    maidenSpan.textContent = ` (${person.maidenName})`;
    nameLine.appendChild(maidenSpan);
  }

  div.appendChild(nameLine);

  // Отчество на следующей строке
  if (person.patronymic) {
    const patronymicLine = document.createElement('div');
    patronymicLine.className = 'patronymic';
    patronymicLine.textContent = person.patronymic;
    div.appendChild(patronymicLine);
  }

  // Дата рождения на следующей строке
  if (person.birthDate) {
    const bd = document.createElement('div');
    bd.className = 'birth-date';
    bd.textContent = `рожд. ${person.birthDate}`;
    div.appendChild(bd);
  }

  return div;
}

// Функция создания узла дерева с человеком и его супругом/супругой
function createTreeNode(person) {
  const container = document.createElement('div');
  container.className = 'person-container';

  const couple = document.createElement('div');
  couple.className = 'couple';

  // Создаём блок для основного человека
  const personDiv = createPersonBlock(person);
  couple.appendChild(personDiv);

  // Если есть супруг(а) — создаём блок
  if (person.spouse) {
    const spouseDiv = createPersonBlock(person.spouse);
    couple.appendChild(spouseDiv);
  }

  container.appendChild(couple);

  // Если есть дети — рекурсивно создаём их узлы
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

// Загрузка данных и создание дерева
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const treeContainer = document.getElementById('tree');
    const tree = createTreeNode(data);
    treeContainer.appendChild(tree);
  })
  .catch(err => console.error('Ошибка загрузки данных:', err));
