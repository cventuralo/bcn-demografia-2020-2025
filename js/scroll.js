let currentStep = "base";

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

  currentStep = state;

  switch (state) {
    case "base":
      drawPopulationGrowthMap(nacionalitatData, currentYear);
      break;
    case "impacte":
      drawSexGrowthMap(nacionalitatData, currentYear);
      break;
    case "sexe":
      drawSexGrowthMap(nacionalitatData, currentYear);
      break;
    case "regio":
      drawRegionGrowthMap(nacionalitatData, currentYear);
      break;
    case "edat":
      drawAgeGroupGrowthMap(ageData, currentYear, currentAgeGroup);
      break;  
    case "micro":
      drawCensusMicro(nacionalitatData);
      break;
    case "educacio":
      drawEducationMap(educacioData, currentYear);
      break;
    case "conclusio":
      clearMap();
      break;
  }
}