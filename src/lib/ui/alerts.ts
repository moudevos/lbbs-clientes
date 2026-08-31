"use client";

import Swal from "sweetalert2";

const base = { confirmButtonColor: "#008c68", background: "#ffffff", color: "#10213a" };
export function showSuccess(title: string, text?: string) { return Swal.fire({ ...base, icon: "success", title, text }); }
export function showError(title: string, text?: string) { return Swal.fire({ ...base, icon: "error", title, text }); }
export async function showConfirm(title: string, text: string, confirmButtonText = "Confirmar") { const result = await Swal.fire({ ...base, icon: "question", title, text, showCancelButton: true, confirmButtonText, cancelButtonText: "Cancelar" }); return result.isConfirmed; }
export function showToast(title: string, icon: "success" | "info" | "warning" | "error" = "success") { return Swal.fire({ ...base, toast: true, icon, title, position: "top-end", showConfirmButton: false, timer: 3200, timerProgressBar: true }); }
