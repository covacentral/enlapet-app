import {
    getNewPetProfile,
    petProfileSchema,
    updatePetProfileSchema
  } from '../models/pet.model.js'
  import {
    findPetsByOwnerId,
    createPet,
    findPetById,
    updatePet,
    deletePet,
    findPetByNFCId
  } from '../services/pet.service.js'
  import { findUserById } from '../services/auth.service.js'
  import { bucket } from '../config/firebase.js'
  import { v4 as uuidv4 } from 'uuid'
  
  // Obtener todas las mascotas del usuario logueado
  export const getMyPets = async (req, res) => {
    try {
      const pets = await findPetsByOwnerId(req.user.uid)
      res.status(200).json(pets)
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las mascotas' })
    }
  }
  
  // Obtener una mascota por su ID
  export const getPetById = async (req, res) => {
    try {
      const pet = await findPetById(req.params.id)
      if (!pet) {
        return res.status(404).json({ message: 'Mascota no encontrada' })
      }
      // Opcional: Verificar  si el usuario tiene permiso para ver esta mascota
      // if (pet.ownerId !== req.user.uid) {
      //   return res.status(403).json({ message: 'No tienes permiso para ver esta mascota' });
      // }
      res.status(200).json(pet)
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la mascota' })
    }
  }
  
  // Crear una nueva mascota
  export const createNewPet = async (req, res) => {
    try {
      const user = await findUserById(req.user.uid)
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }
  
      const petData = getNewPetProfile({
        ...req.body,
        ownerId: req.user.uid,
        ownerInfo: {
          name: user.name,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email
        }
      })
  
      const newPet = await createPet(petData)
      res.status(201).json(newPet)
    } catch (error) {
      console.error('Error al crear la mascota:', error)
      res.status(500).json({ message: 'Error al crear la mascota' })
    }
  }
  
  // Actualizar una mascota
  export const updatePetById = async (req, res) => {
    try {
      const pet = await findPetById(req.params.id)
      if (!pet) {
        return res.status(404).json({ message: 'Mascota no encontrada' })
      }
  
      if (pet.ownerId !== req.user.uid) {
        return res
          .status(403)
          .json({ message: 'No tienes permiso para editar esta mascota' })
      }
  
      // Validar los datos de entrada con el esquema de actualización
      const validatedData = updatePetProfileSchema.parse(req.body)
  
      const updatedPet = await updatePet(req.params.id, validatedData)
      res.status(200).json(updatedPet)
    } catch (error) {
      if (error.name === 'ZodError') {
        return res
          .status(400)
          .json({ message: 'Datos de mascota inválidos', errors: error.errors })
      }
      console.error(error)
      res.status(500).json({ message: 'Error al actualizar la mascota' })
    }
  }
  
  // Eliminar una mascota
  export const deletePetById = async (req, res) => {
    try {
      const pet = await findPetById(req.params.id)
      if (!pet) {
        return res.status(404).json({ message: 'Mascota no encontrada' })
      }
  
      if (pet.ownerId !== req.user.uid) {
        return res
          .status(403)
          .json({ message: 'No tienes permiso para eliminar esta mascota' })
      }
  
      await deletePet(req.params.id)
      res.status(204).send() // No Content
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la mascota' })
    }
  }
  
  export const getPetByNFCId = async (req, res) => {
    try {
      const { nfcId } = req.params
      const pet = await findPetByNFCId(nfcId)
  
      if (!pet) {
        return res.status(404).json({ message: 'Mascota no encontrada' })
      }
  
      res.json(pet)
    } catch (error) {
      console.error('Error fetching pet by NFC ID:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  }
  
  export const uploadPetPicture = async (req, res) => {
    const { id: petId } = req.params
    const userId = req.user.uid
  
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo.' })
    }
  
    try {
      const pet = await findPetById(petId)
      if (!pet) {
        return res.status(404).json({ message: 'Mascota no encontrada.' })
      }
      if (pet.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'No autorizado para cambiar esta foto.' })
      }
  
      const blob = bucket.file(`pets-pictures/${petId}/${uuidv4()}`)
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype
        }
      })
  
      blobStream.on('error', (err) => {
        console.error(err)
        res.status(500).json({ message: 'Error al subir la imagen.' })
      })
  
      blobStream.on('finish', async () => {
        // **INICIO DE LA CORRECCIÓN**
        // Hacer el archivo públicamente legible
        try {
          await blob.makePublic()
        } catch (error) {
          console.error('Error al hacer pública la imagen:', error)
          return res
            .status(500)
            .json({ message: 'La imagen se subió pero no se pudo hacer pública.' })
        }
        // **FIN DE LA CORRECCIÓN**
  
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        await updatePet(petId, { photoURL: publicUrl })
        res.status(200).json({
          message: 'Foto de perfil actualizada con éxito',
          photoURL: publicUrl
        })
      })
  
      blobStream.end(req.file.buffer)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Error interno del servidor.' })
    }
  }