import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./style.css";


// =====================================================
// API CONFIGURATION
// =====================================================

// IMPORTANT:
// Replace this with your ACTUAL Render backend URL.
//
// Example:
// https://smartstock-backend.onrender.com
//
// Do NOT put /api here.
// The code below automatically adds /api.

const RENDER_BACKEND_URL =
  "https://tracknest-4sp1.onrender.com";


// =====================================================
// BUILD API URL
// =====================================================

function buildApiUrl() {

  // First preference: Vercel environment variable
  const envUrl =
    import.meta.env.VITE_API_URL?.trim();

  let url =
    envUrl ||
    RENDER_BACKEND_URL;

  // Remove trailing slash
  url = url.replace(/\/+$/, "");

  // Remove /api if user accidentally included it
  url = url.replace(/\/api$/, "");

  // Add /api exactly once
  return `${url}/api`;
}


const API_URL = buildApiUrl();


// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});


// =====================================================
// AUTH TOKEN
// =====================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// =====================================================
// RESPONSE ERROR HANDLING
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {

    // If token has expired
    if (error?.response?.status === 401) {

      const requestUrl =
        error?.config?.url || "";

      // Don't immediately clear login
      // while attempting login itself.
      if (!requestUrl.includes("/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    return Promise.reject(error);
  }
);
