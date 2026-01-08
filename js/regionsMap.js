// ===============================
// Estat
// ===============================
let selectedRegion = null;
let topRegions = [];
let regionLabels = new Map(); // codi -> nom CA


// ===============================
// Utils
// ===============================
function getRegionLabel(code) {
  return regionLabels.get(code) || `Regió ${code}`;
}


// ===============================
// Carregar labels de regions (pad_dimensions)
// ===============================
function loadRegionLabels(dimensionsData) {
  regionLabels.clear();

  dimensionsData.forEach(d => {
    const dimDesc = (d.Desc_Dimensio || "").trim();
    const code = (d.Codi_Valor || "").trim();
    const label = (d.Desc_Valor_CA || "").trim();

    if (dimDesc === "NACIONALITAT_REGIO" && code !== "") {
      regionLabels.set(code, label);
    }
  });

  console.log("🟢 Regions carregades:", regionLabels.size);
  console.log("🟢 Exemple regions:", Array.from(regionLabels.entries()).slice(0, 5));
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
// Selector de regions (UI dins mapa)
// ===============================
function drawRegionSelector(svg, width, regions) {
  svg.selectAll(".region-selector-group").remove();

  const selectorWidth = 190;
  const rightMargin = 20;

  const selectorGroup = svg.append("g")
    .attr("class", "region-selector-group")
    .attr("transform", `translate(${width - selectorWidth - rightMargin}, 30)`);

  const rowHeight = 28;
  const boxHeight = 50 + regions.length * rowHeight;

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
    .text("Regió d'origen")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const options = selectorGroup.selectAll(".region-option")
    .data(regions)
    .enter()
    .append("g")
    .attr("class", "region-option")
    .attr("transform", (d, i) => `translate(14, ${50 + i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedRegion = d;
      drawRegionGrowthMap(nacionalitatData, currentYear);
    });

  options.append("rect")
    .attr("x", -8)
    .attr("y", -14)
    .attr("width", selectorWidth - 20)
    .attr("height", 24)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === selectedRegion ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", -2)
    .attr("r", 4.5)
    .attr("fill", d => d === selectedRegion ? "#2563eb" : "#bbb");

  options.append("text")
    .attr("x", 12)
    .attr("y", 2)
    .text(d => getRegionLabel(d))
    .style("font-size", "0.82rem")
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
    .style("fill", "url(#legend-gradient-region)")
    .attr("rx", 4)
    .attr("ry", 4);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("← Menys habitants    Més habitants →")
    .style("font-size", "0.75rem")
    .style("fill", "#333");
}


// ===============================
// Comptador acumulat per regió (dreta)
// ===============================
function drawRegionCounter(svg, height, data, year) {
  svg.selectAll(".region-counter-group").remove();

  const data2020 = data.filter(d =>
    d.Data_Referencia.startsWith("2020") &&
    d.NACIONALITAT_REGIO === selectedRegion
  );

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NACIONALITAT_REGIO === selectedRegion
  );

  const total2020 = d3.sum(data2020, d => +d.Valor);
  const totalYear = d3.sum(dataYear, d => +d.Valor);

  const diff = totalYear - total2020;

  // 📍 Posició: esquerra + centrat verticalment
  const boxWidth = 200;
  const boxHeight = 90;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const counterGroup = svg.append("g")
    .attr("class", "region-counter-group")
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
    .text(getRegionLabel(selectedRegion))
    .style("font-size", "0.95rem")
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
    .attr("y", 72)
    .text(`${diff >= 0 ? "+" : ""}${diff.toLocaleString()} habitants`)
    .style("font-size", "1.3rem")
    .style("font-weight", "bold")
    .style("fill", diff >= 0 ? "#2563eb" : "#b91c1c");
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

  if (topRegions.length === 0) {
    topRegions = computeTopRegionsByGrowth(data);
    selectedRegion = topRegions[0];
  }

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
        `<strong>${nom}</strong><br/>${getRegionLabel(selectedRegion)}<br/>Canvi (2020–${year}): ${valor >= 0 ? "+" : ""}${valor.toLocaleString()}`
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
    .text(`Canvi de població per regió (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  drawRegionSelector(svg, width, topRegions);
  drawRegionLegend(svg, height, color, maxAbs);
  drawRegionCounter(svg, height, data, year);
}