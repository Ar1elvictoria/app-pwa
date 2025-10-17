import mongoose from 'mongoose';

// Esquema para las suscripciones push
const subscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  // Información adicional opcional
  userAgent: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejorar el rendimiento
subscriptionSchema.index({ endpoint: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ isActive: 1 });

// Método para actualizar la fecha de último uso
subscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Método estático para encontrar suscripciones activas
subscriptionSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Método estático para limpiar suscripciones inactivas
subscriptionSchema.statics.cleanupInactive = function() {
  return this.deleteMany({ isActive: false });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;