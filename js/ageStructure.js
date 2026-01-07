function drawAgeStructure(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Estructura d’edat per franges als barris")
    .style("font-size", "18px");
}