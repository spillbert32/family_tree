function buildTree(data, parentId = null) {
  return data
    .filter(person => person.parent_id === parentId)
    .map(person => {
      const children = buildTree(data, person.id);
      return {
        ...person,
        children
      };
    });
}

function renderTree(nodes) {
  const ul = document.createElement('ul');

  nodes.forEach(node => {
    const li = document.createElement('li');
    const div = document.createElement('div');
    div.className = 'node';
    div.textContent = node.full_name;
    li.appendChild(div);

    if (node.children && node.children.length > 0) {
      const childrenUl = renderTree(node.children);
      childrenUl.classList.add('children', 'hidden');
      li.appendChild(childrenUl);

      div.addEventListener('click', () => {
        childrenUl.classList.toggle('hidden');
      });
    }

    ul.appendChild(li);
  });

  return ul;
}

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const treeData = buildTree(data);
    const container = document.getElementById('tree-container');
    container.appendChild(renderTree(treeData));
  })
  .catch(error => {
    console.error("Ошибка загрузки данных:", error);
  });
