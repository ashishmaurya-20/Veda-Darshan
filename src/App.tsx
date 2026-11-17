import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { fetchScriptureVerse, fetchVerseCount, SCRIPTURES, ScriptureVerse } from './services/scriptureService';
import { useVerseAudio } from './services/useVerseAudio';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  User as UserIcon,
  Loader2,
  Menu,
  X,
  History,
  AlertCircle,
  Library,
  ShieldCheck,
  Heart,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Volume2,
  VolumeX,
  Loader as LoaderIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">We encountered an unexpected error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface UserData {
  username: string;
  lastRead: { scriptureId: string; section: string; verse: string };
  history?: { scriptureId: string; section: string; verse: string; timestamp: string }[];
  updatedAt: string;
}

function LoginModal({ onLogin, onClose }: { onLogin: (name: string) => void; onClose: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim() || (isRegister && !email.trim())) return;
    
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const body = isRegister 
        ? { username: name.trim(), password: password.trim(), email: email.trim() }
        : { username: name.trim(), password: password.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        if (isRegister) {
          setIsRegister(false);
          setError('Registration successful! Please login with your credentials.');
          // Clear password for security, keep username for convenience
          setPassword('');
        } else {
          onLogin(name.trim());
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError('Network error: Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{isRegister ? 'Create Account' : 'Welcome to Veda Darshan'}</h2>
          <p className="text-gray-500 mt-2">{isRegister ? 'Register to save your progress' : 'Login to resume your spiritual journey'}</p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Username</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjuna"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium"
              />
            </div>
            {isRegister && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arjuna@kurukshetra.com"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim() || !password.trim() || (isRegister && !email.trim())}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? 'Register' : 'Login')}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function HistoryModal({ history, onClose, onSelect }: { 
  history: UserData['history']; 
  onClose: () => void;
  onSelect: (item: { scriptureId: string; section: string; verse: string }) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-orange-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Reading History</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!history || history.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Your reading history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const scripture = SCRIPTURES.find(s => s.id === item.scriptureId);
                return (
                  <button
                    key={idx}
                    onClick={() => { onSelect(item); onClose(); }}
                    className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-orange-900 transition-colors">
                          {scripture?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {scripture?.sectionLabel} {item.section}, Verse {item.verse}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AdminLoginModal({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem('admin_token', data.token);
        }
        onLogin();
        onClose();
      } else {
        setError('Invalid admin credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-indigo-50"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Admin Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter admin username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Admin Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter admin password"
              required
            />
          </div>
          
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AdminPage({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    fetch('/api/admin/users', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Back to Reader
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Read</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">No user data found yet.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.username} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{u.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">
                          {SCRIPTURES.find(s => s.id === u.lastRead.scriptureId)?.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          Section {u.lastRead.section}, Verse {u.lastRead.verse}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{new Date(u.updatedAt).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GitaApp() {
  const [username, setUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gita_username');
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentScripture, setCurrentScripture] = useState(SCRIPTURES[0]);
  const [currentSection, setCurrentSection] = useState('1');
  const [currentVerseNum, setCurrentVerseNum] = useState('1');
  const [maxVerses, setMaxVerses] = useState(0);
  const [verse, setVerse] = useState<ScriptureVerse | null>(null);
  const [fetchingVerse, setFetchingVerse] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showScriptureSelector, setShowScriptureSelector] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);

  // Audio hook — reads the verse aloud with a female Hindi voice
  const { audioState, toggle: toggleAudio, stop: stopAudio } = useVerseAudio();

  // Check for admin route
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdminLogin(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Load progress
  useEffect(() => {
    if (username) {
      fetch(`/api/progress/${username}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setUserData(data);
            if (data.lastRead) {
              const scripture = SCRIPTURES.find(s => s.id === data.lastRead.scriptureId) || SCRIPTURES[0];
              setCurrentScripture(scripture);
              setCurrentSection(data.lastRead.section);
              setCurrentVerseNum(data.lastRead.verse);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [username]);

  // Fetch max verses when scripture or section changes
  useEffect(() => {
    const loadMaxVerses = async () => {
      const count = await fetchVerseCount(currentScripture.id, currentSection);
      setMaxVerses(count);
    };
    loadMaxVerses();
  }, [currentScripture.id, currentSection]);

  // Fetch verse when chapter or verse changes
  useEffect(() => {
    stopAudio(); // stop any playing audio when navigating to a new verse
    const loadVerse = async () => {
      setFetchingVerse(true);
      setVerseError(null);
      try {
        const data = await fetchScriptureVerse(currentScripture.id, currentSection, currentVerseNum);
        setVerse(data);
        
        if (username) {
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              lastRead: { scriptureId: currentScripture.id, section: currentSection, verse: currentVerseNum }
            })
          });
          if (res.ok) {
            // Refresh local user data to get updated history
            const updatedData = await fetch(`/api/progress/${username}`).then(r => r.json());
            setUserData(updatedData);
          }
        }
      } catch (error: any) {
        console.error("Error fetching verse:", error);
        setVerseError(`Unable to load verse. Please try again.`);
        setVerse(null);
      } finally {
        setFetchingVerse(false);
      }
    };

    loadVerse();
  }, [currentScripture.id, currentSection, currentVerseNum, username]);

  const handleLogin = (name: string) => {
    try {
      localStorage.setItem('gita_username', name);
    } catch (e) {
      console.warn("LocalStorage set failed:", e);
    }
    setUsername(name);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('gita_username');
    } catch (e) {
      console.warn("LocalStorage remove failed:", e);
    }
    setUsername(null);
    setUserData(null);
  };

  const handleHistorySelect = (item: { scriptureId: string; section: string; verse: string }) => {
    const scripture = SCRIPTURES.find(s => s.id === item.scriptureId);
    if (scripture) {
      setCurrentScripture(scripture);
      setCurrentSection(item.section);
      setCurrentVerseNum(item.verse);
    }
  };

  const nextVerse = () => {
    const vNum = parseInt(currentVerseNum);
    if (vNum < maxVerses) {
      setCurrentVerseNum((vNum + 1).toString());
    } else {
      const sNum = parseInt(currentSection);
      if (sNum < currentScripture.sections) {
        setCurrentSection((sNum + 1).toString());
        setCurrentVerseNum('1');
      }
    }
  };

  const prevVerse = () => {
    const vNum = parseInt(currentVerseNum);
    if (vNum > 1) {
      setCurrentVerseNum((vNum - 1).toString());
    } else {
      const sNum = parseInt(currentSection);
      if (sNum > 1) {
        setCurrentSection((sNum - 1).toString());
        fetchVerseCount(currentScripture.id, (sNum - 1).toString()).then(count => {
          setCurrentVerseNum(count.toString());
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return (
      <AdminPage 
        onBack={() => {
          sessionStorage.removeItem('admin_token');
          setIsAdminAuthenticated(false);
          window.location.hash = '';
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSidebar(true)}
            className="p-2 hover:bg-orange-50 rounded-full transition-colors md:hidden"
          >
            <Menu className="w-6 h-6 text-orange-800" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Veda Darshan Logo" className="w-10 h-10 rounded-full object-cover shadow-sm border border-orange-200" />
            <h1 className="text-xl font-bold text-orange-900 tracking-tight">Veda Darshan</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowScriptureSelector(true)}
            className="hidden sm:flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-full font-bold transition-all"
          >
            <Library className="w-4 h-4" />
            {currentScripture.name}
          </button>

          {username ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-gray-500">Welcome</span>
                <span className="text-sm font-semibold text-gray-800">{username}</span>
              </div>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="p-2 hover:bg-orange-50 text-orange-600 rounded-full transition-colors"
                title="Reading History"
              >
                <History className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg"
            >
              <UserIcon className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-72 h-[calc(100vh-64px)] overflow-y-auto border-r border-orange-100 p-6 bg-white/50">
          <div className="mb-8">
            <h2 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4">Library</h2>
            <div className="space-y-1">
              {SCRIPTURES.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setCurrentScripture(s);
                    setCurrentSection('1');
                    setCurrentVerseNum('1');
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentScripture.id === s.id 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'hover:bg-orange-100 text-gray-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4">{currentScripture.sectionLabel}s</h2>
          <div className="space-y-1">
            {Array.from({ length: currentScripture.sections }, (_, i) => (i + 1).toString()).map(sec => (
              <button
                key={sec}
                onClick={() => {
                  setCurrentSection(sec);
                  setCurrentVerseNum('1');
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  currentSection === sec 
                    ? 'bg-orange-100 text-orange-800 font-bold' 
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
              >
                {currentScripture.sectionLabel} {sec}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-10">
          <div className="max-w-2xl mx-auto">
            {/* Navigation Info */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-orange-600 font-bold text-sm uppercase tracking-widest">{currentScripture.name}</span>
                <h2 className="text-2xl font-extrabold text-gray-900">{currentScripture.sectionLabel} {currentSection}, Verse {currentVerseNum}</h2>
              </div>
              {userData?.lastRead && (
                <div className="flex items-center gap-2 text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-medium">
                  <History className="w-3 h-3" />
                  Last read: {SCRIPTURES.find(s => s.id === userData.lastRead.scriptureId)?.name}, {userData.lastRead.section}:{userData.lastRead.verse}
                </div>
              )}
            </div>

            {/* Verse Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentScripture.id}-${currentSection}-${currentVerseNum}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-xl shadow-orange-200/50 border border-orange-100 overflow-hidden"
              >
                <div className="p-8 md:p-12">
                  {fetchingVerse ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                      <p className="text-orange-800 font-medium animate-pulse">Fetching divine wisdom...</p>
                    </div>
                  ) : verse ? (
                    <div className="space-y-10">
                      <div className="text-center">
                        <p className="text-3xl md:text-4xl font-serif text-orange-900 leading-relaxed mb-6">
                          {verse.sanskrit}
                        </p>
                        {verse.transliteration && (
                          <p className="text-lg text-gray-500 italic font-serif">
                            {verse.transliteration}
                          </p>
                        )}
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
                      
                      <div>
                        <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-4">English Meaning</h3>
                        <p className="text-xl text-gray-800 leading-relaxed font-medium">
                          {verse.english}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-gray-500">{verseError || "Unable to load verse. Please try again."}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="bg-orange-50/50 border-t border-orange-100 p-6 flex items-center justify-between">
                  <button
                    onClick={prevVerse}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-orange-100 text-orange-800 font-bold transition-all disabled:opacity-30"
                    disabled={currentSection === '1' && currentVerseNum === '1'}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-3">
                    {/* Verse counter */}
                    <span className="text-sm font-bold text-orange-900">
                      {currentVerseNum} / {maxVerses}
                    </span>

                    {/* ── Audio Button ── */}
                    {verse && (
                      <button
                        onClick={() => {
                          const text = verse.sanskrit;
                          toggleAudio(text);
                        }}
                        title={
                          audioState === 'playing' ? 'Pause recitation' :
                          audioState === 'paused'  ? 'Resume recitation' :
                          audioState === 'loading' ? 'Loading voice...' :
                          'Listen to verse recitation'
                        }
                        className={`
                          relative flex items-center justify-center w-12 h-12 rounded-full
                          font-bold transition-all duration-200 shadow-md
                          ${audioState === 'playing'
                            ? 'bg-orange-600 text-white shadow-orange-300 scale-105'
                            : audioState === 'paused'
                              ? 'bg-orange-400 text-white shadow-orange-200'
                              : audioState === 'loading'
                                ? 'bg-orange-100 text-orange-400 cursor-wait'
                                : audioState === 'error'
                                  ? 'bg-red-100 text-red-500'
                                  : 'bg-white text-orange-600 hover:bg-orange-600 hover:text-white hover:scale-110 border border-orange-200'
                          }
                        `}
                      >
                        {/* Ripple ring when playing */}
                        {audioState === 'playing' && (
                          <span className="absolute inset-0 rounded-full bg-orange-400 opacity-30 animate-ping" />
                        )}
                        {audioState === 'loading' ? (
                          <LoaderIcon className="w-5 h-5 animate-spin" />
                        ) : audioState === 'playing' ? (
                          <span className="flex items-end gap-0.5 h-5">
                            <span className="audio-wave-bar h-2" />
                            <span className="audio-wave-bar h-4" />
                            <span className="audio-wave-bar h-3" />
                            <span className="audio-wave-bar h-5" />
                          </span>
                        ) : audioState === 'error' ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={nextVerse}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-orange-100 text-orange-800 font-bold transition-all disabled:opacity-30"
                    disabled={parseInt(currentSection) === currentScripture.sections && parseInt(currentVerseNum) === maxVerses}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Verse Selector */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {Array.from({ length: Math.min(maxVerses, 100) }, (_, i) => (i + 1).toString()).map(v => (
                <button
                  key={v}
                  onClick={() => setCurrentVerseNum(v)}
                  className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                    currentVerseNum === v 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'bg-white hover:bg-orange-100 text-gray-600 border border-orange-50'
                  }`}
                >
                  {v}
                </button>
              ))}
              {maxVerses > 100 && <span className="text-gray-400 self-center px-2">...</span>}
            </div>
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-orange-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Veda Darshan" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
            <span className="font-bold text-orange-900 tracking-tight">Veda Darshan</span>
            <span className="text-xs text-gray-400 ml-1 hidden sm:inline">· Serving divine wisdom offline</span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-5">
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" title="YouTube"
               className="text-gray-400 hover:text-red-600 transition-colors duration-200">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn"
               className="text-gray-400 hover:text-blue-700 transition-colors duration-200">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"
               className="text-gray-400 hover:text-pink-600 transition-colors duration-200">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook"
               className="text-gray-400 hover:text-blue-600 transition-colors duration-200">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter / X"
               className="text-gray-400 hover:text-sky-500 transition-colors duration-200">
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          {/* Donate Button */}
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-full font-bold shadow-md shadow-orange-200 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            <Heart className="w-4 h-4 fill-white" />
            Donate
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          © {new Date().getFullYear()} Veda Darshan · Made with devotion 🙏
        </p>
      </footer>

      {/* ── Donate Modal ── */}
      <AnimatePresence>
        {showDonateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDonateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center text-white relative">
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-7 h-7 fill-white text-white" />
                </div>
                <h2 className="text-xl font-bold">Support Veda Darshan</h2>
                <p className="text-orange-100 text-sm mt-1">Your generosity keeps this mission alive 🙏</p>
              </div>

              {/* QR Code Area */}
              <div className="p-6 flex flex-col items-center gap-4">
                <p className="text-gray-600 text-sm text-center">
                  Scan the QR code below with any UPI, PhonePe, Google Pay, or Paytm app to donate.
                </p>
                <div className="w-56 h-56 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-md flex items-center justify-center bg-orange-50">
                  <img
                    src="/qr-donate.png"
                    alt="Donation QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = 'none';
                      const p = t.parentElement;
                      if (p && !p.querySelector('.qr-fallback')) {
                        const d = document.createElement('div');
                        d.className = 'qr-fallback flex flex-col items-center justify-center text-center p-4 gap-2 w-full h-full';
                        d.innerHTML = `<div style="font-size:48px">📱</div><p style="font-weight:bold;color:#f97316;font-size:14px">Add your QR image</p><p style="color:#9ca3af;font-size:12px">Place <code style="background:#f3f4f6;padding:2px 4px;border-radius:4px">qr-donate.png</code> in the <code style="background:#f3f4f6;padding:2px 4px;border-radius:4px">public/</code> folder</p>`;
                        p.appendChild(d);
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Every contribution, big or small, is deeply appreciated ❤️
                </p>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="w-full py-3 rounded-2xl border-2 border-orange-200 text-orange-700 font-bold hover:bg-orange-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white z-[60] shadow-2xl md:hidden flex flex-col"
            >
              <div className="p-6 border-b border-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Veda Darshan" className="w-6 h-6 rounded-full object-cover border border-orange-200" />
                  <span className="font-bold text-orange-900">Navigation</span>
                </div>
                <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-orange-50 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-4 px-4">Scriptures</h3>
                  <div className="space-y-1">
                    {SCRIPTURES.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentScripture(s);
                          setCurrentSection('1');
                          setCurrentVerseNum('1');
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          currentScripture.id === s.id 
                            ? 'bg-orange-600 text-white' 
                            : 'hover:bg-orange-50 text-gray-700'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-4 px-4">{currentScripture.sectionLabel}s</h3>
                  <div className="space-y-1">
                    {Array.from({ length: currentScripture.sections }, (_, i) => (i + 1).toString()).map(sec => (
                      <button
                        key={sec}
                        onClick={() => {
                          setCurrentSection(sec);
                          setCurrentVerseNum('1');
                          setShowSidebar(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          currentSection === sec 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'hover:bg-orange-50 text-gray-700'
                        }`}
                      >
                        {currentScripture.sectionLabel} {sec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Scripture Selector Modal (Mobile/Small Desktop) */}
      <AnimatePresence>
        {showScriptureSelector && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScriptureSelector(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-orange-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-orange-900">Select Scripture</h2>
                <button onClick={() => setShowScriptureSelector(false)} className="p-2 hover:bg-orange-50 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                {SCRIPTURES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentScripture(s);
                      setCurrentSection('1');
                      setCurrentVerseNum('1');
                      setShowScriptureSelector(false);
                    }}
                    className={`text-left px-4 py-4 rounded-2xl transition-all border ${
                      currentScripture.id === s.id 
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg' 
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-100'
                    }`}
                  >
                    <span className="font-bold">{s.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showLoginModal && (
          <LoginModal 
            onLogin={handleLogin} 
            onClose={() => setShowLoginModal(false)} 
          />
        )}
        {showAdminLogin && (
          <AdminLoginModal 
            isOpen={showAdminLogin} 
            onClose={() => {
              setShowAdminLogin(false);
              window.location.hash = '';
            }} 
            onLogin={() => setIsAdminAuthenticated(true)} 
          />
        )}
        {showHistoryModal && (
          <HistoryModal 
            history={userData?.history} 
            onClose={() => setShowHistoryModal(false)}
            onSelect={handleHistorySelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GitaApp />
    </ErrorBoundary>
  );
}
