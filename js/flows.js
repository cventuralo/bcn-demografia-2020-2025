function drawFlows(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Fluxos migratoris per origen geogràfic")
    .style("font-size", "18px");

  // Aquí després dibuixaràs els arcs
}