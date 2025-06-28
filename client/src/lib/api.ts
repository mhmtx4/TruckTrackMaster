import { apiRequest } from "./queryClient";

export const api = {
  // TIR endpoints
  tirs: {
    getAll: () => fetch("/api/tirs", { credentials: "include" }).then(res => res.json()),
    getById: (id: string) => fetch(`/api/tirs/${id}`, { credentials: "include" }).then(res => res.json()),
    create: (data: any) => apiRequest("POST", "/api/tirs", data),
    update: (id: string, data: any) => apiRequest("PATCH", `/api/tirs/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/tirs/${id}`),
  },

  // Document endpoints
  documents: {
    upload: (tirId: string, formData: FormData) => 
      fetch(`/api/tirs/${tirId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      }),
    delete: (id: string) => apiRequest("DELETE", `/api/documents/${id}`),
  },

  // Share link endpoints
  share: {
    createTirLink: (tirId: string, data: any) => apiRequest("POST", `/api/tirs/${tirId}/share`, data),
    createListLink: (data: any) => apiRequest("POST", "/api/share/list", data),
    getLinks: (type: "tir" | "list") => fetch(`/api/share/${type}`, { credentials: "include" }).then(res => res.json()),
    update: (id: string, data: any) => apiRequest("PATCH", `/api/share/${id}`, data),
  },

  // Public endpoints
  public: {
    getTir: (token: string) => fetch(`/api/public/tir/${token}`, { credentials: "include" }).then(res => res.json()),
    getList: (token: string) => fetch(`/api/public/list/${token}`, { credentials: "include" }).then(res => res.json()),
  },
};
