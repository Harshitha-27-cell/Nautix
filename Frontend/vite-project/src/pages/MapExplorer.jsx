import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import MapWidget from '../components/MapWidget';
import { 
  Search, 
  Filter, 
  Anchor, 
  MapPin, 
  Calendar, 
  Compass, 
  Info,
  TrendingUp,
  AlertCircle,
  Bookmark,
  Globe
} from 'lucide-react';

const MapExplorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWmo = searchParams.get('wmo') || '';
  const initialRegion = searchParams.get('region') || '';

  const [floats, setFloats] = useState([]);
  const [selectedWmo, setSelectedWmo] = useState(initialWmo);
  const [trajectory, setTrajectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trajLoading, setTrajLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(initialWmo);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  // Fetch floats metadata
  useEffect(() => {
    const fetchFloats = async () => {
      try {
        const response = await api.get('/argo/floats');
        setFloats(response.data);
      } catch (err) {
        console.error('Failed to fetch floats:', err);
        setError('Could not retrieve ocean floats coordinates.');
      } finally {
        setLoading(false);
      }
    };
    fetchFloats();
  }, []);

  // Fetch trajectory coordinates when a WMO is selected
  useEffect(() => {
    const fetchTrajectory = async () => {
      if (!selectedWmo) {
        setTrajectory([]);
        return;
      }

      setTrajLoading(true);
      try {
        const response = await api.get(`/argo/profile/${selectedWmo}`);
        const sortedTraj = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setTrajectory(sortedTraj);
      } catch (err) {
        console.error('Failed to fetch float profiles for trajectory:', err);
      } finally {
        setTrajLoading(false);
      }
    };

    fetchTrajectory();
  }, [selectedWmo]);

  // Sync selected WMO and Region with URL query parameters
  useEffect(() => {
    const params = {};
    if (selectedWmo) params.wmo = selectedWmo;
    if (selectedRegion) params.region = selectedRegion;
    setSearchParams(params);
  }, [selectedWmo, selectedRegion]);

  const handleSelectFloat = (wmo) => {
    setSelectedWmo(wmo);
    setSearchQuery(wmo);
  };

  const handleClearSelection = () => {
    setSelectedWmo('');
    setSearchQuery('');
    setSearchParams({});
  };

  // Bookmark current search filter config to local storage
  const handleSaveSearch = () => {
    const saved = localStorage.getItem('saved_queries');
    const current = saved ? JSON.parse(saved) : [];
    
    let title = 'Map view';
    if (selectedRegion && searchQuery) {
      title = `Region: ${selectedRegion} | Float ${searchQuery}`;
    } else if (selectedRegion) {
      title = `Region: ${selectedRegion} Floats`;
    } else if (searchQuery) {
      title = `Float WMO ${searchQuery} Map`;
    } else if (selectedWmo) {
      title = `Float WMO ${selectedWmo} Map`;
    } else {
      title = 'Global Fleet Map';
    }

    if (current.some(q => q.title === title)) {
      alert(`Search view "${title}" is already saved!`);
      return;
    }

    const newQuery = {
      id: Date.now(),
      title,
      type: 'map',
      params: {
        wmo: selectedWmo || searchQuery,
        region: selectedRegion
      }
    };

    localStorage.setItem('saved_queries', JSON.stringify([...current, newQuery]));
    alert(`Saved search view "${title}" to Dashboard!`);
  };

  // Compute regions list
  const regions = Array.from(new Set(floats.map(f => f.region)));

  // Filter floats list
  const filteredFloats = floats.filter(f => {
    const matchesSearch = f.platform_number.includes(searchQuery.trim());
    const matchesRegion = selectedRegion ? f.region === selectedRegion : true;
    return matchesSearch && matchesRegion;
  });

  const activeFloat = selectedWmo 
    ? floats.find(f => f.platform_number === selectedWmo)
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden animate-fade-in">
      
      {/* Search and Metadata Info Panel */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 flex flex-col p-5 overflow-y-auto space-y-6 shrink-0">
        
        {/* Filters block */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-bold text-slate-100 flex items-center gap-2">
            <Filter className="h-5 w-5 text-sky-400" />
            Filters
          </h3>

          {/* Search Float ID */}
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Search WMO Code</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 1901234"
                className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 px-3 py-2 pl-9 rounded-xl text-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          {/* Region Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Ocean Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-sky-500 px-3 py-2.5 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
            >
              <option value="">All Regions</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Save Search Button */}
          <button
            onClick={handleSaveSearch}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Bookmark className="h-4 w-4 text-sky-400" />
            Save Search View
          </button>
        </div>

        {/* Selected Float Info Card */}
        {activeFloat ? (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
                <Info className="h-4.5 w-4.5 text-sky-400" />
                Active Platform
              </h3>
              <button 
                onClick={handleClearSelection}
                className="text-xxs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3.5 text-xs text-slate-350">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">WMO Code:</span>
                <span className="font-mono font-bold text-sky-400">{activeFloat.platform_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1"><Compass className="h-3.5 w-3.5" /> Region:</span>
                <span className="text-slate-200 font-medium truncate max-w-[130px]">{activeFloat.region}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Coordinates:</span>
                <span className="font-mono text-slate-200 text-xxs">
                  {activeFloat.latitude.toFixed(3)}°N, {activeFloat.longitude.toFixed(3)}°E
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Deployed:</span>
                <span className="text-slate-400">{new Date(activeFloat.deployment_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`/visualizations?wmo=${activeFloat.platform_number}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <TrendingUp className="h-4 w-4" />
                View Profile Graphs
              </a>
              <a
                href={`/ocean-3d`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass-card hover:bg-cyan-500/10 text-cyan-400 font-bold text-xs transition-colors cursor-pointer border border-cyan-500/20"
              >
                <Globe className="h-4 w-4" />
                View on 3D Globe
              </a>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 border-t border-slate-800 text-slate-500">
            <Anchor className="h-8 w-8 text-slate-700 mb-3" />
            <p className="text-xs font-semibold">Select a float pin on the map to inspect coordinates and plot trajectory tracks.</p>
          </div>
        )}
      </div>

      {/* Main Map Viewer Panel */}
      <div className="flex-1 h-full bg-slate-950 p-3">
        {loading ? (
          <div className="h-full w-full bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center items-center gap-3 text-sky-400">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-sky-400"></span>
            <p className="text-xs font-semibold animate-pulse">Initializing GIS Telemetry Map...</p>
          </div>
        ) : error ? (
          <div className="h-full w-full bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-center items-center gap-3 text-rose-400 p-6 text-center">
            <AlertCircle className="h-10 w-10 shrink-0" />
            <p className="font-heading text-sm font-semibold">{error}</p>
          </div>
        ) : (
          <MapWidget 
            floats={filteredFloats} 
            selectedWmo={selectedWmo} 
            trajectory={trajectory}
            onSelectFloat={handleSelectFloat}
          />
        )}
      </div>

    </div>
  );
};

export default MapExplorer;
