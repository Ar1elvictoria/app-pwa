import { useState } from 'react';

export default function NotificationTester() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const sendTestNotification = async () => {
    if (!title || !body) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png'
        }),
      });

      if (response.ok) {
        console.log('Notification sent successfully');
        setTitle('');
        setBody('');
      } else {
        console.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '1rem', color: '#333' }}>Test Notifications</h2>
            
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Title:
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Message:
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Notification message"
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
      </div>

      <button
        onClick={sendTestNotification}
        disabled={loading || !title || !body}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: loading || !title || !body ? '#ccc' : '#007bff',
          color: 'white',
          cursor: loading || !title || !body ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Sending...' : 'Send Test Notification'}
      </button>

      <p style={{ 
        marginTop: '1rem', 
        fontSize: '0.9rem', 
        color: '#666',
        textAlign: 'center'
      }}>
        Make sure notifications are enabled in your browser
      </p>
    </div>
  );
}