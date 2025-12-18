import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar"; // Swapped Footer for BottomBar for consistency
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Clock, Sparkles, AlertTriangle, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { generateStrongPassword } from "@/lib/passwordUtils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  KHAKI: "#F0E68C",
  KHAKI_DARK: "#857F3E",
  RED: "#FF0000",
  SOFT_GRAY: "#F8F9FA"
};

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePassword = (pwd: string): { valid: boolean; message?: string } => {
    if (pwd.length < 8) return { valid: false, message: "Password must be at least 8 characters long" };
    if (!/[A-Z]/.test(pwd)) return { valid: false, message: "Add at least one uppercase letter" };
    if (!/[0-9]/.test(pwd)) return { valid: false, message: "Add at least one number" };
    if (!/[!@#$%^&*()]/.test(pwd)) return { valid: false, message: "Add one special character" };
    return { valid: true };
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      if (error) throw error;
      toast({ title: "Check your inbox!", description: "A 6-digit code has been sent." });
      setStep('verify');
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (code.length !== 6) return;
    setVerifying(true);
    setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      setStep('reset');
    } catch (error: any) {
      setError("Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Success!", description: "Password updated successfully." });
      setTimeout(() => navigate("/auth"), 1500);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Shared Header for the Auth Steps
  const AuthHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex flex-col items-center mb-8">
      <div className="bg-[#008080]/10 p-4 rounded-2xl mb-4">
        <Icon className="h-8 w-8 text-[#008080]" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800 text-center">{title}</h1>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-center px-4">
        {subtitle}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />
      
      <main className="container px-4 pt-12 max-w-lg mx-auto relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => step === 'email' ? navigate("/auth") : setStep('email')}
          className="mb-6 hover:bg-slate-100 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-100 transition-all duration-500">
          
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <AuthHeader icon={Mail} title="Recovery" subtitle="Enter your email to receive a secure access code" />
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                <Input 
                  type="email" 
                  className="rounded-2xl border-slate-100 bg-slate-50 h-14 focus:ring-[#008080]" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <PrimaryButton loading={loading} text="Send Secure Code" disabled={!email} />
            </form>
          )}

          {step === 'verify' && (
            <div className="space-y-8">
              <AuthHeader icon={CheckCircle2} title="Verify" subtitle={`We've sent a code to ${email}`} />
              
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); if (v.length === 6) handleVerifyOtp(v); }}>
                  <InputOTPGroup className="gap-2">
                    {[0,1,2,3,4,5].map((i) => (
                      <InputOTPSlot 
                        key={i} 
                        index={i} 
                        className="w-12 h-14 rounded-xl border-slate-200 text-lg font-black text-[#008080]" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && <div className="flex justify-center items-center gap-2 text-[10px] font-black text-[#008080] uppercase tracking-widest"><Loader2 className="h-4 w-4 animate-spin" /> Verifying</div>}

              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  Didn't receive code? {countdown > 0 ? `Wait ${countdown}s` : ""}
                </p>
                <Button 
                  variant="ghost" 
                  disabled={!canResend} 
                  onClick={handleSendCode}
                  className="text-[#008080] font-black uppercase text-[10px] tracking-widest h-auto py-0 hover:bg-transparent"
                >
                  Resend Code
                </Button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <AuthHeader icon={Lock} title="New Password" subtitle="Choose a strong, unique password for your account" />
              
              <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</Label>
                        <button type="button" onClick={() => {
                             const p = generateStrongPassword();
                             setNewPassword(p); setConfirmPassword(p);
                        }} className="text-[9px] font-black text-[#FF7F50] uppercase tracking-widest flex items-center gap-1"><Sparkles className="h-3 w-3"/> Auto-Generate</button>
                    </div>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      className="rounded-2xl border-slate-100 bg-slate-50 h-14 pr-12"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="rounded-2xl border-slate-100 bg-slate-50 h-14"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-tight"><AlertTriangle className="h-4 w-4"/> {error}</div>}

              <PrimaryButton loading={loading} text="Update Password" disabled={loading || newPassword !== confirmPassword || !validatePassword(newPassword).valid} />
            </form>
          )}

        </div>
      </main>
      <MobileBottomBar />
    </div>
  );
};

// Reusable Button to match Event Detail styling
const PrimaryButton = ({ text, loading, disabled }: { text: string, loading?: boolean, disabled?: boolean }) => (
  <Button 
    type="submit" 
    disabled={disabled || loading}
    className="w-full py-8 rounded-2xl text-md font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none"
    style={{ 
        background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)`,
        boxShadow: `0 12px 24px -8px ${COLORS.CORAL}88`
    }}
  >
    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : text}
  </Button>
);

export default ForgotPassword;