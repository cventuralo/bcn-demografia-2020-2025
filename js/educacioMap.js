// ===============================
// Estat
// ===============================
let selectedEducation = null;


// ===============================
// Selector de nivells educatius (BAIX ESQUERRA)
// ===============================
function drawEducationSelector(svg, width, height, educations) {
  svg.selectAll(".education-selector-group").remove();

  const selectorWidth = 240;
  const leftMargin = 30;
  const bottomMargin = 30;

  const rowHeight = 24;
  const boxHeight = 46 + educations.length * rowHeight;

  const selectorGroup = svg.append("g")
    .attr("class", "education-selector-group")
    .attr(
      "transform",
      `translate(${leftMargin}, ${height - boxHeight - bottomMargin})`
    );

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
    .attr("y", 24)
    .text("Nivell educatiu")
    .style("font-size", "0.85rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const options = selectorGroup.selectAll(".education-option")
    .data(educations)
    .enter()
    .append("g")
    .attr("class", "education-option")
    .attr("transform", (d, i) => `translate(14, ${40 + i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedEducation = d;
      drawEducationMap(educacioData, currentYear);
    });

  options.append("rect")
    .attr("x", -8)
    .attr("y", -12)
    .attr("width", selectorWidth - 20)
    .attr("height", 20)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", d => d === selectedEducation ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", -2)
    .attr("r", 4)
    .attr("fill", d => d === selectedEducation ? "#2563eb" : "#bbb");

  options.append("text")
    .attr("x", 12)
    .attr("y", 2)
    .text(d => getEducationLabel(d))
    .style("font-size", "0.75rem")
    .style("fill", d => d === selectedEducation ? "#2563eb" : "#333")
    .style("font-weight", d => d === selectedEducation ? "bold" : "normal");
}


// ===============================
// Llegenda seqüencial (a sobre del selector)
// ===============================
function drawEducationLegend(svg, height, color, max) {
  svg.selectAll(".education-legend-group").remove();

  const legendWidth = 120;
  const legendHeight = 8;

  const leftMargin = 30;
  const bottomMargin = 30;

  const legendGroup = svg.append("g")
    .attr("class", "education-legend-group")
    .attr("transform", `translate(${leftMargin}, ${height - bottomMargin - 10})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-education");

  linearGradient.selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d * max));

  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient-education)")
    .attr("rx", 4)
    .attr("ry", 4);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("Menys → Més")
    .style("font-size", "0.7rem")
    .style("fill", "#333");
}


// ===============================
// Counter total ciutat (BAIX DRETA)
// ===============================
function drawEducationCounter(svg, width, height, data, year) {
  svg.selectAll(".education-counter-group").remove();

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const totalYear = d3.sum(dataYear, d => +d.Valor);

  const boxWidth = 350;
  const boxHeight = 90;
  const rightMargin = 70;
  const bottomMargin = 30;

  const xPos = width - boxWidth - rightMargin;
  const yPos = height - boxHeight - bottomMargin;

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
    .style("font-size", "0.85rem")
    .style("font-weight", "bold")
    .style("fill", "#333");

  counterGroup.append("text")
    .attr("x", 14)
    .attr("y", 44)
    .text(`${year}`)
    .style("font-size", "0.75rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 14)
    .attr("y", 72)
    .text(`${totalYear.toLocaleString()} persones`)
    .style("font-size", "1.35rem")
    .style("font-weight", "bold")
    .style("fill", "#2563eb");
}


// ===============================
// Mapa principal EDUCACIÓ (VALOR ABSOLUT)
// ===============================
function drawEducationMap(data, year = currentYear) {
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

  // inicialitzar nivell educatiu si cal
  if (!selectedEducation) {
    selectedEducation = Array.from(educationLabels.keys())[0];
  }

  // dades filtrades per any + nivell educatiu
  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const sumByBarri = d3.rollup(
    dataYear,
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  const values = Array.from(sumByBarri.values());
  const max = d3.max(values) || 1;

  const color = d3.scaleSequential()
    .domain([0, max])
    .interpolator(d3.interpolateBlues);

  // dibuixar barris
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => color(sumByBarri.get(normalitzaNom(d.properties.NOM)) || 0))
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = sumByBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>
         ${getEducationLabel(selectedEducation)}<br/>
         ${year}: ${valor.toLocaleString()} persones`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  // títol
  svg.append("text")
    .attr("x", 30)
    .attr("y", 32)
    .text(`Població per nivell educatiu (${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  const allEducations = Array.from(educationLabels.keys());

  drawEducationSelector(svg, width, height, allEducations);
  drawEducationLegend(svg, height, color, max);
  drawEducationCounter(svg, width, height, data, year);
}