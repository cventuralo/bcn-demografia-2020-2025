// ===============================
// Estat
// ===============================
let selectedEducation = null;
// let educationLabels = new Map(); // codi -> label
let topEducations = [];


// ===============================
// TOP nivells per volum total (2025)
// ===============================
function computeTopEducations(data) {
  const data2025 = data.filter(d => d.Data_Referencia.startsWith("2025"));

  const sumByEdu = d3.rollup(
    data2025,
    v => d3.sum(v, d => +d.Valor),
    d => d.NIV_EDUCA_esta
  );

  return Array.from(sumByEdu.entries())
    .sort((a, b) => b[1] - a[1])
    .map(d => d[0]);
}


// ===============================
// Selector de nivells educatius (UI dins mapa)
// ===============================
function drawEducationSelector(svg, width, educations) {
  svg.selectAll(".education-selector-group").remove();

  const selectorWidth = 260;
  const rightMargin = 20;

  const selectorGroup = svg.append("g")
    .attr("class", "education-selector-group")
    .attr("transform", `translate(${width - selectorWidth - rightMargin}, 30)`);

  const rowHeight = 28;
  const boxHeight = 50 + educations.length * rowHeight;

  selectorGroup.append("rect")
    .attr("width", selectorWidth)
    .attr("height", boxHeight)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  selectorGroup.append("text")
    .attr("x", 14)
    .attr("y", 28)
    .text("Nivell educatiu")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const options = selectorGroup.selectAll(".education-option")
    .data(educations)
    .enter()
    .append("g")
    .attr("class", "education-option")
    .attr("transform", (d, i) => `translate(14, ${50 + i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedEducation = d;
      drawEducationGrowthMap(educacioData, currentYear);
    });

  options.append("rect")
    .attr("x", -8)
    .attr("y", -14)
    .attr("width", selectorWidth - 20)
    .attr("height", 24)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === selectedEducation ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", -2)
    .attr("r", 4.5)
    .attr("fill", d => d === selectedEducation ? "#2563eb" : "#bbb");

  options.append("text")
    .attr("x", 12)
    .attr("y", 2)
    .text(d => getEducationLabel(d))
    .style("font-size", "0.78rem")
    .style("fill", d => d === selectedEducation ? "#2563eb" : "#333")
    .style("font-weight", d => d === selectedEducation ? "bold" : "normal");
}


// ===============================
// Llegenda (baix esquerra)
// ===============================
function drawEducationLegend(svg, height, color, maxAbs) {
  svg.selectAll(".education-legend-group").remove();

  const legendWidth = 160;
  const legendHeight = 10;

  const legendGroup = svg.append("g")
    .attr("class", "education-legend-group")
    .attr("transform", `translate(40, ${height - 40})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-education");

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
    .style("fill", "url(#legend-gradient-education)")
    .attr("rx", 4)
    .attr("ry", 4);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("← Menys població    Més població →")
    .style("font-size", "0.75rem")
    .style("fill", "#333");
}


// ===============================
// Comptador acumulat (esquerra)
// ===============================
function drawEducationCounter(svg, height, data, year) {
  svg.selectAll(".education-counter-group").remove();

  const data2020 = data.filter(d =>
    d.Data_Referencia.startsWith("2020") &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const total2020 = d3.sum(data2020, d => +d.Valor);
  const totalYear = d3.sum(dataYear, d => +d.Valor);

  const diff = totalYear - total2020;

  const boxWidth = 240;
  const boxHeight = 100;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const counterGroup = svg.append("g")
    .attr("class", "education-counter-group")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  counterGroup.append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  counterGroup.append("text")
    .attr("x", 14)
    .attr("y", 26)
    .text(getEducationLabel(selectedEducation))
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#333");

  counterGroup.append("text")
    .attr("x", 14)
    .attr("y", 44)
    .text(`2020 – ${year}`)
    .style("font-size", "0.75rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 14)
    .attr("y", 76)
    .text(`${diff >= 0 ? "+" : ""}${diff.toLocaleString()} persones`)
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", diff >= 0 ? "#2563eb" : "#b91c1c");
}


// ===============================
// Mapa principal per EDUCACIÓ
// ===============================
function drawEducationGrowthMap(data, year = currentYear) {
  if (!barrisGeoJSON || !barrisGeoJSON.features || !educationLabels.size) return;

  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  if (topEducations.length === 0) {
    topEducations = computeTopEducations(data);
    selectedEducation = topEducations[0];
  }

  const data2020 = data.filter(d =>
    d.Data_Referencia.startsWith("2020") &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const sumByBarri = (dataset) => d3.rollup(
    dataset,
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  const map2020 = sumByBarri(data2020);
  const mapYear = sumByBarri(dataYear);

  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const v2020 = map2020.get(nom) || 0;
    const vYear = mapYear.get(nom) || 0;
    diffPerBarri.set(nom, vYear - v2020);
  });

  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(d3.interpolateRdBu);

  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => color(diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0))
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>
         ${getEducationLabel(selectedEducation)}<br/>
         Canvi (2020–${year}): ${valor >= 0 ? "+" : ""}${valor.toLocaleString()}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Canvi de població per nivell educatiu (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  drawEducationSelector(svg, width, topEducations);
  drawEducationLegend(svg, height, color, maxAbs);
  drawEducationCounter(svg, height, data, year);
}