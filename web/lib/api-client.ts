import axios from 'axios';

let serverClient: ReturnType<typeof axios.create> | null = null;
let clientClient: ReturnType<typeof axios.create> | null = null;

const createServerClient = () => {
  if (!serverClient) {
    serverClient = axios.create({
      baseURL: process.env.CORE_API_URL || 'http://localhost:15001',
      headers: {
        'x-api-key': process.env.CORE_API_KEY!,
      },
    });
  }
  return serverClient;
};

const createClientClient = () => {
  if (!clientClient) {
    clientClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      withCredentials: true,
    });
  }
  return clientClient;
};

const getApiClient = () => {
  const isServer = typeof window === 'undefined';
  return isServer ? createServerClient() : createClientClient();
};

export default getApiClient;
