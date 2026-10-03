export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada'
  });
};

export const errorHandler = (error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Error interno del servidor'
  });
};
