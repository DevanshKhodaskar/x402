"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertCircle, User, Shield, Layers } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Redirect based on role
      if (data.user.role === "ADMIN") router.push("/admin");
      else if (data.user.role === "PROVIDER") router.push("/provider");
      else router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card className="border-slate-800 bg-slate-900/80 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Sign In to AgentPay</CardTitle>
          <p className="text-xs text-slate-400">Access API monetization and consumer metrics</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" variant="default" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Quick Demo Logins for evaluation */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono block text-center">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 px-1 text-slate-300"
                onClick={() => quickLogin("consumer@agentpay.xyz", "consumer123")}
              >
                Consumer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 px-1 text-slate-300"
                onClick={() => quickLogin("provider@agentpay.xyz", "provider123")}
              >
                Provider
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] h-7 px-1 text-slate-300"
                onClick={() => quickLogin("admin@agentpay.xyz", "admin123")}
              >
                Admin
              </Button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-400 hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
