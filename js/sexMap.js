function drawSexGrowthMap(data, year = currentYear) {

  // Comprovo que el GeoJSON dels barris estigui disponible
  if (!barrisGeoJSON || !barrisGeoJSON.features) return;

  // Netejo el mapa abans de dibuixar
  clearMap();

  const svg = d3.select("#map");
  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  // Defineixo la projecció utilitzant coordenades ja projectades
  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitSize([width, height], barrisGeoJSON);

  const path = d3.geoPath().projection(projection);

  // Filtrar només les unitats de tipus barri
  const barris = barrisGeoJSON.features.filter(d => d.properties.TIPUS_UA === "BARRI");

  // Separo les dades de 2020 i de l’any seleccionat
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  // Agrupo les dades per barri i sexe
  function mapPerBarriISexe(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri),
      d => {
        if (d.SEXE === 1 || d.SEXE === "1") return "Dona";
        if (d.SEXE === 2 || d.SEXE === "2") return "Home";
      }
    );
  }

  const map2020 = mapPerBarriISexe(data2020);
  const mapYear = mapPerBarriISexe(dataYear);

  // Calculo la diferència de creixement per sexe a cada barri
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);

    const dones2020 = map2020.get(nom)?.get("Dona") || 0;
    const homes2020 = map2020.get(nom)?.get("Home") || 0;
    const donesYear = mapYear.get(nom)?.get("Dona") || 0;
    const homesYear = mapYear.get(nom)?.get("Home") || 0;

    diffPerBarri.set(nom, (donesYear - dones2020) - (homesYear - homes2020));
  });

  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  // Definixo l’escala de color divergent
  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(t => d3.interpolateRdBu(1 - t));

  // Dibuixo els polígons dels barris
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => color(diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0))
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", (e, d) => {
      const nom = d.properties.NOM;
      const v = diffPerBarri.get(normalitzaNom(nom)) || 0;
      const txt = v > 0 ? `+${v} dones` : v < 0 ? `+${Math.abs(v)} homes` : "Equilibri";

      showTooltip(e, `<strong>${nom}</strong><br/>Increment per sexe (2020–${year}): ${txt}`);
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);

  // Afegeixo el títol del mapa
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment de població per sexe (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // Elimino possibles comptadors anteriors
  svg.selectAll(".sex-counter-group").remove();

  // Calculo els totals per sexe de l’any seleccionat
  const donesTotals = d3.sum(mapYear, d => d[1].get("Dona") || 0);
  const homesTotals = d3.sum(mapYear, d => d[1].get("Home") || 0);

  // Creo el grup de comptadors
  const counterGroup = svg.append("g")
    .attr("class", "sex-counter-group")
    .attr("transform", `translate(${width - 220 - 20}, 20)`);

  counterGroup.append("rect")
    .attr("width", 220)
    .attr("height", 95)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "white")
    .attr("opacity", 0.9)
    .attr("stroke", "#ccc");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 22)
    .text("Total dones")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 42)
    .text(donesTotals.toLocaleString())
    .style("font-size", "1.2rem")
    .style("fill", "#b30000")
    .style("font-weight", "bold");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 62)
    .text("Total homes")
    .style("font-size", "0.9rem")
    .style("font-weight", "bold");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 80)
    .text(homesTotals.toLocaleString())
    .style("font-size", "1.2rem")
    .style("fill", "#1f4ed8")
    .style("font-weight", "bold");

  // Elimino possibles llegendes anteriors
  svg.selectAll(".sex-legend-group").remove();

  const legendWidth = 180;
  const legendHeight = 12;

  // Creo el grup de la llegenda
  const legendGroup = svg.append("g")
    .attr("class", "sex-legend-group")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const defs = svg.append("defs");

  // Defineixo el gradient de la llegenda
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-sex")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(-maxAbs) },
      { offset: "50%", color: color(0) },
      { offset: "100%", color: color(maxAbs) }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 3)
    .attr("ry", 3)
    .style("fill", "url(#legend-gradient-sex)");

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .attr("text-anchor", "start")
    .text("Homes")
    .style("font-size", "0.75rem")
    .style("fill", "#1f4ed8")
    .style("font-weight", "500");

  legendGroup.append("text")
    .attr("x", legendWidth)
    .attr("y", -6)
    .attr("text-anchor", "end")
    .text("Dones")
    .style("font-size", "0.75rem")
    .style("fill", "#b30000")
    .style("font-weight", "500");
}