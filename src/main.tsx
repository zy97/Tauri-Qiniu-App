import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import * as dayjs from 'dayjs'
import * as localizedFormat from 'dayjs/plugin/localizedFormat' // import plugin
import 'dayjs/locale/zh-cn' // import locale
import Test from './Test'
dayjs.extend(localizedFormat) // use plugin
dayjs.locale('zh-cn') // use locale
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
