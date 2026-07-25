import axios, { AxiosError } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 90000, // 90 seconds — Render cold start can take 60s
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Auto retry once on network error (Render cold start)
    if (
      !originalRequest._retry &&
      (!error.response || error.code === "ERR_NETWORK" || error.code === "ECONNABORTED")
    ) {
      originalRequest._retry = true;
      // Wait 5 seconds then retry — gives Render time to wake up
      await new Promise(res => setTimeout(res, 5000));
      return api(originalRequest);
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Keep-alive ping — prevents Render from sleeping
export const pingBackend = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_BASE}/ping`, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
};

export const wakeUpBackend = async (): Promise<void> => {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 90000 });
  } catch {
    // Silent fail — just tried to wake it
  }
};

export const signup = async (email: string, password: string) => {
  if (!email?.trim() || !password?.trim()) throw new Error("Email and password are required");
  const res = await api.post("/auth/signup", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
};

export const login = async (email: string, password: string) => {
  if (!email?.trim() || !password?.trim()) throw new Error("Email and password are required");
  const res = await api.post("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
};

export const uploadMemory = async (formData: FormData) => {
  const res = await api.post("/memories/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 90000,
  });
  return res.data;
};

export const getMemories = async () => {
  const res = await api.get("/memories/");
  return res.data;
};

export const searchMemories = async (query: string) => {
  if (!query?.trim()) return { results: [] };
  const res = await api.get(`/memories/search?q=${encodeURIComponent(query.trim())}`);
  return res.data;
};

export const deleteMemory = async (id: number) => {
  if (!id || id <= 0) throw new Error("Invalid memory ID");
  const res = await api.delete(`/memories/${id}`);
  return res.data;
};

export const chatWithMemories = async (message: string, nMemories: number = 5) => {
  if (!message?.trim()) throw new Error("Message cannot be empty");
  const res = await api.post("/chat/", {
    message: message.trim(),
    n_memories: nMemories,
  }, { timeout: 90000 });
  return res.data;
};

export const getByCategory = async (category: string) => {
  const res = await api.get(`/memories/category/${category}`);
  return res.data;
};

export const getExamRevision = async (subject?: string) => {
  const url = subject
    ? `/memories/exam/revision?subject=${encodeURIComponent(subject)}`
    : "/memories/exam/revision";
  const res = await api.get(url, { timeout: 90000 });
  return res.data;
};

export const getProjects = async (status?: string) => {
  const url = status
    ? `/memories/projects/all?status=${status}`
    : "/memories/projects/all";
  const res = await api.get(url, { timeout: 90000 });
  return res.data;
};

export const markReviewed = async (id: number) => {
  const res = await api.post(`/memories/${id}/review`);
  return res.data;
};

export const updateProjectStatus = async (id: number, status: string) => {
  const res = await api.patch(`/memories/${id}/project-status?status=${status}`);
  return res.data;
};