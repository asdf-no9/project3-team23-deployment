
import '../styles/layout.css'
import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router';
import { currencyFormatter } from '../main';
import Confetti from 'react-confetti'


const options = ["drinks", "ice-cream", "food", "specialty"]

export default function OrderKiosk() {
    const { category } = useParams();

    const [orderState, changeOrderState] = useState({
        menuLoading: true,
        toppingsLoading: true,
        drinkAddLoading: false,
        checkoutLoading: false,
        categories: {},
        toppings: {},
        orderStep: 0,
        selectedCategory: null,
        currentDrinkSelection: { drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0 },
        drinkSelections: [],
        tipSelection: 0,
        customTipChoice: 0,
        customTipChoice_raw: "",
        tipError: false,
        oldsubtotal_raw: 0,
        subtotal_raw: 0,
        subtotal: "$0.00",
        paymentType: 0,
        checkoutError: false,
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
        changeOrderState({
            ...orderState, selectedCategory: name, orderStep: 1, currentDrinkSelection: {
                drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
            }
        });
    }

    const interactionCompleteCheckout = () => {
        if (orderState.checkoutLoading || orderState.tipError)
            return;

        changeOrderState({ ...orderState, checkoutLoading: true, checkoutError: false });

        let tip = 0;

        if (orderState.tipSelection == 4) {
            tip = orderState.customTipChoice;
        } else if (orderState.tipSelection == 3) {
            tip = 0.25 * orderState.subtotal_raw / 100000;
        }
        else if (orderState.tipSelection == 2) {
            tip = 0.2 * orderState.subtotal_raw / 100000;
        } else if (orderState.tipSelection == 1) {
            tip = 0.15 * orderState.subtotal_raw / 100000;
        }
        else {
            tip = 0;
        }

        fetch("http://localhost:3000/order/checkout", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentType: orderState.paymentType,
                tip: tip
            })
        })
            .then((response) => response.json())
            .then((r) => {
                console.log(r)

                if (r["success"] == false || r["error"]) {
                    changeOrderState({ ...orderState, checkoutLoading: false, checkoutError: true });
                    return;
                }

                changeOrderState({ ...orderState, checkoutLoading: false, orderStep: 3 });
            })
            .catch((e) => {
                console.error(e);
            });
    }

    const interactionOrderComplete = () => {
        changeOrderState({
            ...orderState, orderStep: 2, currentDrinkSelection: {
                drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
            }, tipSelection: 0, customTipChoice: 0, tipError: false, customTipChoice_raw: "", paymentType: 0, checkoutError: false
        });
    }

    const interactionCancelDrink = () => {
        changeOrderState({
            ...orderState, orderStep: 0, currentDrinkSelection: {
                drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
            }
        });
    }

    const interactionAddToOrder = () => {

        if (orderState.drinkAddLoading || orderState.currentDrinkSelection.drink == null)
            return;

        changeOrderState({ ...orderState, drinkAddLoading: true });

        fetch("http://localhost:3000/order/add", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                drinkID: orderState.currentDrinkSelection.drink.id,
                sugarLvl: orderState.currentDrinkSelection.sugarLevel,
                iceLvl: orderState.currentDrinkSelection.iceLevel,
                toppings: orderState.currentDrinkSelection.toppings
            })
        })
            .then((response) => response.json())
            .then((r) => {

                console.log(r)

                const priceUpdater = orderState.currentDrinkSelection;
                priceUpdater.price_raw = r["subtotal_raw"] - orderState.subtotal_raw;

                changeOrderState({
                    ...orderState, orderStep: 0, drinkSelections: [...orderState.drinkSelections, priceUpdater],
                    currentDrinkSelection: {
                        drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
                    }, drinkAddLoading: false, oldsubtotal_raw: orderState.subtotal_raw, subtotal: r["subtotal"], subtotal_raw: r["subtotal_raw"]
                });
            })
            .catch((e) => {
                console.error(e);
            });
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

    const interactionChangeTip = (option, other) => {
        if (orderState.checkoutLoading) return;

        if (orderState.tipSelection != option) {
            changeOrderState({ ...orderState, tipSelection: option })
            return;
        }
        if (option == 4 && other != null) {
            const input = other.target.value.trim();

            if (input == "") {
                changeOrderState({ ...orderState, tipError: false, customTipChoice: 0, customTipChoice_raw: "" })
                return;
            }

            const tipAmt = parseFloat(input);

            if (isNaN(tipAmt) || tipAmt == null || tipAmt < 0 || tipAmt > 100) {
                // give error msg
                changeOrderState({ ...orderState, tipError: true, customTipChoice_raw: input })
                return;
            } else {
                changeOrderState({ ...orderState, tipError: false, tipSelection: 4, customTipChoice: tipAmt, customTipChoice_raw: input })
                //, customTipChoice_raw: currencyFormatter.format(tipAmt).replace("$", "") }
            }
        }
    }

    const interactionFinalizeTip = () => {
        if (orderState.checkoutLoading) return;
        if (orderState.tipError || orderState.tipSelection != 4) return;

        if (orderState.customTipChoice == 0) {
            changeOrderState({ ...orderState, tipError: false, tipSelection: 0, customTipChoice: 0, customTipChoice_raw: "" })
            return;
        }

        changeOrderState({ ...orderState, tipSelection: 4, customTipChoice_raw: currencyFormatter.format(orderState.customTipChoice).replace("$", "") })
    }

    const interactionSelectPaymentType = (type) => {
        if (orderState.checkoutLoading) return;
        changeOrderState({ ...orderState, paymentType: type })
    }

    let orderStepHTML;

    if (orderState.orderStep == 0) {

        const enableCheckout = orderState.drinkSelections.length > 0 && orderState.orderStep != 2 && !orderState.menuLoading && !orderState.toppingsLoading && !orderState.drinkAddLoading;
        const checkoutText = orderState.orderStep == 2 ? "Pending..." : (orderState.menuLoading || orderState.toppingsLoading || orderState.drinkAddLoading) ? "Loading..." : ("Checkout: " + orderState.subtotal)

        const categoryButtons = [];
        for (let i in orderState.categories) {
            console.log(orderState.categories[i]);
            categoryButtons.push(<button className='catbuttonitem' onClick={() => interactionCategorySelection(i)}>{i}</button>)
        }
        orderStepHTML =
            <>
                <div className='headerbar one'>
                    <h1>Select Category</h1>
                    <div></div>
                    <Link to="/"><button className='darkgray'>Start Over</button></Link>
                    {/* <button className='blue' onClick={() => interactionAddToOrder()}>Add To Order +</button> */}
                </div>
                {orderState.menuLoading ?
                    <p className='centeralign'>Loading...</p> :
                    <div className='catbuttons'>{categoryButtons}</div>
                }
                <div className='checkoutbutton'>
                    <button disabled={!enableCheckout} className={'totalButton' + (enableCheckout ? ' blue' : ' invisible')} onClick={interactionOrderComplete}>{checkoutText}</button>
                </div>
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

        const addButtonEnabled = orderState.currentDrinkSelection.drink != null && !orderState.drinkAddLoading;
        const addButtonText = orderState.drinkAddLoading ? "Loading..." : "Add to Order +";

        orderStepHTML =
            <>
                <div className='headerbar one'>
                    <h1>{orderState.selectedCategory}</h1>
                    <div></div>
                    <button className='backButton' onClick={() => interactionCancelDrink()}>Back</button>
                    {/* <button disabled={!addButtonEnabled} className={"totalButton " + (addButtonEnabled ? 'blue' : 'black')} onClick={() => interactionAddToOrder()}>{addButtonText}</button> */}
                </div>
                <div className='drinkgrid'>
                    <div>
                        <h2>Select Drink</h2>
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
                    <div >
                        <h2>Toppings <span className='subtext'>(Select All)</span></h2>
                        {orderState.toppingsLoading ?
                            <p>Loading...</p> :
                            <div className='spacer drinkbuttons'>{toppingArray}</div>
                        }
                    </div>
                    {/* <hr /> */}
                    <div className='addbutton'>
                        <button disabled={!addButtonEnabled} className={"finalcheckout " + (addButtonEnabled ? 'blue' : 'black')} onClick={() => interactionAddToOrder()}>{addButtonText}</button>
                    </div>
                </div>


            </>;
    } else if (orderState.orderStep == 2) {


        const tax = orderState.subtotal_raw * 0.0825 / 100000;
        let tip = 0;

        if (orderState.tipSelection == 4) {
            tip = orderState.customTipChoice;
        } else if (orderState.tipSelection == 3) {
            tip = 0.25 * orderState.subtotal_raw / 100000;
        }
        else if (orderState.tipSelection == 2) {
            tip = 0.2 * orderState.subtotal_raw / 100000;
        } else if (orderState.tipSelection == 1) {
            tip = 0.15 * orderState.subtotal_raw / 100000;
        }
        else {
            tip = 0;
        }

        const total = (orderState.subtotal_raw / 100000) + tip + tax;
        const checkoutFinalText = orderState.checkoutLoading ? "Processing Transaction..." : orderState.checkoutError ? "Server error occurred. Please try again." : "Pay & Complete Order";

        orderStepHTML = <>
            <div className='headerbar one'>
                <h1>Checkout</h1>
                <div></div>
                <button disabled={orderState.checkoutLoading} className='backButton' onClick={() => interactionCancelDrink()}>Back</button>
            </div>
            <div className='drinkgrid'>
                <div>
                    <h2 className='h3'>Would you like to leave a Tip?</h2>
                    <div className='drinkbuttons tips'>
                        <button onClick={() => interactionChangeTip(0)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 0 ? 'darkgray' : 'gray')}><h2>0%</h2><h2 className='h3'>$0.00</h2></button>
                        <button onClick={() => interactionChangeTip(1)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 1 ? 'darkgray' : 'gray')}><h2>15%</h2><h2 className='h3'>{currencyFormatter.format(0.15 * orderState.subtotal_raw / 100000)}</h2></button>
                        <button onClick={() => interactionChangeTip(2)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 2 ? 'darkgray' : 'gray')}><h2>20%</h2><h2 className='h3'>{currencyFormatter.format(0.2 * orderState.subtotal_raw / 100000)}</h2></button>
                        <button onClick={() => interactionChangeTip(3)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 3 ? 'darkgray' : 'gray')}><h2>25%</h2><h2 className='h3'>{currencyFormatter.format(0.25 * orderState.subtotal_raw / 100000)}</h2></button>
                        {/* <button onClick={() => interactionChangeTip(4)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 4 ? 'darkgray' : 'gray')}><h2>Other</h2></button> */}
                    </div>
                    <div className={'drinkbuttonitem tips input-button ' + (orderState.tipSelection == 4 ? 'darkgray' : 'gray')} onClick={() => interactionChangeTip(4)}>
                        <span>{orderState.tipSelection == 4 ? "$" : "Other"}</span>
                        <input onChange={(event) => interactionChangeTip(4, event)} onBlur={() => interactionFinalizeTip()} value={orderState.tipSelection == 4 ? orderState.customTipChoice_raw : ''} maxLength={5} placeholder='0.00' className={orderState.tipSelection == 4 ? "visible" : "invisible"} type="text" />
                    </div>
                    {orderState.tipError ? <h2 className='tips error'>Invalid tip choice.</h2> : <></>}
                </div>
                <div>
                    <h2 className='h3'>Select your payment type.</h2>
                    <div className='drinkbuttons'>
                        <button onClick={() => interactionSelectPaymentType(0)} className={'drinkbuttonitem ' + (orderState.paymentType == 0 ? 'darkgray' : 'gray')}>Credit Card</button>
                        <button onClick={() => interactionSelectPaymentType(1)} className={'drinkbuttonitem ' + (orderState.paymentType == 1 ? 'darkgray' : 'gray')}>Cash</button>
                    </div>
                </div>
                <div className='orderdetails'>
                    <h2 className='subtext'>Subtotal: {orderState.subtotal}</h2>
                    <h2 className='subtext'>Tax: {currencyFormatter.format(tax)}</h2>
                    <h2 className='subtext'>Tip: {currencyFormatter.format(tip)}</h2>
                    <h2 className=''>Total: {currencyFormatter.format(total)}</h2>
                    <button onClick={() => interactionCompleteCheckout()} className={'finalcheckout ' + (orderState.checkoutLoading ? 'black' : orderState.checkoutError ? 'red' : 'blue')}>{checkoutFinalText}</button>
                </div>
            </div>
        </>;
    } else if (orderState.orderStep == 3) {

        let width, x;
        const main = document.getElementById("mainBody");
        if (main && main.offsetWidth) {
            x = main.offsetLeft;
            width = window.innerWidth - x;
        } else {
            width = window.innerWidth;
            x = 0;
        }

        orderStepHTML = (
            <>
                <Confetti confettiSource={{ x: x, w: width }} numberOfPieces={300} recycle={false} initialVelocityY={10} gravity={0.2} initialVelocityX={5} tweenDuration={2000} run={true} onConfettiComplete={(confetti) => confetti.reset()} />
                <div className='completedscreen'>
                    <h1>Thank You!</h1>
                    <p>Your order is complete.</p>
                    <Link to="/"><button className='blue'>Start Another Order</button></Link>
                </div>
            </>
        )
    }

    const itemList = [];

    for (let item in orderState.drinkSelections) {
        const price_formatted = currencyFormatter.format(orderState.drinkSelections[item].price_raw / 100000);
        itemList.push(<li>{parseInt(item) + 1}. ({price_formatted}) {orderState.drinkSelections[item].drink.name}</li>);
    }

    // const addButtonEnabled = orderState.currentDrinkSelection.drink != null && !orderState.drinkAddLoading;
    // const addButtonText = orderState.drinkAddLoading ? "Loading..." : "Add to Order +";
    // <button disabled={!enableCheckout} className={'totalButton' + (enableCheckout ? ' blue' : ' black')} onClick={interactionOrderComplete}>{checkoutText}</button>
    return (
        <div className={orderState.orderStep == 3 ? "layout complete" : "layout"}>
            <div className="mainBody" id="mainBody">

                {orderStepHTML}

            </div>
            {orderState.orderStep != 3 ?
                <div className="subtotal">
                    <div className='itemlist'>
                        <h3 className='centeralign'>Current Order</h3>
                        <hr />
                        <ol>
                            {itemList}
                        </ol>
                    </div>

                </div> : <></>
            }
        </div>
    )
}