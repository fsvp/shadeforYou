import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function MapView({ routeCoords }) {
  if (!routeCoords?.length) return null;

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl border border-white/30">
      <MapContainer
        center={routeCoords[0]}
        zoom={9}
        style={{
          height: "450px",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: "#2563eb",
            weight: 5,
          }}
        />

        <Marker position={routeCoords[0]}>
          <Popup>🟢 Start</Popup>
        </Marker>

        <Marker position={routeCoords[1]}>
          <Popup>📍 Destination</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default MapView;