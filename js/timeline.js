// Referencio els controls de la línia temporal
const yearSlider = document.getElementById("year-slider");
const yearLabel = document.getElementById("year-label");
const playBtn = document.getElementById("play-btn");

// Comprovo que tots els elements existeixin abans d’afegir listeners
if (yearSlider && yearLabel && playBtn) {

  // Actualitzo l’any quan es mou el slider
  yearSlider.addEventListener("input", e => {
    currentYear = +e.target.value;
    yearLabel.textContent = currentYear;

    if (currentStep === "base") {
      drawPopulationGrowthMap(nacionalitatData, currentYear);

    } else if (currentStep === "sexe") {
      drawSexGrowthMap(nacionalitatData, currentYear);

    } else if (currentStep === "edat") {
      drawAgeGroupGrowthMap(ageData, currentYear, currentAgeGroup);

    } else if (currentStep === "regio") {
      drawRegionGrowthMap(nacionalitatData, currentYear);

    } else if (currentStep === "educacio") {
      drawEducationMap(educacioData, currentYear);

    } else if (currentStep === "preu") {
      drawPriceVariationMap(priceData, currentYear);
    }
  });

  // Activo o aturo la reproducció automàtica dels anys
  playBtn.addEventListener("click", () => {

    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
      playBtn.textContent = "▶️ Play";

    } else {
      playBtn.textContent = "⏸️ Pausa";

      playInterval = setInterval(() => {
        currentYear++;

        if (currentYear > 2025) {
          currentYear = 2020;
        }

        yearSlider.value = currentYear;
        yearLabel.textContent = currentYear;

        if (currentStep === "base") {
          drawPopulationGrowthMap(nacionalitatData, currentYear);

        } else if (currentStep === "sexe") {
          drawSexGrowthMap(nacionalitatData, currentYear);

        } else if (currentStep === "edat") {
          drawAgeGroupGrowthMap(ageData, currentYear, currentAgeGroup);

        } else if (currentStep === "regio") {
          drawRegionGrowthMap(nacionalitatData, currentYear);

        } else if (currentStep === "educacio") {
          drawEducationMap(educacioData, currentYear);

        } else if (currentStep === "preu") {
          drawPriceVariationMap(priceData, currentYear);
        }

      }, 1500);
    }
  });

}