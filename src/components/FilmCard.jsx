import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reviewAPI, watchlistAPI } from '../services/api';

const FilmCard = ({ film, onUpdate }) => {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [filmReviews, setFilmReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState(null);
  const [watchlistItemId, setWatchlistItemId] = useState(null);
  const [initialReviewsLoaded, setInitialReviewsLoaded] = useState(false);

  useEffect(() => {
    // Component mount olduğunda yorumları yükle
    fetchFilmReviews();
    
    if (user && film.id) {
      fetchWatchlistStatus();
    }
  }, [user, film.id]);

  const fetchFilmReviews = async () => {
    if (initialReviewsLoaded) return; // Zaten yüklendiyse tekrar yükleme
    
    setReviewsLoading(true);
    try {
      const response = await reviewAPI.getFilmReviews(film.id);
      setFilmReviews(response.data || []);
      setInitialReviewsLoaded(true);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
      setFilmReviews([]);
      setInitialReviewsLoaded(true);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleShowReviews = async () => {
    // Modal açılırken yorumları yenile
    setReviewsLoading(true);
    try {
      const response = await reviewAPI.getFilmReviews(film.id);
      setFilmReviews(response.data || []);
    } catch (error) {
      console.error('Yorumlar yüklenirken hata:', error);
    } finally {
      setReviewsLoading(false);
    }
    setShowReviewsModal(true);
  };

  const fetchWatchlistStatus = async () => {
    try {
      const response = await watchlistAPI.getUserFilmWatchlist(user.id, film.id);
      
      if (response.data.status) {
        setWatchlistStatus(response.data.status);
        const allWatchlistResponse = await watchlistAPI.getUserWatchlist(user.id);
        const item = allWatchlistResponse.data.find(
          item => item.filmId === film.id && item.status === response.data.status
        );
        if (item) {
          setWatchlistItemId(item.id);
        }
      } else {
        setWatchlistStatus(null);
        setWatchlistItemId(null);
      }
    } catch (error) {
      console.error('Watchlist status error:', error);
      setWatchlistStatus(null);
      setWatchlistItemId(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      alert('Lütfen önce giriş yapın!');
      return;
    }

    setReviewLoading(true);
    try {
      await reviewAPI.createReview({
        filmId: film.id,
        rating,
        comment,
        userId: user.id,
      });
      alert('Yorumunuz gönderildi!');
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      
      // Yorumları yenile (hem modal hem kart için)
      const response = await reviewAPI.getFilmReviews(film.id);
      setFilmReviews(response.data || []);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(error.response?.data?.message || 'Yorum gönderilemedi');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddToWatchlist = async (status) => {
    if (!user) {
      alert('Lütfen önce giriş yapın!');
      return;
    }

    setWatchlistLoading(true);
    try {
      const payload = {
        filmId: film.id,
        status,
        userId: user.id,
      };
      
      const response = await watchlistAPI.addToWatchlist(payload);
      
      if (response.data && response.data.item && response.data.item.id) {
        setWatchlistItemId(response.data.item.id);
      }
      
      setWatchlistStatus(status);
      
      alert(`Film "${getStatusText(status)}" listesine eklendi!`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Watchlist error:', error.response?.data);
      
      if (error.response?.data?.message?.includes('already')) {
        setWatchlistStatus(status);
        const allWatchlistResponse = await watchlistAPI.getUserWatchlist(user.id);
        const item = allWatchlistResponse.data.find(
          item => item.filmId === film.id
        );
        if (item) {
          setWatchlistItemId(item.id);
        }
      } else {
        alert(error.response?.data?.message || 'Listeye eklenemedi');
      }
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async () => {
    if (!user) {
      alert('Lütfen önce giriş yapın!');
      return;
    }

    if (!watchlistItemId) {
      alert('Bu film listenizde bulunamadı.');
      return;
    }

    if (!window.confirm('Bu filmi listenizden çıkarmak istediğinize emin misiniz?')) {
      return;
    }

    setWatchlistLoading(true);
    try {
      await watchlistAPI.removeFromWatchlist(watchlistItemId);
      
      setWatchlistStatus(null);
      setWatchlistItemId(null);
      
      alert('Film listenizden çıkarıldı!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Remove error:', error);
      alert(error.response?.data?.message || 'Listeden çıkarılamadı');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'to_watch': return 'İzlenecekler';
      case 'watched': return 'İzledim';
      case 'favorite': return 'Favorilerim';
      default: return status;
    }
  };

  const getStatusButtonStyle = (status) => {
    const isActive = watchlistStatus === status;
    
    switch(status) {
      case 'to_watch':
        return {
          backgroundColor: isActive ? '#e3f2fd' : '#f8f9fa',
          borderColor: isActive ? '#bbdefb' : '#6c757d',
          color: isActive ? '#1976d2' : '#212529',
        };
      case 'watched':
        return {
          backgroundColor: isActive ? '#d4edda' : '#f8f9fa',
          borderColor: isActive ? '#c3e6cb' : '#6c757d',
          color: isActive ? '#155724' : '#212529',
        };
      case 'favorite':
        return {
          backgroundColor: isActive ? '#fff3cd' : '#f8f9fa',
          borderColor: isActive ? '#ffeaa7' : '#6c757d',
          color: isActive ? '#856404' : '#212529',
        };
      default:
        return {
          backgroundColor: '#f8f9fa',
          borderColor: '#6c757d',
          color: '#212529',
        };
    }
  };

  const getAverageRating = () => {
    if (filmReviews.length === 0) return '0.0';
    const total = filmReviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / filmReviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    stars += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
    
    return stars;
  };

  // Yükleniyor durumunda gösterilecek placeholder
  const renderRatingInfo = () => {
    if (reviewsLoading && !initialReviewsLoaded) {
      return (
        <div style={styles.ratingInfo}>
          <div style={styles.reviewsButton}>
            <span style={styles.starIcon}>⭐</span>
            <span style={styles.ratingText}>Yükleniyor...</span>
          </div>
        </div>
      );
    }
    
    return (
      <div style={styles.ratingInfo}>
        <button 
          onClick={handleShowReviews}
          style={styles.reviewsButton}
        >
          <span style={styles.starIcon}>⭐</span>
          <span style={styles.ratingText}>
            {getAverageRating()} ({filmReviews.length} yorum)
          </span>
          <span style={styles.viewReviews}>Yorumları Gör</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div style={styles.card}>
        <div style={styles.poster}>
          {film.posterUrl ? (
            <img src={film.posterUrl} alt={film.title} style={styles.posterImg} />
          ) : (
            <div style={styles.noPoster}>🎬</div>
          )}
        </div>
        <div style={styles.info}>
          <h3 style={styles.title}>{film.title}</h3>
          <p style={styles.director}>Yönetmen: {film.director}</p>
          <p style={styles.year}>Yıl: {film.releaseYear}</p>
          
          {/* Ortalama Puan ve Yorum Sayısı - GÜNCELLENDİ */}
          {renderRatingInfo()}
          
          {film.description && (
            <p style={styles.description}>{film.description.substring(0, 100)}...</p>
          )}
          
          {/* Butonlar */}
          <div style={styles.actionButtons}>
            <button 
              onClick={() => setShowReviewForm(!showReviewForm)}
              style={styles.reviewButton}
              disabled={reviewLoading}
            >
              ⭐ Puan Ver
            </button>
          </div>

          {/* Watchlist Butonları */}
          <div style={styles.watchlistSection}>
            <h4 style={styles.watchlistTitle}>Listeme Ekle:</h4>
            <div style={styles.watchlistButtons}>
              {['to_watch', 'watched', 'favorite'].map((status) => (
                <button 
                  key={status}
                  onClick={() => handleAddToWatchlist(status)}
                  style={{
                    ...styles.watchlistButton,
                    ...getStatusButtonStyle(status),
                  }}
                  disabled={watchlistLoading}
                >
                  {watchlistStatus === status ? '✓ ' : ''}
                  {status === 'to_watch' ? '📝 İzlenecekler' : 
                   status === 'watched' ? '✅ İzledim' : 
                   '❤️ Favorilerim'}
                </button>
              ))}
              
              {watchlistStatus && (
                <button 
                  onClick={handleRemoveFromWatchlist}
                  style={styles.removeButton}
                  disabled={watchlistLoading}
                >
                  ❌ Kaldır
                </button>
              )}
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div style={styles.reviewForm}>
              <div style={styles.rating}>
                <span>Puan: </span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      ...styles.starButton,
                      color: star <= rating ? '#ffc107' : '#ccc',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Yorumunuz..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={styles.commentInput}
                rows="3"
              />
              <div style={styles.reviewActions}>
                <button 
                  onClick={handleReviewSubmit}
                  disabled={reviewLoading}
                  style={styles.submitButton}
                >
                  {reviewLoading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
                <button 
                  onClick={() => setShowReviewForm(false)}
                  style={styles.cancelButton}
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YORUMLAR MODALI */}
      {showReviewsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowReviewsModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{film.title} - Yorumlar</h2>
              <button 
                onClick={() => setShowReviewsModal(false)}
                style={styles.closeButton}
              >
                ✕
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {/* Ortalama Puan */}
              <div style={styles.averageRating}>
                <h3>Ortalama Puan: {getAverageRating()}/5</h3>
                <div style={styles.averageStars}>
                  {renderStars(parseFloat(getAverageRating()))}
                </div>
                <p>Toplam {filmReviews.length} yorum</p>
              </div>
              
              {/* Yorum Listesi */}
              <div style={styles.reviewsList}>
                {reviewsLoading ? (
                  <div style={styles.loading}>Yorumlar yükleniyor...</div>
                ) : filmReviews.length === 0 ? (
                  <div style={styles.noReviews}>
                    <p>Henüz yorum yapılmamış.</p>
                    <p>İlk yorumu sen yap!</p>
                  </div>
                ) : (
                  filmReviews.map((review) => (
                    <div key={review.id} style={styles.reviewItem}>
                      <div style={styles.reviewHeader}>
                        <div style={styles.reviewUser}>
                          <strong>{review.user?.email || 'Anonim'}</strong>
                        </div>
                        <div style={styles.reviewRating}>
                          <span style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </span>
                          <span style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p style={styles.reviewComment}>{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={() => {
                  setShowReviewsModal(false);
                  setShowReviewForm(true);
                }}
                style={styles.addReviewButton}
              >
                ⭐ Yorum Ekle
              </button>
              <button 
                onClick={() => setShowReviewsModal(false)}
                style={styles.closeModalButton}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// TAM STİLLER
const styles = {
  
  card: {
    border: '1px solid #a6a39c',
    borderRadius: '8px',
    padding: '16px',
    margin: '10px',
    display: 'flex',
    backgroundColor: '#a6a39c',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  poster: {
    width: '100px',
    height: '150px',
    marginRight: '16px',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    flexShrink: 0,
  },
  posterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px',
  },
  noPoster: {
    fontSize: '40px',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  director: {
    margin: '0 0 4px 0',
    color: '#555',
    fontSize: '14px',
  },
  year: {
    margin: '0 0 8px 0',
    color: '#555',
    fontSize: '14px',
  },
  ratingInfo: {
    marginBottom: '10px',
  },
  reviewsButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#856404',
    width: '100%',
    justifyContent: 'flex-start',
  },
  starIcon: {
    fontSize: '16px',
  },
  ratingText: {
    flex: 1,
    textAlign: 'left',
  },
  viewReviews: {
    fontSize: '12px',
    color: '#666',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  actionButtons: {
    marginBottom: '15px',
  },
  reviewButton: {
    padding: '8px 16px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '100%',
  },
  watchlistSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px dashed #e8e2d3',
  },
  watchlistTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#555',
  },
  watchlistButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  watchlistButton: {
    padding: '8px 12px',
    border: '1px solid #6c757d',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  removeButton: {
    padding: '8px 12px',
    border: '1px solid #dc3545',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '5px',
    transition: 'all 0.3s ease',
  },
  reviewForm: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  rating: {
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 2px',
  },
  commentInput: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '10px',
    resize: 'vertical',
  },
  reviewActions: {
    display: 'flex',
    gap: '8px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1,
  },
  // Modal Stilleri
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  averageRating: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  averageStars: {
    fontSize: '24px',
    color: '#ffc107',
    margin: '10px 0',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  noReviews: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  reviewItem: {
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  reviewUser: {
    fontSize: '14px',
    color: '#333',
  },
  reviewRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  reviewStars: {
    color: '#ffc107',
    fontSize: '16px',
  },
  reviewDate: {
    fontSize: '12px',
    color: '#888',
  },
  reviewComment: {
    margin: 0,
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  modalFooter: {
    padding: '20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  addReviewButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  closeModalButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default FilmCard;