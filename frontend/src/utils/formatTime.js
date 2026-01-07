export const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "00:00";
  
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  
  // Menambahkan leading zero jika kurang dari 10
  const mm = m < 10 ? `0${m}` : m;
  const ss = s < 10 ? `0${s}` : s;
  
  return `${mm}:${ss}`;
};
