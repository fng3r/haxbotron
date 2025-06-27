import nodeStorage from 'node-persist';

import bcrypt from 'bcrypt';

export type IAdminAccount = {
  accountName: string;
  hashedPassword: string;
};

export type IAccount = {
  accountName: string;
  password: string;
};

const ADMINS_KEY = 'admin';

let initialized = false;

async function getStorage() {
  if (!initialized) {
    await nodeStorage.init();
    initialized = true;
  }

  return nodeStorage;
}

export async function makeHashedPassword(given: string): Promise<string> {
  return await bcrypt.hash(given, 10);
}

export async function checkPassword(givenData: string, encryptedCompare: string): Promise<boolean> {
  return await bcrypt.compare(givenData, encryptedCompare);
}

export async function isCorrectPassword(accounts: IAdminAccount[], account: IAccount): Promise<boolean> {
  for (const adminAccount of accounts) {
    const correctPassword = await checkPassword(account.password, adminAccount.hashedPassword);
    if (adminAccount.accountName == account.accountName && correctPassword) {
      return true;
    }
  }

  return false;
}

export function isAdminAccount(adminAccounts: IAdminAccount[], account: IAccount): boolean {
  return adminAccounts.some((adminAccount) => adminAccount.accountName == account.accountName);
}

export async function loadAdminAccounts(): Promise<IAdminAccount[]> {
  const storage = await getStorage();
  const stringified: string | undefined = await storage.getItem(ADMINS_KEY);
  if (stringified !== undefined) {
    const storage: IAdminAccount[] = JSON.parse(stringified);
    return storage;
  }

  return [];
}

export async function saveAdminAccount(account: IAccount): Promise<void> {
  const storage = await getStorage();

  let accounts: IAdminAccount[] = [];
  const storedAccounts: string | undefined = await storage.getItem(ADMINS_KEY);
  if (storedAccounts) {
    accounts = JSON.parse(storedAccounts);
  }
  const hashedPassword = await makeHashedPassword(account.password);
  accounts.push({ accountName: account.accountName, hashedPassword });

  await nodeStorage.setItem('admin', JSON.stringify(accounts));
}

export async function removeAdminAccount(): Promise<void> {
  const storage = await getStorage();
  await storage.removeItem('admin');
}

export async function installationNeeded(): Promise<boolean> {
  const storage = await getStorage();
  const stringified: string | undefined = await storage.getItem(ADMINS_KEY);
  return stringified === undefined;
}
