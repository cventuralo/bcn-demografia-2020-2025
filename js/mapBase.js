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
let maxPoblacioGlobal = null; // 🔴 clau per escala fixa

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

// Function drawPopulationGrowthMap
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

  // ============================
  // 1. Dades 2020 i dades any actual
  // ============================
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  // ============================
  // 2. Població total per barri
  // ============================
  function mapPerBarri(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri)
    );
  }

  const map2020 = mapPerBarri(data2020);
  const mapYear = mapPerBarri(dataYear);

  // ============================
  // 3. Increment real per barri (2020 → year)
  // ============================
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);

    const val2020 = map2020.get(nom) || 0;
    const valYear = mapYear.get(nom) || 0;

    const increment = valYear - val2020;

    diffPerBarri.set(nom, increment);
  });

  // ============================
  // 4. Escala seqüencial coherent
  // ============================
  const values = Array.from(diffPerBarri.values());
  const maxVal = d3.max(values) || 1;

  const color = d3.scaleSequential()
    .domain([0, maxVal])
    .interpolator(d3.interpolateBlues);

  // ============================
  // 5. Dibuixar mapa
  // ============================
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nom = normalitzaNom(d.properties.NOM);
      const valor = diffPerBarri.get(nom) || 0;
      return valor > 0 ? color(valor) : "#eee";
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("stroke-width", 2)
        .attr("stroke", "#000");

      const nom = d.properties.NOM;
      const valor = diffPerBarri.get(normalitzaNom(nom)) || 0;

      const text = valor >= 0
        ? `+${valor.toLocaleString()} habitants`
        : `${valor.toLocaleString()} habitants`;

      showTooltip(
        event,
        `<strong>${nom}</strong><br/>Increment població (2020–${year}): ${text}`
      );
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

  // ============================
  // 6. Títol
  // ============================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment total de població per barri (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // ============================
  // 7. Llegenda
  // ============================
  const legendWidth = 220;
  const legendHeight = 12;

  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const legendScale = d3.scaleLinear()
    .domain([0, maxVal])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format("+,"));

  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient-pop)");

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient-pop");

  linearGradient.selectAll("stop")
    .data([
      { offset: "0%", color: color(0) },
      { offset: "100%", color: color(maxVal) }
    ])
    .enter()
    .append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("Increment població")
    .style("font-size", "0.8rem");

  // ============================
  // 8. Comptador global (TOTAL real any actual)
  // ============================
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
    if (currentStep === "base") {
      drawPopulationGrowthMap(nacionalitatData, currentYear);
    } else if (currentStep === "sexe") {
      drawSexGrowthMap(nacionalitatData, currentYear);
    }
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

        if (currentStep === "base") {
          drawBaseMap(nacionalitatData, currentYear);
        } else if (currentStep === "sexe") {
          drawSexGrowthMap(nacionalitatData, currentYear);
        }

      }, 1200);
    }
  });

}

function drawSexGrowthMap(data, year = currentYear) {
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

  // ============================
  // 1. Dades 2020 i dades any actual
  // ============================
  const data2020 = data.filter(d => d.Data_Referencia.startsWith("2020"));
  const dataYear = data.filter(d => d.Data_Referencia.startsWith(year.toString()));

  // ============================
  // 2. Agrupar per barri + sexe
  // ============================
  function mapPerBarriISexe(dataset) {
    return d3.rollup(
      dataset,
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri),
      d => {
        if (d.SEXE === 1 || d.SEXE === "1") return "Dona";
        if (d.SEXE === 2 || d.SEXE === "2") return "Home";
        return "Altres";
      }
    );
  }

  const map2020 = mapPerBarriISexe(data2020);
  const mapYear = mapPerBarriISexe(dataYear);

  // ============================
  // 3. Increment real per barri (2020 → year)
  // ============================
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);

    const dones2020 = map2020.get(nom)?.get("Dona") || 0;
    const homes2020 = map2020.get(nom)?.get("Home") || 0;

    const donesYear = mapYear.get(nom)?.get("Dona") || 0;
    const homesYear = mapYear.get(nom)?.get("Home") || 0;

    const incDones = donesYear - dones2020;
    const incHomes = homesYear - homes2020;

    // positiu = creixen més dones | negatiu = creixen més homes
    diffPerBarri.set(nom, incDones - incHomes);
  });

  // ============================
  // 4. Escala divergent coherent amb el mapa
  // ============================
  const values = Array.from(diffPerBarri.values());
  const maxAbs = d3.max(values.map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(t => d3.interpolateRdBu(1 - t)); // vermell = dones, blau = homes

  // ============================
  // 5. Dibuixar mapa
  // ============================
  svg.selectAll("path")
    .data(barris)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const nom = normalitzaNom(d.properties.NOM);
      const valor = diffPerBarri.get(nom) || 0;
      return color(valor);
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("stroke-width", 2)
        .attr("stroke", "#000");

      const nom = normalitzaNom(d.properties.NOM);
      const valor = diffPerBarri.get(nom) || 0;

      let text;
      if (valor > 0) {
        text = `+${valor.toLocaleString()} dones`;
      } else if (valor < 0) {
        text = `+${Math.abs(valor).toLocaleString()} homes`;
      } else {
        text = "Equilibri";
      }

      showTooltip(
        event,
        `<strong>${d.properties.NOM}</strong><br/>Increment per sexe (2020–${year}): ${text}`
      );
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

  // ============================
  // 6. Títol
  // ============================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Increment de població per sexe (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // ============================
  // 7. Llegenda (coherent amb diffPerBarri)
  // ============================
  const legendWidth = 220;
  const legendHeight = 12;

  const legendGroup = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

  const legendScale = d3.scaleLinear()
    .domain([-maxAbs, maxAbs])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format("+,"));

  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

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
    .style("fill", "url(#legend-gradient)");

  legendGroup.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);

  legendGroup.append("text")
    .attr("x", 0)
    .attr("y", -6)
    .text("← Més homes       Més dones →")
    .style("font-size", "0.8rem");

  // ============================
  // 8. Comptadors globals (TOTAL real de l'any actual)
  // ============================
  svg.selectAll(".sex-counter-group").remove();

  const donesTotals = d3.sum(mapYear, d => d[1].get("Dona") || 0);
  const homesTotals = d3.sum(mapYear, d => d[1].get("Home") || 0);

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
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 42)
    .text(donesTotals.toLocaleString())
    .style("font-size", "1.2rem")
    .style("font-weight", "bold")
    .style("fill", "#b30000");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 62)
    .text("Total homes")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 80)
    .text(homesTotals.toLocaleString())
    .style("font-size", "1.2rem")
    .style("font-weight", "bold")
    .style("fill", "#1f4ed8");
}