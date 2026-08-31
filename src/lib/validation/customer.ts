import { z } from "zod";

export const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");
export const customerRegistrationSchema = z.object({
  firstName: z.string().transform(normalizeText).pipe(z.string().min(1, "Los nombres son obligatorios.")),
  lastName: z.string().transform(normalizeText).pipe(z.string().min(1, "Los apellidos son obligatorios.")),
  documentType: z.string().trim().min(1, "El tipo de documento es obligatorio."),
  documentNumber: z.string().trim().min(1, "El número de documento es obligatorio."),
  phone: z.string().trim().min(1, "El teléfono es obligatorio."),
  email: z.string().email().optional().nullable(),
}).superRefine((value, context) => {
  const document = value.documentNumber.replace(/[\s.-]/g, "");
  if (value.documentType === "DNI" && !/^\d{8}$/.test(document)) context.addIssue({ code: "custom", path: ["documentNumber"], message: "El DNI debe tener 8 dígitos." });
  if (value.documentType === "RUC" && !/^\d{11}$/.test(document)) context.addIssue({ code: "custom", path: ["documentNumber"], message: "El RUC debe tener 11 dígitos." });
  if (!/^[\p{L}\p{N} .-]{4,30}$/u.test(document)) context.addIssue({ code: "custom", path: ["documentNumber"], message: "El documento contiene caracteres no válidos." });
  if (value.phone.replace(/\D/g, "").length < 9) context.addIssue({ code: "custom", path: ["phone"], message: "El teléfono debe tener al menos 9 dígitos." });
});
