import React, { useState, useEffect } from 'react';
import { filmAPI, watchlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FilmCard from './FilmCard';

const FilmList = ({ activeFilter, setActiveFilter }) => {
  const [allFilms, setAllFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchFilms();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredFilms(allFilms);
    } else if (user && activeFilter) {
      fetchWatchlistFilms(activeFilter);
    } else {
      setFilteredFilms(allFilms);
    }
  }, [activeFilter, allFilms, user]);

  const fetchFilms = async () => {
    try {
      setLoading(true);
      const response = await filmAPI.getAllFilms();
      setAllFilms(response.data);
      setError(null);
    } catch (err) {
      setError('Filmler yüklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlistFilms = async (status) => {
    try {
      setLoading(true);
      
      // 1. Kullanıcının watchlist'ini al
      const watchlistResponse = await watchlistAPI.getUserWatchlist(user.id);
      const watchlistItems = watchlistResponse.data || [];
      
      console.log('Watchlist items:', watchlistItems);
      console.log('Filtering for status:', status);
      
      // 2. Seçilen statüye göre filtrele (örneğin: 'to_watch')
      const filteredWatchlist = watchlistItems.filter(item => 
        item.status === status
      );
      
      console.log('Filtered watchlist:', filteredWatchlist);
      
      // 3. Filtrelenmiş watchlist'teki film ID'lerini al
      const filmIds = filteredWatchlist.map(item => item.filmId);
      console.log('Film IDs to show:', filmIds);
      
      // 4. Tüm filmlerden sadece watchlist'te olanları göster
      const filmsToShow = allFilms.filter(film => 
        filmIds.includes(film.id)
      );
      
      console.log('Films to show:', filmsToShow);
      setFilteredFilms(filmsToShow);
      
    } catch (err) {
      console.error('Watchlist filmleri yüklenirken hata:', err);
      setError('Liste filmleri yüklenirken bir hata oluştu.');
      setFilteredFilms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setActiveFilter('all');
  };

  const getHeaderText = () => {
    switch(activeFilter) {
      case 'all': return 'Tüm Filmler';
      case 'to_watch': return '📝 İzlenecekler Listem';
      case 'watched': return '✅ İzlediğim Filmler';
      case 'favorite': return '❤️ Favori Filmlerim';
      default: return 'Filmler';
    }
  };

  const getEmptyMessage = () => {
    if (!user) {
      return 'Listelerinizi görmek için lütfen giriş yapın.';
    }
    
    switch(activeFilter) {
      case 'to_watch': return 'İzlenecekler listenizde henüz film yok.';
      case 'watched': return 'Henüz hiç film izlememişsiniz.';
      case 'favorite': return 'Favori listenizde henüz film yok.';
      default: return 'Henüz film eklenmemiş.';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={fetchFilms} style={styles.retryButton}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h1 style={styles.header}>{getHeaderText()}</h1>
        {activeFilter !== 'all' && (
          <button 
            onClick={handleClearFilter} 
            style={styles.clearButton}
          >
            Tüm Filmleri Göster
          </button>
        )}
      </div>
      
      {/* Kullanıcı giriş yapmamışsa uyarı göster */}
      {activeFilter !== 'all' && !user && (
        <div style={styles.loginWarning}>
          <p>{getEmptyMessage()}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={styles.loginButton}
          >
            Giriş Yap
          </button>
        </div>
      )}

      {/* Film listesi */}
      {filteredFilms.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>{getEmptyMessage()}</p>
          {activeFilter !== 'all' && user && (
            <button 
              onClick={handleClearFilter} 
              style={styles.browseButton}
            >
              Tüm Filmleri Görüntüle
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredFilms.map((film) => (
            <FilmCard 
              key={film.id} 
              film={film} 
              onUpdate={() => {
                fetchFilms();
                if (activeFilter !== 'all') {
                  fetchWatchlistFilms(activeFilter);
                }
              }} 
            />
          ))}
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
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  header: {
    margin: 0,
    fontSize: '28px',
    color: 'white',
  },
  clearButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  loginWarning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    textAlign: 'center',
  },
  loginButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  emptyText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '20px',
  },
  browseButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '25px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '20px',
    padding: '100px',
    color: '#666',
  },
  error: {
    color: '#dc3545',
    textAlign: 'center',
    padding: '20px',
    fontSize: '16px',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'block',
    margin: '0 auto',
  },
};

export default FilmList;