import axios, { AxiosError } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach JWT token to every request
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

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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

export const signup = async (email: string, password: string) => {
  if (!email?.trim() || !password?.trim()) {
    throw new Error("Email and password are required");
  }
  const res = await api.post("/auth/signup", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
};

export const login = async (email: string, password: string) => {
  if (!email?.trim() || !password?.trim()) {
    throw new Error("Email and password are required");
  }
  const res = await api.post("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return res.data;
};

export const uploadMemory = async (formData: FormData) => {
  const res = await api.post("/memories/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getMemories = async () => {
  const res = await api.get("/memories/");
  return res.data;
};

export const searchMemories = async (query: string) => {
  if (!query?.trim()) return { results: [] };
  const res = await api.get(
    `/memories/search?q=${encodeURIComponent(query.trim())}`
  );
  return res.data;
};

export const deleteMemory = async (id: number) => {
  if (!id || id <= 0) throw new Error("Invalid memory ID");
  const res = await api.delete(`/memories/${id}`);
  return res.data;
};

export const chatWithMemories = async (message: string, nMemories?: number) => {
  if (!message?.trim()) throw new Error("Message cannot be empty");
  const res = await api.post("/chat/", { message: message.trim(), nMemories });
  return res.data;
};
export const getByCategory = async (category: string) => {
  const res = await api.get(`/memories/category/${category}`);
  return res.data;
};

export const getExamRevision = async (subject?: string) => {
  const url = subject ? `/memories/exam/revision?subject=${encodeURIComponent(subject)}` : "/memories/exam/revision";
  const res = await api.get(url);
  return res.data;
};

export const getProjects = async (status?: string) => {
  const url = status ? `/memories/projects/all?status=${status}` : "/memories/projects/all";
  const res = await api.get(url);
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