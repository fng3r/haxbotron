import axios from 'axios';

let clientClient: ReturnType<typeof axios.create> | null = null;

const createClientClient = () => {
  if (!clientClient) {
    clientClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '',
      withCredentials: true,
    });
  }
  return clientClient;
};

const getApiClient = () => {
  return createClientClient();
};

export default getApiClient;
