import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { 
  BarChart3, 
  Download, 
  Sliders, 
  Anchor, 
  Activity, 
  Globe, 
  Clock, 
  AlertCircle,
  Bookmark
} from 'lucide-react';

const Plot = createPlotlyComponent(Plotly);

const Visualization = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialWmo = searchParams.get('wmo') || '';
  const initialTab = searchParams.get('tab') || 'temp-profile';

  const [floats, setFloats] = useState([]);
  const [selectedWmo, setSelectedWmo] = useState(initialWmo);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Plotly data state
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [minPressure, setMinPressure] = useState('');
  const [maxPressure, setMaxPressure] = useState('');
  const [tsParam, setTsParam] = useState('temperature'); // temperature or salinity
  const [tsDepth, setTsDepth] = useState('5.0');
  
  // Load floats list
  useEffect(() => {
    const fetchFloats = async () => {
      try {
        const response = await api.get('/argo/floats');
        setFloats(response.data);
        if (response.data.length > 0 && !selectedWmo) {
          setSelectedWmo(response.data[0].platform_number);
        }
      } catch (err) {
        console.error('Failed to load floats for visualization:', err);
      }
    };
    fetchFloats();
  }, []);

  // Fetch Plotly data from visualization endpoints
  const fetchChart = async () => {
    if (!selectedWmo) return;
    
    setLoading(true);
    setError('');
    setChartData(null);

    let url = '';
    const params = { format: 'json' };

    switch (activeTab) {
      case 'temp-profile':
        url = `/visualization/temperature-profile/${selectedWmo}`;
        if (minPressure) params.min_pressure = parseFloat(minPressure);
        if (maxPressure) params.max_pressure = parseFloat(maxPressure);
        break;
      case 'sal-profile':
        url = `/visualization/salinity-profile/${selectedWmo}`;
        if (minPressure) params.min_pressure = parseFloat(minPressure);
        if (maxPressure) params.max_pressure = parseFloat(maxPressure);
        break;
      case 'trajectory':
        url = `/visualization/trajectory/${selectedWmo}`;
        break;
      case 'timeseries':
        url = `/visualization/timeseries/${selectedWmo}`;
        params.parameter = tsParam;
        params.depth_level = parseFloat(tsDepth) || 5.0;
        break;
      default:
        break;
    }

    try {
      const response = await api.get(url, { params });
      setChartData(response.data);
    } catch (err) {
      console.error('Failed to load chart data:', err);
      setError(err.response?.data?.detail || 'Could not load Plotly data. Verify float ID exists.');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize WMO and active Tab with URL parameters
  useEffect(() => {
    if (selectedWmo) {
      fetchChart();
      setSearchParams({ wmo: selectedWmo, tab: activeTab });
    }
  }, [selectedWmo, activeTab]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchChart();
  };

  // Download interactive HTML page
  const handleDownloadHtml = async () => {
    if (!selectedWmo) return;
    
    let url = '';
    const params = { format: 'html' };

    switch (activeTab) {
      case 'temp-profile':
        url = `/visualization/temperature-profile/${selectedWmo}`;
        if (minPressure) params.min_pressure = parseFloat(minPressure);
        if (maxPressure) params.max_pressure = parseFloat(maxPressure);
        break;
      case 'sal-profile':
        url = `/visualization/salinity-profile/${selectedWmo}`;
        if (minPressure) params.min_pressure = parseFloat(minPressure);
        if (maxPressure) params.max_pressure = parseFloat(maxPressure);
        break;
      case 'trajectory':
        url = `/visualization/trajectory/${selectedWmo}`;
        break;
      case 'timeseries':
        url = `/visualization/timeseries/${selectedWmo}`;
        params.parameter = tsParam;
        params.depth_level = parseFloat(tsDepth) || 5.0;
        break;
      default:
        break;
    }

    try {
      const response = await api.get(url, {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/html' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `float_${selectedWmo}_${activeTab}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Could not download interactive HTML file.');
    }
  };

  // Save current dashboard view to bookmarks
  const handleSaveView = () => {
    if (!selectedWmo) return;
    const saved = localStorage.getItem('saved_queries');
    const current = saved ? JSON.parse(saved) : [];

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.name || 'View';
    const title = `Float ${selectedWmo} - ${activeTabLabel}`;

    if (current.some(q => q.title === title)) {
      alert(`Dashboard view "${title}" is already saved!`);
      return;
    }

    const newQuery = {
      id: Date.now(),
      title,
      type: 'vis',
      params: {
        wmo: selectedWmo,
        tab: activeTab
      }
    };

    localStorage.setItem('saved_queries', JSON.stringify([...current, newQuery]));
    alert(`Saved dashboard view "${title}" to Dashboard!`);
  };

  const tabs = [
    { id: 'temp-profile', name: 'Temp Profile', icon: Activity },
    { id: 'sal-profile', name: 'Salinity Profile', icon: Activity },
    { id: 'trajectory', name: 'Float Trajectory', icon: Globe },
    { id: 'timeseries', name: 'Time-Series', icon: Clock }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-400">Target Float Platform (WMO):</label>
          <select
            value={selectedWmo}
            onChange={(e) => setSelectedWmo(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-sky-500 px-3 py-2 rounded-xl text-slate-200 text-sm outline-none cursor-pointer"
          >
            {floats.map(f => (
              <option key={f.platform_number} value={f.platform_number}>
                {f.platform_number} ({f.region})
              </option>
            ))}
          </select>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid split: Controls & Plotly */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Settings Filters Panel */}
        <div className="w-full xl:w-72 bg-slate-900 border border-slate-800 p-5 rounded-2xl h-fit space-y-5">
          <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-sky-400" />
            Chart Parameters
          </h3>

          <form onSubmit={handleApplyFilters} className="space-y-4">
            
            {/* Conditional filters for Profiles */}
            {(activeTab === 'temp-profile' || activeTab === 'sal-profile') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Min Pressure (dbar)</label>
                  <input
                    type="number"
                    value={minPressure}
                    onChange={(e) => setMinPressure(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-slate-200 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Max Pressure (dbar)</label>
                  <input
                    type="number"
                    value={maxPressure}
                    onChange={(e) => setMaxPressure(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-slate-200 text-xs outline-none"
                  />
                </div>
              </>
            )}

            {/* Conditional filters for Time Series */}
            {activeTab === 'timeseries' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Parameter Type</label>
                  <select
                    value={tsParam}
                    onChange={(e) => setTsParam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2.5 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
                  >
                    <option value="temperature">Temperature</option>
                    <option value="salinity">Salinity</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xxs font-semibold text-slate-500 uppercase tracking-wider">Depth Level (dbar)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={tsDepth}
                    onChange={(e) => setTsDepth(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded-xl text-slate-200 text-xs outline-none"
                  />
                </div>
              </>
            )}

            {activeTab === 'trajectory' && (
              <p className="text-xxs text-slate-500 leading-relaxed">
                Visualizes the complete chronological mapping sequence. Date and geographic coordinate details are plotted directly on the spherical projection map.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 font-bold text-xs transition-colors cursor-pointer"
            >
              Apply Bounds
            </button>
          </form>

          {/* Download & Save triggers */}
          {chartData && (
            <div className="pt-4 border-t border-slate-850 space-y-3">
              <button
                onClick={handleDownloadHtml}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download Interactive HTML
              </button>
              <button
                onClick={handleSaveView}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <Bookmark className="h-4 w-4" />
                Save Dashboard View
              </button>
            </div>
          )}
        </div>

        {/* Plotly Canvas Container */}
        <div className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl min-h-[500px] flex flex-col justify-center items-center relative overflow-hidden">
          
          {loading && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-10 flex flex-col justify-center items-center gap-3 text-sky-400">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-sky-400"></span>
              <p className="text-xs font-semibold animate-pulse">Plotting telemetry data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-rose-400 text-center p-6 max-w-md">
              <AlertCircle className="h-10 w-10 shrink-0" />
              <p className="font-heading text-sm font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && !chartData && (
            <div className="flex flex-col items-center gap-3 text-slate-500 text-center">
              <BarChart3 className="h-12 w-12 text-slate-750" />
              <p className="text-sm">Select a float ID to render scientific profiles.</p>
            </div>
          )}

          {!loading && chartData && (
            <div className="w-full h-full flex justify-center items-center">
              <Plot
                data={chartData.data}
                layout={{
                  ...chartData.layout,
                  autosize: true,
                  useResizeHandler: true
                }}
                config={{ responsive: true }}
                className="w-full max-w-full"
                style={{ height: '500px' }}
              />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Visualization;
