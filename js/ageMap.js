let currentAgeGroup = "0-15";

function drawAgeGroupGrowthMap(data, year = currentYear, ageGroup = currentAgeGroup) {
  if (!barrisGeoJSON || !barrisGeoJSON.features) {
    console.warn("⏳ barrisGeoJSON encara no carregat");
    return;
  }

  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);
  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  // ============================
  // 1. Filtrar dades
  // ============================
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  function filterByAgeGroup(dataset) {
    return dataset.filter(d => getAgeGroup(d.EDAT_1) === ageGroup);
  }

  const data2020Group = filterByAgeGroup(data2020);
  const dataYearGroup = filterByAgeGroup(dataYear);

  function mapPerBarri(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri)
    );
  }

  const map2020 = mapPerBarri(data2020Group);
  const mapYear = mapPerBarri(dataYearGroup);

  // ============================
  // 2. Diferència per barri
  // ============================
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const val2020 = map2020.get(nom) || 0;
    const valYear = mapYear.get(nom) || 0;
    diffPerBarri.set(nom, valYear - val2020);
  });

  // ============================
  // 3. Escala
  // ============================
  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(d3.interpolateRdBu);

  // ============================
  // 4. Dibuix mapa
  // ============================
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nom = normalitzaNom(d.properties.NOM);
      const valor = diffPerBarri.get(nom) || 0;
      return color(valor);
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      const text = valor >= 0
        ? `+${valor.toLocaleString()} persones`
        : `${valor.toLocaleString()} persones`;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>Franja ${ageGroup} (2020–${year}): ${text}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  // ============================
  // 5. Títol
  // ============================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment població ${ageGroup} anys (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // ============================
  // 6. Selector franja DINS del mapa
  // ============================
  svg.selectAll(".age-selector-group").remove();

  const selectorGroup = svg.append("g")
    .attr("class", "age-selector-group")
    .attr("transform", `translate(${width - 220}, 60)`);

  selectorGroup.append("rect")
    .attr("width", 200)
    .attr("height", 150)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", "white")
    .attr("opacity", 0.95)
    .attr("stroke", "#ccc");

  const options = ["0-15", "25-44", "45-64", "65+"];

  const optionGroups = selectorGroup.selectAll(".age-option")
    .data(options)
    .enter()
    .append("g")
    .attr("class", "age-option")
    .attr("transform", (d, i) => `translate(16, ${44 + i * 30})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      currentAgeGroup = d;
      drawAgeGroupGrowthMap(data, currentYear, currentAgeGroup);
    });

  // Fons highlight
  optionGroups.append("rect")
    .attr("x", -8)
    .attr("y", -16)
    .attr("width", 190)
    .attr("height", 26)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", d => d === currentAgeGroup ? "#eef2ff" : "transparent");

  // Punt indicador
  optionGroups.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 4)
    .attr("fill", d => d === currentAgeGroup ? "#1f4ed8" : "#ccc");

  // Text
  optionGroups.append("text")
    .attr("x", 10)
    .attr("y", 4)
    .text(d => d + " anys")
    .style("font-size", "0.9rem")
    .style("fill", d => d === currentAgeGroup ? "#1f4ed8" : "#444")
    .style("font-weight", d => d === currentAgeGroup ? "bold" : "normal");


    selectorGroup.append("text")
    .attr("x", 16)
    .attr("y", 24)
    .text("Franja d'edat")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  // ============================
  // 7. Llegenda
  // ============================
  svg.selectAll(".age-legend-group").remove();

  const legendWidth = 160;
  const legendHeight = 12;

  const legendGroup = svg.append("g")
    .attr("class", "age-legend-group")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-age")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(-maxAbs) },
      { offset: "50%", color: color(0) },
      { offset: "100%", color: color(maxAbs) }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 3)
    .attr("ry", 3)
    .style("fill", "url(#legend-gradient-age)");

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("↓ Disminució")
    .style("font-size", "0.7rem")
    .style("fill", "#555");

  legendGroup.append("text")
    .attr("x", legendWidth)
    .attr("y", -6)
    .attr("text-anchor", "end")
    .text("↑ Increment")
    .style("font-size", "0.7rem")
    .style("fill", "#555");
}