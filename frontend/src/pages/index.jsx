import { useState, useEffect } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'
import Ddd from './ddd'

import '../styles/index.css'

function Index() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState("NOTHING!!!")

  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((response) => response.json())
      .then((r) => {
        setText(JSON.stringify(r))
      })
      .catch((e) => {
        console.error(e)
        setText("ERROR!: " + e.message)
      })
  }, [])

  return (
    <>
      <Ddd />
    </>
  )
}

export default Index
