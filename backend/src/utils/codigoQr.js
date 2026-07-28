// ============================================================================
// Generación del código que va DENTRO del QR de una credencial.
//
// OBS-03: el código NO debe contener datos de la persona. Antes era
// "QR-UP230571-XYZ" (embebía la matrícula), así que cualquiera que viera el QR
// —o adivinara el patrón— deducía a quién pertenecía. Ahora es un código
// OPACO y aleatorio de 128 bits: no dice nada de su dueño y no se puede
// adivinar. La relación código → usuario vive solo en la base de datos.
//
// Nota para producción: lo ideal sería además un token FIRMADO y ROTATIVO
// (que caduque cada pocos minutos) para que una captura de pantalla del QR no
// sirva indefinidamente. Queda documentado como mejora futura.
// ============================================================================
const crypto = require('crypto');

function generarCodigoQr() {
  // 16 bytes aleatorios → 32 caracteres hexadecimales, imposible de adivinar.
  return `SICAD-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
}

module.exports = { generarCodigoQr };
