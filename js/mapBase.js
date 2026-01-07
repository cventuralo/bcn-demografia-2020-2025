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
// Estat temporal
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
// Mapa base
// ======================
function drawBaseMap(data, year = currentYear) {
  if (!barrisGeoJSON || !barrisGeoJSON.features) {
    console.warn("⏳ barrisGeoJSON encara no carregat");
    return;
  }

  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  // Només barris reals
  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  // Agregació població per barri per any
  const poblacioPerBarri = d3.rollup(
    data.filter(d => d.Data_Referencia.startsWith(year.toString())),
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  const maxPoblacio = d3.max(Array.from(poblacioPerBarri.values())) || 0;

  const color = d3.scaleSequential()
    .domain([0, maxPoblacio])
    .interpolator(d3.interpolateBlues);

  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nomGeo = normalitzaNom(d.properties.NOM);
      const valor = poblacioPerBarri.get(nomGeo);
      return valor ? color(valor) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("stroke-width", 2)
        .attr("stroke", "#000");

      const nom = d.properties.NOM;
      const valor = poblacioPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(event, `<strong>${nom}</strong><br/>Població (${year}): ${valor.toLocaleString()}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("stroke-width", 0.5)
        .attr("stroke", "#333");

      hideTooltip();
    });

  // Títol
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Distribució de la població per barri (${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");
}

// ======================
// Impacte (stub)
// ======================
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

// ======================
// Clear
// ======================
function clearMap() {
  d3.select("#map").selectAll("*").remove();
}

// ======================
// Timeline controls
// ======================
const yearSlider = document.getElementById("year-slider");
const yearLabel = document.getElementById("year-label");
const playBtn = document.getElementById("play-btn");

if (yearSlider && yearLabel && playBtn) {

  yearSlider.addEventListener("input", e => {
    currentYear = +e.target.value;
    yearLabel.textContent = currentYear;
    drawBaseMap(nacionalitatData, currentYear);
  });

  playBtn.addEventListener("click", () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
      playBtn.textContent = "▶️ Play";
    } else {
      playBtn.textContent = "⏸ Pause";
      playInterval = setInterval(() => {
        currentYear++;
        if (currentYear > 2025) currentYear = 2020;

        yearSlider.value = currentYear;
        yearLabel.textContent = currentYear;
        drawBaseMap(nacionalitatData, currentYear);
      }, 1200);
    }
  });

}