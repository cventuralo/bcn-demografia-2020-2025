// ======================
// Utils
// ======================
function normalitzaNom(nom) {
  return nom
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^el |^la |^els |^les /, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ======================
// Estat temporal global
// ======================
let currentYear = 2020;
let playInterval = null;

// ======================
// Tooltip
// ======================
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
    .duration(150)
    .style("opacity", 1);
}

function hideTooltip() {
  tooltip.transition().duration(150).style("opacity", 0);
}

// ======================
// Clear mapa
// ======================
function clearMap() {
  d3.select("#map").selectAll("*").remove();
}

function getAgeGroup(age) {
  age = +age;
  if (age >= 0 && age <= 15) return "0-15";
  if (age >= 25 && age <= 44) return "25-44";
  if (age >= 45 && age <= 64) return "45-64";
  if (age >= 65) return "65+";
  return null;
}