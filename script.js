let currentTransform = null;
let trees = {};
let firstRender = true;

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

function render(treeData) {
  const svg = d3.select("svg").attr("pointer-events", "all");
  svg.selectAll("*").remove();

  const g = svg.append("g").attr("transform", currentTransform || "translate(100,50)");

  const zoom = d3.zoom()
    .scaleExtent([0.5, 3])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
      currentTransform = event.transform;
    });

  svg.call(zoom);

  // Увеличиваем параметры в 1.25 раза:
  const dx = 300, dy = 300;
  const spouseSpacing = 120 * 1.25; // 150
  const circleRadius = 28 * 1.25;   // 35

  treeData.forEach((rootData, rootIndex) => {
    const root = d3.hierarchy(rootData, d => d.children);
    d3.tree().nodeSize([dx, dy])(root);
    const xOff = rootIndex * 900;

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
          toggle(d.data);
          render(treeData);
        })
      );

    nodes.each(function(d) {
      if (d.data.isReference) return;

      const el = d3.select(this);
      const sp = d.data.spouses;

      const canExpand = (d.data.children && d.data.children.length > 0) ||
                        (d.data._children && d.data._children.length > 0);

      const maleClass = canExpand ? "expandable male" : "not-expandable male";
      const femaleClass = canExpand ? "expandable female" : "not-expandable female";

      const surnameDisplay = p =>
        p.gender === "female" && p.spouses?.length && p.maidenSurname && p.maidenSurname !== p.surname
          ? p.surname
          : p.surname;

      const addMaiden = (p, x) => {
        if (p.gender === "female" && p.spouses?.length && p.maidenSurname && p.maidenSurname !== p.surname) {
          el.append("text")
            .attr("class", "maiden")
            .attr("x", x)
            .attr("y", circleRadius + 20)  // 16 * 1.25 = 20
            .attr("text-anchor", "middle")
            .text(`(дев. ${p.maidenSurname})`);
        }
      };

      const drawPerson = (p, cx) => {
        el.append("circle")
          .attr("class", p.gender === "male" ? maleClass : femaleClass)
          .attr("r", circleRadius)
          .attr("cx", cx)
          .on("mouseover", function(event) {
            const tooltip = d3.select("#tooltip");
            const content = `
              <strong>${p.surname} ${p.name} ${p.patronymic || ''}</strong><br>
              Год рождения: ${p.birthYear || 'неизвестно'}<br>
              ${p.deathYear ? 'Год смерти: ' + p.deathYear + '<br>' : ''}
              Место жительства: ${p.location || 'неизвестно'}<br>
              Описание: ${p.description || 'Описание отсутствует'}
            `;
            tooltip.html(content)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY + 15) + "px")
              .classed("visible", true);
          })
          .on("mousemove", function(event) {
            d3.select("#tooltip")
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY + 15) + "px");
          })
          .on("mouseout", function() {
            d3.select("#tooltip").classed("visible", false);
          });
      };

      if (sp.length === 2) {
        const [a, b] = sp;
        drawPerson(a, -spouseSpacing / 2);
        drawPerson(b, spouseSpacing / 2);

        el.append("text")
          .attr("class", "surname")
          .attr("y", -circleRadius - 18)  // -14 * 1.25 = -17.5 округлил до -18
          .attr("x", -spouseSpacing / 2)
          .attr("text-anchor", "middle")
          .text(a.surname);

        el.append("text")
          .attr("x", -spouseSpacing / 2)
          .attr("y", circleRadius + 45)  // 36 * 1.25 = 45
          .attr("text-anchor", "middle")
          .text(a.name);

        if (a.patronymic) {
          el.append("text")
            .attr("x", -spouseSpacing / 2)
            .attr("y", circleRadius + 65)  // 52 * 1.25 = 65
            .attr("text-anchor", "middle")
            .text(a.patronymic);
        }
        addMaiden(a, -spouseSpacing / 2);

        el.append("text")
          .attr("class", "surname")
          .attr("y", -circleRadius - 18)
          .attr("x", spouseSpacing / 2)
          .attr("text-anchor", "middle")
          .text(b.surname);

        el.append("text")
          .attr("x", spouseSpacing / 2)
          .attr("y", circleRadius + 45)
          .attr("text-anchor", "middle")
          .text(b.name);

        if (b.patronymic) {
          el.append("text")
            .attr("x", spouseSpacing / 2)
            .attr("y", circleRadius + 65)
            .attr("text-anchor", "middle")
            .text(b.patronymic);
        }
        addMaiden(b, spouseSpacing / 2);
      } else if (sp.length === 1) {
        const a = sp[0];
        drawPerson(a, 0);

        el.append("text")
          .attr("class", "surname")
          .attr("y", -circleRadius - 18)
          .attr("text-anchor", "middle")
          .text(a.surname);

        el.append("text")
          .attr("y", circleRadius + 45)
          .attr("text-anchor", "middle")
          .text(a.name);

        if (a.patronymic) {
          el.append("text")
            .attr("y", circleRadius + 65)
            .attr("text-anchor", "middle")
            .text(a.patronymic);
        }
        addMaiden(a, 0);
      }
    });
  });
  if (firstRender) {
    const svgNode = svg.node();
    const svgWidth = svgNode.clientWidth || svgNode.getBoundingClientRect().width;
    const svgHeight = svgNode.clientHeight || svgNode.getBoundingClientRect().height;
    const gBounds = g.node().getBBox();

    const translateX = svgWidth / 2 - (gBounds.x + gBounds.width / 2);
    const translateY = svgHeight / 2 - (gBounds.y + gBounds.height / 2);
    const initialTransform = d3.zoomIdentity.translate(translateX, translateY).scale(1);

    svg.transition().duration(750).call(d3.zoom().transform, initialTransform);
    currentTransform = initialTransform;
    firstRender = false;
  }
}

// Кнопки переключения
document.getElementById("btnMarinichev").onclick = () => {
  firstRender = true;
  currentTransform = null;
  render(trees.tree1);
};

document.getElementById("btnShapovalov").onclick = () => {
  firstRender = true;
  currentTransform = null;
  render(trees.tree2);
};

document.getElementById("btnGuzovin").onclick = () => {
  firstRender = true;
  currentTransform = null;
  render(trees.tree3);
};

document.getElementById("btnRibasov").onclick = () => {
  firstRender = true;
  currentTransform = null;
  render(trees.tree4);
};
