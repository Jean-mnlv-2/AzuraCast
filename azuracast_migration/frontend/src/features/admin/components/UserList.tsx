import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Shield, Mail, Edit2, Trash2, Search, Key, X } from 'lucide-react';
import api from '../../../api/axios';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';

interface UserData {
  id: number;
  email: string;
  name: string;
  is_superuser: boolean;
  is_active: boolean;
}

interface StationPermission {
  station_id: number;
  station_name: string;
  short_name: string;
  permissions: string[];
}

interface Station {
  id: number;
  name: string;
  short_name: string;
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

  // Permission management state
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<string>('view_station');

  const availablePermissionTypes = [
    'view_station', 'manage_station', 'manage_station_profile',
    'manage_station_media', 'manage_station_playlists', 'manage_station_streamers',
    'manage_station_mounts', 'manage_station_remotes', 'manage_station_webhooks',
    'manage_station_podcasts', 'manage_station_hls', 'manage_station_analytics'
  ];

  const { data: stations } = useQuery<Station[]>({
    queryKey: ['admin_stations'],
    queryFn: async () => {
      const response = await api.get('/stations/');
      return response.data;
    },
    enabled: isPermissionModalOpen,
  });

  const { data: userPermissions, refetch: refetchUserPermissions } = useQuery<StationPermission[]>({
    queryKey: ['user_permissions', targetUser?.id],
    queryFn: async () => {
      const response = await api.get(`/users/${targetUser?.id}/get_station_permissions/`);
      return response.data;
    },
    enabled: !!targetUser && isPermissionModalOpen,
  });

  const permissionMutation = useMutation({
    mutationFn: async ({ action, stationId, permission }: { action: 'add' | 'remove', stationId: number, permission: string }) => {
      return api.post(`/users/${targetUser?.id}/station_permissions/`, {
        station_id: stationId,
        permission: permission,
        action: action
      });
    },
    onSuccess: () => {
      refetchUserPermissions();
    },
  });

  const openPermissions = (user: UserData) => {
    setTargetUser(user);
    setIsPermissionModalOpen(true);
  };

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
          <h1 className="fw-bold tracking-tight text-main mb-1">{t('users.title')}</h1>
          <p className="text-muted-soft mb-0">{t('users.subtitle')}</p>
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
            icon={<Search size={18} className="text-muted-soft" />}
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
                        <div className="fw-bold text-main">{user.name || 'Sans nom'}</div>
                        <div className="small text-muted-soft">{user.email}</div>
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
                      <Button
                        variant="light"
                        size="sm"
                        icon={<Key size={16} />}
                        title="Permissions"
                        onClick={() => openPermissions(user)}
                      />
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
        <div className="d-flex flex-column gap-3 mt-2">
          <Input
            label={t('users.modal.name')}
            placeholder="ex: Jean Jacques"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          {!editingUser && (
            <div>
              <label className="form-label fw-semibold">{t('users.modal.email')}</label>
              <input
                type="email"
                className="form-control shadow-none"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean.jacques@example.com"
                required
              />
              <div className="form-text small opacity-75">Cette adresse servira d'identifiant de connexion.</div>
            </div>
          )}
          {editingUser && (
            <div className="p-3 bg-light-soft rounded-3 d-flex align-items-center gap-3">
              <div className="bg-white p-2 rounded-circle shadow-sm">
                <Mail size={18} className="text-danger" />
              </div>
              <div>
                <div className="small text-muted-soft fw-bold text-uppercase ls-1">Identifiant Email</div>
                <div className="fw-bold text-main">{editingUser.email}</div>
              </div>
            </div>
          )}
          <Input
            label={editingUser ? `${t('users.modal.password')} (optionnel)` : t('users.modal.password')}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={!editingUser}
          />
          <hr className="my-2 opacity-10" />
          <div className="row g-3">
            <div className="col-md-6">
              <div className="form-check form-switch custom-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isSuperuser"
                  checked={form.is_superuser}
                  onChange={(e) => setForm((f) => ({ ...f, is_superuser: e.target.checked }))}
                />
                <label className="form-check-label fw-bold text-main small text-uppercase" htmlFor="isSuperuser">
                  {t('users.modal.is_superuser')}
                </label>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-check form-switch custom-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isActive"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <label className="form-check-label fw-bold text-main small text-uppercase" htmlFor="isActive">
                  {t('users.status.active')}
                </label>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Permission Management Modal */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setTargetUser(null);
        }}
        title={t('users.permissions.title', { name: targetUser?.name || targetUser?.email })}
        size="lg"
      >
        <div className="mb-4">
          <h6 className="fw-bold mb-3">{t('users.permissions.add_title')}</h6>
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label className="form-label small fw-bold">{t('users.permissions.station_label')}</label>
              <Select
                options={[
                  { value: '', label: t('users.permissions.station_placeholder') },
                  ...(stations?.map(s => ({ value: s.id.toString(), label: s.name })) || [])
                ]}
                value={selectedStationId?.toString() || ''}
                onChange={(e) => setSelectedStationId(e.target.value ? parseInt(e.target.value) : null)}
              />

            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">{t('users.permissions.permission_label')}</label>
              <Select
                options={availablePermissionTypes.map(p => ({
                  value: p,
                  label: t(`users.permissions.types.${p}`)
                }))}
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <Button 
                variant="danger" 
                className="w-100" 
                disabled={!selectedStationId || permissionMutation.isPending}
                onClick={() => permissionMutation.mutate({ 
                  action: 'add', 
                  stationId: selectedStationId!, 
                  permission: selectedPermission 
                })}
              >
                {t('users.permissions.add_button')}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-top pt-4">
          <h6 className="fw-bold mb-3">{t('users.permissions.current_permissions')}</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>{t('users.permissions.table.station')}</th>
                  <th>{t('users.permissions.table.permissions')}</th>
                  <th className="text-end">{t('users.permissions.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {userPermissions?.map(up => (
                  <tr key={up.station_id}>
                    <td>{up.station_name}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {up.permissions.map(p => (
                          <span key={p} className="badge bg-light text-dark border d-flex align-items-center gap-1">
                            {t(`users.permissions.types.${p}`)}
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-danger p-0 ms-1 border-0"
                              onClick={() => permissionMutation.mutate({ 
                                action: 'remove', 
                                stationId: up.station_id, 
                                permission: p 
                              })}
                              title={`${t('common.delete')} ${p}`}
                            >
                              <X size={12} />
                            </Button>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-end">
                      {/* Actions column can be empty now as we have the X in the badge or kept for bulk actions */}
                    </td>
                  </tr>
                ))}
                {(!userPermissions || userPermissions.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-muted">{t('users.permissions.none')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default UserList;
