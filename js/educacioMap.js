// ===============================
// Estat
// ===============================
let selectedEducation = null;


// ===============================
// Utils: wrap text en diverses línies (amb bon interlineat)
// ===============================
function wrapText(textSelection, maxWidth) {
  textSelection.each(function () {
    const text = d3.select(this);
    const words = text.text().split(/\s+/).reverse();
    let word;
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.25; // ems
    const y = text.attr("y");
    const dy = 0;

    let tspan = text.text(null)
      .append("tspan")
      .attr("x", text.attr("x"))
      .attr("y", y)
      .attr("dy", dy + "em");

    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > maxWidth) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan")
          .attr("x", text.attr("x"))
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}


// ===============================
// Selector de nivells educatius (DALT DRETA)
// ===============================
function drawEducationSelector(svg, width, educations) {
  svg.selectAll(".education-selector-group").remove();

  const selectorWidth = 270;
  const rightMargin = 30;
  const topMargin = 60;

  const rowHeight = 36;
  const boxHeight = 50 + educations.length * rowHeight;

  const selectorGroup = svg.append("g")
    .attr("class", "education-selector-group")
    .attr("transform", `translate(${width - selectorWidth - rightMargin}, ${topMargin})`);

  selectorGroup.append("rect")
    .attr("width", selectorWidth)
    .attr("height", boxHeight)
    .attr("rx", 14)
    .attr("ry", 14)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  selectorGroup.append("text")
    .attr("x", 18)
    .attr("y", 26)
    .text("Nivell educatiu")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#444");

  const options = selectorGroup.selectAll(".education-option")
    .data(educations)
    .enter()
    .append("g")
    .attr("class", "education-option")
    .attr("transform", (d, i) => `translate(18, ${44 + i * rowHeight})`)
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      selectedEducation = d;
      drawEducationMap(educacioData, currentYear);
    });

  options.append("rect")
    .attr("x", -8)
    .attr("y", -14)
    .attr("width", selectorWidth - 36)
    .attr("height", 28)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", d => d === selectedEducation ? "#e8efff" : "transparent");

  options.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 4.5)
    .attr("fill", d => d === selectedEducation ? "#2563eb" : "#bbb");

  const optionText = options.append("text")
    .attr("x", 14)
    .attr("y", 4)
    .text(d => getEducationLabel(d))
    .style("font-size", "0.78rem")
    .style("fill", d => d === selectedEducation ? "#2563eb" : "#333")
    .style("font-weight", d => d === selectedEducation ? "bold" : "normal");

  optionText.call(wrapText, selectorWidth - 70);
}


// ===============================
// Llegenda seqüencial (BAIX ESQUERRA)
// ===============================
function drawEducationLegend(svg, height, color, max) {
  svg.selectAll(".education-legend-group").remove();

  const legendWidth = 120;
  const legendHeight = 8;

  const legendGroup = svg.append("g")
    .attr("class", "education-legend-group")
    .attr("transform", `translate(40, ${height - 34})`);

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
// Counter total ciutat (CENTRE ESQUERRA)
// ===============================
function drawEducationCounter(svg, height, data, year) {
  svg.selectAll(".education-counter-group").remove();

  const dataYear = data.filter(d =>
    d.Data_Referencia.startsWith(year.toString()) &&
    d.NIV_EDUCA_esta === selectedEducation
  );

  const totalYear = d3.sum(dataYear, d => +d.Valor);

  const boxWidth = 280;
  const boxHeight = 120;
  const xPos = 40;
  const yPos = (height / 2) - (boxHeight / 2);

  const counterGroup = svg.append("g")
    .attr("class", "education-counter-group")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  counterGroup.append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 16)
    .attr("ry", 16)
    .attr("fill", "white")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.97);

  const titleText = counterGroup.append("text")
    .attr("x", 18)
    .attr("y", 28)
    .text(getEducationLabel(selectedEducation))
    .style("font-size", "0.9rem")
    .style("font-weight", "bold")
    .style("fill", "#333");

  titleText.call(wrapText, boxWidth - 36);

  counterGroup.append("text")
    .attr("x", 18)
    .attr("y", 60)
    .text(`${year}`)
    .style("font-size", "0.75rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 18)
    .attr("y", 96)
    .text(`${totalYear.toLocaleString()} persones`)
    .style("font-size", "1.45rem")
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

  if (!selectedEducation) {
    selectedEducation = Array.from(educationLabels.keys())[0];
  }

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

  svg.append("text")
    .attr("x", 30)
    .attr("y", 32)
    .text(`Població per nivell educatiu (${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  const allEducations = Array.from(educationLabels.keys());

  drawEducationSelector(svg, width, allEducations);
  drawEducationLegend(svg, height, color, max);
  drawEducationCounter(svg, height, data, year);
}