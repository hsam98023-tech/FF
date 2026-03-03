// src/App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from 'firebase/auth';
import {
  ref,
  onValue,
  push,
  set,
  remove,
  serverTimestamp,
  DataSnapshot,
} from 'firebase/database';
import { auth, db } from './firebase';
import {
  LogIn,
  UserPlus,
  MessageCircle,
  LayoutDashboard,
  Settings,
  Trash2,
  LogOut,
  Send,
  Shield,
  Users,
} from 'lucide-react';

type NavKey = 'chat' | 'dashboard' | 'settings';

type ClanUser = {
  name: string;
  role: 'Admin' | 'Member';
  bio: string;
  photoURL: string;
};

type Message = {
  id: string;
  uid: string;
  text: string;
  createdAt: number;
};

const neonIndigo = '#6366f1';

const GlassCard: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
> = ({ className = '', noPadding, children, ...rest }) => (
  <div
    className={`rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.35)] ${
      noPadding ? '' : 'p-4'
    } ${className}`}
    {...rest}
  >
    {children}
  </div>
);

const TextInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, className = '', ...props }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-zinc-300">{label}</span>
    <input
      className={`w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-${neonIndigo} focus:ring-1 focus:ring-[${neonIndigo}]`}
      {...props}
    />
  </label>
);

// Simple button component for consistent styling
const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }
> = ({ variant = 'primary', className = '', children, ...props }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<typeof variant, string> = {
    primary:
      'bg-indigo-500/90 hover:bg-indigo-400 text-white shadow-[0_0_25px_rgba(99,102,241,0.7)]',
    ghost:
      'bg-white/5 hover:bg-white/10 text-zinc-100 border border-white/10',
    danger:
      'bg-red-500/90 hover:bg-red-400 text-white shadow-[0_0_25px_rgba(239,68,68,0.7)]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);
  return { user, initializing };
};

const useClanUser = (user: User | null) => {
  const [clanUser, setClanUser] = useState<ClanUser | null>(null);

  useEffect(() => {
    if (!user) {
      setClanUser(null);
      return;
    }
    const userRef = ref(db, `users/${user.uid}`);
    const unsub = onValue(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as ClanUser;
        setClanUser(data);
      } else {
        // Provision default data if missing
        const defaultData: ClanUser = {
          name: user.displayName || user.email?.split('@')[0] || 'DN Member',
          role: 'Member',
          bio: 'New to DN CLAN',
          photoURL: user.photoURL || '',
        };
        set(userRef, defaultData);
        setClanUser(defaultData);
      }
    });
    return () => unsub();
  }, [user]);

  return clanUser;
};

