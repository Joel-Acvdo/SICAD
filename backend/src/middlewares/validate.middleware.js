// Middleware de validación con Zod. Valida req.body contra un esquema.
// Además del mensaje general, devuelve los errores AGRUPADOS POR CAMPO
// ({ campo: "motivo" }) para que el formulario los pinte debajo de cada input
// en vez de mostrar un texto largo y técnico al final.
function validar(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      const errores = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path.join('.') || '_';
        if (!errores[campo]) errores[campo] = issue.message; // el primero por campo
      }
      const mensaje = resultado.error.issues[0]?.message || 'Revisa los datos del formulario';
      return res.status(400).json({ error: mensaje, errores });
    }
    req.body = resultado.data;
    next();
  };
}

module.exports = { validar };
