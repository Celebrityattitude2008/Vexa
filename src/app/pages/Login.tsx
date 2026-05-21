import { useState, type FormEvent } from "react";
import { useNavigate, Navigate } from "react-router";
import { Mail, Lock, Github, Globe } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const { login, signup, signInWithGoogle, signInWithGithub, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070d]">
        <img src="/logo.png" alt="Vexa" className="w-12 h-12 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const getFirebaseErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
        return "Invalid email or password. Please try again.";
      if (code === "auth/email-already-in-use") return "An account with this email already exists.";
      if (code === "auth/weak-password") return "Password must be at least 6 characters.";
      if (code === "auth/invalid-email") return "Please enter a valid email address.";
      if (code === "auth/too-many-requests") return "Too many attempts. Please wait a moment and try again.";
      if (code === "auth/popup-closed-by-user") return "Sign-in popup was closed. Please try again.";
      if (code === "auth/invalid-api-key" || code === "auth/configuration-not-found")
        return "Firebase is not configured. Please add your Firebase credentials in the Secrets tab.";
    }
    return isNewUser
      ? "Unable to create account. Please check your details and try again."
      : "Unable to sign in. Please check your credentials.";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isNewUser) {
        await signup(email, password);
        toast.success("Account created successfully! Welcome to Vexa.");
      } else {
        await login(email, password);
        toast.success("Signed in successfully. Welcome back!");
      }
      navigate("/");
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProvider = async (provider: "google" | "github") => {
    setError(null);
    setSubmitting(true);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithGithub();
      toast.success("Signed in successfully. Welcome to Vexa!");
      navigate("/");
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070d] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-xl shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl overflow-hidden">
            <img src="/logo.png" alt="Vexa Security" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-100">
            {isNewUser ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {isNewUser
              ? "Sign up with Google, GitHub, or your email and password."
              : "Sign in with Google, GitHub, or your email and password."}
          </p>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => handleProvider("google")}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Globe className="h-5 w-5" />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleProvider("github")}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Github className="h-5 w-5" />
            Continue with GitHub
          </button>
        </div>

        <div className="relative my-6 flex items-center">
          <div className="flex-1 h-px bg-white/10" />
          <span className="px-3 text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={isNewUser ? 6 : undefined}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-muted)]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: "var(--accent-primary)" }}
            className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isNewUser ? "Creating account..." : "Signing in..."
              : isNewUser ? "Create account" : "Continue"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <button
            type="button"
            onClick={() => { setIsNewUser(!isNewUser); setError(null); }}
            style={{ color: "var(--accent-text)" }}
            className="font-medium hover:opacity-80 transition-opacity"
          >
            {isNewUser
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
