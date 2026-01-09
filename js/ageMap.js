// =========================================
// AGE GROUP GROWTH MAP – BCN
// Increment població per franges d'edat
// =========================================

let currentAgeGroup = "0-15";


// =========================
// CÀLCULS
// =========================

function filterDataByAgeGroup(data, ageGroup) {
  return data.filter(d => getAgeGroup(d.EDAT_1) === ageGroup);
}

function computeAgeGroupMaps(data, year, ageGroup) {
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  const data2020Group = filterDataByAgeGroup(data2020, ageGroup);
  const dataYearGroup = filterDataByAgeGroup(dataYear, ageGroup);

  const mapPerBarri = (dataset) => d3.rollup(
    dataset,
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  return {
    map2020: mapPerBarri(data2020Group),
    mapYear: mapPerBarri(dataYearGroup),
    total2020: d3.sum(data2020Group, d => +d.Valor),
    totalYear: d3.sum(dataYearGroup, d => +d.Valor)
  };
}

function computeAgeGroupDiffPerBarri(barris, map2020, mapYear) {
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

function drawAgeGroupMap(svg, barris, path, diffPerBarri, color, ageGroup, year) {
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const val = diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0;
      return color(val);
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
}


// =========================
// TÍTOL
// =========================

function drawAgeGroupTitle(svg, ageGroup, year) {
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment població ${ageGroup} anys (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");
}


// ===============================
// Selector franja d’edat (dalt dreta)
// ===============================
function drawAgeGroupSelector(svg, width, data, year) {
  svg.selectAll(".age-selector-group").remove();

  const selectorWidth = 190;
  const rightMargin = 20;
  const topMargin = 30;

  const selectorGroup = svg.append("g")
    .attr("class", "age-selector-group")
    .attr("transform", `translate(${width - selectorWidth - rightMargin}, ${topMargin})`);

  const options = ["0-15", "25-44", "45-64", "65+"];
  const rowHeight = 32;
  const boxHeight = 50 + options.length * rowHeight;

  selectorGroup.append("rect")
    .attr("width", selectorWidth)
    .attr("height", boxHeight)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  selectorGroup.append("text")
    .attr("x", 16)
    .attr("y", 28)
    .text("Franja d'edat")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const optionGroups = selectorGroup.selectAll(".age-option")
    .data(options)
    .enter()
    .append("g")
    .attr("class", "age-option")
    .attr("transform", (d, i) => `translate(16, ${50 + i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      currentAgeGroup = d;
      drawAgeGroupGrowthMap(data, currentYear, currentAgeGroup);
    });

  optionGroups.append("rect")
    .attr("x", -8)
    .attr("y", -16)
    .attr("width", selectorWidth - 32)
    .attr("height", 26)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === currentAgeGroup ? "#eef2ff" : "transparent");

  optionGroups.append("circle")
    .attr("cx", 0)
    .attr("cy", -2)
    .attr("r", 4.5)
    .attr("fill", d => d === currentAgeGroup ? "#1f4ed8" : "#ccc");

  optionGroups.append("text")
    .attr("x", 12)
    .attr("y", 2)
    .text(d => d + " anys")
    .style("font-size", "0.85rem")
    .style("fill", d => d === currentAgeGroup ? "#1f4ed8" : "#333")
    .style("font-weight", d => d === currentAgeGroup ? "bold" : "normal");
}

// =========================
// COMPTADOR FRANJA (MIG ESQUERRA)
// =========================

function drawAgeGroupCounter(svg, height, ageGroup, year, total2020, totalYear) {
  svg.selectAll(".age-counter-group").remove();

  const diff = totalYear - total2020;

  const boxWidth = 200;
  const boxHeight = 90;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const group = svg.append("g")
    .attr("class", "age-counter-group")
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
    .text(`Franja ${ageGroup} anys`)
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
    .text(`${diff >= 0 ? "+" : ""}${diff.toLocaleString()} persones`)
    .style("font-size", "1.3rem")
    .style("font-weight", "bold")
    .style("fill", diff >= 0 ? "#2563eb" : "#b91c1c");
}


// =========================
// LLEGENDA
// =========================

function drawAgeGroupLegend(svg, width, height, color, maxAbs) {
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
    .attr("x2", "100%");

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


// =========================
// FUNCIÓ PRINCIPAL
// =========================

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

  const barris = barrisGeoJSON.features.filter(
    d => d.properties.TIPUS_UA === "BARRI"
  );

  // Càlculs
  const { map2020, mapYear, total2020, totalYear } =
    computeAgeGroupMaps(data, year, ageGroup);

  const diffPerBarri =
    computeAgeGroupDiffPerBarri(barris, map2020, mapYear);

  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(d3.interpolateRdBu);

  // Dibuix
  drawAgeGroupMap(svg, barris, path, diffPerBarri, color, ageGroup, year);
  drawAgeGroupTitle(svg, ageGroup, year);
  drawAgeGroupSelector(svg, width, data, year);
  drawAgeGroupCounter(svg, height, ageGroup, year, total2020, totalYear);
  drawAgeGroupLegend(svg, width, height, color, maxAbs);
}