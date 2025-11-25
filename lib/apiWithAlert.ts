import { useAlert } from "@/app/hooks/useAlert";
import axios from "axios";

let lastErrorTime = 0;

export function useApiWithAlert() {
  const { showError, showWarning } = useAlert();
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const now = Date.now();
      if (now - lastErrorTime < 500) return Promise.reject(error); // ignore rapid duplicates
      lastErrorTime = now;

      const status = error.response?.status;
      const message = error.message;

      if (status === 404) showError(message);
      else if (status === 403) showWarning(message);
      else showError(message);

      return Promise.reject(error);
    }
  );

  return api;
}
