
import '../styles/layout.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router';

export default function OrderKiosk() {

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
        <div class="layout">
            <div class="mainBody"><p>{text}</p>  </div>
            <div class="subtotal"> </div>
        </div>
    )
}