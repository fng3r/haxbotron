import { redirect } from 'next/navigation';

import { getSession } from '../actions/auth';

import LoginForm from '@/components/LoginForm';

export default async function SignIn() {
  const session = await getSession();
  if (session) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <LoginForm />
      </div>
    </div>
  );
}
