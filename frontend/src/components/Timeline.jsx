import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css'; // Import style bawaan
import { formatTime } from '../utils/formatTime';

const Timeline = ({ 
  duration, 
  startTime, 
  endTime, 
  currentTime, 
  onRangeChange 
}) => {
  
  // Menghitung posisi playhead (garis merah) dalam persen
  const playheadPosition = (currentTime / duration) * 100;

  return (
    <div className="w-full px-2 py-4">
      {/* Time Labels */}
      <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
        <span>{formatTime(startTime)}</span>
        <span className="text-blue-400">Durasi Klip: {formatTime(endTime - startTime)}</span>
        <span>{formatTime(endTime)}</span>
      </div>

      <div className="relative h-6 flex items-center">
        {/* Indikator Posisi Video (Playhead) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none transition-all duration-100 ease-linear"
          style={{ left: `${playheadPosition}%`, height: '24px' }}
        >
          {/* Kepala Playhead */}
          <div className="w-2 h-2 bg-red-500 rounded-full -ml-[3px] -mt-1 shadow"></div>
        </div>

        {/* Slider Utama */}
        <Slider
          range
          min={0}
          max={duration}
          step={0.1} // Presisi hingga 0.1 detik
          defaultValue={[0, duration]}
          value={[startTime, endTime]}
          onChange={(val) => onRangeChange(val)}
          
          // Styling Custom agar sesuai tema Gelap
          trackStyle={[{ backgroundColor: '#3B82F6', height: 8 }]} // Warna area yang dipilih (Biru)
          handleStyle={[
            { borderColor: '#3B82F6', backgroundColor: '#fff', opacity: 1, height: 20, width: 20, marginTop: -6 },
            { borderColor: '#3B82F6', backgroundColor: '#fff', opacity: 1, height: 20, width: 20, marginTop: -6 }
          ]}
          railStyle={{ backgroundColor: '#4B5563', height: 8 }} // Warna track yang tidak dipilih (Abu-abu)
        />
      </div>
      
      <div className="text-right text-xs text-gray-500 mt-1">
        Total Video: {formatTime(duration)}
      </div>
    </div>
  );
};

export default Timeline;
