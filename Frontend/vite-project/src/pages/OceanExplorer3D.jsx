import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import api from '../services/api';
import { tempToColor, TEMP_LEGEND } from '../utils/tempColorScale';
import {
  Search,
  Filter,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  AlertCircle,
  Thermometer,
  Droplets,
  Anchor,
} from 'lucide-react';

const Plot = createPlotlyComponent(Plotly);

const enrichFloat = async (floatMeta, searchProfiles) => {
  const matched = searchProfiles?.find((p) => p.platform_number === floatMeta.platform_number);
  if (matched) {
    const m = matched.measurements?.[0];
    return {
      lat: floatMeta.latitude,
      lng: floatMeta.longitude,
      wmo: floatMeta.platform_number,
      region: floatMeta.region,
      temp: m?.temperature ?? 15,
      salinity: m?.salinity ?? null,
      depth: m?.pressure ?? null,
      timestamp: matched.timestamp,
      color: tempToColor(m?.temperature ?? 15),
      size: 0.5,
    };
  }

  try {
    const { data: profiles } = await api.get(`/argo/profile/${floatMeta.platform_number}`);
    if (!profiles?.length) return null;
    const latest = profiles[profiles.length - 1];
    const m = latest.measurements?.[0];
    return {
      lat: floatMeta.latitude,
      lng: floatMeta.longitude,
      wmo: floatMeta.platform_number,
      region: floatMeta.region,
      temp: m?.temperature ?? 15,
      salinity: m?.salinity ?? null,
      depth: m?.pressure ?? null,
      timestamp: latest.timestamp,
      color: tempToColor(m?.temperature ?? 15),
      size: 0.5,
    };
  } catch {
    return {
      lat: floatMeta.latitude,
      lng: floatMeta.longitude,
      wmo: floatMeta.platform_number,
      region: floatMeta.region,
      temp: 15,
      salinity: null,
      depth: null,
      timestamp: floatMeta.last_active,
      color: tempToColor(15),
      size: 0.5,
    };
  }
};

