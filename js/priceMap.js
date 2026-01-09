// =========================================
// PRICE VARIATION MAP – BCN
// Variació % preu mig m2 per barri + totals BCN
// =========================================


// =========================
// CÀLCULS
// =========================

function computePriceMaps(data, year) {
  const yearKey = year.toString();
  const baseYearKey = "2020";

  const dataBarri = data.filter(d => d["Tipo de territorio"] === "Barri");

  const mapPerBarri = (yearCol) => d3.rollup(
    dataBarri,
    v => {
      const val = v[0][yearCol];
      return val ? +val : 0;
    },
    d => normalitzaNom(d.Territorio)
  );

  const map2020 = mapPerBarri(baseYearKey);
  const mapYear = mapPerBarri(yearKey);

  const bcnRow = data.find(d => d.Territorio === "Barcelona" && d["Tipo de territorio"] === "Municipi");
  const total2020 = bcnRow ? +bcnRow[baseYearKey] : 0;
  const totalYear = bcnRow ? +bcnRow[yearKey] : 0;

  return { map2020, mapYear, total2020, totalYear };
}


function computePriceDiffPerBarri(barris, map2020, mapYear) {
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);
    const v2020 = map2020.get(nom) || 0;
    const vYear = mapYear.get(nom) || 0;

    if (v2020 > 0) {
      const pct = ((vYear - v2020) / v2020) * 100;
      diffPerBarri.set(nom, pct);
    } else {
      diffPerBarri.set(nom, 0);
    }
  });

  return diffPerBarri;
}


// =========================
// DIBUIX MAPA
// =========================

function drawPriceMap(svg, barris, path, diffPerBarri, color, year) {
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const val = diffPerBarri.get(normalitzaNom(d.properties.NOM)) || 0;
      return color(val);
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>
         Variació preu m² (2020–${year}): ${valor >= 0 ? "+" : ""}${valor.toFixed(1)} %`
      );
    })
    .on("mousemove", e => {
      tooltip
        .style("left", (e.pageX + 10) + "px")
        .style("top", (e.pageY + 10) + "px");
    })
    .on("mouseout", hideTooltip);
}


// =========================
// TÍTOL
// =========================

function drawPriceTitle(svg, year) {
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Variació del preu mig €/m² per barri (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");
}


// =========================
// COMPTADOR TOTAL BCN (DALT DRETA)
// =========================

function drawTotalPriceCounter(svg, width, totalYear) {
  svg.selectAll(".price-counter-group").remove();

  const group = svg.append("g")
    .attr("class", "price-counter-group")
    .attr("transform", `translate(${width - 260}, 20)`);

  group.append("rect")
    .attr("width", 240)
    .attr("height", 70)
    .attr("rx", 12)
    .attr("ry", 12)
    .attr("fill", "white")
    .attr("opacity", 0.95)
    .attr("stroke", "#ccc");

  group.append("text")
    .attr("x", 14)
    .attr("y", 26)
    .text("Preu mig BCN")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  group.append("text")
    .attr("x", 14)
    .attr("y", 50)
    .text(`${totalYear.toLocaleString()} €/m²`)
    .style("font-size", "1.4rem")
    .style("font-weight", "bold")
    .style("fill", "#111");
}


// =========================
// COMPTADOR VARIACIÓ BCN (ESQUERRA CENTRAT)
// =========================

function drawPriceVariationCounter(svg, height, year, total2020, totalYear) {
  svg.selectAll(".price-variation-counter-group").remove();

  const pct = total2020 > 0 ? ((totalYear - total2020) / total2020) * 100 : 0;

  const boxWidth = 240;
  const boxHeight = 100;
  const xPos = 30;
  const yPos = (height / 2) - (boxHeight / 2);

  const group = svg.append("g")
    .attr("class", "price-variation-counter-group")
    .attr("transform", `translate(${xPos}, ${yPos})`);

  group.append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 14)
    .attr("ry", 14)
    .attr("fill", "white")
    .attr("stroke", "#ddd")
    .attr("opacity", 0.97);

  group.append("text")
    .attr("x", 16)
    .attr("y", 30)
    .text("Variació BCN")
    .style("font-size", "0.95rem")
    .style("font-weight", "bold")
    .style("fill", "#111");

  group.append("text")
    .attr("x", 16)
    .attr("y", 52)
    .text(`2020 – ${year}`)
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  group.append("text")
    .attr("x", 16)
    .attr("y", 84)
    .text(`${pct >= 0 ? "+" : ""}${pct.toFixed(1)} %`)
    .style("font-size", "1.5rem")
    .style("font-weight", "bold")
    .style("fill", pct >= 0 ? "#2563eb" : "#b91c1c");
}


// =========================
// LLEGENDA
// =========================

function drawPriceLegend(svg, width, height, color, maxAbs) {
  svg.selectAll(".price-legend-group").remove();

  const legendWidth = 200;
  const legendHeight = 12;

  const legendGroup = svg.append("g")
    .attr("class", "price-legend-group")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-price")
    .attr("x1", "0%")
    .attr("x2", "100%");

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
    .style("fill", "url(#legend-gradient-price)")
    .attr("rx", 3)
    .attr("ry", 3);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .text(`-${maxAbs.toFixed(0)} %`)
    .style("font-size", "0.7rem")
    .style("fill", "#555");

  legendGroup.append("text")
    .attr("x", legendWidth)
    .attr("y", -5)
    .attr("text-anchor", "end")
    .text(`+${maxAbs.toFixed(0)} %`)
    .style("font-size", "0.7rem")
    .style("fill", "#555");

  legendGroup.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .text("Variació preu €/m²")
    .style("font-size", "0.75rem")
    .style("fill", "#444");
}


// =========================
// FUNCIÓ PRINCIPAL
// =========================

function drawPriceVariationMap(data, year = currentYear) {
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

  const barris = barrisGeoJSON.features.filter(
    d => d.properties.TIPUS_UA === "BARRI"
  );

  // Càlculs
  const { map2020, mapYear, total2020, totalYear } = computePriceMaps(data, year);
  const diffPerBarri = computePriceDiffPerBarri(barris, map2020, mapYear);

  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(d3.interpolateRdBu);

  // Dibuix
  drawPriceMap(svg, barris, path, diffPerBarri, color, year);
  drawPriceTitle(svg, year);
  drawTotalPriceCounter(svg, width, totalYear);
  drawPriceVariationCounter(svg, height, year, total2020, totalYear);
  drawPriceLegend(svg, width, height, color, maxAbs);
}