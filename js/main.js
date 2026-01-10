// Definixo les variables globals per emmagatzemar les dades
let edatFrangesData;
let ageData = [];
let nacionalitatData;
let educacioData;
let priceData;
let barrisGeoJSON;
let dimensionsData;

// Carrego tots els fitxers necessaris de manera paral·lela
Promise.all([
  d3.csv("data/2020-2025_pad_mdba_sexe_edat-q.csv"),
  d3.csv("data/2020-2025_pad_mdbas_edat-1.csv"),
  d3.csv("data/2020-2025_pad_mdb_nacionalitat-regio_sexe.csv"),
  d3.csv("data/2020-2025_pad_mdb_niv-educa-esta_edat-lloc-naix.csv"),
  d3.csv("data/pad_dimensions.csv"),
  d3.csv("data/2012_2025_preu_mig_m2.csv"),
  d3.json("data/0301100100_UNITATS_ADM_POLIGONS.json")
]).then(([
  edatFranges,
  ageCSV,
  nacionalitat,
  educacio,
  dimensions,
  preuCSV,
  barris
]) => {

  // Assigno les dades carregades a les variables corresponents
  edatFrangesData = edatFranges;
  ageData = ageCSV;
  nacionalitatData = nacionalitat;
  educacioData = educacio;
  dimensionsData = dimensions;
  priceData = preuCSV;
  barrisGeoJSON = barris;

  // Carrego els labels de regions utilitzats al mapa de regions
  loadRegionLabels(dimensionsData);

  // Carrego els labels de nivell educatiu utilitzats al mapa d’educació
  loadEducationLabels(dimensionsData);

}).catch(err => {
  // Gestiono possibles errors en la càrrega de dades
  console.error("Error carregant les dades:", err);
});
