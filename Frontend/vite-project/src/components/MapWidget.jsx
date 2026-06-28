import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon marker asset resolution inside Vite builds
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to programmatically fly/re-center the map focus
const ChangeMapFocus = ({ coords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, zoom, { animate: true, duration: 1 });
    }
  }, [coords, zoom, map]);
  return null;
};

const MapWidget = ({ floats, selectedWmo, trajectory, onSelectFloat }) => {
  // Center of world view initially
  const defaultCenter = [15.0, 0.0];
  const defaultZoom = 2.5;

  // Compute center if a float is actively selected
  const activeFloat = selectedWmo 
    ? floats.find(f => f.platform_number === selectedWmo)
    : null;
  const mapCenter = activeFloat ? [activeFloat.latitude, activeFloat.longitude] : defaultCenter;
  const mapZoom = activeFloat ? 5 : defaultZoom;

  // Prepare line points for selected float trajectory path
  const linePoints = trajectory && trajectory.length > 0
    ? trajectory.map(pt => [pt.latitude, pt.longitude])
    : [];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-800 shadow-lg relative">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        worldCopyJump={false}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />

        {/* Change center focus hook */}
        <ChangeMapFocus coords={activeFloat ? [activeFloat.latitude, activeFloat.longitude] : null} zoom={mapZoom} />

        {/* Trajectory Polyline track path */}
        {linePoints.length > 0 && (
          <Polyline 
            positions={linePoints} 
            color="#4cc9f0" 
            weight={3} 
            dashArray="5, 10" 
            opacity={0.8}
          />
        )}

        {/* Dynamic markers for all floats in list */}
        {floats.map((fl) => {
          const isActive = selectedWmo === fl.platform_number;
          return (
            <Marker 
              key={fl.platform_number} 
              position={[fl.latitude, fl.longitude]}
              eventHandlers={{
                click: () => onSelectFloat(fl.platform_number)
              }}
            >
              <Popup>
                <div className="p-1 space-y-2">
                  <h4 className="font-heading font-bold text-sky-400 text-sm">Float {fl.platform_number}</h4>
                  <div className="text-xs space-y-1 text-slate-300">
                    <p><span className="text-slate-500">Region:</span> {fl.region}</p>
                    <p><span className="text-slate-500">Latitude:</span> {fl.latitude.toFixed(4)}</p>
                    <p><span className="text-slate-500">Longitude:</span> {fl.longitude.toFixed(4)}</p>
                    <p><span className="text-slate-500">Deployed:</span> {new Date(fl.deployment_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <a
                      href={`/visualizations?wmo=${fl.platform_number}`}
                      className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 hover:bg-sky-400 font-bold text-xxs transition-colors"
                    >
                      Charts
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapWidget;
