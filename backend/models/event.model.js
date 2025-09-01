// backend/models/event.model.js
// Define la estructura y validación para los documentos de eventos.

const { z } = require('zod');

// Esquema para la creación de un nuevo evento.
const createEventSchema = z.object({
  title: z.string()
    .min(5, "El título debe tener al menos 5 caracteres.")
    .max(100, "El título no puede exceder los 100 caracteres."),
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(500, "La descripción no puede exceder los 500 caracteres."),
  date: z.string().datetime({ message: "La fecha debe estar en formato ISO 8601." }),
  location: z.string().min(5, "La ubicación es requerida."),
  organizerId: z.string().min(1, "Se requiere el ID del organizador."),
  category: z.string().min(1, "La categoría es requerida."),
});

module.exports = {
  createEventSchema,
};