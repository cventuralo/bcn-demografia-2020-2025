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
      }, 1200);
    }
  });

}