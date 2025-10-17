import { Router } from 'express';
import Subscription from '../models/Subscription.js';
import Cliente from '../models/Cliente.js';
import { isMongoConnected } from '../db.js';
import webpush from 'web-push';

const router = Router();

// Configurar web-push (deberías usar variables de entorno en producción)
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'BBQ2DeJnbCYDVC_n4RahJEanth7T79VkNmrBOkN8zC9TH5lto4-lC0_Nr5GeF00d1YIlC0udLgkiqYXVO7XLbTg', // Clave pública VAPID
  'PGHUqS0YMUgXVQrEKnlXkm_KKkScyudpnw5bjL-CfqE' // Clave privada VAPID
);

// Almacenamiento en memoria como fallback
let memorySubscriptions = [];

// Función para enviar notificación push
async function sendPushNotification(title, body, data = {}) {
  try {
    let subscriptions = [];
    
    // Obtener suscripciones activas
    if (isMongoConnected()) {
      subscriptions = await Subscription.find({ isActive: true });
    } else {
      subscriptions = memorySubscriptions.filter(sub => sub.isActive !== false);
    }
    
    if (subscriptions.length === 0) {
      console.log('📱 No hay suscripciones activas para enviar notificación');
      return;
    }
    
    const payload = JSON.stringify({
      title,
      body,
      data,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png'
    });
    
    console.log(`📱 Enviando notificación a ${subscriptions.length} suscriptor(es)`);
    
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys
        };
        
        await webpush.sendNotification(pushSubscription, payload);
        console.log('✅ Notificación enviada exitosamente');
      } catch (error) {
        console.error('❌ Error al enviar notificación:', error);
        
        // Si la suscripción es inválida, marcarla como inactiva
        if (error.statusCode === 410 || error.statusCode === 404) {
          if (isMongoConnected() && subscription._id) {
            await Subscription.findByIdAndUpdate(subscription._id, { isActive: false });
          } else if (!isMongoConnected()) {
            const index = memorySubscriptions.findIndex(sub => sub.endpoint === subscription.endpoint);
            if (index !== -1) {
              memorySubscriptions[index].isActive = false;
            }
          }
        }
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('❌ Error general al enviar notificaciones:', error);
  }
}

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Ruta para enviar notificación de prueba
router.post('/send-notification', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    // Valores por defecto si no se proporcionan
    const notificationTitle = title || '🔔 Notificación de Prueba';
    const notificationBody = body || 'Esta es una notificación de prueba desde el servidor PWA';
    const notificationData = data || { 
      type: 'test_notification',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Enviando notificación de prueba:', { 
      title: notificationTitle, 
      body: notificationBody 
    });
    
    // Enviar la notificación
    await sendPushNotification(notificationTitle, notificationBody, notificationData);
    
    res.status(200).json({ 
      message: 'Notificación enviada exitosamente',
      notification: {
        title: notificationTitle,
        body: notificationBody,
        data: notificationData
      }
    });
    
  } catch (error) {
    console.error('❌ Error al enviar notificación de prueba:', error);
    res.status(500).json({ 
      error: 'Error al enviar notificación',
      details: error.message 
    });
  }
});

