import fabiolaImg from '../assets/fabiola.jpg';
import yulisaImg from '../assets/yulisa.jpg';
import marianaImg from '../assets/mariana.jpg';
import gloriaImg from '../assets/gloria.jpg';
import comuna13Img from '../assets/comuna13.jpg';
import logoImg from '../assets/logo.jpg';

export const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const guiasMap = {
  fabiola: fabiolaImg,
  yulisa: yulisaImg,
  mariana: marianaImg,
  gloria: gloriaImg
};

/**
 * Resuelve la fotografía real de un guía a partir de la ruta guardada en la base de datos
 * (ej: "src/assets/fabiola.jpg", "src\\assets\\yulisa.jpg", URLs completas o nombres de archivo)
 */
export function resolveGuiaPhoto(fotoPath, nombre = '') {
  if (!fotoPath && !nombre) {
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300';
  }

  // 1. Si es una URL absoluta o base64
  if (typeof fotoPath === 'string' && (fotoPath.startsWith('http://') || fotoPath.startsWith('https://') || fotoPath.startsWith('data:'))) {
    return fotoPath;
  }

  const str = `${fotoPath || ''} ${nombre || ''}`.toLowerCase().replace(/\\/g, '/');

  if (str.includes('fabiola')) return fabiolaImg;
  if (str.includes('yulisa')) return yulisaImg;
  if (str.includes('mariana')) return marianaImg;
  if (str.includes('gloria')) return gloriaImg;

  // Si tiene formato de archivo local en public
  if (typeof fotoPath === 'string') {
    const filename = fotoPath.split(/[/\\]/).pop();
    if (filename && filename.endsWith('.jpg')) {
      return `/assets/${filename}`;
    }
  }

  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300';
}

/**
 * Resuelve la fotografía de un lugar turístico
 */
export function resolveLugarPhoto(imagenPath, nombre = '') {
  if (!imagenPath && !nombre) {
    return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600';
  }

  if (typeof imagenPath === 'string' && (imagenPath.startsWith('http://') || imagenPath.startsWith('https://') || imagenPath.startsWith('data:'))) {
    return imagenPath;
  }

  const str = `${imagenPath || ''} ${nombre || ''}`.toLowerCase();
  if (str.includes('comuna 13') || str.includes('comuna13')) return comuna13Img;

  if (typeof imagenPath === 'string') {
    const filename = imagenPath.split(/[/\\]/).pop();
    if (filename && (filename.endsWith('.jpg') || filename.endsWith('.png'))) {
      return `/assets/${filename}`;
    }
  }

  return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600';
}

/**
 * Resuelve la fotografía o avatar de un usuario
 * Maneja:
 * - Cuentas institucionales/empresa ("Emi tours", "emitours", referencias a logo) -> logoImg
 * - URLs completas (Google OAuth lh3.googleusercontent.com, CDNs)
 * - Nombres o rutas locales de assets (ej: "logo.jpg", "src/assets/logo.jpg")
 * - Fallback predeterminado a DEFAULT_USER_AVATAR evitando imágenes rotas
 */
export function resolveUserPhoto(fotoPath, nombre = '') {
  const nombreLower = String(nombre || '').toLowerCase().trim();
  const fotoLower = String(fotoPath || '').toLowerCase().trim();

  // 1. Si el nombre del usuario o la ruta contiene referencia al logo de Emi Tours
  if (
    nombreLower.includes('emi tours') ||
    nombreLower.includes('emitours') ||
    fotoLower.includes('logo') ||
    fotoLower.includes('emitours') ||
    fotoLower.includes('emi tours')
  ) {
    return logoImg;
  }

  // 2. Si no tiene foto definida
  if (!fotoPath || typeof fotoPath !== 'string' || !fotoPath.trim()) {
    return DEFAULT_USER_AVATAR;
  }

  const clean = fotoPath.trim();

  // 3. URLs completas (Google OAuth, Unsplash, http, https, data:)
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }

  // 4. Mapeo a imágenes del proyecto
  if (clean.toLowerCase().includes('logo')) return logoImg;
  if (clean.toLowerCase().includes('fabiola')) return fabiolaImg;
  if (clean.toLowerCase().includes('yulisa')) return yulisaImg;
  if (clean.toLowerCase().includes('mariana')) return marianaImg;
  if (clean.toLowerCase().includes('gloria')) return gloriaImg;

  // 5. Archivos locales con extensión de imagen
  const filename = clean.split(/[/\\]/).pop();
  if (filename && /\.(jpg|jpeg|png|webp|svg)$/i.test(filename)) {
    if (filename.toLowerCase().includes('logo')) return logoImg;
    return `/assets/${filename}`;
  }

  return DEFAULT_USER_AVATAR;
}
