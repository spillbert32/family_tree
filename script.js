function render(treeData) {
  g.selectAll("*").remove();

  treeData.forEach((rootData, rootIndex) => {
    const root = d3.hierarchy(rootData, d => d.children);
    d3.tree().nodeSize([dx, dy])(root);
    const xOff = rootIndex * 1125;

    const linksData = root.links().filter(link => !link.target.data.isReference);

    g.selectAll(".link" + rootIndex)
      .data(linksData)
      .join(
        enter => enter.append("path")
          .attr("class", "link")
          .attr("d", d3.linkVertical()
            .x(d => d.x + xOff)
            .y(d => d.y))
          .each(function () {
            const length = this.getTotalLength();
            d3.select(this)
              .attr("stroke-dasharray", length)
              .attr("stroke-dashoffset", length)
              .transition()
              .duration(1500)
              .ease(d3.easeCubicOut)
              .attr("stroke-dashoffset", 0);
          }),
        update => update
          .attr("d", d3.linkVertical()
            .x(d => d.x + xOff)
            .y(d => d.y)),
        exit => exit.remove()
      );

    const nodes = g.selectAll(".node" + rootIndex)
      .data(root.descendants(), d => d.data.id)
      .join(enter => enter.append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x + xOff},${d.y})`)
        .on("click", (_, d) => {
          toggle(d.data);
          render(treeData);
        }));

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
            .attr("y", circleRadius + 20)
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
              Дата рождения: ${p.birthDate || 'неизвестно'}<br>
              Место рождения: ${p.birthPlace || 'неизвестно'}<br>
              Дата смерти: ${p.deathDate || 'неизвестно'}<br>
              Место смерти: ${p.deathPlace || 'неизвестно'}<br>
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

        el.append("text").attr("class", "surname").attr("y", -circleRadius - 18).attr("x", -spouseSpacing / 2).attr("text-anchor", "middle").text(surnameDisplay(a));
        el.append("text").attr("class", "surname").attr("y", -circleRadius - 18).attr("x", spouseSpacing / 2).attr("text-anchor", "middle").text(surnameDisplay(b));
        addMaiden(a, -spouseSpacing / 2);
        addMaiden(b, spouseSpacing / 2);
        el.append("text").attr("x", -spouseSpacing / 2).attr("y", circleRadius + 45).attr("text-anchor", "middle").text(a.name);
        if (a.patronymic) el.append("text").attr("x", -spouseSpacing / 2).attr("y", circleRadius + 60).attr("text-anchor", "middle").text(a.patronymic);
        el.append("text").attr("x", spouseSpacing / 2).attr("y", circleRadius + 45).attr("text-anchor", "middle").text(b.name);
        if (b.patronymic) el.append("text").attr("x", spouseSpacing / 2).attr("y", circleRadius + 60).attr("text-anchor", "middle").text(b.patronymic);
      } else {
        const a = sp[0];
        drawPerson(a, 0);
        el.append("text").attr("class", "surname").attr("y", -circleRadius - 18).attr("text-anchor", "middle").text(surnameDisplay(a));
        addMaiden(a, 0);
        el.append("text").attr("x", 0).attr("y", circleRadius + 45).attr("text-anchor", "middle").text(a.name);
        if (a.patronymic) el.append("text").attr("x", 0).attr("y", circleRadius + 60).attr("text-anchor", "middle").text(a.patronymic);
      }
    });
  });

  const gBounds = g.node().getBBox();
  const svgNode = svg.node();
  const svgWidth = svgNode.clientWidth;
  const svgHeight = svgNode.clientHeight;

  const translateX = (svgWidth - gBounds.width) / 2 - gBounds.x;
  const translateY = (svgHeight - gBounds.height) / 2 - gBounds.y;

  if (firstRender || !currentTransform) {
    const initialTransform = d3.zoomIdentity.translate(translateX, translateY).scale(1);
    svg.call(zoom.transform, initialTransform);
    currentTransform = initialTransform;
    firstRender = false;
  } else {
    svg.call(zoom.transform, currentTransform);
  }
}
