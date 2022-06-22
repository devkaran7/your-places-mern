const axios = require("axios");
const HttpError = require("../models/http-error");

async function getCoordinates(address) {
  const response = await axios.get(
    `http://api.positionstack.com/v1/forward?access_key=57831480aec14a5b01046c02b5c15ca3&query=${encodeURIComponent(
      address
    )}`
  );
  const data = response.data.data[0];
  if (!data) {
    const error = new HttpError("Could not find location", 404);
    throw error;
  }
  const answer = {
    lat: data.latitude,
    lng: data.longitude,
  };
  return answer;
}

module.exports = getCoordinates;
