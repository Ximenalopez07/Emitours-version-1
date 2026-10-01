import fabiolaImg from '../assets/fabiola.jpg';
import yulisaImg from '../assets/yulisa.jpg';
import marianaImg from '../assets/mariana.jpg';
import gloriaImg from '../assets/gloria.jpg';
import comuna13Img from '../assets/comuna13.jpg';

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
