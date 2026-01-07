function drawBaseMap(data) {
  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  // 🔴 PROJECCIÓ CORRECTA PER EPSG:25831 (UTM)
  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  // DEBUG (ens ajuda a verificar que hi ha dades)
  console.log("Polígons:", barrisGeoJSON.features.length);
  console.log("Exemple propietats:", barrisGeoJSON.features[0].properties);

  // Agreguem població total per barri (any 2020)
  const poblacioPerBarri = d3.rollup(
    data.filter(d => d.Data_Referencia.startsWith("2020")),
    v => d3.sum(v, d => +d.Valor),
    d => d.Nom_Barri
  );

  console.log("Exemple barri CSV:", data[0].Nom_Barri);

  const maxPoblacio = d3.max(Array.from(poblacioPerBarri.values()));

  const color = d3.scaleSequential()
    .domain([0, maxPoblacio])
    .interpolator(d3.interpolateBlues);

  svg.selectAll("path")
    .data(barrisGeoJSON.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nom = d.properties.NOM;
      const valor = poblacioPerBarri.get(nom);
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
}

function clearMap() {
  d3.select("#map").selectAll("*").remove();
}