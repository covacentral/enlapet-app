// backend/models/event.model.js
// VERSIÓN 2.0: CORREGIDO. Se alinea el esquema de validación con los datos enviados por el frontend.

const { z } = require('zod');

// Esquema para la creación de un nuevo evento.
const createEventSchema = z.object({
  // Se cambia 'title' por 'name' para coincidir con el frontend.
  name: z.string()
    .min(5, "El nombre del evento debe tener al menos 5 caracteres.")
    .max(100, "El nombre no puede exceder los 100 caracteres."),
  
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(500, "La descripción no puede exceder los 500 caracteres."),
  
  // Se reemplaza 'date' por 'startDate' y 'endDate'.
  startDate: z.string().datetime({ message: "La fecha de inicio debe estar en formato ISO 8601." }),
  endDate: z.string().datetime({ message: "La fecha de fin debe estar en formato ISO 8601." }),

  category: z.string().min(1, "La categoría es requerida."),

  // Los campos de ubicación (customLat, customLng) son validados en el controlador,
  // por lo que se eliminan de este esquema para evitar redundancia.
});

module.exports = {
  createEventSchema,
};