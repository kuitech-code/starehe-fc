const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export async function fetchApiList(path, label) {
  let response;
  try {
    response = await fetch(`${API_ORIGIN}${path}`);
  } catch {
    throw new Error(`Could not connect to the backend while loading ${label}.`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Could not load ${label}.`);
  if (!Array.isArray(data)) throw new Error(`The ${label} service returned an unexpected response.`);
  return data;
}

export function formatDate(value, options = { day: "numeric", month: "long", year: "numeric" }) {
  if (!value) return "Date to be confirmed";

  const datePart = String(value).slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart)
    ? new Date(`${datePart}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.valueOf())) return "Date to be confirmed";
  return date.toLocaleDateString("en-GB", options);
}

export function formatTime(value) {
  if (!value) return "Time to be confirmed";

  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function imageSource(value) {
  if (!value) return "";
  if (/^(data:|https?:\/\/)/i.test(value)) return value;

  return `${API_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

export function resultLetter(match) {
  if (match.starehe_score === match.opponent_score) return "D";
  return match.starehe_score > match.opponent_score ? "W" : "L";
}