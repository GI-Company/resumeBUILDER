export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "244, 243, 243";
}

export function shadeColor(hex: string, percent: number) {
  const f = parseInt(hex.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = Math.abs(percent);
  const R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  const nR = Math.round(((t - R) * p) / 100) + R,
    nG = Math.round(((t - G) * p) / 100) + G,
    nB = Math.round(((t - B) * p) / 100) + B;
  return (
    "#" + (0x1000000 + nR * 0x10000 + nG * 0x100 + nB).toString(16).slice(1)
  );
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
}
