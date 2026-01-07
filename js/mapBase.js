function normalitzaNom(nom) {
  return nom
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^el |^la |^els |^les /, "")
    .replace(/\s+/g, " ")
    .trim();
}

function drawBaseMap(data) {
  if (!barrisGeoJSON || !barrisGeoJSON.features) {
    console.warn("⏳ barrisGeoJSON encara no carregat");
    return;
  }

  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  // 🔴 PROJECCIÓ CORRECTA PER EPSG:25831 (UTM)
  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  // 🔎 Només barris reals
  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  console.log("Barris reals:", barris.length);
  console.log("Exemple barri GEO:", barris[0].properties.NOM);
  console.log("Exemple barri GEO normalitzat:", normalitzaNom(barris[0].properties.NOM));
  console.log("Exemple CSV normalitzat:", normalitzaNom(data[0].Nom_Barri));

  // Agreguem població total per barri (any 2020)
  const poblacioPerBarri = d3.rollup(
    data.filter(d => d.Data_Referencia.startsWith("2020")),
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  const maxPoblacio = d3.max(Array.from(poblacioPerBarri.values()));

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
    .attr("stroke-width", 0.5);

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