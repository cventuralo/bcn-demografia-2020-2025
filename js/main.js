let edatFrangesData;
let ageData = [];
let nacionalitatData;
let educacioData;
let barrisGeoJSON;
let dimensionsData;
let regionLabels = new Map();

Promise.all([
  d3.csv("data/2020-2025_pad_mdba_sexe_edat-q.csv"),
  d3.csv("data/2020-2025_pad_mdbas_edat-1.csv"),
  d3.csv("data/2020-2025_pad_mdb_nacionalitat-regio_sexe.csv"),
  d3.csv("data/2020-2025_pad_mdb_niv-educa-esta_edat-lloc-naix.csv"),
  d3.csv("data/pad_dimensions.csv"), // 🔵 NOU
  d3.json("data/0301100100_UNITATS_ADM_POLIGONS.json")
]).then(([edatFranges, ageCSV, nacionalitat, educacio, dimensions, barris]) => {

  edatFrangesData = edatFranges;
  ageData = ageCSV;
  nacionalitatData = nacionalitat;
  educacioData = educacio;
  dimensionsData = dimensions;
  barrisGeoJSON = barris;

  dimensions.forEach(d => {
    const dim = (d.Codi_Dimensio || "").trim();
    const code = (d.Codi_Valor || "").trim();
    const label = (d.Desc_Valor_CA || "").trim();

    if (dim === "NACIONALITAT_REGIO" && code !== "") {
      regionLabels.set(code, label);
    }
  });

  console.log("🟢 Regions carregades:", regionLabels.size);
  console.log("🟢 Exemple regions:", Array.from(regionLabels.entries()).slice(0, 10));


  console.log("✅ CSV + GeoJSON carregats correctament");
  console.log("Regions carregades:", regionLabels.size);

}).catch(err => {
  console.error("❌ Error carregant dades:", err);
});
