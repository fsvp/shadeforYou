import SunCalc from "suncalc";

function calculateBearing(start, end) {
  const lat1 = (start.lat * Math.PI) / 180;
  const lon1 = (start.lon * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const lon2 = (end.lon * Math.PI) / 180;

  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;

  return (brng + 360) % 360;
}

export function getSeatRecommendation(start, end, time) {
  if (!time) {
    return {
      side: "⚠️ Select time",
      reason: "Please choose your travel time.",
      heatExposure: 0,
    };
  }

  const bearing = calculateBearing(start, end);

  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);

  const sunPos = SunCalc.getPosition(now, start.lat, start.lon);

  const altitude = sunPos.altitude; // radians

  // ✅ Night time check
  if (altitude <= 0) {
    return {
      side: "🌙 Either side is okay",
      reason: "Night time — no direct sunlight on the bus.",
      heatExposure: 0,
    };
  }

  // Convert sun altitude to heat percentage
  const heatExposure = Math.round(
    Math.min(100, Math.max(0, Math.sin(altitude) * 100))
  );

  const azimuth = ((sunPos.azimuth * 180) / Math.PI + 180) % 360;

  let relativeAngle = (azimuth - bearing + 360) % 360;

  if (relativeAngle > 180) {
    relativeAngle -= 360;
  }

  // If relativeAngle > 0, sunlight is on right side, so sit left
  if (relativeAngle > 0) {
    return {
      side: "✅ Sit on LEFT side",
      reason: "Sunlight is expected on the right side of the bus.",
      heatExposure,
    };
  } else {
    return {
      side: "✅ Sit on RIGHT side",
      reason: "Sunlight is expected on the left side of the bus.",
      heatExposure,
    };
  }
}