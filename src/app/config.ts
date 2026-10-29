// Datos de configuración de servicios externos.
// Ninguno es secreto: MockAPI y el preset sin firmar de Cloudinary son públicos por diseño.
export const CONFIG = {
  // URL de tu proyecto MockAPI (Paso 1). Ej.: https://6720abcd1234.mockapi.io/api/v1
  mockApiUrl: 'https://TU_ID.mockapi.io/api/v1',
  // Cloudinary (Paso 4.4): nombre de la nube y nombre del preset SIN firmar
  cloudinaryCloudName: 'wum6nkel',
  cloudinaryUploadPreset: 'TU_PRESET_SIN_FIRMAR',
  // Open-Meteo no necesita clave
  openMeteoUrl: 'https://api.open-meteo.com/v1/forecast',
  pageSize: 5, // grupos pequeños (R3); con 15+ registros hay al menos 3 páginas
  umbralLluviaMm: 5, // R4
};
