import { useState } from 'react';
import { FiLock, FiChevronDown, FiActivity, FiUser, FiMapPin, FiStar, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const API_DATA = [
  {
    category: 'Health',
    categoryUz: 'Server holati',
    categoryRu: 'Состояние сервера',
    icon: <FiActivity className="text-rose-500" />,
    endpoints: [
      { 
        method: 'GET', 
        path: '/api/health', 
        descUz: 'Server holati tekshiruvi (Ochiq - token shart emas)', 
        descRu: 'Проверка состояния сервера (Открыто - токен не требуется)',
        auth: false 
      },
    ]
  },
  {
    category: 'Authentication',
    categoryUz: 'Authentifikatsiya',
    categoryRu: 'Аутентификация',
    icon: <FiUser className="text-amber-500" />,
    endpoints: [
      { method: 'POST', path: '/api/auth/register', descUz: 'Ro\'yxatdan o\'tish', descRu: 'Регистрация', auth: false },
      { method: 'POST', path: '/api/auth/callback/credentials', descUz: 'Tizimga kirish (Login)', descRu: 'Вход в систему (Логин)', auth: false },
      { method: 'GET', path: '/api/auth/session', descUz: 'Sessiyani tekshirish', descRu: 'Проверка сессии', auth: false },
      { method: 'POST', path: '/api/auth/signout', descUz: 'Tizimdan chiqish', descRu: 'Выход', auth: true },
      { method: 'GET', path: '/api/auth/csrf', descUz: 'CSRF tokenni olish', descRu: 'Получить CSRF токен', auth: false },
    ]
  },
  {
    category: 'Toilets',
    categoryUz: 'Hojatxonalar (Joylar)',
    categoryRu: 'Туалеты (Места)',
    icon: <FiMapPin className="text-blue-500" />,
    endpoints: [
      { method: 'GET', path: '/api/toilets', descUz: 'Barcha joylarni olish', descRu: 'Получить все места', auth: false },
      { method: 'POST', path: '/api/toilets', descUz: 'Yangi joy qo\'shish', descRu: 'Добавить новое место', auth: true },
      { method: 'GET', path: '/api/toilets/nearby', descUz: 'Yaqin atrofdagi joylarni qidirish', descRu: 'Поиск ближайших мест', auth: false },
      { method: 'GET', path: '/api/toilets/[id]', descUz: 'Joy haqida batafsil va sharhlar', descRu: 'Детальная информация и отзывы', auth: false },
      { method: 'PUT', path: '/api/toilets/[id]', descUz: 'Joyni tahrirlash', descRu: 'Редактировать место', auth: true },
      { method: 'DELETE', path: '/api/toilets/[id]', descUz: 'Joyni o\'chirish', descRu: 'Удалить место', auth: true },
    ]
  },
  {
    category: 'Reviews',
    categoryUz: 'Sharhlar',
    categoryRu: 'Отзывы',
    icon: <FiStar className="text-yellow-400" />,
    endpoints: [
      { method: 'POST', path: '/api/reviews', descUz: 'Sharh qoldirish va reyting berish', descRu: 'Оставить отзыв и поставить рейтинг', auth: true },
    ]
  }
];

const MethodBadge = ({ method }) => {
  const styles = {
    GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    POST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider min-w-[60px] text-center ${styles[method]}`}>
      {method}
    </span>
  );
};

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-300 font-sans selection:bg-primary/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">API Documentation</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">v1.0.0 • Public API</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">System Operational</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white mb-2">Backend API Reference</h2>
          <p className="text-gray-500 max-w-2xl leading-relaxed">
            Toilet Finder platformasi uchun barcha mavjud API endpointlari ro'yxati. 
            Ma'lumotlarni integratsiya qilish va testlash uchun foydalaning.
          </p>
        </div>

        <div className="space-y-10">
          {API_DATA.map((section, sIdx) => (
            <section key={sIdx} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                <div className="p-2 bg-white/5 rounded-lg text-xl">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{section.category}</h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {section.categoryUz} / {section.categoryRu}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {section.endpoints.map((ep, eIdx) => {
                  const id = `${sIdx}-${eIdx}`;
                  return (
                    <div 
                      key={eIdx}
                      className="group border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl overflow-hidden transition-all duration-200"
                    >
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer"
                        onClick={() => toggle(id)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <MethodBadge method={ep.method} />
                          <code className="text-sm font-mono text-gray-400 group-hover:text-white transition-colors truncate">
                            {ep.path}
                          </code>
                          <div className="hidden lg:block h-1 w-1 rounded-full bg-white/10 mx-2"></div>
                          <p className="hidden md:block text-xs text-gray-500 truncate">
                            {ep.descUz}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 ml-4">
                          {ep.auth && (
                            <div className="tooltip tooltip-left" data-tip="Token talab qilinadi">
                              <FiLock className="text-gray-600 group-hover:text-amber-500/50 transition-colors" size={14} />
                            </div>
                          )}
                          <FiChevronDown 
                            className={`text-gray-600 transition-transform duration-300 ${expanded[id] ? 'rotate-180' : ''}`} 
                            size={16} 
                          />
                        </div>
                      </div>

                      {expanded[id] && (
                        <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-slide-down">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2">Tavsif / Описание</h4>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-300 font-medium leading-relaxed">
                                    <span className="text-primary mr-2">•</span> {ep.descUz}
                                  </p>
                                  <p className="text-sm text-gray-500 font-medium leading-relaxed italic">
                                    <span className="text-gray-700 mr-2">•</span> {ep.descRu}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2">Xavfsizlik</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.auth ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                    {ep.auth ? 'TOKEN REQUIRED' : 'PUBLIC ACCESS'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-[11px]">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600 uppercase text-[9px] font-black tracking-widest">Example Response</span>
                                <span className="text-emerald-500/50">200 OK</span>
                              </div>
                              <pre className="text-emerald-400/80">
                                {JSON.stringify({
                                  success: true,
                                  data: ep.method === 'GET' ? [] : {},
                                  message: "Success"
                                }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Savollar bormi? Backend jamoasi bilan bog'laning.
          </p>
          <div className="flex justify-center gap-4">
            <a href="mailto:support@toilet.uz" className="text-xs font-bold text-white hover:text-primary transition-colors">support@toilet.uz</a>
            <span className="text-white/5">•</span>
            <a href="#" className="text-xs font-bold text-white hover:text-primary transition-colors">Telegram Bot</a>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}} />
    </div>
  );
}