const AuthView: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const user = cred.user;
        const name = displayName || email.split('@')[0];
        await updateProfile(user, { displayName: name });
        const userRef = ref(db, `users/${user.uid}`);
        const payload: ClanUser = {
          name,
          role: 'Member',
          bio: 'New to DN CLAN',
          photoURL: '',
        };
        await set(userRef, payload);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-zinc-100">
      <div className="relative w-full max-w-md px-4">
        {/* Neon gradient blobs */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />

        <GlassCard className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">
                DN CLAN
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                دخول إلى الساحة
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                {mode === 'login'
                  ? 'سجّل دخولك للانضمام إلى دردشة العشيرة.'
                  : 'أنشئ حساباً جديداً وانضم إلى DN CLAN.'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-black/60">
              <Shield className="h-6 w-6 text-indigo-400" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <TextInput
                label="اسم العرض"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="DN Player"
                autoComplete="name"
                required
              />
            )}
            <TextInput
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <TextInput
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
            />
            {error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full justify-center"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>تسجيل الدخول</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>إنشاء حساب</span>
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="h-px flex-1 bg-white/10" />
            <button
              type="button"
              onClick={() =>
                setMode((m) => (m === 'login' ? 'signup' : 'login'))
              }
              className="mx-3 text-indigo-400 hover:text-indigo-300"
            >
              {mode === 'login'
                ? 'لا تملك حساباً؟ انضم الآن'
                : 'لديك حساب بالفعل؟ سجّل الدخول'}
            </button>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const GlobalChatView: React.FC<{ currentUser: User; clanUser: ClanUser }> = ({
  currentUser,
  clanUser,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const isAdmin = clanUser.role === 'Admin';

  useEffect(() => {
    const messagesRef = ref(db, 'messages');
    const unsub = onValue(messagesRef, (snap: DataSnapshot) => {
      const data = snap.val() || {};
      const list: Message[] = Object.keys(data)
        .map((id) => ({ id, ...(data[id] as Omit<Message, 'id'>) }))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMessages(list);
    });
    return () => unsub();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const msgRef = push(ref(db, 'messages'));
    await set(msgRef, {
      uid: currentUser.uid,
      text,
      createdAt: Date.now(),
    });
    setInput('');
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    await remove(ref(db, `messages/${id}`));
  };

  const userCache = useMemo(() => new Map<string, ClanUser>(), []);

  const [_, setTick] = useState(0); // force rerender when map mutates

  // Subscribe to all users (for names/roles/avatars)
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snap) => {
      userCache.clear();
      snap.forEach((child) => {
        userCache.set(child.key as string, child.val() as ClanUser);
      });
      setTick((t) => t + 1);
    });
    return () => unsub();
  }, [userCache]);

  const resolveUser = (uid: string): ClanUser => {
    const fallback: ClanUser = {
      name: 'Unknown',
      role: 'Member',
      bio: '',
      photoURL: '',
    };
    return userCache.get(uid) ?? fallback;
  };

  return (
    <div className="flex h-full flex-col">
      <GlassCard className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-indigo-400">
            Global Chat
          </p>
          <h2 className="text-lg font-semibold">ساحة الدردشة العامة</h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/40 bg-black/60">
          <MessageCircle className="h-5 w-5 text-indigo-400" />
        </div>
      </GlassCard>

      <GlassCard className="flex min-h-0 flex-1 flex-col" noPadding>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg) => {
            const u = resolveUser(msg.uid);
            const isMine = msg.uid === currentUser.uid;
            const avatar =
              u.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                u.name || 'DN',
              )}&background=6366f1&color=fff`;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  isMine ? 'flex-row-reverse text-right' : ''
                }`}
              >
                <img
                  src={avatar}
                  alt={u.name}
                  className="h-9 w-9 flex-shrink-0 rounded-full border border-white/10 object-cover"
                />
                <div className="max-w-[70%] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {u.name}
                    </span>
                    <span className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-2 py-[1px] text-[10px] font-medium uppercase tracking-wide text-indigo-300">
                      {u.role}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="ml-1 text-zinc-500 hover:text-red-400"
                        title="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                      isMine
                        ? 'bg-indigo-500/30 text-zinc-50'
                        : 'bg-black/40 text-zinc-100'
                    } border border-white/10`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="pt-10 text-center text-xs text-zinc-500">
              لا توجد رسائل بعد. كن أول من يكتب!
            </p>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-white/5 bg-black/40 p-3"
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/60"
            />
            <Button type="submit" disabled={!input.trim()} className="h-10">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

const DashboardView: React.FC<{ clanUser: ClanUser; membersCount: number }> = ({
  clanUser,
  membersCount,
}) => {
  const bio =
    clanUser.bio && clanUser.bio !== 'New to DN CLAN'
      ? clanUser.bio
      : 'DN CLAN هو فريق E-sports يركز على العمل الجماعي، الاحترافية، وروح التحدي في جميع المنافسات الرقمية.';

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/40 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">
            Welcome to
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
            DN E-SPORTS
          </h1>
          <p className="text-sm text-zinc-300">
            استعد لدخول عالم المنافسات الإلكترونية مع فريقك.
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1">
              <Users className="h-3.5 w-3.5 text-indigo-300" />
              <span className="font-semibold text-zinc-100">
                {membersCount}
              </span>
              <span className="text-[11px] text-zinc-400">Members</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1">
              <Shield className="h-3.5 w-3.5 text-indigo-300" />
              <span className="text-[11px] text-indigo-200">
                Role: {clanUser.role}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-2 text-sm font-semibold text-zinc-100">
          عن العشيرة
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">{bio}</p>
      </GlassCard>
    </div>
  );
};

const SettingsView: React.FC<{ user: User; clanUser: ClanUser }> = ({
  user,
  clanUser,
}) => {
  const [name, setName] = useState(clanUser.name);
  const [bio, setBio] = useState(
    clanUser.bio === 'New to DN CLAN' ? '' : clanUser.bio,
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setName(clanUser.name);
    setBio(clanUser.bio === 'New to DN CLAN' ? '' : clanUser.bio);
  }, [clanUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const trimmedName = name.trim() || user.email?.split('@')[0] || 'DN';
      await updateProfile(user, { displayName: trimmedName });
      await set(ref(db, `users/${user.uid}`), {
        ...clanUser,
        name: trimmedName,
        bio: bio.trim() || 'New to DN CLAN',
      });
      setStatus('تم حفظ الملف الشخصي بنجاح.');
    } catch (err: any) {
      setStatus(err.message || 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">
          إعدادات الحساب
        </h2>
        <form onSubmit={handleSave} className="space-y-3">
          <TextInput
            label="اسم العرض"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="DN Player"
            required
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-300">
              نبذة / رابط واتساب
            </span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/60"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة قصيرة عنك أو ضع رابط واتساب للتواصل."
            />
          </label>
          {status && (
            <p className="text-xs text-zinc-400">
              {status}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 justify-center"
            >
              حفظ الملف الشخصي
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="mb-3 text-sm font-semibold text-zinc-100">
          الجلسة الحالية
        </h3>
        <div className="mb-3 space-y-1 text-xs text-zinc-300">
          <p>
            <span className="text-zinc-500">البريد:</span> {user.email}
          </p>
          <p>
            <span className="text-zinc-500">الدور:</span> {clanUser.role}
          </p>
        </div>
        <Button
          variant="danger"
          className="w-full justify-center"
          type="button"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </Button>
      </GlassCard>
    </div>
  );
};

const BottomNav: React.FC<{
  current: NavKey;
  onChange: (k: NavKey) => void;
}> = ({ current, onChange }) => {
  const items: { key: NavKey; label: string; icon: React.ReactNode }[] = [
