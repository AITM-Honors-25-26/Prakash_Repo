// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'
import React from "react"
import { createRoot } from "react-dom/client"

const HomePage = ()=>{
  return (
    <div>
    <p>what is my name</p></div>
  )
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>
)
