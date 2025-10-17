import mongoose from 'mongoose';

// Esquema para los clientes
const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  plan: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejorar el rendimiento
clienteSchema.index({ email: 1 });
clienteSchema.index({ nombre: 1 });
clienteSchema.index({ createdAt: -1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

export default Cliente;