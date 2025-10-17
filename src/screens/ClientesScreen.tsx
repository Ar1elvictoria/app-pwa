import React, { useState, useEffect } from 'react';
import AddClienteModal from '../components/AddClienteModal';
import { PushToggle } from '../components/pushToggle';
import { getClientes, type Cliente } from '../utils/indexedDB';
import './ClientesScreen.css';

const ClientesScreen: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      const clientesData = await getClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    loadClientes();
  };

  return (
    <div className="clientes-screen">
      {/* Header con título y botones */}
      <div className="header">
        <h1>Clientes</h1>
        <div className="header-actions">
          <PushToggle />
          <button onClick={handleOpenModal} className="btn-add">
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Lista de clientes */}
      {clientes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay clientes</h3>
          <p>Agrega tu primer cliente para comenzar</p>
        </div>
      ) : (
        <div className="clientes-list">
          {clientes.map((cliente) => (
            <div key={cliente.id || cliente._id} className="cliente-item">
              <div className="cliente-info">
                <h3 className="cliente-nombre">{cliente.nombre}</h3>
                <p className="cliente-email">{cliente.email}</p>
                <span className="cliente-plan">{cliente.plan || 'Sin plan'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClienteModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default ClientesScreen;