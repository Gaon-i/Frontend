import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // 서버 주소 입력
  withCredentials: true, // 세션 쿠키 전송을 위해 필수
  headers: {
    "Content-Type": "application/json",
  },
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};

    // 401(미인증) 에러 처리
    if (status === 401) {
      const publicPaths = ["/auth/admin/login", "/"];
      if (!publicPaths.includes(window.location.pathname)) {
        
        // 로컬 데이터 정리
        localStorage.clear();

        window.location.href = "/auth/admin/login?expired=true";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API 작업