'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  IAccount,
  IAdminAccount,
  installationNeeded,
  isAdminAccount,
  isCorrectPassword,
  loadAdminAccounts,
  saveAdminAccount,
} from '@/lib/auth/auth';
import { generateToken, verifyToken } from '@/lib/auth/jwt';

type LoginState =
  | {
      error: string;
      success?: undefined;
      user?: undefined;
    }
  | {
      success: boolean;
      user: {
        name: string;
      };
      error?: undefined;
    };

const ACCESS_TOKEN_COOKIE = 'access_token';

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get('username')?.toString();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return {
      error: 'Email and password are required',
    };
  }

  const adminAccounts: IAdminAccount[] = await loadAdminAccounts();
  const account: IAccount = {
    accountName: username,
    password: password,
  };
  if (!isAdminAccount(adminAccounts, account) || !(await isCorrectPassword(adminAccounts, account))) {
    return { error: `Username or password is incorrect.` };
  }

  const token = await generateToken(account.accountName);
  await setTokenCookie(token);

  redirect('/admin');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);

  redirect('/');
}

type SignUpState =
  | {
      error: string;
      success?: undefined;
      user?: undefined;
    }
  | {
      success: boolean;
      user: {
        name: string;
      };
      error?: undefined;
    };

export async function signup(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const username = formData.get('username')?.toString();
  const password = formData.get('password')?.toString();

  if (!username || !password) {
    return {
      error: 'Email and password are required',
    };
  }

  if (!(password.length >= 3 && password.length <= 20)) {
    return {
      error: 'Password length shold be between 3 and 20 characters',
    };
  }

  if (await installationNeeded()) {
    await saveAdminAccount({ accountName: username, password });

    const token = await generateToken(username);
    await setTokenCookie(token);
  }

  redirect('/admin');
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) return null;

  try {
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    console.error(`Failed to verify user access token. Error: ${error}`);
    return null;
  }
}

async function setTokenCookie(authToken: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE,
    value: authToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}
