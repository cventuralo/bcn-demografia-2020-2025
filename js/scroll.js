gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray(".step").forEach(step => {
  ScrollTrigger.create({
    trigger: step,
    start: "top center",
    onEnter: () => {
      setActive(step);
      updateVis(step.dataset.step);
    },
    onEnterBack: () => {
      setActive(step);
      updateVis(step.dataset.step);
    }
  });
});

function setActive(step) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  step.classList.add("active");
}

function updateVis(state) {
  if (!barrisGeoJSON) {
    console.warn("⏳ Esperant GeoJSON...");
    return;
  }

  switch (state) {
    case "base":
      drawBaseMap(nacionalitatData, currentYear);
      break;
    case "impacte":
      drawImpactMap(edatFrangesData);
      break;
    case "sexe":
      drawSexGrowthMap(nacionalitatData, currentYear);
      break;
    case "fluxos":
      drawFlows(nacionalitatData);
      break;
    case "edat":
      drawAgeStructure(edatFrangesData);
      break;
    case "micro":
      drawCensusMicro(edatExactaData);
      break;
    case "educacio":
      drawEducation(educacioData);
      break;
    case "conclusio":
      clearMap();
      break;
  }
}