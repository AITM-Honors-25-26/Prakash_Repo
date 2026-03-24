// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

import { createRoot } from "react-dom/client"

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
const rootElem = document.getElementById("root")!
const reactDomElem = createRoot(rootElem)
reactDomElem.render("Hello wordl")