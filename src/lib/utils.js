import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function humanizeSize(bytes) {
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log2(Number(bytes)) / 10);
  return (Number(bytes) / 1024 ** i).toFixed(1) + sizes[i];
}

export function mimeToExt(mime) {
  const ext = mime.split("/")[1]?.split("+")[0];
  return ext ? ext.toUpperCase() : "";
}

export function secondsUntil({ now, futureDate }) {
  const diff = futureDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}
