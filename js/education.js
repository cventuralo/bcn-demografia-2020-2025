function drawEducation(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Distribució del nivell educatiu per barri")
    .style("font-size", "18px");
}