let currentTransform = null;
let isInitialRender = true;
let trees = {};

const svg = d3.select("svg").attr("pointer-events", "all");
const g = svg.append("g");

// Инициализируем zoom один раз!
const zoomBehavior = d3.zoom()
  .scaleExtent([0.5, 3])
  .on("zoom", e => {
    g.attr("transform", e.transform);
    currentTransform = e.transform;
  });

svg.call(zoomBehavior);

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
    isInitialRender = false;
  });

// ... (buildTree и toggle функции без изменений) ...

function render(treeData) {
  g.selectAll("*").remove();

  const dx = 300, dy = 300, spouseSpacing = 120, circleRadius = 28;

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
            .attr("y", circleRadius + 16)
            .attr("text-anchor", "middle")
            .text(`(дев. ${p.maidenSurname})`);
        }
      };

      if (sp.length === 2) {
        const [a, b] = sp;
        el.append("circle").attr("class", a.gender === "male" ? maleClass : femaleClass).attr("r", circleRadius).attr("cx", -spouseSpacing / 2);
        el.append("circle").attr("class", b.gender === "male" ? maleClass : femaleClass).attr("r", circleRadius).attr("cx", spouseSpacing / 2);
        el.append("text").attr("class", "surname").attr("y", -circleRadius - 14).attr("x", -spouseSpacing / 2).attr("text-anchor", "middle").text(surnameDisplay(a));
        el.append("text").attr("class", "surname").attr("y", -circleRadius - 14).attr("x", spouseSpacing / 2).attr("text-anchor", "middle").text(surnameDisplay(b));
        addMaiden(a, -spouseSpacing / 2);
        addMaiden(b, spouseSpacing / 2);
        el.append("text").attr("x", -spouseSpacing / 2).attr("y", circleRadius + 36).attr("text-anchor", "middle").text(a.name);
        if (a.patronymic) el.append("text").attr("x", -spouseSpacing / 2).attr("y", circleRadius + 52).attr("text-anchor", "middle").text(a.patronymic);
        el.append("text").attr("x", spouseSpacing / 2).attr("y", circleRadius + 36).attr("text-anchor", "middle").text(b.name);
        if (b.patronymic) el.append("text").attr("x", spouseSpacing / 2).attr("y", circleRadius + 52).attr("text-anchor", "middle").text(b.patronymic);
      } else {
        const a = sp[0];
        el.append("circle").attr("class", a.gender === "male" ? maleClass : femaleClass).attr("r", circleRadius);
        el.append("text").attr("class", "surname").attr("y", -circleRadius - 14).attr("text-anchor", "middle").text(surnameDisplay(a));
        addMaiden(a, 0);
        el.append("text").attr("x", 0).attr("y", circleRadius + 36).attr("text-anchor", "middle").text(a.name);
        if (a.patronymic) el.append("text").attr("x", 0).attr("y", circleRadius + 52).attr("text-anchor", "middle").text(a.patronymic);
      }
    });
  });

  if (isInitialRender) {
    const gBox = g.node().getBBox();
    const svgWidth = +svg.attr("width");
    const svgHeight = +svg.attr("height");

    const centerX = (svgWidth - gBox.width) / 2 - gBox.x;
    const centerY = (svgHeight - gBox.height) / 2 - gBox.y;

    const transform = d3.zoomIdentity.translate(centerX, centerY);
    g.attr("transform", transform);
    svg.call(zoomBehavior.transform, transform);

    currentTransform = transform;
  } else {
    g.attr("transform", currentTransform || d3.zoomIdentity);
  }
}

// Кнопки выбора семей
document.getElementById("btnMarinichev").addEventListener("click", () => {
  currentTransform = null;
  isInitialRender = true;
  render(trees.tree1);
  isInitialRender = false;
});

document.getElementById("btnShapovalov").addEventListener("click", () => {
  currentTransform = null;
  isInitialRender = true;
  render(trees.tree2);
  isInitialRender = false;
});

document.getElementById("btnGuzovin").addEventListener("click", () => {
  currentTransform = null;
  isInitialRender = true;
  render(trees.tree3);
  isInitialRender = false;
});

document.getElementById("btnRibasov").addEventListener("click", () => {
  currentTransform = null;
  isInitialRender = true;
  render(trees.tree4);
  isInitialRender = false;
});
