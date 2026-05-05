import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const quickFeedbackOptions = ['Toza', 'Arzon', 'Qulay', 'Navbat bor', 'Sovun bor'];

export default function ToiletDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chatMessages, sendMessage } = useSocket();
  
  const [toilet, setToilet] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [reviewForm, setReviewForm] = useState({
    rating: '5',
    comment: '',
    quick_feedback: []
  });

  const [chatText, setChatText] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [toiletRes, reviewsRes] = await Promise.all([
        request(`/toilets/${id}`),
        request(`/reviews/toilet/${id}`)
      ]);
      setToilet(toiletRes.data);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    try {
      await request('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          toiletId: Number(id),
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
          quick_feedback: reviewForm.quick_feedback
        })
      });
      setMessage('Sharh saqlandi');
      setReviewForm({ rating: '5', comment: '', quick_feedback: [] });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function toggleQuickFeedback(val) {
    setReviewForm(prev => {
      const exists = prev.quick_feedback.includes(val);
      return {
        ...prev,
        quick_feedback: exists 
          ? prev.quick_feedback.filter(i => i !== val)
          : [...prev.quick_feedback, val]
      };
    });
  }

  function handleSendChat(e) {
    e.preventDefault();
    if (!chatText.trim() || !toilet) return;
    sendMessage(toilet.ownerId, chatText.trim());
    setChatText('');
  }

  async function handleDelete() {
    if (!window.confirm("O'chirmoqchimisiz?")) return;
    try {
      await request(`/toilets/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="font-bold opacity-50 uppercase tracking-widest text-xs">Yuklanmoqda...</p>
    </div>
  );
  
  if (!toilet) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="alert alert-error max-w-md">
        <span>Xatolik: Toilet topilmadi</span>
      </div>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>Orqaga qaytish</button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Details and Reviews */}
      <div className="lg:col-span-2 space-y-8">
        {/* Main Details Panel */}
        <div className="card bg-base-100 shadow-xl border border-base-content/5">
          <div className="card-body p-0">
            {/* Hero Image / Gallery Placeholder */}
            <div className="h-64 bg-base-300 relative">
              {toilet.images?.[0] ? (
                <img src={toilet.images[0]} className="w-full h-full object-cover" alt={toilet.name} />
              ) : (
                <div className="flex items-center justify-center h-full text-5xl opacity-20">🚽</div>
              )}
              <div className="absolute top-4 right-4">
                <div className={`badge badge-lg font-bold shadow-lg ${
                  toilet.status === 'OPEN' ? 'badge-success' : 'badge-error'
                }`}>
                  {toilet.status}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">{toilet.name}</h1>
                  <p className="text-sm opacity-60 mt-1 uppercase font-bold">Joylashuv: {toilet.lat}, {toilet.lng}</p>
                </div>
                <div className="stats shadow bg-base-200">
                  <div className="stat py-2 px-4">
                    <div className="stat-title text-[10px] uppercase font-bold">Narxi</div>
                    <div className="stat-value text-xl">{toilet.price} <span className="text-xs opacity-50">uzs</span></div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="stats stats-vertical lg:stats-horizontal w-full bg-base-200 shadow-sm rounded-2xl mb-8">
                <div className="stat">
                  <div className="stat-title">Reyting</div>
                  <div className="stat-value text-primary">⭐ {toilet.avg_rating || 0}</div>
                  <div className="stat-desc">Foydalanuvchilar tomonidan</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Turi</div>
                  <div className="stat-value text-secondary text-2xl">{toilet.type}</div>
                  <div className="stat-desc">Kategoriyasi</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Ega</div>
                  <div className="stat-value text-lg truncate max-w-[150px]">{toilet.owner?.name || 'Owner'}</div>
                  <div className="stat-desc text-xs">ID: {toilet.ownerId}</div>
                </div>
              </div>

              {toilet.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {toilet.images.slice(1).map((img, i) => (
                    <img key={i} src={img} className="rounded-xl aspect-square object-cover border border-base-content/10 shadow-sm" alt="Gallery" />
                  ))}
                </div>
              )}

              {user?.id === toilet.ownerId && (
                <div className="flex gap-2 justify-end border-t border-base-content/5 pt-6 mt-6">
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/toilets/${id}/edit`)}>Tahrirlash</button>
                  <button className="btn btn-error btn-sm btn-outline" onClick={handleDelete}>O'chirish</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
          <div className="card-body">
            <h2 className="card-title text-2xl font-black uppercase mb-6">Fikrlar ({reviews.length})</h2>
            
            {user?.role === 'USER' && (
              <div className="bg-base-200 p-6 rounded-2xl mb-8 border border-base-content/5">
                <h3 className="font-bold mb-4 uppercase text-xs opacity-60 tracking-widest">Fikringizni qoldiring</h3>
                <form onSubmit={handleReviewSubmit} className="form-control gap-4">
                  <div className="rating rating-lg mb-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <input 
                        key={n} 
                        type="radio" 
                        name="rating-2" 
                        className="mask mask-star-2 bg-orange-400" 
                        checked={Number(reviewForm.rating) === n}
                        onChange={() => setReviewForm({...reviewForm, rating: String(n)})}
                      />
                    ))}
                  </div>
                  <textarea 
                    className="textarea textarea-bordered h-24 focus:textarea-primary text-base" 
                    placeholder="Sizga yoqdimi? Qanday xizmat ko'rsatildi?" 
                    value={reviewForm.comment} 
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  />
                  <div className="flex flex-wrap gap-2">
                    {quickFeedbackOptions.map(opt => (
                      <button 
                        key={opt} 
                        type="button"
                        className={`btn btn-xs rounded-full ${reviewForm.quick_feedback.includes(opt) ? 'btn-primary' : 'btn-ghost bg-base-300'}`}
                        onClick={() => toggleQuickFeedback(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-primary shadow-lg shadow-primary/20" type="submit">Yuborish</button>
                </form>
              </div>
            )}

            <div className="space-y-6">
              {reviews.map(r => (
                <div key={r.id} className="flex gap-4 p-4 rounded-2xl hover:bg-base-200 transition-colors">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-12 h-12">
                      <span className="text-lg">{(r.user?.name || 'U').charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-lg">{r.user?.name || "Noma'lum"}</span>
                      <span className="badge badge-ghost font-bold">⭐ {r.rating}</span>
                    </div>
                    <p className="opacity-80 text-sm leading-relaxed">{r.comment || 'Izohsiz.'}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {r.quick_feedback?.map(f => (
                        <span key={f} className="badge badge-sm badge-outline opacity-50">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-center py-10 opacity-40 font-bold italic">Hali fikrlar yo'q</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Chat Sidebar */}
      <div className="lg:col-span-1 h-fit sticky top-24">
        <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden h-[700px] flex flex-col">
          <div className="p-4 bg-primary text-primary-content">
            <h2 className="card-title flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              Ega bilan bog'lanish
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages bg-base-200/50">
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
                <p className="opacity-50 font-bold italic">Chatlashish uchun login qiling</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>Kirish</button>
              </div>
            ) : (
              <>
                {chatMessages.filter(m => m.senderId === toilet.ownerId || m.receiverId === toilet.ownerId).length === 0 && (
                  <p className="text-center opacity-30 text-xs italic py-10">Muloqotni boshlang...</p>
                )}
                {chatMessages.filter(m => m.senderId === toilet.ownerId || m.receiverId === toilet.ownerId).map((m, i) => (
                  <div key={i} className={`chat ${m.senderId === user.id ? 'chat-end' : 'chat-start'}`}>
                    <div className={`chat-bubble shadow-sm ${m.senderId === user.id ? 'chat-bubble-primary' : 'chat-bubble-neutral'}`}>
                      {m.text}
                    </div>
                    <div className="chat-footer opacity-50 text-[10px] mt-1">
                      {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="p-4 bg-base-100 border-t border-base-content/5">
            <form onSubmit={handleSendChat} className="join w-full">
              <input 
                className="input input-bordered join-item flex-1 focus:input-primary" 
                placeholder="Xabar..." 
                value={chatText} 
                onChange={e => setChatText(e.target.value)} 
                disabled={!user}
              />
              <button className="btn btn-primary join-item" disabled={!user}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
