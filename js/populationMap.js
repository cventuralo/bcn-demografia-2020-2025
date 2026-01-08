function drawPopulationGrowthMap(data, year = currentYear) {
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

  // =========================
  // Dades 2020 i any actual
  // =========================
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  function mapPerBarri(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri)
    );
  }

  const map2020 = mapPerBarri(data2020);
  const mapYear = mapPerBarri(dataYear);

  // =========================
  // Increment per barri
  // =========================
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const val2020 = map2020.get(nom) || 0;
    const valYear = mapYear.get(nom) || 0;
    diffPerBarri.set(nom, valYear - val2020);
  });

  const values = Array.from(diffPerBarri.values());
  const maxVal = d3.max(values) || 1;

  const color = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateBlues);

  // =========================
  // Dibuix mapa
  // =========================
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const valor = diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0;
      return valor > 0 ? color(valor) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>Increment població (2020–${year}): ${valor >= 0 ? "+" : ""}${valor.toLocaleString()}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  // =========================
  // Títol
  // =========================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment total de població per barri (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // =========================
  // Comptador TOTAL BCN (dalt dreta)  ✅ NO TOCAT
  // =========================
  svg.selectAll(".population-counter-group").remove();

  const totalPoblacio = d3.sum(mapYear, d => d[1] || 0);

  const counterGroup = svg.append("g")
    .attr("class", "population-counter-group")
    .attr("transform", `translate(${width - 240}, 20)`);

  counterGroup.append("rect")
    .attr("width", 220)
    .attr("height", 60)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "white")
    .attr("opacity", 0.95)
    .attr("stroke", "#ccc");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 22)
    .text("Total població BCN")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 44)
    .text(totalPoblacio.toLocaleString())
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", "#111");

  // =========================
  // Comptador INCREMENT BCN (esquerra centrat)  🟢 CORRECTE: totalYear - total2020
  // =========================
  svg.selectAll(".population-increment-counter-group").remove();

  const total2020 = d3.sum(data2020, d => +d.Valor);
  const totalYear = d3.sum(dataYear, d => +d.Valor);
  const incrementBCN = totalYear - total2020;

  const boxWidth = 240;
  const boxHeight = 95;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const incGroup = svg.append("g")
    .attr("class", "population-increment-counter-group")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  incGroup.append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 14)
    .attr("ry", 14)
    .attr("fill", "white")
    .attr("stroke", "#ddd")
    .attr("opacity", 0.97);

  incGroup.append("text")
    .attr("x", 16)
    .attr("y", 28)
    .text("Increment BCN")
    .style("font-size", "0.95rem")
    .style("font-weight", "bold")
    .style("fill", "#111");

  incGroup.append("text")
    .attr("x", 16)
    .attr("y", 48)
    .text(`2020 – ${year}`)
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  incGroup.append("text")
    .attr("x", 16)
    .attr("y", 78)
    .text(`${incrementBCN >= 0 ? "+" : ""}${incrementBCN.toLocaleString()} habitants`)
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", incrementBCN >= 0 ? "#2563eb" : "#b91c1c");

  // =========================
  // Llegenda
  // =========================
  svg.selectAll(".population-legend-group").remove();

  const legendWidth = 180;
  const legendHeight = 12;

  const legendGroup = svg.append("g")
    .attr("class", "population-legend-group")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-pop")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(0) },
      { offset: "100%", color: color(maxVal) }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient-pop)")
    .attr("rx", 3)
    .attr("ry", 3);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .text("0")
    .style("font-size", "0.7rem")
    .style("fill", "#555");

  legendGroup.append("text")
    .attr("x", legendWidth)
    .attr("y", -5)
    .attr("text-anchor", "end")
    .text(`+${maxVal.toLocaleString()}`)
    .style("font-size", "0.7rem")
    .style("fill", "#555");

  legendGroup.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .text("Increment població")
    .style("font-size", "0.75rem")
    .style("fill", "#444");
}