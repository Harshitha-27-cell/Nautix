import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  Bot, 
  User, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Map as MapIcon,
  Compass,
  Bookmark,
  BookmarkCheck,
  X,
  Activity,
  Globe
} from 'lucide-react';

const Plot = createPlotlyComponent(Plotly);

// Setup default Leaflet icon assets
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [1, -26],
  shadowSize: [32, 32]
});

// Inline Chart component that loads backend Plotly figure data inside message bubbles
const InlineChart = ({ wmo, type, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChart = async () => {
      let url = '';
      if (type === 'temperature') {
        url = `/visualization/temperature-profile/${wmo}`;
      } else {
        url = `/visualization/salinity-profile/${wmo}`;
      }

      try {
        const response = await api.get(url, { params: { format: 'json' } });
        setData(response.data);
      } catch (err) {
        console.error('Failed to load inline chart:', err);
        setError('Failed to load profile chart.');
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, [wmo, type]);

  return (
    <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
      <button 
        onClick={onClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-md hover:bg-slate-850 text-slate-500 hover:text-slate-300"
      >
        <X className="h-4 w-4" />
      </button>
      <h5 className="text-xxs font-bold uppercase tracking-wider text-slate-500">
        Inline {type === 'temperature' ? 'Temperature' : 'Salinity'} Profile - Float {wmo}
      </h5>

      {loading && (
        <div className="h-48 flex flex-col justify-center items-center gap-2 text-sky-400">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-sky-400"></span>
          <span className="text-xxs font-medium animate-pulse">Rendering plot...</span>
        </div>
      )}

      {error && (
        <div className="h-48 flex justify-center items-center text-rose-400 text-xs gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="w-full overflow-hidden flex justify-center items-center">
          <Plot
            data={data.data}
            layout={{
              ...data.layout,
              height: 240,
              margin: { l: 45, r: 20, t: 30, b: 35 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              title: { ...data.layout?.title, font: { ...data.layout?.title?.font, size: 13 } }
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

// Inline Map widget to show coordinates trajectory tracks
const InlineMap = ({ wmo, onClose }) => {
  const [trajectory, setTrajectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrajectory = async () => {
      try {
        const response = await api.get(`/argo/profile/${wmo}`);
        const sorted = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setTrajectory(sorted);
      } catch (err) {
        console.error('Failed to load inline map trajectory:', err);
        setError('Failed to load trajectory coordinates.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrajectory();
  }, [wmo]);

  const mapCenter = trajectory.length > 0 
    ? [trajectory[trajectory.length - 1].latitude, trajectory[trajectory.length - 1].longitude] 
    : [20.0, 0.0];

  const linePoints = trajectory.map(pt => [pt.latitude, pt.longitude]);

  return (
    <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 relative">
      <button 
        onClick={onClose}
        className="absolute top-2.5 right-2.5 p-1 rounded-md hover:bg-slate-850 text-slate-500 hover:text-slate-300 z-10"
      >
        <X className="h-4 w-4" />
      </button>
      <h5 className="text-xxs font-bold uppercase tracking-wider text-slate-500 mb-2">
        Inline Trajectory Track - Float {wmo}
      </h5>

      {loading && (
        <div className="h-48 flex flex-col justify-center items-center gap-2 text-sky-400">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-sky-400"></span>
          <span className="text-xxs font-medium animate-pulse">Loading map...</span>
        </div>
      )}

      {error && (
        <div className="h-48 flex justify-center items-center text-rose-400 text-xs gap-2">
          <AlertCircle className="h-4.5 w-4.5" />
          {error}
        </div>
      )}

      {!loading && !error && trajectory.length > 0 && (
        <div className="h-56 w-full rounded-lg overflow-hidden border border-slate-850">
          <MapContainer 
            center={mapCenter} 
            zoom={4} 
            scrollWheelZoom={false} 
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Polyline positions={linePoints} color="#4cc9f0" weight={2} />
            {trajectory.map((pt, idx) => (
              <Marker 
                key={pt.profile_id} 
                position={[pt.latitude, pt.longitude]}
                icon={DefaultIcon}
              />
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Track bookmarked states of messages
  const [bookmarkedList, setBookmarkedList] = useState([]);

  // Active inline visualizers per message ID
  const [activeVisuals, setActiveVisuals] = useState({}); // { [msgId]: { type: 'temperature'|'salinity'|'map', wmo: '1901234' } }

  const messagesEndRef = useRef(null);

  const suggestionChips = [
    { text: 'Show floats in Indian Ocean', icon: Compass },
    { text: 'Show temperature profile for float 1901234', icon: TrendingUp },
    { text: 'Explain QC flags', icon: HelpCircle },
    { text: 'Compare salinity across depths', icon: MapIcon }
  ];

  // Load saved bookmarks from localStorage
  const loadSavedBookmarks = () => {
    const saved = localStorage.getItem('saved_queries');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBookmarkedList(parsed.map(q => q.value || q.title));
    }
  };

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const response = await api.get('/api/v1/conversations');
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Fetch message history for selected conversation
  const fetchHistory = async (convId) => {
    setHistoryLoading(true);
    setError('');
    try {
      const response = await api.get(`/chat/history/${convId}`);
      const sorted = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(sorted);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Could not load chat history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    loadSavedBookmarks();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchHistory(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle autoQuery parameter from Dashboard links
  useEffect(() => {
    if (location.state?.autoQuery) {
      handleSendMessage(location.state.autoQuery);
      // Clear navigation state to prevent running again on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSelectConversation = (id) => {
    if (loading) return;
    setActiveConvId(id);
  };

  const handleNewChat = () => {
    if (loading) return;
    setActiveConvId(null);
    setMessages([]);
    setError('');
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    if (loading) return;
    try {
      await api.delete(`/api/v1/conversations/${id}`);
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Could not delete conversation.');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    setError('');

    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await api.post('/chat/message', {
        content: messageText,
        conversation_id: activeConvId
      });

      const { conversation_id, reply, extracted_entities } = response.data;
      
      if (!activeConvId) {
        setActiveConvId(conversation_id);
        fetchConversations();
      }

      const tempBotMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        content: reply,
        timestamp: new Date().toISOString(),
        extracted_entities: extracted_entities // Keep entities inside message object
      };
      setMessages(prev => [...prev, tempBotMsg]);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Bookmark / Save Query locally
  const handleToggleBookmark = (content) => {
    const saved = localStorage.getItem('saved_queries');
    let current = saved ? JSON.parse(saved) : [];

    if (bookmarkedList.includes(content)) {
      // Remove
      current = current.filter(q => q.value !== content);
      setBookmarkedList(prev => prev.filter(c => c !== content));
    } else {
      // Add
      const newQuery = {
        id: Date.now(),
        title: content.length > 30 ? content.slice(0, 30) + '...' : content,
        type: 'chat',
        value: content
      };
      current.push(newQuery);
      setBookmarkedList(prev => [...prev, content]);
    }
    
    localStorage.setItem('saved_queries', JSON.stringify(current));
  };

  const handleToggleVisual = (msgId, type, wmo) => {
    setActiveVisuals(prev => {
      const current = prev[msgId];
      if (current && current.type === type) {
        // Toggle off if clicking the same one again
        const updated = { ...prev };
        delete updated[msgId];
        return updated;
      }
      return { ...prev, [msgId]: { type, wmo } };
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden animate-fade-in">
      
      {/* Sessions Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              No recent conversations
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`group flex items-center justify-between px-3 py-3 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                  activeConvId === conv.id
                    ? 'bg-slate-800/80 text-sky-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-750 text-slate-500 hover:text-rose-400 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Conversation pane */}
      <div className="flex-1 flex flex-col bg-slate-950">
        
        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400"></span>
              <p className="text-xs">Fetching history logs...</p>
            </div>
          ) : messages.length === 0 ? (
            
            // Empty / Welcome suggestions
            <div className="flex flex-col justify-center items-center h-full max-w-lg mx-auto text-center">
              <div className="p-4 rounded-full bg-sky-950 border border-sky-500/20 text-sky-400 mb-6">
                <Bot className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-100">ARGO Chat Assistant</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Interact with the retrieval-augmented engine. Load float telemetry variables, draw coordinate paths, and search reference operating manuals.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-10">
                {suggestionChips.map((chip, idx) => {
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.text)}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left text-xs text-slate-350 transition-all duration-200 cursor-pointer"
                    >
                      <ChipIcon className="h-4 w-4 text-sky-400 shrink-0" />
                      <span>{chip.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          ) : (

            // Message flow
            <div className="space-y-6">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                
                // Parse float WMO code if mentioned in the message text or metadata
                const wmoMatch = msg.content.match(/\b\d{7}\b/);
                const floatWmo = msg.extracted_entities?.platform_number || (wmoMatch ? wmoMatch[0] : null);
                
                const activeVisual = activeVisuals[msg.id];
                const isBookmarked = bookmarkedList.includes(msg.content);

                return (
                  <div key={msg.id} className="space-y-3">
                    <div className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                      
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${
                        isBot ? 'bg-sky-950 border border-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                      </div>
                      
                      {/* Text Bubble */}
                      <div className="relative group/bubble">
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isBot
                            ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                            : 'bg-sky-500 text-slate-950 font-medium rounded-tr-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          
                          {/* Inline Visualization Action Buttons for Bot responses with float WMO */}
                          {isBot && floatWmo && (
                            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleToggleVisual(msg.id, 'temperature', floatWmo)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xxs font-bold transition-all duration-200 ${
                                  activeVisual?.type === 'temperature'
                                    ? 'bg-sky-500 text-slate-950'
                                    : 'bg-slate-950 hover:bg-slate-850 text-sky-400 border border-sky-550/20'
                                }`}
                              >
                                <Activity className="h-3 w-3" />
                                Temp Plot
                              </button>
                              <button
                                onClick={() => handleToggleVisual(msg.id, 'salinity', floatWmo)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xxs font-bold transition-all duration-200 ${
                                  activeVisual?.type === 'salinity'
                                    ? 'bg-sky-500 text-slate-950'
                                    : 'bg-slate-950 hover:bg-slate-850 text-sky-400 border border-sky-550/20'
                                }`}
                              >
                                <Activity className="h-3 w-3" />
                                Salinity Plot
                              </button>
                              <button
                                onClick={() => handleToggleVisual(msg.id, 'map', floatWmo)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xxs font-bold transition-all duration-200 ${
                                  activeVisual?.type === 'map'
                                    ? 'bg-sky-500 text-slate-950'
                                    : 'bg-slate-950 hover:bg-slate-850 text-sky-400 border border-sky-550/20'
                                }`}
                              >
                                <Globe className="h-3 w-3" />
                                Trajectory Map
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Save Query bookmark icon (visible on bubble hover for User queries) */}
                        {!isBot && (
                          <button
                            onClick={() => handleToggleBookmark(msg.content)}
                            className="absolute -left-10 top-2 p-1.5 rounded-lg opacity-0 group-hover/bubble:opacity-100 hover:bg-slate-900 text-slate-500 hover:text-sky-400 transition-all duration-200 cursor-pointer"
                            title={isBookmarked ? 'Remove saved query' : 'Save query to Dashboard'}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="h-4.5 w-4.5 text-sky-400 animate-bounce" />
                            ) : (
                              <Bookmark className="h-4.5 w-4.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Visualization Canvas Box */}
                    {isBot && activeVisual && activeVisual.wmo === floatWmo && (
                      <div className="pl-11 max-w-[85%]">
                        {activeVisual.type === 'map' ? (
                          <InlineMap 
                            wmo={floatWmo} 
                            onClose={() => setActiveVisuals(prev => {
                              const updated = { ...prev };
                              delete updated[msg.id];
                              return updated;
                            })}
                          />
                        ) : (
                          <InlineChart 
                            wmo={floatWmo} 
                            type={activeVisual.type} 
                            onClose={() => setActiveVisuals(prev => {
                              const updated = { ...prev };
                              delete updated[msg.id];
                              return updated;
                            })}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          )}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="h-8 w-8 rounded-full shrink-0 bg-sky-950 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Bot className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none space-y-2 w-48">
                <div className="h-3 bg-slate-800 animate-pulse rounded-full w-full"></div>
                <div className="h-3 bg-slate-800 animate-pulse rounded-full w-5/6"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Form Input footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }} 
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about ARGO ocean data..."
              disabled={loading || historyLoading}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/10 px-4 py-3 rounded-xl text-slate-200 placeholder-slate-500 outline-none text-sm transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading || historyLoading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:bg-sky-500/40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Chat;
