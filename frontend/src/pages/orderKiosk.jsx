
import '../styles/layout.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router';

export default function OrderKiosk() {

    const [isLoading, setLoading] = useState(true);
    const [categories, setCategories] = useState({});

    const buttonArray = [];

    useEffect(() => {
        fetch("http://localhost:3000/menu")
            .then((response) => response.json())
            .then((r) => {
                setLoading(false);
                setCategories(r["categories"]);
                console.log(r);
            })
            .catch((e) => {
                console.error(e)
            })
    }, [])

    for (let i in categories) {
        console.log(categories[i]);
        buttonArray.push(<button className='catbuttonitem'>{i}</button>)
    }

    return (
        <div class="layout">
            <div class="mainBody">
                <h2>Select Category</h2>
                {isLoading ?
                    <p className='centeralign'>Loading...</p> :
                    <div className='catbuttons'>{buttonArray}</div>
                }
            </div>
            <div class="subtotal">
                <div className='itemlist'>
                    <h3 className='centeralign'>Current Order</h3>
                    <hr />
                    <ol>
                        <li>Test</li>
                        <li>Test 2</li>
                    </ol>
                </div>
                <button className='totalButton'>Total: $0.00</button>
            </div>
        </div>
    )
}