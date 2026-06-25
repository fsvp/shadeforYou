import React, { useState } from "react";
import axios from "axios";
import SunCalc from "suncalc";
import MapView from "./components/MapView";
import "./App.css";

function App() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [routeCoords, setRouteCoords] = useState([]);
  const [result, setResult] = useState(null);

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const fetchSuggestions = async (value, type) => {
    if (value.length < 3) {
      if (type === "from") setFromSuggestions([]);
      if (type === "to") setToSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${value}&format=json&limit=5`
      );

      if (type === "from") {
        setFromSuggestions(response.data);
      } else {
        setToSuggestions(response.data);
      }
    } catch (error) {
      console.log("Suggestion error:", error);
    }
  };

  const swapLocations = () => {
    const oldFrom = from;
    const oldTo = to;

    setFrom(oldTo);
    setTo(oldFrom);

    setFromSuggestions([]);
    setToSuggestions([]);
    setResult(null);
    setRouteCoords([]);
  };

  const getCoordinates = async (place) => {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${place}&format=json&limit=1`
    );

    if (!response.data.length) {
      throw new Error("Location not found. Please choose from suggestions.");
    }

    return {
      lat: parseFloat(response.data[0].lat),
      lon: parseFloat(response.data[0].lon),
    };
  };

  const getDirection = (fromCoords, toCoords) => {
    const latDiff = toCoords.lat - fromCoords.lat;
    const lonDiff = toCoords.lon - fromCoords.lon;

    if (Math.abs(latDiff) > Math.abs(lonDiff)) {
      return latDiff > 0 ? "north" : "south";
    }

    return lonDiff > 0 ? "east" : "west";
  };

  const analyzeSunlight = (fromCoords, toCoords, selectedTime) => {
    if (!selectedTime) {
      return {
        side: "⚠️ Select time",
        heat: "0%",
        reason: "Please select your travel time.",
      };
    }

    const now = new Date();
    const [hours, minutes] = selectedTime.split(":").map(Number);

    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);

    const sunPosition = SunCalc.getPosition(
      now,
      fromCoords.lat,
      fromCoords.lon
    );

    if (sunPosition.altitude <= 0) {
      return {
        side: "🌙 Either Side is Okay",
        heat: "0%",
        reason: "Night time — no direct sunlight on the bus.",
      };
    }

    const direction = getDirection(fromCoords, toCoords);

    let sunSide = "";

    if (direction === "north") {
      sunSide = sunPosition.azimuth > 0 ? "right" : "left";
    } else if (direction === "south") {
      sunSide = sunPosition.azimuth > 0 ? "left" : "right";
    } else if (direction === "east") {
      sunSide = sunPosition.azimuth > 0 ? "right" : "left";
    } else if (direction === "west") {
      sunSide = sunPosition.azimuth > 0 ? "left" : "right";
    }

    const bestSide = sunSide === "left" ? "right" : "left";

    const sunIntensity = Math.min(
      100,
      Math.round(Math.sin(sunPosition.altitude) * 100)
    );

    const selectedSeatHeat = Math.round(sunIntensity * 0.25);

    return {
      side:
        bestSide === "left"
          ? "⬅️ Sit on LEFT Side"
          : "➡️ Sit on RIGHT Side",
      heat: `${selectedSeatHeat}%`,
      reason: `Sunlight is strongest on the ${sunSide} side, so the ${bestSide} side is better.`,
    };
  };

  const handleSubmit = async () => {
    try {
      if (!from || !to || !time) {
        alert("Please enter From, To and Time");
        return;
      }

      const fromCoords = await getCoordinates(from);
      const toCoords = await getCoordinates(to);

      setRouteCoords([
        [fromCoords.lat, fromCoords.lon],
        [toCoords.lat, toCoords.lon],
      ]);

      const analysis = analyzeSunlight(fromCoords, toCoords, time);

      setResult(analysis);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <h1>🚌 ShadeForYou AI</h1>

      <div className="card">
        <div className="form">
          <div className="input-box">
            <input
              className="input"
              type="text"
              placeholder="From"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                fetchSuggestions(e.target.value, "from");
              }}
            />

            {fromSuggestions.length > 0 && (
              <div className="suggestions">
                {fromSuggestions.map((item) => (
                  <div
                    key={item.place_id}
                    className="suggestion-item"
                    onClick={() => {
                      setFrom(item.display_name);
                      setFromSuggestions([]);
                    }}
                  >
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="swap-button"
            type="button"
            onClick={swapLocations}
            title="Swap locations"
          >
            ⇄
          </button>

          <div className="input-box">
            <input
              className="input"
              type="text"
              placeholder="To"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                fetchSuggestions(e.target.value, "to");
              }}
            />

            {toSuggestions.length > 0 && (
              <div className="suggestions">
                {toSuggestions.map((item) => (
                  <div
                    key={item.place_id}
                    className="suggestion-item"
                    onClick={() => {
                      setTo(item.display_name);
                      setToSuggestions([]);
                    }}
                  >
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <input
            className="input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <button className="button" onClick={handleSubmit}>
            Analyze Shade
          </button>
        </div>

        {result && (
          <div className="result">
            <h2>{result.side}</h2>

            <p>{result.reason}</p>

            <h3>🌡️ Selected Seat Heat Exposure: {result.heat}</h3>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: result.heat,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {routeCoords.length > 0 && (
        <div className="map-wrapper">
          <MapView routeCoords={routeCoords} />
        </div>
      )}
    </div>
  );
}

export default App;