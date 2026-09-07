import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-purple-50/40 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#C59B27] to-[#9A7318] flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-[#C59B27]/25 text-white font-bold text-lg sm:text-xl tracking-wider">
            PFS
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Photo Fashion Studio</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Wedding &bull; Fashion &bull; Creative CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@studio.com"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-transparent transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#C59B27] to-[#9A7318] hover:from-[#b88c1a] hover:to-[#876412] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#C59B27]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Signing in..." : "Sign In to Studio"}
          </button>
          <div className="text-center pt-2">
            <span className="text-[11px] text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Demo: admin@studio.com / Admin@123
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
