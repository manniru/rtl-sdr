import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Preset {
  name: string;
  frequency: number;
}

const DEFAULT_PRESETS: Preset[] = [
  { name: "Station 1", frequency: 88.1 },
  { name: "Station 2", frequency: 92.3 },
  { name: "Station 3", frequency: 96.5 },
  { name: "Station 4", frequency: 100.7 },
  { name: "Station 5", frequency: 104.3 },
  { name: "Station 6", frequency: 107.9 },
];

function App() {
  const [frequency, setFrequency] = useState(100.0);
  const [volume, setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(20).fill(20));

  // Check device connection on mount
  useEffect(() => {
    checkDevice();
  }, []);

  // Visualizer animation when playing
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerBars(Array(20).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setVisualizerBars(
        Array(20)
          .fill(0)
          .map(() => Math.random() * 80 + 20)
      );
      setSignalStrength(Math.floor(Math.random() * 3) + 3);
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const checkDevice = async () => {
    try {
      const connected = await invoke<boolean>("check_device");
      setIsConnected(connected);
    } catch (error) {
      console.error("Device check failed:", error);
      setIsConnected(false);
    }
  };

  const handlePlay = async () => {
    try {
      if (isPlaying) {
        await invoke("stop_radio");
        setIsPlaying(false);
        setSignalStrength(0);
      } else {
        await invoke("start_radio", { frequency: frequency * 1e6 });
        setIsPlaying(true);
        setSignalStrength(4);
      }
    } catch (error) {
      console.error("Radio control failed:", error);
    }
  };

  const handleFrequencyChange = useCallback(
    async (newFrequency: number) => {
      setFrequency(newFrequency);
      setActivePreset(null);

      if (isPlaying) {
        try {
          await invoke("tune_frequency", { frequency: newFrequency * 1e6 });
        } catch (error) {
          console.error("Tune failed:", error);
        }
      }
    },
    [isPlaying]
  );

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    try {
      await invoke("set_volume", { volume: newVolume });
    } catch (error) {
      console.error("Volume change failed:", error);
    }
  };

  const selectPreset = (index: number) => {
    setActivePreset(index);
    handleFrequencyChange(presets[index].frequency);
  };

  const formatFrequency = (freq: number) => {
    return freq.toFixed(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FM Radio</h1>
              <p className="text-xs text-white/50">RTL-SDR Receiver</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`status-dot ${isConnected ? "connected" : ""} ${
                isPlaying ? "playing" : ""
              }`}
            />
            <span className="text-xs text-white/60">
              {isPlaying ? "Playing" : isConnected ? "Ready" : "No Device"}
            </span>
          </div>
        </div>

        {/* Frequency Display */}
        <div className="text-center mb-8">
          <div className="frequency-display">{formatFrequency(frequency)}</div>
          <div className="text-white/50 text-sm mt-1">MHz FM</div>
        </div>

        {/* Visualizer */}
        <div className="flex items-end justify-center gap-1 h-16 mb-8">
          {visualizerBars.map((height, index) => (
            <div
              key={index}
              className="visualizer-bar transition-all duration-150"
              style={{
                height: isPlaying ? `${height}%` : "20%",
                opacity: isPlaying ? 1 : 0.3,
                animationDelay: `${index * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Frequency Slider */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="range"
              min="88"
              max="108"
              step="0.1"
              value={frequency}
              onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
              className="frequency-slider"
            />
            {/* Frequency scale */}
            <div className="flex justify-between mt-3 px-1">
              {[88, 92, 96, 100, 104, 108].map((mark) => (
                <span key={mark} className="text-xs text-white/40">
                  {mark}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {/* Step Down */}
          <button
            onClick={() => handleFrequencyChange(Math.max(88, frequency - 0.1))}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play/Stop Button */}
          <button
            onClick={handlePlay}
            className={`play-button ${isPlaying ? "playing" : ""}`}
            disabled={!isConnected}
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Step Up */}
          <button
            onClick={() => handleFrequencyChange(Math.min(108, frequency + 0.1))}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-4 mb-8 px-2">
          <svg
            className="w-5 h-5 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="volume-slider flex-1"
          />
          <svg
            className="w-5 h-5 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <span className="text-white/60 text-sm w-10 text-right">{volume}%</span>
        </div>

        {/* Signal Strength */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xs text-white/40 mr-2">Signal</span>
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`signal-bar ${level <= signalStrength ? "active" : ""}`}
              style={{ height: `${level * 6 + 8}px` }}
            />
          ))}
        </div>

        {/* Presets */}
        <div>
          <div className="text-xs text-white/40 mb-3 uppercase tracking-wider">Presets</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => selectPreset(index)}
                className={`preset-button ${activePreset === index ? "active" : ""}`}
              >
                <div className="font-medium">{preset.frequency}</div>
                <div className="text-xs opacity-60">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
