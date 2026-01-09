let edatFrangesData;
let ageData = [];
let nacionalitatData;
let educacioData;
let priceData;
let barrisGeoJSON;
let dimensionsData;

Promise.all([
  d3.csv("data/2020-2025_pad_mdba_sexe_edat-q.csv"),
  d3.csv("data/2020-2025_pad_mdbas_edat-1.csv"),
  d3.csv("data/2020-2025_pad_mdb_nacionalitat-regio_sexe.csv"),
  d3.csv("data/2020-2025_pad_mdb_niv-educa-esta_edat-lloc-naix.csv"),
  d3.csv("data/pad_dimensions.csv"),
  d3.csv("data/2012_2025_preu_mig_m2.csv"),
  d3.json("data/0301100100_UNITATS_ADM_POLIGONS.json")
]).then(([edatFranges, ageCSV, nacionalitat, educacio, dimensions, preuCSV, barris]) => {

  edatFrangesData = edatFranges;
  ageData = ageCSV;
  priceData = preuCSV;
  nacionalitatData = nacionalitat;
  educacioData = educacio;
  dimensionsData = dimensions;

  barrisGeoJSON = barris;

  // 🔵 carregar labels de regions (FUNCIO A regionMap.js)
  loadRegionLabels(dimensionsData);
  // carregar labels de educacio
  loadEducationLabels(dimensionsData);

  console.log("✅ CSV + GeoJSON carregats correctament");
  console.log("🟢 Regions carregades:", regionLabels.size);

}).catch(err => {
  console.error("❌ Error carregant dades:", err);
});