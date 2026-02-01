import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Zap, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const Auth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                toast.success('Registration successful! Please check your email for verification.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success('Welcome back!');
                navigate('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md p-8 bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl relative z-10 rounded-3xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
                        <Zap className="w-8 h-8 text-primary-foreground fill-current" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Smart<span className="text-primary">Swap</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-center">
                        {isSignUp ? 'Create your operator account' : 'Sign in to access network ops'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Address</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="operator@smartswap.ai"
                                className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold ml-1">Password</Label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all transform active:scale-[0.98] group"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                {isSignUp ? 'Initialize Account' : 'Access Ops Center'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground border border-white/5 hover:bg-white/5 transition-all text-xs font-semibold"
                        onClick={() => navigate('/dashboard')}
                    >
                        SKIP TO DASHBOARD (DEMO MODE)
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                    </button>

                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-semibold">
                        Secure AI Operations Environment
                    </p>
                </div>
            </Card>
        </div>
    );
};
