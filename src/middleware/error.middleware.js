export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const body = { error: err.message || "Error interno del servidor" };

  console.error(`[${status}] ${err.message}`);
  if (status === 500) console.error(err.stack);
  res.status(status).json(body);
}
