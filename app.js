const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3002, () => {
      console.log("Server Running at http://localhost:3002/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//get all states
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    select * from 
    state`;
  const statesArray = await db.all(getAllStatesQuery);
  response.send(statesArray);
});

// 2 get the states by using the Id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuerybyId = `
    select * from 
    state 
    where state_id=${stateId};
    `;
  const stateDetails = await db.get(getstateQuerybyId);
  response.send(convertDbObjectToResponseObject(stateDetails));
});

// API 3
app.post("/districts/", async (request, response) => {
  const newDistrict = request.body;
  const { districtName, stateId, cured, active, deaths } = newDistrict;
  const addingNewDistrictQuery = `
    insert into 
    district (district_name, state_id, cured, active, deaths)
    values(
        '${districtName}',
        '${stateId}',
        '${cured}',
        '${active}',
        '${deaths}',
    );
    `;
  const dbResponse = await db.run(addingNewDistrictQuery);
  const newDistrictDetails = dbResponse.lastId;
  response.send("District Successfully Added");
});

//api 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select * 
    from districts
    where district_id=${districtId};
    `;
  const districtsArray = await db.get(getDistrictQuery);
  response.send(districtsArray);
});
// api 4 delete the district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    delete from 
    districts 
    where district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});
