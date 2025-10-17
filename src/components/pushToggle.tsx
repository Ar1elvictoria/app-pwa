import React, { useState } from 'react';
import { urlBase64ToUint8Array } from '../utils/pushUtils';


const PUBLIC_VAPID_KEY: string = "BBQ2DeJnbCYDVC_n4RahJEanth7T79VkNmrBOkN8zC9TH5lto4-lC0_Nr5GeF00d1YIlC0udLgkiqYXVO7XLbTg"; 
const API_SUBSCRIBE_URL: string = 'http://localhost:3000/api/subscribe';

export const PushToggle: React.FC = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const subscribeUser = async () => {
        setIsLoading(true);
        console.log('🔔 Iniciando suscripción a notificaciones push...');
        
        // 1. Verificación de soporte y permiso
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.error('❌ Las Notificaciones Push no están soportadas.');
            alert('Las notificaciones push no están soportadas en este navegador.');
            setIsLoading(false);
            return;
        }

        console.log('✅ Service Worker y Push Manager soportados');

        const permission: NotificationPermission = await Notification.requestPermission();
        console.log('🔔 Permiso de notificaciones:', permission);
        
        if (permission !== 'granted') {
            alert('Permiso de notificaciones denegado. No se puede suscribir.');
            setIsLoading(false);
            return;
        }

        try {
            console.log('⏳ Esperando service worker...');
            const registration = await navigator.serviceWorker.ready;
            console.log('✅ Service worker listo:', registration);

            console.log('⏳ Creando suscripción push...');
            const subscription: PushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            console.log('✅ Suscripción creada:', subscription);

            // Opcional: convertir a JSON para el backend
            const subJSON: PushSubscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;
            console.log('📤 Enviando suscripción al backend:', subJSON);

            // 3. Enviar la suscripción a tu backend
            const response = await fetch(API_SUBSCRIBE_URL, {
                method: 'POST',
                body: JSON.stringify(subJSON),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                console.log('✅ Suscripción guardada con éxito.');
                setIsSubscribed(true);
                alert('¡Notificaciones activadas correctamente!');
            } else {
                console.error('❌ Fallo al guardar la suscripción en el backend.');
                const errorText = await response.text();
                console.error('Error details:', errorText);
                alert('Error al activar las notificaciones. Revisa la consola.');
            }

        } catch (err) {
            console.error('❌ Fallo en la suscripción push:', err);
            alert('Error al suscribirse a las notificaciones: ' + err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
        }}>
            <button 
                onClick={subscribeUser} 
                disabled={!('serviceWorker' in navigator) || isLoading || isSubscribed}
                style={{
                    padding: '0.875rem 1.5rem',
                    border: 'none',
                    borderRadius: '10px',
                    background: isSubscribed 
                        ? 'linear-gradient(135deg, #00b894 0%, #00a085 100%)'
                        : isLoading 
                            ? 'linear-gradient(135deg, #b2bec3 0%, #636e72 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: isLoading || isSubscribed ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minWidth: '220px',
                    boxShadow: isLoading || isSubscribed 
                        ? 'none' 
                        : '0 4px 15px rgba(102, 126, 234, 0.3)',
                    opacity: isLoading || isSubscribed ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                    if (!isLoading && !isSubscribed) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isLoading || isSubscribed 
                        ? 'none' 
                        : '0 4px 15px rgba(102, 126, 234, 0.3)';
                }}
            >
                {isLoading ? (
                    <>
                        <span style={{
                            display: 'inline-block',
                            width: '18px',
                            height: '18px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></span>
                        Activando notificaciones...
                    </>
                ) : isSubscribed ? (
                    <>
                        ✅ Notificaciones Activadas
                    </>
                ) : (
                    <>
                        🔔 Activar Notificaciones Push
                    </>
                )}
            </button>
            
            {isSubscribed && (
                <div style={{
                    background: 'rgba(0, 184, 148, 0.1)',
                    border: '1px solid rgba(0, 184, 148, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#00a085',
                    fontWeight: '500'
                }}>
                    <span style={{ fontSize: '1.1rem' }}>✅</span>
                    Las notificaciones push están activas. ¡Ya puedes recibir alertas!
                </div>
            )}

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};