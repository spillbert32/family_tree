let treeData = {};
let currentTransform = null;
let firstRender = true;

function isMobile() {
  return window.innerWidth <= 768;
}

fetch("db.json")
  .then((response) => response.json())
  .then((data) => {
    treeData = data;
    loadTree("marinichev");
  });

function loadTree(name) {
  if (!treeData[name]) return;
  const tree = buildTree(treeData[name]);
  render(tree);
}

function buildTree(data) {
  const map = new Map();
  data.forEach((person) => map.set(person.id, { ...person, children: [] }));
  const roots = [];

  data.forEach((person) => {
    person.parents?.forEach((parentId) => {
      const parent = map.get(parentId);
      if (parent) {
        parent.children.push(map.get(person.id));
      }
    });
  });

  data.forEach((person) => {
    if (!person.parents || person.parents.length === 0) {
      roots.push(map.get(person.id));
    }
  });

  return roots;
}

function render(treeData) {
  const svg = d3.select("svg");
  svg.selectAll("*").remove();

  const g = svg.append("g");

  const zoom = d3.zoom()
    .scaleExtent([0.5, isMobile() ? 4 : 3])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
      currentTransform = event.transform;
    });

  svg.call(zoom);

  const dx = isMobile() ? 400 : 300;
  const dy = isMobile() ? 400 : 300;
  const spouseSpacing = isMobile() ? 180 : 120;
  const circleRadius = isMobile() ? 50 : 28;

  treeData.forEach((rootData, rootIndex) => {
    const root = d3.hierarchy(rootData, d => d.children);
    d3.tree().nodeSize([dx, dy])(root);
    const xOff = rootIndex * (isMobile() ? dx + 200 : dx * 3);

    const nodes = g.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.x + xOff},${d.y})`);

    nodes.append("circle")
      .attr("r", circleRadius)
      .attr("fill", "steelblue")
      .on("mouseover", function (event, d) {
        if (!isMobile()) {
          const p = d.data;
          const tooltip = d3.select("#tooltip");
          tooltip.html(`
            <strong>${p.surname || ""} ${p.name || ""}</strong><br>
            ${p.patronymic ? p.patronymic + "<br>" : ""}
            Год рождения: ${p.birthYear || "неизвестно"}<br>
            ${p.deathYear ? 'Год смерти: ' + p.deathYear + '<br>' : ''}
            ${p.location ? p.location + "<br>" : ""}
            ${p.description || ""}
          `)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY + 15) + "px")
          .classed("visible", true);
        }
      })
      .on("mouseout", function () {
        d3.select("#tooltip").classed("visible", false);
      })
      .on("click", function (event, d) {
        if (isMobile()) {
          alert(
            `${d.data.surname || ""} ${d.data.name || ""}\n` +
            (d.data.patronymic ? d.data.patronymic + "\n" : "") +
            `Год рождения: ${d.data.birthYear || "неизвестно"}\n` +
            (d.data.deathYear ? "Год смерти: " + d.data.deathYear + "\n" : "") +
            (d.data.location ? d.data.location + "\n" : "") +
            (d.data.description || "")
          );
        }
      });

    nodes.append("text")
      .attr("dy", ".35em")
      .attr("x", 0)
      .attr("text-anchor", "middle")
      .text(d => d.data.name || "")
      .style("fill", "white");
  });

  if (firstRender) {
    const size = svg.node().viewBox.baseVal || { width: window.innerWidth, height: window.innerHeight };
    const scale = isMobile() ? 1.5 : 1;
    const translateX = size.width / 2;
    const translateY = size.height / 4;
    const initial = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    svg.call(zoom.transform, initial);
    currentTransform = initial;
    firstRender = false;
  }
}
