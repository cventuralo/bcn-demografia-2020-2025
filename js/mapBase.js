function drawBaseMap(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Mapa base de població per barri (2020)")
    .style("font-size", "18px");
}

function drawImpactMap(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Variació poblacional després de la pandèmia")
    .style("font-size", "18px");
}

function clearMap() {
  d3.select("#map").selectAll("*").remove();
}