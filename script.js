// Основная логика построения дерева и показа tooltip

// Загружаем JSON с данными
fetch('db.json')
  .then(res => res.json())
  .then(data => {
    // Собираем все люди из всех фамилий в один массив
    const people = [];
    for (const family in data) {
      people.push(...data[family]);
    }
    
    // Пример простого построения: создадим svg и кружки для каждого человека
    const width = document.getElementById('tree-container').clientWidth;
    const height = document.getElementById('tree-container').clientHeight;

    const svg = d3.select("#tree-container")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Расположим людей в линию с равными интервалами по горизонтали
    const margin = 50;
    const spacing = (width - 2 * margin) / (people.length - 1);

    // Для простоты: каждый человек — узел с координатами x,y
    people.forEach((person, i) => {
      person.x = margin + i * spacing;
      person.y = height / 2;
    });

    // Добавляем кружки
    const nodes = svg.selectAll("circle")
      .data(people)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 20)
      .attr("fill", d => d.gender === "male" ? "#4a90e2" : "#e24a7a")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");

    // Добавим подписи под кружками
    svg.selectAll("text")
      .data(people)
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text(d => d.name);

    // Работа с тултипом
    const tooltip = d3.select("#tooltip");

    nodes
      .on("mouseover", (event, d) => {
        let html = `
          <strong>${d.name} ${d.patronymic || ""} ${d.surname}</strong><br/>
          Год рождения: ${d.birthYear || "неизвестен"}<br/>
          Пол: ${d.gender || "неизвестен"}<br/>
          ${d.maidenSurname ? `Девичья фамилия: ${d.maidenSurname}<br/>` : ""}
          Родители: ${d.parents && d.parents.length ? d.parents.join(", ") : "неизвестны"}
        `;
        tooltip.html(html)
          .style("display", "block");
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY + 15) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });
  })
  .catch(err => {
    console.error("Ошибка при загрузке данных:", err);
  });
