// Normalitzo els noms dels barris per facilitar comparacions
function normalitzaNom(nom) {
  return nom
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^el |^la |^els |^les /, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Defineixo l’any actual de la visualització
let currentYear = 2020;

// Defineixo l’interval per a la reproducció automàtica
let playInterval = null;

// Creo el contenidor del tooltip
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

// Mostro el tooltip amb el contingut indicat
function showTooltip(event, html) {
  tooltip
    .html(html)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY + 10) + "px")
    .transition()
    .duration(150)
    .style("opacity", 1);
}

// Amago el tooltip
function hideTooltip() {
  tooltip
    .transition()
    .duration(150)
    .style("opacity", 0);
}

// Esborro tot el contingut del mapa
function clearMap() {
  d3.select("#map").selectAll("*").remove();
}

// Assigno una franja d’edat a partir d’un valor numèric
function getAgeGroup(age) {
  age = +age;

  if (age >= 0 && age <= 15) return "0-15";
  if (age >= 16 && age <= 24) return "16-24";
  if (age >= 25 && age <= 44) return "25-44";
  if (age >= 45 && age <= 64) return "45-64";
  if (age >= 65) return "65+";

  return null;
}

// Emmagatzemo els labels de nivell educatiu
let educationLabels = new Map();

// Carrego els labels d’educació a partir de les dimensions
function loadEducationLabels(dimensionsData) {
  educationLabels.clear();

  dimensionsData.forEach(d => {
    const dimDesc = (d.Desc_Dimensio || "").trim();
    const code = (d.Codi_Valor || "").trim();
    const label = (d.Desc_Valor_CA || "").trim();

    if (dimDesc === "NIV_EDUCA_esta" && code !== "") {
      educationLabels.set(code, label);
    }
  });

  console.log("Labels d’educació carregats:", educationLabels.size);
}

// Retorno el label complet del nivell educatiu
function getEducationLabel(code) {
  return educationLabels.get(code) || `Nivell ${code}`;
}

// Retorno un label abreujat del nivell educatiu
function getEducationShortLabel(code) {
  switch (code) {
    case "1":
      return "Sense estudis";
    case "2":
      return "Primària";
    case "3":
      return "ESO / FPI";
    case "4":
      return "Batxillerat / CFGM";
    case "5":
      return "Universitaris / CFGS";
    case "6":
      return "No consta";
    default:
      return code;
  }
}