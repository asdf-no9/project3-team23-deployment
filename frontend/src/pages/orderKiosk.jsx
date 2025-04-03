
import '../styles/layout.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router';

export default function OrderKiosk() {

    const [isLoading, setLoading] = useState(true);
    const [categories, setCategories] = useState({});

    // 0 - cat select. 1 - drink select. 2 - payment, etc. 
    const [orderStep, setOrderStep] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState();

    // const [drinkSelection, updateDrinkSelection] = useState({ drink: {}, iceLevel: 1, sugarLevel: 1, toppings: [] });

    useEffect(() => {
        if (isLoading) {
            setLoading(false);
            fetch("http://localhost:3000/menu")
                .then((response) => response.json())
                .then((r) => {
                    setLoading(false);
                    setCategories(r["categories"]);
                    console.log(r);
                })
                .catch((e) => {
                    console.error(e);
                });
        }
    }, [isLoading]);


    const interactionCategorySelection = (name) => {
        setSelectedCategory(name);
        setOrderStep(1);
    }

    const interactionOrderComplete = () => {

    }

    const interactionCancelDrink = () => {
        setOrderStep(0);
    }

    const interactionAddToOrder = () => {

    }

    let orderStepHTML;
    const categoryButtons = [];
    const drinkArray = [];

    if (orderStep == 0) {
        for (let i in categories) {
            console.log(categories[i]);
            categoryButtons.push(<button className='catbuttonitem' onClick={() => interactionCategorySelection(i)}>{i}</button>)
        }
        orderStepHTML =
            <>
                <h2>Select Category</h2>
                {isLoading ?
                    <p className='centeralign'>Loading...</p> :
                    <div className='catbuttons'>{categoryButtons}</div>
                }
            </>;
    } else if (orderStep == 1) {
        for (let i in categories[selectedCategory]) {
            console.log(categories[selectedCategory][i]);
            categoryButtons.push(<button className='catbuttonitem'>{categories[selectedCategory][i]["name"]}</button>)
        }
        orderStepHTML =
            <>
                <div className='headerbar two'>
                    <h2>Select Drink</h2>
                    <div></div>
                    <button className='darkgray' onClick={() => interactionCancelDrink()}>Cancel</button>
                    <button className='blue' onClick={() => interactionAddToOrder()}>Add To Order +</button>
                </div>
                <div className='catbuttons'>{categoryButtons}</div>
            </>;
    }

    return (
        <div class="layout">
            <div class="mainBody">

                {orderStepHTML}

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
                <button className='totalButton blue' onClick={interactionOrderComplete}>Total: $0.00</button>
            </div>
        </div>
    )
}