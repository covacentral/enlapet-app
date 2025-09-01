// backend/models/post.model.js
// Define la estructura y validación para los documentos de publicaciones (posts).

const { z } = require('zod');

// Esquema para la creación de un nuevo post.
const createPostSchema = z.object({
  caption: z.string()
    .min(1, "El texto de la publicación no puede estar vacío.")
    .max(280, "El texto no puede exceder los 280 caracteres."),
  authorId: z.string().min(1, "Se requiere el ID del autor."),
  authorType: z.enum(['user', 'pet'], { errorMap: () => ({ message: "El tipo de autor debe ser 'user' o 'pet'." }) }),
  missionId: z.string().optional(),
  petId: z.string().optional(),
});

module.exports = {
  createPostSchema,
};