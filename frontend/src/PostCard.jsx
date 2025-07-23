// frontend/src/PostCard.jsx
// Versión: 1.0 - Componente de Tarjeta de Publicación
// Muestra una publicación individual con imagen, autor, texto y contadores.
// Creado para el Sprint 3: Comunidad.

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react'; // Iconos para interacción

function PostCard({ post }) {
  // Medida de seguridad: no renderizar nada si el post o el autor no son válidos.
  if (!post || !post.author) {
    return null;
  }

  // Fallback para la foto de perfil del autor si no existe.
  const profilePic = post.author.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)';
  
  // Formatear la fecha para que sea más legible para el usuario.
  const postDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Determinar la ruta al perfil del autor (mascota o usuario)
  const authorProfileLink = `/dashboard/pet/${post.author.id}`; // Asumimos que por ahora todos los autores son mascotas

  return (
    <div className="post-card-container bg-white border border-gray-200 rounded-lg shadow-sm mb-6 max-w-xl mx-auto">
      {/* Cabecera de la Tarjeta con enlace al perfil del autor */}
      <Link to={authorProfileLink} className="flex items-center p-4 hover:bg-gray-50 rounded-t-lg">
        <img
          src={profilePic}
          alt={`Perfil de ${post.author.name}`}
          className="w-10 h-10 rounded-full object-cover mr-4"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/4A5568?text=:)' }}
        />
        <span className="font-bold text-gray-800">{post.author.name}</span>
      </Link>

      {/* Imagen de la Publicación */}
      <div className="post-image-wrapper">
        <img
          src={post.imageUrl}
          alt={`Publicación de ${post.author.name}: ${post.caption}`}
          className="w-full h-auto object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/4A5568?text=Imagen+no+disponible' }}
        />
      </div>

      {/* Cuerpo y Acciones */}
      <div className="p-4">
        <div className="flex items-center text-gray-500 mb-2">
          {/* Botón de Like (Pata Arriba) - Funcionalidad a conectar en futuro sprint */}
          <button className="flex items-center mr-6 hover:text-red-500 transition-colors">
            <Heart size={20} className="mr-2" />
            <span>{post.likesCount}</span>
          </button>
          
          {/* Botón de Comentarios - Funcionalidad a conectar en futuro sprint */}
          <button className="flex items-center hover:text-blue-500 transition-colors">
            <MessageCircle size={20} className="mr-2" />
            <span>{post.commentsCount}</span>
          </button>
        </div>

        <p className="text-gray-700 mb-4">
          {post.caption}
        </p>
        
        <p className="text-xs text-gray-400 mt-4">{postDate}</p>
      </div>
    </div>
  );
}

export default PostCard;
