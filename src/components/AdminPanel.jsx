import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { filmAPI, userAPI } from '../services/api';

const AdminPanel = ({ setActiveFilter }) => {
  const { user, isAdmin } = useAuth();
  const [films, setFilms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('films');
  const [newFilm, setNewFilm] = useState({
    title: '',
    director: '',
    releaseYear: new Date().getFullYear(),
    description: '',
    posterUrl: '',
  });
  const [editingFilm, setEditingFilm] = useState(null);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchFilms();
      fetchUsers();
    }
  }, [user]);

  const fetchFilms = async () => {
    try {
      const response = await filmAPI.getAllFilms();
      setFilms(response.data);
    } catch (error) {
      console.error('Filmler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingFilm) {
      setEditingFilm({ ...editingFilm, [name]: value });
    } else {
      setNewFilm({ ...newFilm, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFilm) {
        await filmAPI.updateFilm(editingFilm.id, editingFilm);
        alert('Film başarıyla güncellendi!');
        setEditingFilm(null);
      } else {
        await filmAPI.createFilm(newFilm);
        alert('Film başarıyla eklendi!');
        setNewFilm({
          title: '',
          director: '',
          releaseYear: new Date().getFullYear(),
          description: '',
          posterUrl: '',
        });
      }
      fetchFilms();
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.message || 'İşlem başarısız'));
    }
  };

  const handleDeleteFilm = async (id) => {
    if (!window.confirm('Bu filmi silmek istediğinize emin misiniz?')) return;
    
    try {
      await filmAPI.deleteFilm(id);
      alert('Film silindi!');
      fetchFilms();
    } catch (error) {
      alert('Film silinirken hata: ' + error.response?.data?.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    
    try {
      await userAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('Kullanıcı başarıyla silindi!');
    } catch (error) {
      alert('Kullanıcı silinirken hata: ' + error.response?.data?.message);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!window.confirm(`Bu kullanıcıyı ${newRole === 'admin' ? 'ADMIN' : 'USER'} yapmak istediğinize emin misiniz?`)) return;
    
    try {
      await userAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      alert(`Kullanıcı ${newRole === 'admin' ? 'admin yapıldı!' : 'user yapıldı!'}`);
    } catch (error) {
      alert('Rol değiştirilirken hata: ' + error.response?.data?.message);
    }
  };

  const handleEditFilm = (film) => {
    setEditingFilm({
      id: film.id,
      title: film.title,
      director: film.director,
      releaseYear: film.releaseYear,
      description: film.description || '',
      posterUrl: film.posterUrl || '',
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingFilm(null);
  };

  if (!user || !isAdmin()) {
    return (
      <div style={styles.container}>
        <h2>Erişim Engellendi</h2>
        <p>Bu sayfayı görüntülemek için admin yetkilerine sahip olmalısınız.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.loading}>Yükleniyor...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Admin Paneli</h2>
      
      {/* TAB BUTONLARI */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab('films')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'films' && styles.activeTab)
          }}
        >
          🎬 Film Yönetimi
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'users' && styles.activeTab)
          }}
        >
          👥 Kullanıcı Yönetimi
        </button>
      </div>

      {/* FİLM YÖNETİMİ TAB'İ */}
      {activeTab === 'films' && (
        <>
          {/* Film Ekleme / Güncelleme Formu */}
          <div style={styles.formContainer}>
            <h3>{editingFilm ? '🎬 Film Güncelle' : '➕ Yeni Film Ekle'}</h3>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                name="title"
                placeholder="Film Başlığı *"
                value={editingFilm ? editingFilm.title : newFilm.title}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
              <input
                type="text"
                name="director"
                placeholder="Yönetmen *"
                value={editingFilm ? editingFilm.director : newFilm.director}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
              <input
                type="number"
                name="releaseYear"
                placeholder="Yıl *"
                value={editingFilm ? editingFilm.releaseYear : newFilm.releaseYear}
                onChange={handleInputChange}
                min="1888"
                max="2030"
                required
                style={styles.input}
              />
              <textarea
                name="description"
                placeholder="Açıklama (opsiyonel)"
                value={editingFilm ? editingFilm.description : newFilm.description}
                onChange={handleInputChange}
                style={styles.textarea}
              />
              <input
                type="text"
                name="posterUrl"
                placeholder="Poster URL (opsiyonel)"
                value={editingFilm ? editingFilm.posterUrl : newFilm.posterUrl}
                onChange={handleInputChange}
                style={styles.input}
              />
              
              <div style={styles.formButtons}>
                <button type="submit" style={editingFilm ? styles.updateButton : styles.submitButton}>
                  {editingFilm ? '📝 Güncelle' : '➕ Film Ekle'}
                </button>
                
                {editingFilm && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    style={styles.cancelButton}
                  >
                    ❌ İptal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Film Listesi */}
          <div style={styles.filmsContainer}>
            <h3>Mevcut Filmler ({films.length})</h3>
            {films.length === 0 ? (
              <p>Henüz film eklenmemiş.</p>
            ) : (
              <div style={styles.filmsGrid}>
                {films.map((film) => (
                  <div key={film.id} style={styles.filmCard}>
                    <div style={styles.filmInfo}>
                      <h4>{film.title}</h4>
                      <p>👤 Yönetmen: {film.director}</p>
                      <p>📅 Yıl: {film.releaseYear}</p>
                      
                      {film.description && (
                        <p style={styles.description}>
                          {film.description.substring(0, 80)}...
                        </p>
                      )}
                      {film.posterUrl && (
                        <div style={styles.posterPreview}>
                          <img 
                            src={film.posterUrl} 
                            alt={film.title}
                            style={styles.posterImg}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleEditFilm(film)}
                        style={styles.editButton}
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteFilm(film.id)}
                        style={styles.deleteButton}
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* KULLANICI YÖNETİMİ TAB'İ */}
      {activeTab === 'users' && (
        <div style={styles.usersContainer}>
          <h3>Kullanıcı Yönetimi ({users.length} kullanıcı)</h3>
          
          {users.length === 0 ? (
            <p>Henüz kullanıcı yok.</p>
          ) : (
            <div style={styles.usersTableContainer}>
              <table style={styles.usersTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>ID</th>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Rol</th>
                    <th style={styles.tableHeader}>Kayıt Tarihi</th>
                    <th style={styles.tableHeader}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{userItem.id}</td>
                      <td style={styles.tableCell}>
                        {userItem.email}
                        {user.id === userItem.id && <span style={styles.youBadge}> (Siz)</span>}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.roleBadge,
                          ...(userItem.role === 'admin' ? styles.adminBadge : styles.userBadge)
                        }}>
                          {userItem.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {new Date(userItem.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.userActions}>
                          {/* Rol Değiştir Butonu (kendini değiştiremez) */}
                          {user.id !== userItem.id && (
                            <button
                              onClick={() => handleToggleUserRole(userItem.id, userItem.role)}
                              style={{
                                ...styles.roleButton,
                                ...(userItem.role === 'admin' ? styles.makeUserButton : styles.makeAdminButton)
                              }}
                              title={userItem.role === 'admin' ? 'User yap' : 'Admin yap'}
                            >
                              {userItem.role === 'admin' ? '⬇️ User Yap' : '⬆️ Admin Yap'}
                            </button>
                          )}
                          
                          {/* Sil Butonu (kendini silemez) */}
                          {user.id !== userItem.id && (
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              style={styles.deleteUserButton}
                              title="Kullanıcıyı sil"
                            >
                              🗑️ Sil
                            </button>
                          )}
                          
                          {(user.id === userItem.id) && (
                            <span style={styles.selfNote}>Kendi hesabın</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* İstatistikler */}
          <div style={styles.statsContainer}>
            <h4>📊 İstatistikler</h4>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{users.length}</div>
                <div style={styles.statLabel}>Toplam Kullanıcı</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div style={styles.statLabel}>Admin Sayısı</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {users.filter(u => u.role === 'user').length}
                </div>
                <div style={styles.statLabel}>User Sayısı</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '20px',
  },
  // Tab Stilleri
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  activeTab: {
    backgroundColor: '#007bff',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,123,255,0.3)',
  },
  // Film Form Stilleri
  formContainer: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    transition: 'border-color 0.3s',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  updateButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    flex: 1,
  },
  // Film Listesi Stilleri
  filmsContainer: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  filmsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  filmCard: {
    border: '1px solid #e9ecef',
    padding: '20px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  filmInfo: {
    flex: 1,
  },
  description: {
    color: '#666',
    fontSize: '14px',
    marginTop: '10px',
    lineHeight: '1.4',
  },
  posterPreview: {
    width: '100%',
    height: '120px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    marginTop: '15px',
    overflow: 'hidden',
  },
  posterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#ffc107',
    color: '#212529',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    flex: 1,
  },
  // KULLANICI YÖNETİMİ STİLLERİ
  usersContainer: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  usersTableContainer: {
    overflowX: 'auto',
    marginBottom: '30px',
  },
  usersTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: '600',
    color: '#495057',
  },
  tableRow: {
    borderBottom: '1px solid #e9ecef',
    '&:hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  tableCell: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  youBadge: {
    fontSize: '12px',
    color: '#007bff',
    fontWeight: '500',
    marginLeft: '5px',
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  adminBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  userBadge: {
    backgroundColor: '#e2e3e5',
    color: '#383d41',
    border: '1px solid #d6d8db',
  },
  userActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  roleButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  makeAdminButton: {
    backgroundColor: '#cce5ff',
    color: '#004085',
    border: '1px solid #b8daff',
  },
  makeUserButton: {
    backgroundColor: '#f8f9fa',
    color: '#212529',
    border: '1px solid #d6d8db',
  },
  deleteUserButton: {
    padding: '6px 12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  selfNote: {
    fontSize: '12px',
    color: '#6c757d',
    fontStyle: 'italic',
  },
  statsContainer: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#007bff',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6c757d',
  },
};

export default AdminPanel;