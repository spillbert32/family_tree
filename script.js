// Загрузка данных и построение дерева с центровкой камеры только при загрузке

const svg = d3.select("svg");
const width = window.innerWidth;
const height = window.innerHeight;

const g = svg.append("g");

// Масштабирование и панорамирование
const zoom = d3.zoom()
  .scaleExtent([0.5, 2.5])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

svg.call(zoom);

let currentData = null;
let root = null;

const tooltip = d3.select("#tooltip");

function buildHierarchy(data) {
  // Конвертация списка в древовидную структуру для d3.hierarchy
  // Узлы — по id, связи родители -> дети
  const nodesById = new Map();
  data.forEach(d => nodesById.set(d.id, {...d, children: []}));

  // Добавляем детей к родителям
  data.forEach(d => {
    d.parents.forEach(pId => {
      const parent = nodesById.get(pId);
      if (parent) parent.children.push(nodesById.get(d.id));
    });
  });

  // Находим корневых (у кого нет родителей)
  const roots = data.filter(d => d.parents.length === 0).map(d => nodesById.get(d.id));
  
  if (roots.length === 1) {
    return d3.hierarchy(roots[0]);
  } else if (roots.length > 1) {
    // Объединяем несколько корней в фиктивный корень
    const fakeRoot = {id: "root", name: "Корень", children: roots};
    return d3.hierarchy(fakeRoot);
  } else {
    // На всякий случай
    return d3.hierarchy(nodesById.values().next().value);
  }
}

function render(familyName, data) {
  svg.selectAll("*").remove();
  g.selectAll("*").remove();

  currentData = data;
  root = buildHierarchy(data);

  const treeLayout = d3.tree().size([height - 150, width - 150]).separation((a, b) => 1);

  treeLayout(root);

  // Линии связей
  g.selectAll(".link")
    .data(root.links())
    .join("path")
    .attr("class", "link")
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    );

  // Узлы
  const node = g.selectAll(".node")
    .data(root.descendants())
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`)
    .on("mouseenter", (event, d) => {
      showTooltip(event, d.data);
    })
    .on("mousemove", (event) => {
      moveTooltip(event);
    })
    .on("mouseleave", () => {
      hideTooltip();
    });

  node.append("circle")
    .attr("r", 18)
    .attr("class", d => d.data.gender === "male" ? "male" : "female");

  node.append("text")
    .attr("dy", -25)
    .attr("text-anchor", "middle")
    .attr("class", "surname")
    .text(d => d.data.surname || "");

  node.append("text")
    .attr("dy", -10)
    .attr("text-anchor", "middle")
    .text(d => d.data.name || "");

  // Центрируем камеру по дереву **только один раз при загрузке**
  centerTree();
}

function centerTree() {
  if (!root) return;

  // Получаем размеры дерева
  const nodes = root.descendants();
  const minX = d3.min(nodes, d => d.y);
  const maxX = d3.max(nodes, d => d.y);
  const minY = d3.min(nodes, d => d.x);
  const maxY = d3.max(nodes, d => d.x);

  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  // Центрируем с некоторым отступом
  const offsetX = (width - treeWidth) / 2 - minX;
  const offsetY = (height - treeHeight) / 2 - minY;

  // Устанавливаем трансформацию с масштабом 1 и центровкой
  svg.transition()
    .duration(800)
    .call(zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY).scale(1));
}

// Работа с тултипом (показ, перемещение, скрытие)
function showTooltip(event, data) {
  let html = `
    <b>${data.name || "?"} ${data.surname || ""}</b><br/>
    Отчество: ${data.patronymic || "не указано"}<br/>
    Год рождения: ${data.birthYear || "?"}<br/>
    Пол: ${data.gender === "male" ? "Мужской" : "Женский"}<br/>
    ${data.maidenSurname ? `Девичья фамилия: ${data.maidenSurname}<br/>` : ""}
    Супруги: ${data.spouses && data.spouses.length > 0 ? data.spouses.join(", ") : "нет"}<br/>
    Родители: ${data.parents && data.parents.length > 0 ? data.parents.join(", ") : "нет"}
  `;
  tooltip.html(html)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY + 15) + "px")
    .classed("visible", true);
}

function moveTooltip(event) {
  tooltip
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY + 15) + "px");
}

function hideTooltip() {
  tooltip.classed("visible", false);
}

// Загрузка данных и рендеринг при клике на кнопку
d3.json("db.json").then(db => {
  function loadFamily(name) {
    if (!db[name]) {
      alert("Данные для семьи '" + name + "' не найдены.");
      return;
    }
    render(name, db[name]);
  }

  // Загрузка начальной семьи при загрузке страницы
  loadFamily("marinichev");

  // Обработчики кнопок
  d3.selectAll("#buttons button").on("click", (event) => {
    const family = event.target.getAttribute("data-family");
    loadFamily(family);
  });
});
