// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'
import React from "react"
import { createRoot } from "react-dom/client"
import HomePage from "./pages/home/home.page.jsx"

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
)