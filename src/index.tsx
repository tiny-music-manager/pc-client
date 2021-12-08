import React from 'react'
import ReactDOM from 'react-dom'
import { MainPage } from './pages/main'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './index.scss'

import reportWebVitals from './reportWebVitals'

setTimeout(() => {
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter>
          <MainPage />
      </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
  )
}, 50);

reportWebVitals();
