let edatFrangesData;
let edatExactaData;
let nacionalitatData;
let educacioData;
let barrisGeoJSON;

Promise.all([
  d3.csv("data/2020-2025_pad_mdba_sexe_edat-q.csv"),
  d3.csv("data/2020-2025_pad_mdbas_edat-1.csv"),
  d3.csv("data/2020-2025_pad_mdb_nacionalitat-regio_sexe.csv"),
  d3.csv("data/2020-2025_pad_mdb_niv-educa-esta_edat-lloc-naix.csv"),
  d3.json("data/0301100100_UNITATS_ADM_POLIGONS.json")
]).then(([edatFranges, edatExacta, nacionalitat, educacio, barris]) => {

  edatFrangesData = edatFranges;
  edatExactaData = edatExacta;
  nacionalitatData = nacionalitat;
  educacioData = educacio;
  barrisGeoJSON = barris;

  console.log("✅ CSV + GeoJSON carregats correctament");
  console.log("Total features GeoJSON:", barrisGeoJSON.features.length);
}).catch(err => {
  console.error("❌ Error carregant dades:", err);
});