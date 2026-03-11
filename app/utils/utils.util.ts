export const formatTemps = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return h > 0 ? `${h}h${min.toString().padStart(2, '0')}` : `${min} min`;
};