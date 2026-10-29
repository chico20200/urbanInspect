// Uso:  node seed/seed-incidencias.mjs https://TU_ID.mockapi.io/api/v1   (Node 18+)
const base = process.argv[2];
if (!base) {
  console.error('Falta la URL. Ejemplo: node seed/seed-incidencias.mjs https://6ae35f7f933120ae20f8b756.mockapi.io/api/v1');
  process.exit(1);
}

const tipos = ['luminaria', 'bache', 'senalizacion', 'alcantarilla', 'parque'];
const estados = ['pendiente', 'en_proceso', 'resuelta'];
const prioridades = ['baja', 'media', 'alta'];
const lugares = [
  ['Av. Amazonas y Naciones Unidas', 'Iñaquito', -0.1765, -78.4818],
  ['Calle García Moreno y Sucre', 'Centro Histórico', -0.2202, -78.5126],
  ['Av. 10 de Agosto y Colón', 'La Mariscal', -0.2033, -78.4955],
  ['Av. Maldonado y Morán Valverde', 'Quitumbe', -0.2905, -78.5466],
  ['Av. Eloy Alfaro y De los Granados', 'El Batán', -0.1712, -78.4706],
  ['Parque La Carolina, sector lagunas', 'La Carolina', -0.1852, -78.4856],
];
const descripciones = {
  luminaria: 'Luminaria apagada durante la noche',
  bache: 'Bache profundo en el carril derecho',
  senalizacion: 'Señal de pare desgastada y poco visible',
  alcantarilla: 'Alcantarilla obstruida con basura',
  parque: 'Columpio roto en el área infantil',
};

const total = 18; // con limit=5 son 4 páginas
for (let n = 1; n <= total; n++) {
  const tipo = tipos[n % tipos.length];
  const [direccion, sector, lat, lng] = lugares[n % lugares.length];
  const estado = estados[n % estados.length];
  const prioridad = prioridades[(n + 1) % prioridades.length];
  const fecha = new Date(Date.now() - n * 36e5 * 7).toISOString(); // cada 7 horas hacia atrás
  const body = {
    codigo: `INC-SEED${String(n).padStart(2, '0')}`,
    tipo, descripcion: `${descripciones[tipo]} (#${n})`, direccion, sector, fecha, estado, prioridad,
    fotoUrl: null, lat, lng,
    observacion: estado === 'resuelta' ? 'Reparado por la cuadrilla municipal.' : null,
    climaTemperatura: null, climaPrecipitacion: null, climaDescripcion: null,
  };
  const r = await fetch(`${base}/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log(`${n}/${total} ${body.codigo} ${estado} ${prioridad} → HTTP ${r.status}`);
}