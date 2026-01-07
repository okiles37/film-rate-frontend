import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import FilmList from './components/FilmList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminPanel from './components/AdminPanel';

// Navbar component'i - GÜNCELLENDİ
const Navbar = ({ activeFilter, setActiveFilter }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <div style={styles.logoContainer}>
          <Link to="/" style={styles.logo} onClick={() => setActiveFilter('all')}>
            🎬 FilmRate
          </Link>
        </div>
        
        {/* YENİ: Watchlist Filtre Butonları */}
        {user && location.pathname === '/' && (
          <div style={styles.filterButtons}>
            <button
              onClick={() => handleFilterClick('to_watch')}
              style={{
                ...styles.filterButton,
                backgroundColor: activeFilter === 'to_watch' ? '#e3f2fd' : 'transparent',
                color: activeFilter === 'to_watch' ? '#1976d2' : 'white',
                borderColor: activeFilter === 'to_watch' ? '#bbdefb' : 'rgba(255,255,255,0.3)',
              }}
            >
              📝 İzlenecekler
            </button>
            <button
              onClick={() => handleFilterClick('watched')}
              style={{
                ...styles.filterButton,
                backgroundColor: activeFilter === 'watched' ? '#d4edda' : 'transparent',
                color: activeFilter === 'watched' ? '#155724' : 'white',
                borderColor: activeFilter === 'watched' ? '#c3e6cb' : 'rgba(255,255,255,0.3)',
              }}
            >
              ✅ İzledim
            </button>
            <button
              onClick={() => handleFilterClick('favorite')}
              style={{
                ...styles.filterButton,
                backgroundColor: activeFilter === 'favorite' ? '#fff3cd' : 'transparent',
                color: activeFilter === 'favorite' ? '#856404' : 'white',
                borderColor: activeFilter === 'favorite' ? '#ffeaa7' : 'rgba(255,255,255,0.3)',
              }}
            >
              ❤️ Favorilerim
            </button>
          </div>
        )}
      </div>

      <nav style={styles.nav}>
        <Link to="/" style={styles.navLink} onClick={() => setActiveFilter('all')}>
          Ana Sayfa
        </Link>
        {user ? (
          <>
            <span style={styles.userInfo}>
              {user.email} ({user.role})
            </span>
            {isAdmin() && (
              <Link to="/admin" style={styles.navLink} onClick={() => setActiveFilter('all')}>
                Admin Paneli
              </Link>
            )}
            <button onClick={logout} style={styles.logoutButton}>
              Çıkış Yap
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.navLink} onClick={() => setActiveFilter('all')}>
              Giriş Yap
            </Link>
            <Link to="/register" style={styles.navLink} onClick={() => setActiveFilter('all')}>
              Kayıt Ol
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};

// Ana uygulama - GÜNCELLENDİ
const AppContent = () => {
  const { loading } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all'); // YENİ: Filtre state'i

  if (loading) {
    return <div style={styles.loading}>Yükleniyor...</div>;
  }

  return (
    <Router>
      <div style={styles.app}>
        {/* YENİ: activeFilter ve setActiveFilter prop'ları eklendi */}
        <Navbar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        <main style={styles.main}>
          <Routes>
            {/* YENİ: FilmList'e filtre prop'ları eklendi */}
            <Route 
              path="/" 
              element={
                <FilmList 
                  activeFilter={activeFilter} 
                  setActiveFilter={setActiveFilter} 
                />
              } 
            />
            {/* YENİ: LoginForm ve RegisterForm'a setActiveFilter eklendi */}
            <Route 
              path="/login" 
              element={
                <LoginForm 
                  setActiveFilter={setActiveFilter} 
                />
              } 
            />
            <Route 
              path="/register" 
              element={
                <RegisterForm 
                  setActiveFilter={setActiveFilter} 
                />
              } 
            />
            {/* YENİ: AdminPanel'e setActiveFilter eklendi */}
            <Route 
              path="/admin" 
              element={
                <AdminPanel 
                  setActiveFilter={setActiveFilter} 
                />
              } 
            />
          </Routes>
        </main>
        <footer style={styles.footer}>
          <p>© 2025 FilmRate - Film İnceleme Platformu</p>
        </footer>
      </div>
    </Router>
  );
};

// Ana App component'i
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Stiller - GÜNCELLENDİ
const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    textAlign: 'center',
    fontSize: '24px',
    padding: '100px',
  },
  header: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  leftSection: { // YENİ: Sol bölüm için stil
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  filterButtons: { // YENİ: Filtre butonları için stil
    display: 'flex',
    gap: '10px',
  },
  filterButton: { // YENİ: Filtre butonu için stil
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.3)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
  userInfo: {
    color: '#ccc',
    fontSize: '14px',
    marginRight: '10px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  main: {
    flex: 1,
    backgroundColor: '#292825',
    padding: '20px',
  },
  footer: {
    backgroundColor: '#1a1a1a',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
  },
};

export default App;