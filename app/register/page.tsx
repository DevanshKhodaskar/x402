"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"CONSUMER" | "PROVIDER">("CONSUMER");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      if (data.user.role === "PROVIDER") router.push("/provider");
      else router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card className="border-slate-800 bg-slate-900/80 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="h-10 w-10 rounded-xl bg-blue-600 mx-auto flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Create AgentPay Account</CardTitle>
          <p className="text-xs text-slate-400">Join the AI agent micro-payment economy</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Display Name</label>
              <Input
                placeholder="Agent Developer"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Email Address</label>
              <Input
                type="email"
                placeholder="developer@example.com"
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
                minLength={6}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CONSUMER")}
                  className={`text-xs p-2.5 rounded-lg border text-center transition-colors ${
                    role === "CONSUMER"
                      ? "border-blue-500 bg-blue-500/10 text-white font-semibold"
                      : "border-slate-800 bg-slate-950 text-slate-400"
                  }`}
                >
                  Consumer (Buy APIs)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("PROVIDER")}
                  className={`text-xs p-2.5 rounded-lg border text-center transition-colors ${
                    role === "PROVIDER"
                      ? "border-blue-500 bg-blue-500/10 text-white font-semibold"
                      : "border-slate-800 bg-slate-950 text-slate-400"
                  }`}
                >
                  Provider (Sell APIs)
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button type="submit" variant="default" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
