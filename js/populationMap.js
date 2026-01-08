// =========================================
// POPULATION GROWTH MAP – BCN
// Increment població per barri + totals BCN
// =========================================


// =========================
// CÀLCULS
// =========================

function computePopulationMaps(data, year) {
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  const mapPerBarri = (dataset) => d3.rollup(
    dataset,
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  return {
    map2020: mapPerBarri(data2020),
    mapYear: mapPerBarri(dataYear),
    total2020: d3.sum(data2020, d => +d.Valor),
    totalYear: d3.sum(dataYear, d => +d.Valor)
  };
}


function computeDiffPerBarri(barris, map2020, mapYear) {
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const v2020 = map2020.get(nom) || 0;
    const vYear = mapYear.get(nom) || 0;
    diffPerBarri.set(nom, vYear - v2020);
  });

  return diffPerBarri;
}


// =========================
// DIBUIX MAPA
// =========================

function drawPopulationMap(svg, barris, path, diffPerBarri, color, year) {
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const val = diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0;
      return val > 0 ? color(val) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>
         Increment població (2020–${year}): ${valor >= 0 ? "+" : ""}${valor.toLocaleString()}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);
}


// =========================
// TÍTOL
// =========================

function drawPopulationTitle(svg, year) {
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment total de població per barri (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");
}


// =========================
// COMPTADOR TOTAL BCN (DALT DRETA)
// =========================

function drawTotalPopulationCounter(svg, width, totalYear) {
  svg.selectAll(".population-counter-group").remove();

  const group = svg.append("g")
    .attr("class", "population-counter-group")
    .attr("transform", `translate(${width - 240}, 20)`);

  group.append("rect")
    .attr("width", 220)
    .attr("height", 60)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "white")
    .attr("opacity", 0.95)
    .attr("stroke", "#ccc");

  group.append("text")
    .attr("x", 12)
    .attr("y", 22)
    .text("Total població BCN")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  group.append("text")
    .attr("x", 12)
    .attr("y", 44)
    .text(totalYear.toLocaleString())
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", "#111");
}


// =========================
// COMPTADOR INCREMENT BCN (ESQUERRA CENTRAT)
// =========================

function drawPopulationIncrementCounter(svg, height, year, total2020, totalYear) {
  svg.selectAll(".population-increment-counter-group").remove();

  const increment = totalYear - total2020;

  const boxWidth = 200;
  const boxHeight = 90;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const group = svg.append("g")
    .attr("class", "population-increment-counter-group")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  group.append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 14)
    .attr("ry", 14)
    .attr("fill", "white")
    .attr("stroke", "#ddd")
    .attr("opacity", 0.97);

  group.append("text")
    .attr("x", 16)
    .attr("y", 28)
    .text("Increment BCN")
    .style("font-size", "0.95rem")
    .style("font-weight", "bold")
    .style("fill", "#111");

  group.append("text")
    .attr("x", 16)
    .attr("y", 48)
    .text(`2020 – ${year}`)
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  group.append("text")
    .attr("x", 16)
    .attr("y", 78)
    .text(`${increment >= 0 ? "+" : ""}${increment.toLocaleString()} habitants`)
    .style("font-size", "1.3rem")
    .style("font-weight", "bold")
    .style("fill", increment >= 0 ? "#2563eb" : "#b91c1c");
}


// =========================
// LLEGENDA
// =========================

function drawPopulationLegend(svg, width, height, color, maxVal) {
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
    .attr("x2", "100%");

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


// =========================
// FUNCIÓ PRINCIPAL
// =========================

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

  const barris = barrisGeoJSON.features.filter(
    d => d.properties.TIPUS_UA === "BARRI"
  );

  // Càlculs
  const { map2020, mapYear, total2020, totalYear } = computePopulationMaps(data, year);
  const diffPerBarri = computeDiffPerBarri(barris, map2020, mapYear);

  const values = Array.from(diffPerBarri.values());
  const maxVal = d3.max(values) || 1;

  const color = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateBlues);

  // Dibuix
  drawPopulationMap(svg, barris, path, diffPerBarri, color, year);
  drawPopulationTitle(svg, year);
  drawTotalPopulationCounter(svg, width, totalYear);
  drawPopulationIncrementCounter(svg, height, year, total2020, totalYear);
  drawPopulationLegend(svg, width, height, color, maxVal);
}