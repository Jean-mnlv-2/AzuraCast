import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Plus, Settings, Trash2, MoreVertical, HardDrive, User, Key } from 'lucide-react';
import api from '../../../api/axios';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';

interface SftpUserRow {
  id: number;
  username: string;
  public_keys: string;
}

const SftpUsers: React.FC = () => {
  const { t } = useTranslation();
  const { station_short_name } = useParams<{ station_short_name: string }>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<SftpUserRow | null>(null);

  const { data: sftp_users, isLoading } = useQuery<SftpUserRow[]>({
    queryKey: ['sftp_users', station_short_name],
    queryFn: async () => {
      const response = await api.get(`/stations/${station_short_name}/sftp_users/`);
      return response.data;
    },
  });

  const createSftpMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return api.post(`/stations/${station_short_name}/sftp_users/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sftp_users', station_short_name] });
      setIsModalOpen(false);
      setEditUser(null);
    },
  });

  const updateSftpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, string> }) => {
      return api.patch(`/stations/${station_short_name}/sftp_users/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sftp_users', station_short_name] });
      setIsModalOpen(false);
      setEditUser(null);
    },
  });

  const deleteSftpMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/stations/${station_short_name}/sftp_users/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sftp_users', station_short_name] }),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (editUser) {
      const body: Record<string, string> = {
        username: data.username,
        public_keys: data.public_keys || '',
      };
      if (data.password) {
        body.password = data.password;
      }
      updateSftpMutation.mutate({ id: editUser.id, data: body });
    } else {
      createSftpMutation.mutate(data);
    }
  };

  const openCreate = () => {
    setEditUser(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: SftpUserRow) => {
    setEditUser(user);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">Utilisateurs SFTP</h1>
          <p className="text-muted mb-0">Gérez les comptes d&apos;accès SFTP pour télécharger vos médias.</p>
        </div>
        <Button variant="danger" icon={<Plus size={20} />} onClick={openCreate}>
          Nouvel Utilisateur SFTP
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditUser(null); }} title={editUser ? t('common.edit') : 'Nouvel Utilisateur SFTP'}>
        <form onSubmit={handleCreateSubmit}>
          <Input name="username" label="Nom d'utilisateur" placeholder="ex: sftp_user" defaultValue={editUser?.username} required readOnly={!!editUser} />
          <Input name="password" type="password" label={editUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} required={!editUser} />
          <div className="mb-3">
            <label className="form-label fw-bold small text-muted text-uppercase">Clés SSH Publiques (Optionnel)</label>
            <textarea name="public_keys" className="form-control" rows={3} placeholder="ssh-rsa ..." defaultValue={editUser?.public_keys || ''} />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="light" onClick={() => { setIsModalOpen(false); setEditUser(null); }}>Annuler</Button>
            <Button
              type="submit"
              variant="danger"
              loading={createSftpMutation.isPending || updateSftpMutation.isPending}
            >
              {editUser ? t('common.save') : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <div className="row g-4">
        {sftp_users?.map((user) => (
          <div key={user.id} className="col-12 col-lg-6">
            <Card
              className="h-100"
              headerActions={
                <div className="dropdown">
                  <button type="button" className="btn btn-link text-muted p-0 shadow-none" data-bs-toggle="dropdown" aria-expanded="false">
                    <MoreVertical size={20} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                    <li>
                      <button type="button" className="dropdown-item d-flex align-items-center gap-2" onClick={() => openEdit(user)}>
                        <Settings size={16} /> {t('common.edit')}
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center gap-2 text-danger"
                        onClick={() => {
                          if (window.confirm('Supprimer cet utilisateur SFTP ?')) {
                            deleteSftpMutation.mutate(user.id);
                          }
                        }}
                      >
                        <Trash2 size={16} /> {t('common.delete')}
                      </button>
                    </li>
                  </ul>
                </div>
              }
            >
              <div className="d-flex align-items-center gap-4">
                <div className="bg-light-soft rounded-3 p-3 text-danger">
                  <HardDrive size={32} />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="mb-0 fw-bold">{user.username}</h5>
                  </div>
                  <div className="d-flex gap-3 small text-muted">
                    <span className="d-flex align-items-center gap-1"><User size={14} /> Accès Médias</span>
                    {user.public_keys && <span className="d-flex align-items-center gap-1"><Key size={14} /> Clé SSH Active</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}

        {sftp_users?.length === 0 && (
          <div className="col-12 text-center py-5 text-muted">
            <HardDrive size={48} className="opacity-25 mb-3 d-block mx-auto" />
            Aucun utilisateur SFTP configuré.
          </div>
        )}
      </div>
    </div>
  );
};

export default SftpUsers;
