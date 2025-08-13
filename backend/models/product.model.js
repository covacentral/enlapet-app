// backend/models/product.model.js
// Define la estructura y valores por defecto para un documento de producto en Firestore.

/**
 * @typedef {Object} ProductPrice
 * @property {number} amount - El precio en la unidad monetaria más pequeña (ej. centavos). Para 100,000 COP, sería 10000000.
 * @property {'COP'} currency - El código de la moneda.
 */

/**
 * @typedef {Object} ProductDimensions
 * @property {number} weight - Peso en gramos.
 * @property {number} height - Alto en cm.
 * @property {number} width - Ancho en cm.
 * @property {number} length - Largo en cm.
 */

/**
 * Devuelve el objeto base para un nuevo producto.
 * @param {Object} data - Datos iniciales del producto.
 * @param {string} data.name - Nombre del producto (ej. "Collar Inteligente EnlaPet").
 * @param {string} data.sku - Stock Keeping Unit, identificador único de inventario.
 * @param {number} data.priceAmount - Precio en la unidad monetaria principal (ej. 100000).
 * @returns {Object} El objeto de producto para Firestore.
 */
const getNewProduct = ({ name, sku, priceAmount }) => ({
    name,
    sku,
    description: '',
    /** @type {ProductPrice} */
    price: {
      amount: priceAmount * 100, // Almacenamos en centavos para evitar problemas con decimales
      currency: 'COP',
    },
    stock: 0,
    isActive: true, // Para activar o desactivar la visibilidad del producto
    imageUrl: '',
    galleryImageUrls: [],
    /** @type {ProductDimensions} */
    shippingDetails: {
      weight: 0,
      height: 0,
      width: 0,
      length: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  module.exports = {
    getNewProduct
  };