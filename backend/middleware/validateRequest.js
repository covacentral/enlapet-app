const validateRequest = (schema) => async (req, res, next) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      // Si la validación falla, Zod emite un error con un array 'issues'.
      // Mapeamos estos issues para crear un mensaje de error claro para el cliente.
      const errorMessages = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      
      // Respondemos con un estado 400 (Bad Request) y los detalles del error.
      return res.status(400).json({
        error: "La solicitud contiene datos inválidos o incompletos.",
        details: errorMessages,
      });
    }
  };
  
  module.exports = validateRequest;