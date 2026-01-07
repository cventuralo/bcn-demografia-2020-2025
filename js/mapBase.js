function drawBaseMap(data) {
  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const projection = d3.geoMercator()
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  // Agreguem població total per barri (any 2020)
  const poblacioPerBarri = d3.rollup(
    data.filter(d => d.Data_Referencia.startsWith("2020")),
    v => d3.sum(v, d => +d.Valor),
    d => d.Nom_Barri
  );

  const maxPoblacio = d3.max(Array.from(poblacioPerBarri.values()));

  const color = d3.scaleSequential()
    .domain([0, maxPoblacio])
    .interpolator(d3.interpolateBlues);

  svg.selectAll("path")
    .data(barrisGeoJSON.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nom = d.properties.NOM || d.properties.NOM_BARRI;
      const valor = poblacioPerBarri.get(nom);
      return valor ? color(valor) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke-width", 2);

      const nom = d.properties.NOM || d.properties.NOM_BARRI;
      const valor = poblacioPerBarri.get(nom) || 0;

      showTooltip(event, `<strong>${nom}</strong><br/>Població (2020): ${valor}`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke-width", 0.5);
      hideTooltip();
    });

  // Títol
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text("Distribució de la població per barri (2020)")
    .style("font-size", "18px")
    .style("font-weight", "bold");
}


function drawImpactMap(data) {
  clearMap();

  const svg = d3.select("#map");
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text("Impacte de la pandèmia (pendent d'implementar)")
    .style("font-size", "18px")
    .style("font-weight", "bold");
}


function clearMap() {
  d3.select("#map").selectAll("*").remove();
}


// ===== TOOLTIP =====

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("padding", "8px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("pointer-events", "none")
  .style("opacity", 0);

function showTooltip(event, html) {
  tooltip
    .html(html)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY + 10) + "px")
    .transition()
    .duration(200)
    .style("opacity", 1);
}

function hideTooltip() {
  tooltip.transition().duration(200).style("opacity", 0);
}