const FloatCharts = ({ wmo }) => {
  const [tempData, setTempData] = useState(null);
  const [salData, setSalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tRes, sRes] = await Promise.all([
          api.get(`/visualization/temperature-profile/${wmo}`, { params: { format: 'json' } }),
          api.get(`/visualization/salinity-profile/${wmo}`, { params: { format: 'json' } }),
        ]);
        setTempData(tRes.data);
        setSalData(sRes.data);
      } catch (err) {
        console.error('Chart load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [wmo]);

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center text-cyan-400 text-xs">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400 mr-2" />
        Loading charts...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tempData && (
        <Plot
          data={tempData.data}
          layout={{
            ...tempData.layout,
            height: 180,
            margin: { l: 40, r: 10, t: 25, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: { text: 'Temperature Profile', font: { size: 11, color: '#94a3b8' } },
          }}
          config={{ responsive: true, displayModeBar: false }}
          className="w-full"
        />
      )}
      {salData && (
        <Plot
          data={salData.data}
          layout={{
            ...salData.layout,
            height: 180,
            margin: { l: 40, r: 10, t: 25, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            title: { text: 'Salinity Profile', font: { size: 11, color: '#94a3b8' } },
          }}
          config={{ responsive: true, displayModeBar: false }}
          className="w-full"
        />
      )}
    </div>
  );
};

const OceanExplorer3D = () => {
  const globeRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [points, setPoints] = useState([]);
  const [allFloats, setAllFloats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pathData, setPathData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globeReady, setGlobeReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [minSalinity, setMinSalinity] = useState('');
  const [maxDepth, setMaxDepth] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: floats } = await api.get('/argo/floats');
      setAllFloats(floats);

      const params = {};
      if (selectedRegion) params.region = selectedRegion;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (minTemp) params.min_temp = parseFloat(minTemp);
      if (maxTemp) params.max_temp = parseFloat(maxTemp);
      if (searchQuery.trim()) params.platform_number = searchQuery.trim();

      let searchProfiles = [];
      const hasFilters = Object.keys(params).length > 0;
      if (hasFilters) {
        const { data } = await api.get('/argo/search', { params });
        searchProfiles = data;
      }

      let filteredFloats = floats;
      if (searchQuery.trim()) {
        filteredFloats = floats.filter((f) => f.platform_number.includes(searchQuery.trim()));
      }
      if (selectedRegion) {
        filteredFloats = filteredFloats.filter((f) => f.region === selectedRegion);
      }

      const batchSize = 5;
      const enriched = [];
      for (let i = 0; i < filteredFloats.length; i += batchSize) {
        const batch = filteredFloats.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map((f) => enrichFloat(f, hasFilters ? searchProfiles : null))
        );
        enriched.push(...results.filter(Boolean));
      }

      let finalPoints = enriched;
      if (minSalinity) {
        finalPoints = finalPoints.filter((p) => p.salinity != null && p.salinity >= parseFloat(minSalinity));
      }
      if (maxDepth) {
        finalPoints = finalPoints.filter((p) => p.depth != null && p.depth <= parseFloat(maxDepth));
      }
      if (minTemp && !hasFilters) {
        finalPoints = finalPoints.filter((p) => p.temp >= parseFloat(minTemp));
      }
      if (maxTemp && !hasFilters) {
        finalPoints = finalPoints.filter((p) => p.temp <= parseFloat(maxTemp));
      }

      setPoints(finalPoints);
    } catch (err) {
      console.error(err);
      setError('Could not load ARGO float data for the globe.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedRegion, startDate, endDate, minTemp, maxTemp, minSalinity, maxDepth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (globeRef.current && globeReady) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.4;
    }
  }, [globeReady]);

  const handlePointClick = async (point) => {
    setSelected(point);
    try {
      const { data } = await api.get(`/argo/profile/${point.wmo}`);
      const sorted = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setPathData([
        {
          wmo: point.wmo,
          coords: sorted.map((p) => [p.latitude, p.longitude, 0.02]),
        },
      ]);
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 1000);
      }
    } catch (err) {
      console.error('Trajectory load failed:', err);
      setPathData([]);
    }
  };

  const handleReset = () => {
    setSelected(null);
    setPathData([]);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  };

  const handleZoom = (dir) => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAlt = dir === 'in' ? Math.max(0.5, pov.altitude - 0.5) : Math.min(4, pov.altitude + 0.5);
    globeRef.current.pointOfView({ ...pov, altitude: newAlt }, 500);
  };

  const regions = Array.from(new Set(allFloats.map((f) => f.region)));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] rounded-2xl border border-cyan-500/10 glass-panel overflow-hidden animate-fade-in">
      {/* Filters sidebar */}
      <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-cyan-500/10 p-5 overflow-y-auto space-y-4 shrink-0">
        <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
          <Filter className="h-5 w-5 text-cyan-400" />
          Globe Filters
        </h3>

        <div className="space-y-1.5">
          <label className="text-xxs font-semibold text-slate-500 uppercase">WMO / Float ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 1901234"
              className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 px-3 py-2 pl-9 rounded-xl text-slate-200 text-xs outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xxs font-semibold text-slate-500 uppercase">Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 px-3 py-2 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xxs outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xxs outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">Min Temp °C</label>
            <input type="number" value={minTemp} onChange={(e) => setMinTemp(e.target.value)} placeholder="0"
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xs outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">Max Temp °C</label>
            <input type="number" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} placeholder="30"
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xs outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">Min Salinity</label>
            <input type="number" value={minSalinity} onChange={(e) => setMinSalinity(e.target.value)} placeholder="34"
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xs outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase">Max Depth dbar</label>
            <input type="number" value={maxDepth} onChange={(e) => setMaxDepth(e.target.value)} placeholder="2000"
              className="w-full bg-slate-950/60 border border-slate-700/50 px-2 py-2 rounded-xl text-slate-200 text-xs outline-none" />
          </div>
        </div>

        <button onClick={loadData}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer">
          Apply Filters
        </button>

        {/* Legend */}
        <div className="border-t border-slate-700/50 pt-4 space-y-2">
          <p className="text-xxs font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5" /> Temperature Legend
          </p>
          {TEMP_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xxs text-slate-400">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        <p className="text-xxs text-slate-600">{points.length} float(s) displayed</p>
      </div>

      {/* Globe viewer */}
      <div ref={containerRef} className="flex-1 relative bg-[#040810] min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-cyan-400" />
            <p className="text-xs font-semibold animate-pulse">Loading 3D Ocean Globe...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-rose-400 p-6 text-center">
            <AlertCircle className="h-10 w-10" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          atmosphereColor="#4cc9f0"
          atmosphereAltitude={0.15}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.06}
          pointRadius="size"
          pointLabel={(d) => `<div style="background:#0d1b31;color:#f0f3f8;padding:6px 10px;border-radius:8px;font-size:11px;border:1px solid rgba(76,201,240,0.3)">
            <b>Float ${d.wmo}</b><br/>${d.temp?.toFixed(1)}°C · ${d.region}
          </div>`}
          onPointClick={handlePointClick}
          pathsData={pathData}
          pathPoints="coords"
          pathPointLat={(p) => p[0]}
          pathPointLng={(p) => p[1]}
          pathPointAlt={(p) => p[2]}
          pathColor={() => ['#4cc9f0', '#00b4d8']}
          pathStroke={1.5}
          pathDashLength={0.4}
          pathDashGap={0.2}
          pathDashAnimateTime={4000}
          onGlobeReady={() => setGlobeReady(true)}
        />

        {/* Globe controls */}
        <div className="absolute bottom-4 left-4 flex gap-2 z-10">
          <button onClick={() => handleZoom('in')} title="Zoom In"
            className="p-2.5 rounded-xl glass-card text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => handleZoom('out')} title="Zoom Out"
            className="p-2.5 rounded-xl glass-card text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleReset} title="Reset View"
            className="p-2.5 rounded-xl glass-card text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition-colors">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Selected float detail panel */}
        {selected && (
          <div className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto glass-panel rounded-2xl p-5 z-10 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-heading font-bold text-cyan-400 flex items-center gap-2">
                <Anchor className="h-4 w-4" />
                Float {selected.wmo}
              </h4>
              <button onClick={() => { setSelected(null); setPathData([]); }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Latitude</span>
                <span className="font-mono">{selected.lat?.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Longitude</span>
                <span className="font-mono">{selected.lng?.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temperature</span>
                <span>{selected.temp?.toFixed(2) ?? '—'} °C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 flex items-center gap-1"><Droplets className="h-3 w-3" /> Salinity</span>
                <span>{selected.salinity?.toFixed(3) ?? '—'} PSU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Depth</span>
                <span>{selected.depth?.toFixed(1) ?? '—'} dbar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latest</span>
                <span>{selected.timestamp ? new Date(selected.timestamp).toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Region</span>
                <span className="truncate max-w-[140px]">{selected.region}</span>
              </div>
            </div>

            <FloatCharts wmo={selected.wmo} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OceanExplorer3D;
