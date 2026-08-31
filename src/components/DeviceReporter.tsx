"use client";

import { useEffect } from "react";

function installationId() { const key = "lbbs_customer_installation_id"; let value = localStorage.getItem(key); if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); } return value; }
export function DeviceReporter() { useEffect(() => { const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true; void fetch("/api/devices/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ installationId: installationId(), isPwa: standalone, platform: navigator.platform || "unknown", language: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown" }) }).catch(() => undefined); }, []); return null; }
