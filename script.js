// Загружаем данные и строим дерево с использованием связей по id

fetch('data.json')
  .then((res) => res.json())
  .then((data) => {
    // Создаём карту id → человек
    const peopleMap = new Map();
    data.forEach(person => peopleMap.set(person.id, person));

    // Создаём функцию построения узла с учетом уровня (для цветов)
    function createTreeNode(id, level = 0) {
      const person = peopleMap.get(id);
      if (!person) return null;

      const container = document.createElement('div');
      container.className = 'person-container';
      container.classList.add(`level-${level}`);

      // Создаем блок пары, если есть супруг
      const coupleDiv = document.createElement('div');
      coupleDiv.className = 'couple';

      // Функция создания блока человека
      function createPersonBlock(p) {
        const div = document.createElement('div');
        div.className = 'person';

        // Имя и отчество + фамилия
        const nameLine = document.createElement('div');
        nameLine.className = 'person-name';

        // Формируем ФИО с девичьей фамилией в скобках для замужних женщин
        let fullName = p.firstName + ' ' + p.patronymic + ' ' + p.lastName;
        if (p.maidenName) {
          fullName += ` (девичья ${p.maidenName})`;
        }
        nameLine.textContent = fullName;
        div.appendChild(nameLine);

        // Дата рождения
        if (p.birthDate) {
          const birthLine = document.createElement('div');
          birthLine.className = 'person-birthdate';
          birthLine.textContent = 'Дата рождения: ' + p.birthDate;
          div.appendChild(birthLine);
        }

        return div;
      }

      // Добавляем главного человека
      coupleDiv.appendChild(createPersonBlock(person));

      // Добавляем супругу, если есть
      if (person.spouseId) {
        const spouse = peopleMap.get(person.spouseId);
        if (spouse) {
          coupleDiv.appendChild(createPersonBlock(spouse));
        }
      }

      container.appendChild(coupleDiv);

      // Добавляем детей, если есть
      if (person.childrenIds && person.childrenIds.length > 0) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'children';

        person.childrenIds.forEach(childId => {
          const childNode = createTreeNode(childId, level + 1);
          if (childNode) childrenDiv.appendChild(childNode);
        });

        container.appendChild(childrenDiv);
      }

      return container;
    }

    // Поиск корня — человека без родителей (не встречается как ребенок)
    const allIds = new Set(data.map(p => p.id));
    const childIds = new Set();
    data.forEach(p => {
      if (p.childrenIds) p.childrenIds.forEach(cId => childIds.add(cId));
    });
    const rootCandidates = [...allIds].filter(id => !childIds.has(id));
    const rootId = rootCandidates.length > 0 ? rootCandidates[0] : data[0].id;

    // Отрисовка
    const treeContainer = document.getElementById('tree');
    treeContainer.innerHTML = '';
    const treeRoot = createTreeNode(rootId, 0);
    treeContainer.appendChild(treeRoot);
  });
