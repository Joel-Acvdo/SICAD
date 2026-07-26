// ============================================================================
// Utilería de imágenes del navegador.
// comprimirImagen(file): recorta la imagen al centro (cuadrada) y la comprime
// a 256px JPEG (~20-40 KB). Devuelve una promesa con el data URL listo para
// mandarse al backend en el mismo POST/PUT del usuario.
// ============================================================================
export function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const lado = 256;
      const canvas = document.createElement('canvas');
      canvas.width = lado;
      canvas.height = lado;
      const min = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, lado, lado);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
