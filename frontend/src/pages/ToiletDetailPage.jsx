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
      setMessage('Sharh saqlandi ✓');
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
    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">Yuklanmoqda...</p>
    </div>
  );

  if (!toilet) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
      <div className="text-6xl opacity-30 mb-2">😟</div>
      <h2 className="text-xl font-black uppercase opacity-40">Topilmadi</h2>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Orqaga qaytish</button>
    </div>
  );

  const ownerMessages = chatMessages.filter(m => m.senderId === toilet.ownerId || m.receiverId === toilet.ownerId);

  return (
    <div className="animate-fade-in-up">
      {/* Back Button */}
      <button
        className="btn btn-ghost btn-sm mb-6 font-bold opacity-50 hover:opacity-100 gap-2"
        onClick={() => navigate('/')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Orqaga
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Left Column: Details + Reviews ─── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Main Card */}
          <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
            {/* Hero Image */}
            <div className="h-56 lg:h-72 bg-gradient-to-br from-base-300 to-base-200 relative overflow-hidden">
              {toilet.images?.[0] ? (
                <img src={toilet.images[0]} className="w-full h-full object-cover" alt={toilet.name} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="text-7xl opacity-15 block">🚽</span>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-20 mt-2">Rasm yo'q</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent"></div>
              <div className="absolute top-4 right-4">
                <div className={`badge badge-lg font-black shadow-xl ${
                  toilet.status === 'OPEN' ? 'badge-success' : 'badge-error'
                }`}>
                  {toilet.status === 'OPEN' ? '● Ochiq' : '● Yopiq'}
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 -mt-8 relative z-10">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-1">{toilet.name}</h1>
              <p className="text-xs opacity-40 font-bold uppercase tracking-wider mb-6">
                📍 {Number(toilet.lat).toFixed(4)}, {Number(toilet.lng).toFixed(4)}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="bg-base-200/60 p-4 rounded-2xl text-center">
                  <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Narxi</p>
                  <p className="text-2xl font-black mt-1">{toilet.price}<span className="text-xs opacity-40 ml-1">uzs</span></p>
                </div>
                <div className="bg-base-200/60 p-4 rounded-2xl text-center">
                  <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Reyting</p>
                  <p className="text-2xl font-black mt-1 text-primary">⭐ {Number(toilet.avg_rating || 0).toFixed(1)}</p>
                </div>
                <div className="bg-base-200/60 p-4 rounded-2xl text-center">
                  <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Turi</p>
                  <p className="text-lg font-black mt-1">{toilet.type}</p>
                </div>
                <div className="bg-base-200/60 p-4 rounded-2xl text-center">
                  <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Egasi</p>
                  <p className="text-sm font-black mt-1 truncate">{toilet.owner?.name || 'Noma\'lum'}</p>
                </div>
              </div>

              {/* Gallery */}
              {toilet.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {toilet.images.slice(1).map((img, i) => (
                    <img key={i} src={img} className="rounded-xl aspect-square object-cover border border-base-content/5 shadow-sm hover:scale-105 transition-transform cursor-pointer" alt="Gallery" />
                  ))}
                </div>
              )}

              {/* Owner Actions */}
              {user?.id === toilet.ownerId && (
                <div className="flex gap-2 justify-end border-t border-base-content/5 pt-6">
                  <button className="btn btn-outline btn-sm font-bold gap-1" onClick={() => navigate(`/toilets/${id}/edit`)}>
                    ✏️ Tahrirlash
                  </button>
                  <button className="btn btn-error btn-sm btn-outline font-bold gap-1" onClick={handleDelete}>
                    🗑️ O'chirish
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Reviews ─── */}
          <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-secondary to-primary"></div>
            <div className="card-body p-6 lg:p-8">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-6">
                Fikrlar
                <span className="text-sm font-bold opacity-30 ml-2 normal-case">({reviews.length} ta)</span>
              </h2>

              {/* Review Form */}
              {user?.role === 'USER' && (
                <div className="bg-base-200/50 p-6 rounded-2xl mb-8 border border-base-content/5">
                  <h3 className="font-black mb-4 uppercase text-[10px] opacity-40 tracking-widest">Fikringizni qoldiring</h3>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="rating rating-lg">
                      {[1, 2, 3, 4, 5].map(n => (
                        <input
                          key={n}
                          type="radio"
                          name="rating-detail"
                          className="mask mask-star-2 bg-orange-400"
                          checked={Number(reviewForm.rating) === n}
                          onChange={() => setReviewForm({...reviewForm, rating: String(n)})}
                        />
                      ))}
                    </div>
                    <textarea
                      className="textarea textarea-bordered w-full h-24 bg-base-200 border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="Sizga yoqdimi? Qanday xizmat ko'rsatildi?"
                      value={reviewForm.comment}
                      onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                    />
                    <div className="flex flex-wrap gap-2">
                      {quickFeedbackOptions.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          className={`btn btn-xs rounded-full font-bold ${
                            reviewForm.quick_feedback.includes(opt) ? 'btn-primary' : 'btn-ghost bg-base-300/50 opacity-60 hover:opacity-100'
                          }`}
                          onClick={() => toggleQuickFeedback(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-primary shadow-lg shadow-primary/20 font-bold" type="submit">
                      Yuborish
                    </button>
                  </form>
                </div>
              )}

              {/* Review List */}
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="flex gap-4 p-4 rounded-2xl hover:bg-base-200/50 transition-colors">
                    <div className="avatar placeholder shrink-0">
                      <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-11 h-11">
                        <span className="text-sm font-bold">{(r.user?.name || 'U').charAt(0)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{r.user?.name || "Noma'lum"}</span>
                        <span className="badge badge-sm badge-ghost font-bold">⭐ {r.rating}</span>
                      </div>
                      <p className="opacity-60 text-sm leading-relaxed">{r.comment || 'Izohsiz.'}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.quick_feedback?.map(f => (
                          <span key={f} className="badge badge-xs badge-outline opacity-40 font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center py-12 opacity-25 font-bold italic text-sm">Hali fikrlar yo'q</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Chat ─── */}
        <div className="lg:col-span-1 h-fit sticky top-24">
          <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-secondary text-primary-content flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-white/20 text-primary-content rounded-full w-9 h-9">
                  <span className="text-sm font-bold">{(toilet.owner?.name || 'O').charAt(0)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{toilet.owner?.name || 'Egasi'}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </span>
                  <span className="text-[10px] opacity-70 font-medium">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages bg-base-200/30">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
                  <div className="text-4xl opacity-20">💬</div>
                  <p className="opacity-40 font-bold text-sm">Chatlashish uchun tizimga kiring</p>
                  <button className="btn btn-primary btn-sm font-bold" onClick={() => navigate('/login')}>Kirish</button>
                </div>
              ) : (
                <>
                  {ownerMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                      <div className="text-3xl opacity-15">💬</div>
                      <p className="text-xs opacity-20 font-bold italic">Muloqotni boshlang...</p>
                    </div>
                  )}
                  {ownerMessages.map((m, i) => (
                    <div key={i} className={`chat ${m.senderId === user.id ? 'chat-end' : 'chat-start'}`}>
                      <div className={`chat-bubble text-sm shadow-sm ${
                        m.senderId === user.id ? 'chat-bubble-primary' : ''
                      }`}>
                        {m.text}
                      </div>
                      <div className="chat-footer opacity-30 text-[10px] mt-0.5 font-medium">
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-base-100 border-t border-base-content/5">
              <form onSubmit={handleSendChat} className="join w-full">
                <input
                  className="input input-bordered join-item flex-1 bg-base-200 border-none focus:ring-2 focus:ring-primary/20 text-sm h-10"
                  placeholder="Xabar yozing..."
                  value={chatText}
                  onChange={e => setChatText(e.target.value)}
                  disabled={!user}
                />
                <button className="btn btn-primary join-item h-10 px-4" disabled={!user}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </div>

          {/* Message Toast */}
          {message && (
            <div className="mt-4 alert py-2 px-4 rounded-xl text-xs font-bold border-none bg-success/10 text-success animate-slide-down">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
