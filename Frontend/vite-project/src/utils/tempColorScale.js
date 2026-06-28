export const tempToColor = (temp) => {
  const t = Math.max(-2, Math.min(32, temp ?? 15));
  const ratio = (t + 2) / 34;
  const hue = 220 - ratio * 200;
  return `hsl(${hue}, 85%, 55%)`;
};

export const TEMP_LEGEND = [
  { label: 'Cold (< 5°C)', color: tempToColor(2) },
  { label: 'Cool (5–15°C)', color: tempToColor(10) },
  { label: 'Warm (15–25°C)', color: tempToColor(20) },
  { label: 'Hot (> 25°C)', color: tempToColor(28) },
];
