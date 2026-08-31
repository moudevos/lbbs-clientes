"use client";

import { useEffect, useState } from "react";

import { showError } from "@/lib/ui/alerts";

type Movement = { type: string; title: string; description: string; date: string; value: number; unit: string; status: string };

export function MovementsClient() {
  const [items, setItems] = useState<Movement[]>([]);
  const [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(nextOffset = 0) {
    setLoading(true);
    try {
      const response = await fetch(`/api/rewards/movements?limit=20&offset=${nextOffset}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudieron cargar los movimientos.");
      setItems(nextOffset ? (previous) => [...previous, ...result.data.items] : result.data.items);
      setOffset(nextOffset + result.data.items.length);
      setMore(result.data.hasMore);
    } catch (error) {
      await showError("No se pudo cargar movimientos", error instanceof Error ? error.message : "Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  return <section className="customer-card"><p className="customer-eyebrow">Rewards</p><h1 className="customer-title">Movimientos</h1><ul className="customer-list">{items.map((movement, index) => <li key={`${movement.date}-${index}`}><strong>{movement.title}</strong><small>{movement.description} · {new Date(movement.date).toLocaleDateString("es-PE")}</small><small>{movement.value > 0 ? "+" : ""}{movement.value} {movement.unit}</small></li>)}{!loading && !items.length ? <li>Aún no tienes movimientos.</li> : null}</ul>{more ? <button className="customer-button customer-button--secondary" disabled={loading} onClick={() => void load(offset)}>Ver más</button> : null}</section>;
}
