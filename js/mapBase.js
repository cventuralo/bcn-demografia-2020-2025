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

// ======================
// Mapa base (ACUMULATIU + ESCALA FIXA)
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

  // ======================
  // ACUMULACIÓ 2020 → year
  // ======================
  const poblacioPerBarri = d3.rollup(
    data.filter(d => {
      const any = +d.Data_Referencia.slice(0, 4);
      return any >= 2020 && any <= year;
    }),
    v => d3.sum(v, d => +d.Valor),
    d => normalitzaNom(d.Nom_Barri)
  );

  // ======================
  // MÀXIM GLOBAL (una sola vegada)
  // ======================
  if (!maxPoblacioGlobal) {
    const poblacioTotalGlobal = d3.rollup(
      data.filter(d => {
        const any = +d.Data_Referencia.slice(0, 4);
        return any >= 2020 && any <= 2025;
      }),
      v => d3.sum(v, d => +d.Valor),
      d => normalitzaNom(d.Nom_Barri)
    );

    maxPoblacioGlobal = d3.max(Array.from(poblacioTotalGlobal.values()));
    console.log("🔵 Max població global 2020–2025:", maxPoblacioGlobal);
  }

  // ======================
  // Escala de color FIXA
  // ======================
  const color = d3.scaleSequential()
    .domain([0, maxPoblacioGlobal])
    .interpolator(d3.interpolateBlues);

  // ======================
  // Dibuix
  // ======================
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

      showTooltip(event, `<strong>${nom}</strong><br/>Població acumulada (2020–${year}): ${valor.toLocaleString()}`);
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

  // ======================
  // Títol
  // ======================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Població acumulada per barri (2020–${year})`)
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
    if (currentStep === "base") {
      drawBaseMap(nacionalitatData, currentYear);
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
  // 1. Filtrar dades 2020 → year
  // ============================
  const dataFiltrada = data.filter(d => {
    const any = +d.Data_Referencia.slice(0, 4);
    return any >= 2020 && any <= year;
  });

  // ============================
  // 2. Calcular acumulació per barri
  // ============================
  const diffPerBarri = new Map();

  barris.forEach(b => {
    const nom = normalitzaNom(b.properties.NOM);

    const donesAcumulades = d3.sum(
      dataFiltrada.filter(d =>
        normalitzaNom(d.Nom_Barri) === nom &&
        (d.SEXE === 1 || d.SEXE === "1")
      ),
      d => +d.Valor
    );

    const homesAcumulats = d3.sum(
      dataFiltrada.filter(d =>
        normalitzaNom(d.Nom_Barri) === nom &&
        (d.SEXE === 2 || d.SEXE === "2")
      ),
      d => +d.Valor
    );

    // positiu = més dones | negatiu = més homes
    diffPerBarri.set(nom, donesAcumulades - homesAcumulats);
  });

  // ============================
  // 3. Escala divergent CORRECTA
  // ============================
  const maxAbs = d3.max(Array.from(diffPerBarri.values()).map(v => Math.abs(v))) || 1;

  const color = d3.scaleDiverging()
    .domain([-maxAbs, 0, maxAbs])
    .interpolator(t => d3.interpolateRdBu(1 - t)); // invertim perquè vermell = dones, blau = homes

  // ============================
  // 4. Dibuixar mapa
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
        `<strong>${d.properties.NOM}</strong><br/>Balanç acumulat per sexe (2020–${year}): ${text}`
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
  // 5. Títol
  // ============================
  svg.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .text(`Balanç acumulat per sexe (2020–${year})`)
    .style("font-size", "18px")
    .style("font-weight", "bold");

  // ============================
  // 6. Llegenda (baix a la dreta)
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
  // 7. COMPTADORS dins l’SVG (top-right)
  // ============================
  // esborrem si ja existeixen
  svg.selectAll(".sex-counter-group").remove();

  const marginRight = 20;
  const marginTop = 20;

  const counterGroup = svg.append("g")
    .attr("class", "sex-counter-group")
    .attr("transform", `translate(${width - 220 - marginRight}, ${marginTop})`);

  const donesTotals = d3.sum(
    dataFiltrada.filter(d => d.SEXE === 1 || d.SEXE === "1"),
    d => +d.Valor
  );

  const homesTotals = d3.sum(
    dataFiltrada.filter(d => d.SEXE === 2 || d.SEXE === "2"),
    d => +d.Valor
  );

  // fons
  counterGroup.append("rect")
    .attr("width", 220)
    .attr("height", 80)
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "white")
    .attr("opacity", 0.85)
    .attr("stroke", "#ccc");

  // Dones
  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 22)
    .text("Dones acumulades")
    .style("font-size", "0.8rem")
    .style("fill", "#666");

  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 42)
    .text(donesTotals.toLocaleString())
    .style("font-size", "1.2rem")
    .style("font-weight", "bold")
    .style("fill", "#b30000");

  // Homes
  counterGroup.append("text")
    .attr("x", 12)
    .attr("y", 62)
    .text("Homes acumulats")
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