// Ruta para suscribirse a notificaciones push
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos: endpoint, keys.p256dh, keys.auth' 
      });
    }

    // Si MongoDB está disponible, usar la base de datos
    if (isMongoConnected()) {
      try {
        // Buscar si ya existe una suscripción con este endpoint
        let subscription = await Subscription.findOne({ endpoint });
        
        if (subscription) {
          // Actualizar suscripción existente
          subscription.keys = keys;
          subscription.userAgent = req.get('User-Agent') || 'Unknown';
          subscription.isActive = true;
          await subscription.updateLastUsed();
          console.log('📱 Suscripción actualizada en MongoDB:', endpoint.substring(0, 50) + '...');
        } else {
          // Crear nueva suscripción
          subscription = new Subscription({
            endpoint,
            keys,
            userAgent: req.get('User-Agent') || 'Unknown'
          });
          await subscription.save();
          console.log('📱 Nueva suscripción guardada en MongoDB:', endpoint.substring(0, 50) + '...');
        }
        
        return res.status(201).json({ 
          message: 'Suscripción guardada exitosamente en MongoDB',
          id: subscription._id 
        });
      } catch (dbError) {
        console.error('Error al guardar en MongoDB:', dbError);
        // Continuar con almacenamiento en memoria si falla MongoDB
      }
    }

    // Fallback: usar almacenamiento en memoria
    const existingIndex = memorySubscriptions.findIndex(sub => sub.endpoint === endpoint);
    
    if (existingIndex !== -1) {
      // Actualizar suscripción existente
      memorySubscriptions[existingIndex] = {
        ...memorySubscriptions[existingIndex],
        keys,
        userAgent: req.get('User-Agent') || 'Unknown',
        lastUsed: new Date(),
        isActive: true
      };
      console.log('📱 Suscripción actualizada en memoria:', endpoint.substring(0, 50) + '...');
    } else {
      // Crear nueva suscripción
      const newSubscription = {
        id: Date.now().toString(),
        endpoint,
        keys,
        userAgent: req.get('User-Agent') || 'Unknown',
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true
      };
      memorySubscriptions.push(newSubscription);
      console.log('📱 Nueva suscripción guardada en memoria:', endpoint.substring(0, 50) + '...');
    }

    res.status(201).json({ 
      message: 'Suscripción guardada exitosamente en memoria',
      storage: 'memory'
    });

  } catch (error) {
    console.error('Error al procesar suscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    let stats = {};

    if (isMongoConnected()) {
      try {
        const total = await Subscription.countDocuments();
        const active = await Subscription.countDocuments({ isActive: true });
        const inactive = total - active;
        
        stats = {
          total,
          active,
          inactive,
          storage: 'mongodb'
        };
      } catch (dbError) {
        console.error('Error al obtener stats de MongoDB:', dbError);
        // Continuar con stats de memoria
      }
    }

    // Fallback: estadísticas de memoria
    if (!stats.storage) {
      const activeMemory = memorySubscriptions.filter(sub => sub.isActive).length;
      stats = {
        total: memorySubscriptions.length,
        active: activeMemory,
        inactive: memorySubscriptions.length - activeMemory,
        storage: 'memory'
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener todas las suscripciones activas (solo para desarrollo)
router.get('/subscriptions', async (req, res) => {
  try {
    let subscriptions = [];

    if (isMongoConnected()) {
      try {
        subscriptions = await Subscription.findActive();
        return res.json({
          subscriptions: subscriptions.map(sub => ({
            id: sub._id,
            endpoint: sub.endpoint.substring(0, 50) + '...',
            userAgent: sub.userAgent,
            createdAt: sub.createdAt,
            lastUsed: sub.lastUsed
          })),
          storage: 'mongodb'
        });
      } catch (dbError) {
        console.error('Error al obtener suscripciones de MongoDB:', dbError);
      }
    }

    // Fallback: suscripciones de memoria
    const activeMemorySubscriptions = memorySubscriptions
      .filter(sub => sub.isActive)
      .map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        lastUsed: sub.lastUsed
      }));

    res.json({
      subscriptions: activeMemorySubscriptions,
      storage: 'memory'
    });

  } catch (error) {
    console.error('Error al obtener suscripciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para desactivar una suscripción
router.delete('/subscribe/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      try {
        const subscription = await Subscription.findById(id);
        if (subscription) {
          subscription.isActive = false;
          await subscription.save();
          return res.json({ 
            message: 'Suscripción desactivada exitosamente en MongoDB' 
          });
        }
      } catch (dbError) {
        console.error('Error al desactivar en MongoDB:', dbError);
      }
    }

    // Fallback: desactivar en memoria
    const subscriptionIndex = memorySubscriptions.findIndex(sub => sub.id === id);
    if (subscriptionIndex !== -1) {
      memorySubscriptions[subscriptionIndex].isActive = false;
      return res.json({ 
        message: 'Suscripción desactivada exitosamente en memoria' 
      });
    }

    res.status(404).json({ error: 'Suscripción no encontrada' });

  } catch (error) {
    console.error('Error al desactivar suscripción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/clientes', async(req,res)=> {
  try {
    const { nombre, email, plan } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }
    
    const newCliente = new Cliente({
      nombre,
      email,
      plan: plan || ''
    });
    
    await newCliente.save();
    
    // Enviar notificación push cuando se guarde exitosamente (sin bloquear la respuesta)
    sendPushNotification(
      '✅ Cliente Guardado',
      `${nombre} ha sido agregado exitosamente`,
      { 
        type: 'cliente_saved',
        clienteId: newCliente._id,
        nombre: nombre
      }
    ).catch(error => {
      console.error('Error al enviar notificación push:', error);
    });
    
    res.status(201).json({ message: 'Cliente creado exitosamente', cliente: newCliente });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para reportes de actividad (para completar el background sync)
router.post('/activity-reports', async(req, res) => {
  try {
    const { type, description, timestamp, data } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({ error: 'Tipo y descripción son obligatorios' });
    }
    
    // Por ahora solo logueamos el reporte, podrías crear un modelo ActivityReport si necesitas persistencia
    console.log('📊 Reporte de actividad recibido:', { type, description, timestamp, data });
    
    // Enviar notificación push
    await sendPushNotification(
      '📊 Reporte Guardado',
      `Reporte de ${type}: ${description}`,
      { 
        type: 'activity_report_saved',
        reportType: type,
        description: description
      }
    );
    
    res.status(201).json({ 
      message: 'Reporte de actividad guardado exitosamente',
      report: { type, description, timestamp, data }
    });
  } catch (error) {
    console.error('Error al guardar reporte de actividad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
})

export default router;