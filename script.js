let currentTransform = null;
let trees = {};
let firstRender = true;

// Проверка устройства
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

function buildTree(people) {
  const personMap = new Map(people.map(p => [p.id, p]));
  const pairsMap = new Map();

  people.forEach(p => {
    if (p.spouses?.length) {
      p.spouses.forEach(spId => {
        const key = [p.id, spId].sort().join("_");
        if (!pairsMap.has(key)) {
          pairsMap.set(key, { spouses: [p.id, spId], children: [] });
        }
      });
    } else {
      pairsMap.set(p.id, { spouses: [p.id], children: [] });
    }
  });

  people.forEach(p => {
    if (p.parents?.length) {
      const key = [...p.parents].sort().join("_");
      if (!pairsMap.has(key)) {
        pairsMap.set(key, { spouses: [...p.parents], children: [p.id] });
      } else {
        pairsMap.get(key).children.push(p.id);
      }
    }
  });

  const hasParents = id => personMap.get(id)?.parents?.length > 0;
  const roots = [];
  pairsMap.forEach((pair, key) => {
    if (pair.spouses.some(id => !hasParents(id))) {
      roots.push({ key, spouses: pair.spouses, children: pair.children });
    }
  });

  const used = new Set();
  function buildNode(key) {
    if (used.has(key)) {
      return {
        id: key,
        spouses: pairsMap.get(key).spouses.map(i => personMap.get(i)),
        children: null,
        isReference: true
      };
    }
    used.add(key);
    const { spouses, children } = pairsMap.get(key);
    return {
      id: key,
      spouses: spouses.map(i => personMap.get(i)),
      children: children.map(cid => {
        const ch = personMap.get(cid);
        const childKey = [...new Set([ch.id, ...(ch.spouses || [])])].sort().join("_");
        return buildNode(childKey);
      }),
      isReference: false
    };
  }
  return roots.map(r => buildNode(r.key));
}

function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else if (d._children) {
    d.children = d._children;
    d._children = null;
  }
}

// Загрузка данных
fetch("db.json")
  .then(res => res.json())
  .then(data => {
    trees = {
      tree1: buildTree(data.marinichev),
      tree2: buildTree(data.shapovalov),
      tree3: buildTree(data.guzovin),
      tree4: buildTree(data.ribasov)
    };
    render(trees.tree1);
  });

function showModal(person) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");
  content.innerHTML = `
    <strong>${person.surname} ${person.name} ${person.patronymic || ''}</strong><br>
    Год рождения: ${person.birthYear || 'неизвестно'}<br>
    ${person.deathYear ? 'Год смерти: ' + person.deathYear + '<br>' : ''}
    Место жительства: ${person.location || 'неизвестно'}<br>
    Описание: ${person.description || 'Описание отсутствует'}
  `;
  modal.style.display = "flex";
}

document.getElementById("modal").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

function render(treeData) {
  const svg = d3.select("svg");
  svg.selectAll("*").remove();

  const g = svg.append("g").attr("transform", currentTransform || "translate(0,0)");

  const zoom = d3.zoom()
    .scaleExtent([0.5, 3])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
      currentTransform = event.transform;
    });

  svg.call(zoom);

  const dx = 300, dy = 300, spouseSpacing = isMobile() ? 150 : 120, circleRadius = isMobile() ? 40 : 28;

  treeData.forEach((rootData, rootIndex) => {
    const root = d3.hierarchy(rootData, d => d.children);
    d3.tree().nodeSize([dx, dy])(root);
    const xOff = rootIndex * (isMobile() ? 1000 : 900);

    const linksData = root.links().filter(link => !link.target.data.isReference);
    g.selectAll(".link" + rootIndex)
      .data(linksData)
      .join("path")
      .attr("class", "link")
      .attr("d", d3.linkVertical()
        .x(d => d.x + xOff)
        .y(d => d.y));

    const nodes = g.selectAll(".node" + rootIndex)
      .data(root.descendants(), d => d.data.id)
      .join(enter => enter.append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x + xOff},${d.y})`)
        .on("click", (_, d) => {
          if (isMobile()) {
            // Показать модальное окно по первому человеку
            const p = d.data.spouses[0];
            if (p) showModal(p);
          } else {
            toggle(d.data);
            render(treeData);
          }
        })
      );

    nodes.each(function(d) {
      if (d.data.isReference) return;
      const el = d3.select(this);
      const sp = d.data.spouses;
      const canExpand = (d.data.children?.length > 0) || (d.data._children?.length > 0);
      const maleClass = canExpand ? "expandable male" : "not-expandable male";
      const femaleClass = canExpand ? "expandable female" : "not-expandable female";

      const drawPerson = (p, cx) => {
        el.append("circle")
          .attr("class", p.gender === "male" ? maleClass : femaleClass)
          .attr("r", circleRadius)
          .attr("cx", cx)
          .on(isMobile() ? "click" : "mouseover", function(event) {
            if (isMobile()) {
              showModal(p);
              event.stopPropagation();
            } else {
              const tooltip = d3.select("#tooltip");
              tooltip.html(`
                <strong>${p.surname} ${p.name} ${p.patronymic || ''}</strong><br>
                Год рождения: ${p.birthYear || 'неизвестно'}<br>
                ${p.deathYear ? 'Год смерти: ' + p.deathYear + '<br>' : ''}
                Место жительства: ${p.location || 'неизвестно'}<br>
                Описание: ${p.description || 'Описание отсутствует'}
              `)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY + 15) + "px")
              .classed("visible", true);
            }
          })
          .on("mousemove", function(event) {
            if (!isMobile()) {
              d3.select("#tooltip")
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY + 15) + "px");
            }
          })
          .on("mouseout", function() {
            if (!isMobile()) {
              d3.select("#tooltip").classed("visible", false);
            }
          });
      };

      if (sp.length === 2) {
        drawPerson(sp[0], -spouseSpacing / 2);
        drawPerson(sp[1], spouseSpacing / 2);
      } else {
        drawPerson(sp[0], 0);
      }
    });
  });

  if (firstRender) {
    const bounds = svg.node().getBBox();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const initial = d3.zoomIdentity.translate(svg.node().viewBox.baseVal.width / 2 - centerX, svg.node().viewBox.baseVal.height / 2 - centerY).scale(1);
    svg.call(d3.zoom().transform, initial);
    currentTransform = initial;
    firstRender = false;
  }
}

// Кнопки переключения деревьев
["Marinichev","Shapovalov","Guzovin","Ribasov"].forEach(name => {
  document.getElementById(`btn${name}`).onclick = () => {
    firstRender = true;
    render(trees[`tree${["Marinichev","Shapovalov","Guzovin","Ribasov"].indexOf(name)+1}`]);
  };
});
