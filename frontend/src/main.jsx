import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createRoot
} from "react-dom/client";

import axios from "axios";

import "./style.css";


// =====================================================
// SMARTSTOCK API
// =====================================================

// IMPORTANT:
// Put your ACTUAL Render backend URL here.
//
// Example:
// https://tracknest-backend.onrender.com
//
// DO NOT add /api here.

const RENDER_BACKEND_URL =
  "https://tracknest-4sp1.onrender.com";


// =====================================================
// API URL BUILDER
// =====================================================

function getApiUrl() {

  let url =
    import.meta.env.VITE_API_URL ||
    RENDER_BACKEND_URL;

  url = String(url).trim();

  // Remove trailing /
  url = url.replace(/\/+$/, "");

  // Remove /api if it was already supplied
  if (url.endsWith("/api")) {
    url = url.slice(0, -4);
  }

  return `${url}/api`;
}


const API_URL = getApiUrl();


// =====================================================
// AXIOS
// =====================================================

const api = axios.create({

  baseURL: API_URL,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json"
  }

});


// =====================================================
// AUTH TOKEN
// =====================================================

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem("token");

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;

  },

  (error) => {

    return Promise.reject(error);

  }

);
