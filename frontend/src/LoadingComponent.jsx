import React, { useState, useEffect } from 'react';
import './App.css';

// --- Base de datos de frases sobre animales ---
const animalFacts = [
  "Laika fue el primer ser vivo en orbitar la Tierra en 1957.",
  "Hachiko, un perro Akita, esperó a su dueño en una estación de tren por 9 años tras su muerte.",
  "Cher Ami, una paloma mensajera, salvó a casi 200 soldados en la I Guerra Mundial entregando un mensaje crucial.",
  "Balto lideró el tramo final de una expedición en trineo para llevar medicinas a Nome, Alaska, en 1925.",
  "Los gatos eran considerados sagrados en el Antiguo Egipcio y se momificaban junto a sus dueños.",
  "Wojtek, un oso pardo, fue enlistado como soldado en el ejército polaco durante la II Guerra Mundial.",
  "La tortuga Harriet, que vivió en el zoológico de Australia, se cree que fue recogida por Charles Darwin.",
  "El pulpo Paul predijo correctamente los resultados de 8 partidos del Mundial de Fútbol de 2010.",
  "Los delfines se llaman unos a otros por 'nombres' únicos a través de silbidos específicos.",
  "Las nutrias de mar duermen tomadas de la mano para no separarse mientras flotan.",
  "Se cree que los perros fueron los primeros animales en ser domesticados por los humanos.",
  "Un grupo de flamencos se llama 'flamboyance'.",
  "Las vacas tienen mejores amigas y se estresan cuando se separan de ellas.",
  "Las huellas de la nariz de un perro son tan únicas como las huellas dactilares de un humano.",
  "Los elefantes son uno de los pocos mamíferos que no pueden saltar.",
  "Las mariposas saborean con sus patas.",
  "Los cuervos son tan inteligentes que pueden reconocer rostros humanos y guardar rencor.",
  "El corazón de un colibrí late más de 1,200 veces por minuto.",
  "Los caballitos de mar son monógamos y el macho es quien lleva los huevos.",
  "Una cucaracha puede vivir varias semanas sin su cabeza.",
  "Las jirafas solo necesitan entre 5 y 30 minutos de sueño en un período de 24 horas.",
  "Los koalas duermen hasta 22 horas al día.",
  "El cerebro de un avestruz es más pequeño que uno de sus ojos.",
  "Los pingüinos 'proponen matrimonio' a su pareja ofreciéndole una piedra.",
  "Las hormigas dejan rastros de feromonas para que otras las sigan.",
  "Los ajolotes pueden regenerar extremidades, órganos e incluso partes de su cerebro.",
  "Los perezosos se mueven tan lento que las algas pueden crecer en su pelaje.",
  "El guepardo es el animal terrestre más rápido, alcanzando velocidades de hasta 120 km/h.",
  "Las ballenas jorobadas crean canciones complejas que pueden durar horas.",
  "Los camaleones cambian de color para regular su temperatura y comunicar su estado de ánimo.",
  "Las abejas pueden reconocer rostros humanos.",
  "El ornitorrinco es uno de los pocos mamíferos venenosos.",
  "Los zorros árticos usan su cola como una manta para abrigarse.",
  "Las medusas han existido por más de 650 millones de años, antes que los dinosaurios.",
  "Los murciélagos son los únicos mamíferos capaces de volar.",
  "Los pulpos tienen tres corazones.",
  "Las cabras tienen pupilas rectangulares.",
  "Los escarabajos peloteros usan la Vía Láctea para navegar.",
  "Los loros pueden aprender cientos de palabras, pero no entienden el lenguaje.",
  "Las anguilas eléctricas pueden generar descargas de hasta 600 voltios.",
  "Los dragones de Komodo son los lagartos más grandes del mundo.",
  "Las ranas pueden congelarse por completo durante el invierno y descongelarse en primavera.",
  "Los topos pueden cavar túneles de hasta 90 metros en una sola noche.",
  "Los osos polares tienen la piel negra debajo de su pelaje blanco.",
  "Las cebras tienen rayas únicas, como una huella dactilar.",
  "Los tiburones han existido por más tiempo que los árboles.",
  "Los búhos no pueden mover sus ojos, por lo que giran su cabeza hasta 270 grados.",
  "Las ardillas plantan miles de árboles cada año al olvidar dónde enterraron sus nueces.",
  "Los castores construyen presas para crear estanques seguros donde vivir.",
  "Los flamencos nacen de color gris; su plumaje rosado proviene de los pigmentos de su comida."
];

function LoadingComponent({ text = "Cargando..." }) {
  const [fact, setFact] = useState('');

  // Selecciona una frase al azar solo cuando el componente se monta por primera vez
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * animalFacts.length);
    setFact(animalFacts[randomIndex]);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-fact">{fact}</p>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
}

export default LoadingComponent;
