import axios from "axios";

const STORAGE_KEY = "smw:tokens";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

// Request interceptor: adds authorization token if it exists
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const tokens = JSON.parse(stored);
          if (tokens?.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
        } catch (error) {
          console.error("Error parsing tokens from localStorage", error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: updates token if renewed in header
// and handles automatic refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => {
    const renewedToken = response.headers["renewed-token"];
    if (renewedToken && typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const tokens = JSON.parse(stored);
          tokens.accessToken = renewedToken;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
        } catch (error) {
          console.error("Error updating renewed token", error);
        }
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If we receive 401 and haven't tried refreshing the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const tokens = JSON.parse(stored);
            if (tokens?.refreshToken) {
              console.log("[apiClient] Refreshing token...");
              
              // Try to refresh the token using the refresh_token
              const refreshResponse = await axios.post(
                `${apiClient.defaults.baseURL}/api/v3/auth/refresh`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${tokens.refreshToken}`,
                  },
                }
              );

              // Update tokens in localStorage
              const newAccessToken = refreshResponse.data.access_token;
              const newRefreshToken = refreshResponse.data.refresh_token || tokens.refreshToken;
              
              tokens.accessToken = newAccessToken;
              tokens.refreshToken = newRefreshToken;
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));

              // Dispatch custom event to notify AuthProvider about token update
              window.dispatchEvent(new CustomEvent("tokenRefreshed", { 
                detail: { accessToken: newAccessToken, refreshToken: newRefreshToken } 
              }));

              console.log("[apiClient] Token refreshed successfully");
              
              // Process queued requests with new token
              processQueue(null, newAccessToken);
              isRefreshing = false;

              // Update the original request header and retry it
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log out
            console.error("[apiClient] Token refresh failed, logging out", refreshError);
            processQueue(refreshError, null);
            isRefreshing = false;
            window.localStorage.removeItem(STORAGE_KEY);
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }
      }
      
      isRefreshing = false;
    }

    return Promise.reject(error);
  }
);

export default apiClient;