import Link from 'next/link';
import { connection } from 'next/server';

import { CheckCircle } from 'lucide-react';

import SignUp from '@/components/SignUp';

import { installationNeeded } from '@/lib/auth/auth';

export default async function Install() {
  await connection();

  const isInstallationNeeded = await installationNeeded();

  return isInstallationNeeded ? (
    <SignUp />
  ) : (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Initial Configuration</h1>
          <p className="mt-2">
            Already done.{' '}
            <Link href="/login" className="underline underline-offset-4 hover:underline">
              Log in
            </Link>{' '}
            and start managing the server.
          </p>
        </div>
      </div>
    </div>
  );
}
