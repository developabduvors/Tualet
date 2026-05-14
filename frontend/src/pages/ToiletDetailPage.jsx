import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ToiletDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: '5', comment: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const response = await request(`/toilets/${id}`);
      setLocation(response.data.location);
      setReviews(response.data.reviews.data || []);
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
          locationId: id,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
          images: [],
        }),
      });
      setMessage('Sharh saqlandi');
      setReviewForm({ rating: '5', comment: '' });
      loadData();
    } catch (error) {
      setMessage(error.message);
    }
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

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  if (!location) return <div className="text-center py-20">{message || 'Topilmadi'}</div>;

  const isOwner = user?.id && user.id === location.createdById;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="card bg-base-100 shadow-2xl border border-base-content/5 overflow-hidden">
        <div className="p-6 lg:p-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-2">{location.name}</h1>
          <p className="opacity-60">{location.address}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="bg-base-200/60 p-4 rounded-2xl text-center">
              <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Narxi</p>
              <p className="text-2xl font-black mt-1">{location.priceAmount}</p>
            </div>
            <div className="bg-base-200/60 p-4 rounded-2xl text-center">
              <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Reyting</p>
              <p className="text-2xl font-black mt-1">{Number(location.rating || 0).toFixed(1)}</p>
            </div>
            <div className="bg-base-200/60 p-4 rounded-2xl text-center">
              <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Turi</p>
              <p className="text-lg font-black mt-1">{location.type}</p>
            </div>
            <div className="bg-base-200/60 p-4 rounded-2xl text-center">
              <p className="text-[9px] uppercase font-black opacity-25 tracking-widest">Koordinata</p>
              <p className="text-sm font-black mt-1">{location.latitude}, {location.longitude}</p>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 justify-end border-t border-base-content/5 pt-6 mt-6">
              <button className="btn btn-outline btn-sm font-bold gap-1" onClick={() => navigate(`/toilets/${id}/edit`)}>
                Tahrirlash
              </button>
              <button className="btn btn-error btn-sm btn-outline font-bold gap-1" onClick={handleDelete}>
                O&apos;chirish
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-content/5 overflow-hidden">
        <div className="card-body p-6 lg:p-8">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Sharhlar</h2>

          {user && (
            <div className="bg-base-200/50 p-6 rounded-2xl mb-8 border border-base-content/5">
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <select
                  className="select select-bordered w-full bg-base-200 border-none"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                >
                  <option value="5">5</option>
                  <option value="4">4</option>
                  <option value="3">3</option>
                  <option value="2">2</option>
                  <option value="1">1</option>
                </select>
                <textarea
                  className="textarea textarea-bordered w-full h-24 bg-base-200 border-none"
                  placeholder="Fikringizni yozing"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                />
                <button className="btn btn-primary shadow-lg shadow-primary/20 font-bold" type="submit">
                  Yuborish
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-2xl hover:bg-base-200/50 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{review.user?.name || 'Noma&apos;lum'}</span>
                  <span className="badge badge-sm badge-ghost font-bold">{review.rating}</span>
                </div>
                <p className="opacity-60 text-sm leading-relaxed">{review.comment}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-center py-12 opacity-25 font-bold italic text-sm">Hali sharhlar yo&apos;q</p>}
          </div>
        </div>
      </div>

      {message && (
        <div className="alert py-2 px-4 rounded-xl text-xs font-bold border-none bg-success/10 text-success animate-slide-down">
          {message}
        </div>
      )}
    </div>
  );
}
