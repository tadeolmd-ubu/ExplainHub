export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const body = { error: status >= 500 ? "Error interno del servidor" : err.message };

  console.error(`[${status}] ${err.message}`);
  if (status === 500) console.error(err.stack);
  res.status(status).json(body);
}
