// Defineixo l’estat inicial del pas actiu
let currentStep = "base";

// Registro el plugin ScrollTrigger de GSAP
gsap.registerPlugin(ScrollTrigger);

// Creo un ScrollTrigger per a cada bloc de text amb classe .step
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

// Activo visualment el bloc de text corresponent al pas actual
function setActive(step) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  step.classList.add("active");
}

// Actualitzo la visualització segons el pas actiu
function updateVis(state) {

  // Comprovo que el GeoJSON estigui carregat abans de dibuixar
  if (!barrisGeoJSON) {
    console.warn("Encara no s’ha carregat el GeoJSON dels barris");
    return;
  }

  currentStep = state;

  // Selecciono la visualització corresponent a cada estat
  switch (state) {

    case "base":
      drawPopulationGrowthMap(nacionalitatData, currentYear);
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

    case "educacio":
      drawEducationMap(educacioData, currentYear);
      break;

    case "preu":
      drawPriceVariationMap(priceData, currentYear);
      break;

    case "conclusio":
      clearMap();
      break;

    default:
      console.warn("Estat de visualització no reconegut:", state);
      break;
  }
}