function drawCensusMicro(data) {
  clearMap();

  const svg = d3.select("#map");

  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text("Microanàlisi per secció censal (pendent d'implementar)")
    .style("font-size", "18px")
    .style("font-weight", "bold");
}