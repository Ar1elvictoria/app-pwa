import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  try {
    // Si ya está conectado, no intentar reconectar
    if (isConnected) {
      return true;
    }

    const conn = await mongoose.connect('mongodb+srv://arielvictoria75_db_user:xcACSWQcw6Lkf2H0@clientes.dbmnmqv.mongodb.net/?retryWrites=true&w=majority&appName=clientes', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    // arielvictoria75_db_user
    // xcACSWQcw6Lkf2H0

    
    isConnected = true;
    console.log(`✅ MongoDB Atlas conectado: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB Atlas:', error.message);
    console.log('⚠️  El servidor continuará funcionando sin MongoDB');
    isConnected = false;
    return false;
  }
};

// Función para verificar si MongoDB está disponible
const isMongoConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Intentar reconectar cada 30 segundos si no está conectado
const startReconnectTimer = () => {
  setInterval(async () => {
    if (!isMongoConnected()) {
      console.log('🔄 Intentando reconectar a MongoDB...');
      await connectDB();
    }
  }, 30000);
};

export { connectDB, isMongoConnected, startReconnectTimer };
export default connectDB;