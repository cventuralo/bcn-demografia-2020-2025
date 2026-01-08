// ===============================
// Estat
// ===============================
let selectedRegion = null;
let topRegions = [];

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

  const selectorGroup = svg.append("g")
    .attr("class", "region-selector-group")
    .attr("transform", `translate(${width - 260}, 120)`);

  const boxHeight = 46 + regions.length * 30;

  selectorGroup.append("rect")
    .attr("width", 240)
    .attr("height", boxHeight)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.95);

  selectorGroup.append("text")
    .attr("x", 16)
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
    .attr("transform", (d, i) => `translate(16, ${52 + i * 30})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedRegion = d;
      drawRegionGrowthMap(nacionalitatData, currentYear);
    });

  options.append("rect")
    .attr("x", -10)
    .attr("y", -14)
    .attr("width", 220)
    .attr("height", 26)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === selectedRegion ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 5)
    .attr("fill", d => d === selectedRegion ? "#2563eb" : "#bbb");

  options.append("text")
    .attr("x", 14)
    .attr("y", 4)
    .text(d => d)
    .style("font-size", "0.85rem")
    .style("fill", d => d === selectedRegion ? "#2563eb" : "#333")
    .style("font-weight", d => d === selectedRegion ? "bold" : "normal");
}

// ===============================
// Mapa principal per REGIÓ
// ===============================
function drawRegionGrowthMap(data, year = currentYear) {
  if (!barrisGeoJSON || !barrisGeoJSON.features) return;

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
        `<strong>${nom}</strong><br/>${selectedRegion}<br/>Canvi (2020–${year}): ${txt}`
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
    .text(`Canvi de població per regió: ${selectedRegion} (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // =========================
  // Selector
  // =========================
  drawRegionSelector(svg, width, topRegions);
}