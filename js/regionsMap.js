// ===============================
// Estat
// ===============================
let selectedRegion = null;
let topRegions = [];


// ===============================
// Utils
// ===============================
function getRegionLabel(code) {
  return regionLabels.get(code) || `Regió ${code}`;
}


// ===============================
// TOP 10 regions per creixement 2020–2025
// ===============================
function computeTopRegionsByGrowth(data) {
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const data2025 = data.filter(d => d.Data_Referencia.startsWith("2025"));

  const sumByRegion = (dataset) => d3.rollup(
    dataset,
    v => d3.sum(v, d => +d.Valor),
    d => d.NACIONALITAT_REGIO
  );

  const map2020 = sumByRegion(data2020);
  const map2025 = sumByRegion(data2025);

  const diffs = [];

  map2025.forEach((val2025, region) => {
    const val2020 = map2020.get(region) || 0;
    diffs.push({
      region,
      diff: val2025 - val2020
    });
  });

  return diffs
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10)
    .map(d => d.region);
}


// ===============================
// Selector de regions (dalt dreta, estret)
// ===============================
function drawRegionSelector(svg, width, regions) {
  svg.selectAll(".region-selector-group").remove();

  const selectorGroup = svg.append("g")
    .attr("class", "region-selector-group")
    .attr("transform", `translate(${width - 240}, 30)`); // 🔵 dalt dreta

  const boxHeight = 44 + regions.length * 28;

  selectorGroup.append("rect")
    .attr("width", 220)
    .attr("height", boxHeight)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  selectorGroup.append("text")
    .attr("x", 14)
    .attr("y", 26)
    .text("Regió d'origen")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const options = selectorGroup.selectAll(".region-option")
    .data(regions)
    .enter()
    .append("g")
    .attr("class", "region-option")
    .attr("transform", (d, i) => `translate(14, ${52 + i * 26})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedRegion = d;
      drawRegionGrowthMap(nacionalitatData, currentYear);
    });

  options.append("rect")
    .attr("x", -8)
    .attr("y", -14)
    .attr("width", 190)
    .attr("height", 24)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === selectedRegion ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", -2)
    .attr("r", 4)
    .attr("fill", d => d === selectedRegion ? "#2563eb" : "#bbb");

  options.append("text")
    .attr("x", 12)
    .attr("y", 2)
    .text(d => getRegionLabel(d))
    .style("font-size", "0.8rem")
    .style("fill", d => d === selectedRegion ? "#2563eb" : "#333")
    .style("font-weight", d => d === selectedRegion ? "bold" : "normal");
}


// ===============================
// Llegenda (baix esquerra)
// ===============================
function drawRegionLegend(svg, height, color, maxAbs) {
  svg.selectAll(".region-legend-group").remove();

  const legendWidth = 160;
  const legendHeight = 10;

  const legendGroup = svg.append("g")
    .attr("class", "region-legend-group")
    .attr("transform", `translate(40, ${height - 40})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-region");

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
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", "url(#legend-gradient-region)");

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("← Menys habitants    Més habitants →")
    .style("font-size", "0.75rem")
    .style("fill", "#333");
}


// ===============================
// Panell resum regió (dreta, sota selector)
// ===============================
function drawRegionSummaryBox(svg, width, regionLabel, totalDiff, year) {
  svg.selectAll(".region-summary-group").remove();

  const boxWidth = 220;

  const group = svg.append("g")
    .attr("class", "region-summary-group")
    .attr("transform", `translate(${width - boxWidth - 20}, 320)`);

  group.append("rect")
    .attr("width", boxWidth)
    .attr("height", 90)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  group.append("text")
    .attr("x", 14)
    .attr("y", 26)
    .text(regionLabel)
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#111");

  group.append("text")
    .attr("x", 14)
    .attr("y", 44)
    .text(`(2020–${year})`)
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  const valueText = totalDiff >= 0
    ? `+${totalDiff.toLocaleString()}`
    : totalDiff.toLocaleString();

  group.append("text")
    .attr("x", 14)
    .attr("y", 70)
    .text(valueText)
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", totalDiff >= 0 ? "#2563eb" : "#b91c1c");
}


// ===============================
// Mapa principal per REGIÓ
// ===============================
function drawRegionGrowthMap(data, year = currentYear) {
  if (!barrisGeoJSON || !barrisGeoJSON.features || !regionLabels.size) return;

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
  // Init topRegions una vegada
  // =========================
  if (topRegions.length === 0) {
    topRegions = computeTopRegionsByGrowth(data);
    selectedRegion = topRegions[0];
  }

  // =========================
  // Filtrar dades
  // =========================
  const data2020 = data.filter(d =>
    d.Data_Referencia.startsWith("2020") &&
    d.NACIONALITAT_REGIO === selectedRegion
  );

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NACIONALITAT_REGIO === selectedRegion
  );

  const sumByBarri = (dataset) => d3.rollup(
    dataset,
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  const map2020 = sumByBarri(data2020);
  const mapYear = sumByBarri(dataYear);

  // =========================
  // Diferència per barri
  // =========================
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

  // =========================
  // Dibuix mapa
  // =========================
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

      const txt = valor >= 0
        ? `+${valor.toLocaleString()}`
        : `${valor.toLocaleString()}`;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>${getRegionLabel(selectedRegion)}<br/>Canvi (2020–${year}): ${txt}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  // =========================
  // Títol net
  // =========================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Canvi de població per regió (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // =========================
  // Total acumulat regió
  // =========================
  const totalRegionDiff = d3.sum(Array.from(diffPerBarri.values()));

  // =========================
  // UI
  // =========================
  drawRegionSelector(svg, width, topRegions);
  drawRegionLegend(svg, height, color, maxAbs);
  drawRegionSummaryBox(svg, width, getRegionLabel(selectedRegion), totalRegionDiff, year);
}