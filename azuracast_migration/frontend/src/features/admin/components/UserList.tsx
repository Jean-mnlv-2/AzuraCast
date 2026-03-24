import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Shield, Mail, Edit2, Trash2, Search } from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';

interface UserData {
  id: number;
  email: string;
  name: string;
  is_superuser: boolean;
  is_active: boolean;
}

const emptyForm = {
  email: '',
  name: '',
  password: '',
  is_superuser: false,
  is_active: true,
};

const UserList: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name || '',
      password: '',
      is_superuser: user.is_superuser,
      is_active: user.is_active,
    });
    setIsModalOpen(true);
  };

  const { data: users, isLoading } = useQuery<UserData[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users/');
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        const body: Record<string, unknown> = {
          name: form.name,
          is_superuser: form.is_superuser,
          is_active: form.is_active,
        };
        if (form.password) {
          body.password = form.password;
        }
        return api.patch(`/users/${editingUser.id}/`, body);
      }
      return api.post('/users/', {
        email: form.email,
        password: form.password,
        name: form.name || undefined,
        is_superuser: form.is_superuser,
        is_active: form.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="fw-bold tracking-tight text-dark mb-1 text-main">{t('users.title')}</h1>
          <p className="text-muted mb-0">{t('users.subtitle')}</p>
        </div>
        <Button variant="danger" icon={<Plus size={20} />} onClick={openCreate}>
          {t('users.new_user')}
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <Input
            placeholder={t('users.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} className="text-muted" />}
          />
        </div>

        <div className="table-responsive rounded-3 overflow-hidden border">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light-soft text-main fw-bold small text-uppercase">
              <tr>
                <th className="px-4 py-3">{t('users.table.user')}</th>
                <th className="px-4 py-3 text-center">{t('users.table.role')}</th>
                <th className="px-4 py-3 text-center">{t('users.table.status')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="transition-all hover-bg-light-soft">
                  <td className="px-4 py-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                        {user.name?.[0].toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold text-dark text-main">{user.name || 'Sans nom'}</div>
                        <div className="small text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.is_superuser ? (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-2 fw-bold">
                        <Shield size={12} className="me-1" /> {t('users.roles.admin')}
                      </span>
                    ) : (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 fw-bold">
                        {t('users.roles.user')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'} rounded-circle p-1 me-2`} style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                    <span className="small fw-semibold text-main">{user.is_active ? t('users.status.active') : t('users.status.inactive')}</span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="light" size="sm" icon={<Edit2 size={16} />} title={t('common.edit')} onClick={() => openEdit(user)} />
                      <Button
                        variant="light"
                        size="sm"
                        className="text-danger"
                        icon={<Trash2 size={16} />}
                        onClick={() => {
                          if (window.confirm(t('common.delete') + ' ?')) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        title={t('common.delete')}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          setForm(emptyForm);
        }}
        title={editingUser ? t('common.edit') : t('users.modal.title')}
        footer={
          <>
            <Button variant="light" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={saveMutation.isPending}
              disabled={!editingUser && (!form.email || !form.password)}
              onClick={() => saveMutation.mutate()}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <div className="d-flex flex-column gap-3">
          {!editingUser && (
            <div>
              <label className="form-label fw-semibold">{t('users.modal.email')}</label>
              <input
                type="email"
                className="form-control"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean.dupont@example.com"
                required
              />
            </div>
          )}
          {editingUser && (
            <div className="small text-muted">
              <Mail size={14} className="me-1" />
              {editingUser.email}
            </div>
          )}
          <Input
            label={t('users.modal.name')}
            placeholder="ex: Jean Dupont"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label={editingUser ? `${t('users.modal.password')} (optionnel)` : t('users.modal.password')}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editingUser}
          />
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isSuperuser"
              checked={form.is_superuser}
              onChange={(e) => setForm((f) => ({ ...f, is_superuser: e.target.checked }))}
            />
            <label className="form-check-label fw-semibold text-main" htmlFor="isSuperuser">
              {t('users.modal.is_superuser')}
            </label>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isActive"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <label className="form-check-label fw-semibold text-main" htmlFor="isActive">
              {t('users.status.active')}
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserList;
