// frontend/src/utils/colombiaData.js
// Este archivo contiene los datos geográficos de Colombia para los formularios.

export const colombiaData = [
  { "departamento": "Amazonas", "ciudades": ["Leticia", "Puerto Nariño"] },
  { "departamento": "Antioquia", "ciudades": ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó", "Rionegro"] },
  { "departamento": "Arauca", "ciudades": ["Arauca", "Saravena", "Tame"] },
  { "departamento": "Atlántico", "ciudades": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga"] },
  { "departamento": "Bolívar", "ciudades": ["Cartagena", "Magangué", "Turbaco"] },
  { "departamento": "Boyacá", "ciudades": ["Tunja", "Duitama", "Sogamoso"] },
  { "departamento": "Caldas", "ciudades": ["Manizales", "La Dorada", "Chinchiná"] },
  { "departamento": "Caquetá", "ciudades": ["Florencia", "San Vicente del Caguán"] },
  { "departamento": "Casanare", "ciudades": ["Yopal", "Aguazul", "Villanueva"] },
  { "departamento": "Cauca", "ciudades": ["Popayán", "Santander de Quilichao"] },
  { "departamento": "Cesar", "ciudades": ["Valledupar", "Aguachica", "Agustín Codazzi"] },
  { "departamento": "Chocó", "ciudades": ["Quibdó", "Istmina"] },
  { "departamento": "Córdoba", "ciudades": ["Montería", "Cereté", "Sahagún", "Lorica"] },
  { "departamento": "Cundinamarca", "ciudades": ["Bogotá D.C.", "Soacha", "Fusagasugá", "Facatativá", "Zipaquirá", "Chía", "Girardot"] },
  { "departamento": "Guainía", "ciudades": ["Inírida"] },
  { "departamento": "Guaviare", "ciudades": ["San José del Guaviare"] },
  { "departamento": "Huila", "ciudades": ["Neiva", "Pitalito", "Garzón"] },
  { "departamento": "La Guajira", "ciudades": ["Riohacha", "Maicao", "Uribia"] },
  { "departamento": "Magdalena", "ciudades": ["Santa Marta", "Ciénaga", "Fundación"] },
  { "departamento": "Meta", "ciudades": ["Villavicencio", "Acacías", "Granada"] },
  { "departamento": "Nariño", "ciudades": ["Pasto", "Tumaco", "Ipiales"] },
  { "departamento": "Norte de Santander", "ciudades": ["Cúcuta", "Ocaña", "Pamplona"] },
  { "departamento": "Putumayo", "ciudades": ["Mocoa", "Puerto Asís", "Orito"] },
  { "departamento": "Quindío", "ciudades": ["Armenia", "Calarcá", "Montenegro"] },
  { "departamento": "Risaralda", "ciudades": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"] },
  { "departamento": "San Andrés y Providencia", "ciudades": ["San Andrés"] },
  { "departamento": "Santander", "ciudades": ["Bucaramanga", "Floridablanca", "Barrancabermeja", "Girón", "Piedecuesta"] },
  { "departamento": "Sucre", "ciudades": ["Sincelejo", "Corozal", "Tolú"] },
  { "departamento": "Tolima", "ciudades": ["Ibagué", "Espinal", "Melgar"] },
  { "departamento": "Valle del Cauca", "ciudades": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago"] },
  { "departamento": "Vaupés", "ciudades": ["Mitú"] },
  { "departamento": "Vichada", "ciudades": ["Puerto Carreño"] }
];

export const departments = colombiaData.map(d => d.departamento).sort();
