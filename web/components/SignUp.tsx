'use client';

import { useActionState, useState } from 'react';

import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { signup } from '@/app/actions/auth';

export default function SignUp() {
  const [adminAccount, setAdminAccount] = useState({
    username: '',
    password: '',
  });

  const { username, password } = adminAccount;

  const [signupState, signupAction] = useActionState(signup, { error: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminAccount({
      ...adminAccount,
      [name]: value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Initial Configuration</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create admin account</CardTitle>
            <CardDescription>Enter credentials below to create admin account</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signupAction}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={onChange}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password (3-20 characters)</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={onChange}
                    required
                  />
                </div>
                {signupState.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{signupState.error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Sign Up
                  </Button>
                </div>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/admin" className="underline underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
