import "../styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import "react-toastify/dist/ReactToastify.css"

import type { AppProps } from "next/app"
import { ToastContainer } from "react-toastify"
import { SessionProvider } from "next-auth/react"
import * as React from "react"
import { ThemeProvider } from "../providers/ThemeProvider"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </SessionProvider>
    </ThemeProvider>
  )
}
export default MyApp
