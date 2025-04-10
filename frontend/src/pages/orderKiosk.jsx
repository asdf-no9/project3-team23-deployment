
import '../styles/layout.css'
import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router';

const options = ["drinks", "ice-cream", "food", "specialty"]

export default function OrderKiosk() {
    const { category, subcat } = useParams();

    const [orderState, changeOrderState] = useState({
        menuLoading: true,
        toppingsLoading: true,
        categories: {},
        toppings: {},
        orderStep: 0,
        selectedCategory: null,
        currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [] },
        drinkSelections: [],
    });

    useEffect(() => {
        if (orderState.menuLoading) {
            fetch("http://localhost:3000/menu")
                .then((response) => response.json())
                .then((r) => {
                    changeOrderState({ ...orderState, menuLoading: false, categories: r["categories"] });
                })
                .catch((e) => {
                    console.error(e);
                });
        }
        if (orderState.toppingsLoading) {
            fetch("http://localhost:3000/toppings")
                .then((response) => response.json())
                .then((r) => {
                    changeOrderState({ ...orderState, toppingsLoading: false, toppings: r["toppings"] });
                })
                .catch((e) => {
                    console.error(e);
                });
        }
    }, [orderState]);

    if (!options.includes(category))
        return (<Navigate to="/order-kiosk/drinks" />)

    const interactionCategorySelection = (name) => {
        changeOrderState({ ...orderState, selectedCategory: name, orderStep: 1, currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [] } });
    }

    const interactionOrderComplete = () => {
        changeOrderState({ ...orderState, orderStep: 2, currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [] } });
    }

    const interactionCancelDrink = () => {
        changeOrderState({ ...orderState, orderStep: 0, currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [] } });
    }

    const interactionAddToOrder = () => {

        if ()

            changeOrderState({ ...orderState, orderStep: 0, drinkSelections: [...orderState.drinkSelections, orderState.currentDrinkSelection], currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [] } });
    }

    const interactionChangeDrink = (drink) => {
        changeOrderState({ ...orderState, currentDrinkSelection: { ...orderState.currentDrinkSelection, drink: drink } });
    }

    const interactionChangeIceLevel = (level) => {
        changeOrderState({ ...orderState, currentDrinkSelection: { ...orderState.currentDrinkSelection, iceLevel: level } });
    }

    const interactionChangeSugarLevel = (level) => {
        changeOrderState({ ...orderState, currentDrinkSelection: { ...orderState.currentDrinkSelection, sugarLevel: level } });
    }

    const interactionChangeTopping = (topping) => {
        const currentToppings = orderState.currentDrinkSelection.toppings;
        if (currentToppings.includes(topping)) {
            changeOrderState({ ...orderState, currentDrinkSelection: { ...orderState.currentDrinkSelection, toppings: currentToppings.filter((t) => t != topping) } });
        } else {
            changeOrderState({ ...orderState, currentDrinkSelection: { ...orderState.currentDrinkSelection, toppings: [...currentToppings, topping] } });
        }
    }


    let orderStepHTML;

    if (orderState.orderStep == 0) {
        const categoryButtons = [];
        for (let i in orderState.categories) {
            console.log(orderState.categories[i]);
            categoryButtons.push(<button className='catbuttonitem' onClick={() => interactionCategorySelection(i)}>{i}</button>)
        }
        orderStepHTML =
            <>
                <h2>Select Category</h2>
                {orderState.menuLoading ?
                    <p className='centeralign'>Loading...</p> :
                    <div className='catbuttons'>{categoryButtons}</div>
                }
            </>;
    } else if (orderState.orderStep == 1) {
        const drinkArray = [];
        const iceArray = [];
        const sugarArray = [];
        const toppingArray = [];
        for (let i in orderState.categories[orderState.selectedCategory]) {
            const drink = orderState.categories[orderState.selectedCategory][i];
            const selected = orderState.currentDrinkSelection.drink && (orderState.currentDrinkSelection.drink.name == drink.name);
            drinkArray.push(<button disabled={selected} onClick={() => interactionChangeDrink(drink)} className={'drinkbuttonitem ' + (selected ? 'darkgray' : 'gray')}>{drink.name + ' (' + drink.price + ')'}</button>)
        }
        for (let i = 2; i >= 0; i--) {
            const name = i == 2 ? "Regular Ice" : i == 1 ? "Less Ice" : "No Ice";
            const selected = orderState.currentDrinkSelection.iceLevel == i;
            iceArray.push(<button disabled={selected} onClick={() => interactionChangeIceLevel(i)} className={'drinkbuttonitem ' + (selected ? 'darkgray' : 'gray')}>{name}</button>)
        }
        for (let i = 4; i >= 0; i--) {
            let amount = 0;
            if (i == 4) amount = 1;
            else if (i == 3) amount = 0.8;
            else if (i == 2) amount = 0.5;
            else if (i == 1) amount = 0.3;

            const selected = orderState.currentDrinkSelection.sugarLevel == amount;
            sugarArray.push(<button disabled={selected} onClick={() => interactionChangeSugarLevel(amount)} className={'drinkbuttonitem ' + (selected ? 'darkgray' : 'gray')}>{amount * 100}%</button>)
        }
        for (let i in orderState.toppings) {
            const topping = orderState.toppings[i];
            let color = "gray";
            if (!topping["in_stock"]) color = "black";
            else if (orderState.currentDrinkSelection.toppings.includes(topping["name"])) color = "darkgray";
            toppingArray.push(<button disabled={topping["in_stock"] ? false : true} className={'drinkbuttonitem ' + color} onClick={() => interactionChangeTopping(topping["name"])}>{topping["name"]}</button>)
        }
        orderStepHTML =
            <>
                <div className='headerbar two'>
                    <h1>Select Drink</h1>
                    <div></div>
                    <button className='darkgray' onClick={() => interactionCancelDrink()}>Cancel</button>
                    <button className='blue' onClick={() => interactionAddToOrder()}>Add To Order +</button>
                </div>
                <div className='drinkgrid'>
                    <div>
                        <div className='drinkbuttons'>{drinkArray}</div>
                    </div>
                    <div>
                        <h2>Ice Level</h2>
                        <div className='drinkbuttons'>
                            {iceArray}
                        </div>
                    </div>
                    <div>
                        <h2>Sugar Level</h2>
                        <div className='drinkbuttons'>
                            {sugarArray}
                        </div>
                    </div>
                    <div>
                        <h2>Toppings</h2>
                        {orderState.toppingsLoading ?
                            <p>Loading...</p> :
                            <div className='drinkbuttons'>{toppingArray}</div>
                        }
                    </div>
                </div>
            </>;
    }

    return (
        <div className="layout">
            <div className="mainBody">

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