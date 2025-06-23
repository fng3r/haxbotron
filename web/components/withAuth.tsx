import { redirect } from 'next/navigation';

import { getSession } from '@/app/actions/auth';

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return async function AuthWrapper(props: P) {
    const session = await getSession();

    if (!session) {
      redirect('/login');
    }

    return <WrappedComponent {...props} />;
  };
}
