function drawCensusMicro(data) {
  clearMap();
  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 40)
    .attr("y", 50)
    .text("Microanàlisi per secció censal (edat exacta)")
    .style("font-size", "18px");
}