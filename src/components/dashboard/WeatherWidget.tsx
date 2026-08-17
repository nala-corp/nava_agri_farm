import React, { useState } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Sparkles,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface WeatherProps {
  locationName?: string;
}

export const WeatherWidget: React.FC<WeatherProps> = ({ locationName = 'Karanganyar, Jawa Tengah' }) => {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Weather simulation state for agronomy recommendations
  const weatherForecast = [
    {
      day: 'Hari Ini',
      date: '17 Ags',
      temp: 29,
      tempMin: 22,
      tempMax: 32,
      condition: 'Cerah Berawan',
      icon: 'cloud-sun',
      humidity: 68,
      windSpeed: 11,
      rainChance: 20,
      uvIndex: 'Tinggi (7.4)',
      evapotranspiration: '3.8 mm/hari',
      agronomyAdvice: {
        sprayWindow: 'Sangat Baik: Pagi 06.30 - 09.00 atau Sore 15.30 - 17.30',
        irrigationAdvice: 'Irigasi normal 1.5 liter/tanaman pagi hari.',
        pestAlert: 'Angin sedang aman untuk aplikasi semprot foliar.'
      }
    },
    {
      day: 'Besok',
      date: '18 Ags',
      temp: 27,
      tempMin: 21,
      tempMax: 30,
      condition: 'Hujan Ringan Sore',
      icon: 'cloud-rain',
      humidity: 78,
      windSpeed: 14,
      rainChance: 65,
      uvIndex: 'Sedang (5.2)',
      evapotranspiration: '2.9 mm/hari',
      agronomyAdvice: {
        sprayWindow: 'Utamakan pagi 06.00 - 08.30 (Gunakan perekat/perekat perata).',
        irrigationAdvice: 'Kurangi debit siram 30% antisipasi hujan sore.',
        pestAlert: 'Waspada kelembaban tinggi memicu spora jamur bercak daun.'
      }
    },
    {
      day: 'Lusa',
      date: '19 Ags',
      temp: 31,
      tempMin: 23,
      tempMax: 33,
      condition: 'Cerah Terik',
      icon: 'sun',
      humidity: 58,
      windSpeed: 8,
      rainChance: 10,
      uvIndex: 'Sangat Tinggi (9.0)',
      evapotranspiration: '4.5 mm/hari',
      agronomyAdvice: {
        sprayWindow: 'Pagi lebih awal 06.00 - 08.00 untuk hindari penguapan.',
        irrigationAdvice: 'Tingkatkan durasi drip irigasi di siang menjelang sore.',
        pestAlert: 'Cuaca panas memicu populasi kutu kebul & thrips meningkat.'
      }
    }
  ];

  const current = weatherForecast[selectedDay];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="bg-white border border-[#e9ece6] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#e9ece6]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            {current.icon === 'sun' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : current.icon === 'cloud-rain' ? (
              <CloudRain className="w-4 h-4 text-blue-500" />
            ) : (
              <CloudSun className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              Prakiraan Cuaca & Rekomendasi Agronomi
            </h3>
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-600" /> {locationName}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-1.5 text-gray-400 hover:text-emerald-700 rounded-lg cursor-pointer transition-transform ${
            isRefreshing ? 'animate-spin text-emerald-700' : ''
          }`}
          title="Perbarui Data Cuaca"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Weather Display */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Metrics */}
        <div className="sm:col-span-1 p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-800 block">
              {current.day} ({current.date})
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-slate-800 font-mono">
                {current.temp}°C
              </span>
              <span className="text-[11px] text-gray-500">
                ({current.tempMin}° - {current.tempMax}°)
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-900 mt-1 block">
              {current.condition}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-200/50 text-[11px]">
            <div className="flex items-center gap-1 text-slate-600">
              <Droplets className="w-3.5 h-3.5 text-teal-600" />
              <span>{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
              <span>{current.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <CloudRain className="w-3.5 h-3.5 text-blue-500" />
              <span>Hujan {current.rainChance}%</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">UV: {current.uvIndex.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Smart Agronomy Recommendation */}
        <div className="sm:col-span-2 p-3.5 bg-[#fbfcfb] rounded-xl border border-[#e9ece6] space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Panduan Agronomi Lapangan
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-[#f0f2ed]">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 font-semibold">Jendela Semprot / Foliar:</strong>
                  <p className="text-[11px] text-gray-600 mt-0.5">{current.agronomyAdvice.sprayWindow}</p>
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-slate-700 bg-white p-2 rounded-lg border border-[#f0f2ed]">
                <Droplets className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 font-semibold">Rekomendasi Air & Irigasi:</strong>
                  <p className="text-[11px] text-gray-600 mt-0.5">{current.agronomyAdvice.irrigationAdvice}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{current.agronomyAdvice.pestAlert}</span>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast Selector */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#e9ece6]">
        {weatherForecast.map((w, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedDay(idx)}
            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
              selectedDay === idx
                ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30'
                : 'bg-white border-[#e9ece6] hover:bg-[#f9faf8]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-800">{w.day}</span>
              <span className="font-mono text-gray-500">{w.temp}°C</span>
            </div>
            <div className="text-[11px] text-gray-500 truncate mt-0.5">
              {w.condition}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
