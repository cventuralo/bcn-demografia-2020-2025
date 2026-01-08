function drawPopulationGrowthMap(data, year = currentYear) {
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

  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  function mapPerBarri(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri)
    );
  }

  const map2020 = mapPerBarri(data2020);
  const mapYear = mapPerBarri(dataYear);

  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const val2020 = map2020.get(nom) || 0;
    const valYear = mapYear.get(nom) || 0;
    diffPerBarri.set(nom, valYear - val2020);
  });

  const values = Array.from(diffPerBarri.values());
  const maxVal = d3.max(values) || 1;

  const color = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateBlues);

  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const valor = diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0;
      return valor > 0 ? color(valor) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>Increment població (2020–${year}): +${valor.toLocaleString()}`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment total de població per barri (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // Comptador global
  svg.selectAll(".population-counter-group").remove();

  const totalPoblacio = d3.sum(mapYear, d => d[1] || 0);

  const counterGroup = svg.append("g")
    .attr("class", "population-counter-group")
    .attr("transform", `translate(${width - 240}, 20)`);

  counterGroup.append("rect")
    .attr("width", 220)
    .attr("height", 60)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "white")
    .attr("opacity", 0.9)
    .attr("stroke", "#ccc");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 22)
    .text("Total població BCN")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 44)
    .text(totalPoblacio.toLocaleString())
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", "#111");
}