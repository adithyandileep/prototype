"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  SUPER_ADMIN_USERNAME,
  SUPER_ADMIN_PASSWORD,
  SUPER_ADMIN_STORAGE_KEY,
} from "@/app/lib/super-admin-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    // Simple static check
    if (
      username.trim() === SUPER_ADMIN_USERNAME &&
      password === SUPER_ADMIN_PASSWORD
    ) {
      // mark as logged in in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(SUPER_ADMIN_STORAGE_KEY, "true");
      }
      // redirect to main super admin dashboard
      router.replace("/super-admin");
    } else {
      setError("Invalid credentials.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-900/70 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-50 text-center">
              Super Admin Login
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Enter your credentials to access the super admin panel.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login as Super Admin"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-1 text-xs text-slate-500 justify-center">
            <p className="text-center">
              This area is restricted to authorized super admins only.
            </p>
          </CardFooter>
        </Card>

        {/* Small helper (optional) */}
        <p className="mt-3 text-center text-xs text-slate-500">
          Use username: <span className="font-mono">{SUPER_ADMIN_USERNAME}</span>{" "}
          & password: <span className="font-mono">{SUPER_ADMIN_PASSWORD}</span>{" "}
          (only for development)
        </p>
      </div>
    </div>
  );
}
