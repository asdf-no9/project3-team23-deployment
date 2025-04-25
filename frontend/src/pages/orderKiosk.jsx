
import kioskStyles from '../styles/orderKiosk.module.css'
import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router';
import { currencyFormatter } from '../main';
import Confetti from 'react-confetti'
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL;

export default function OrderKiosk({ loginInfo }) {
    // const { category } = useParams();

    const mainRef = useRef(null)
    const runBefore = useRef(false);
    const inputRef = useRef(null);

    const [menuState, setMenuState] = useState({ menuLoading: true, categories: {} });
    const [toppingsState, setToppingsState] = useState({ toppingsLoading: true, toppings: [] });
    const [orderIDState, setOrderIDState] = useState({ orderIDLoading: true, orderID: -1 });

    const [orderState, changeOrderState] = useState({
        drinkAddLoading: false,
        checkoutLoading: false,
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

    /**
     * @returns true if any of the loading states are true, false otherwise
     */
    function loading() {
        return orderIDState.orderIDLoading || menuState.menuLoading || toppingsState.toppingsLoading ||
            orderState.drinkAddLoading || orderState.checkoutLoading || orderIDState.orderID == -1;
    }

    useEffect(() => {
        if (runBefore.current) return;
        runBefore.current = true;

        fetch(API_URL + "order/start", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => {
                setOrderIDState(({ ...orderIDState, orderIDLoading: false, orderID: r["orderID"] }));
            })
            .catch((e) => {
                console.error(e);
            });
        fetch(API_URL + "menu")
            .then((response) => response.json())
            .then((r) => {
                setMenuState({ ...menuState, menuLoading: false, categories: r["categories"] });
            })
            .catch((e) => {
                console.error(e);
            });
        fetch(API_URL + "toppings")
            .then((response) => response.json())
            .then((r) => {
                setToppingsState({ ...toppingsState, toppingsLoading: false, toppings: r["toppings"] });
            })
            .catch((e) => {
                console.error(e);
            });
    }, []);

    // if (!options.includes(category))
    //     return (<Navigate to="/order-kiosk/drinks" />)

    const interactionCategorySelection = (name) => {
        changeOrderState({
            ...orderState, selectedCategory: name, orderStep: 1, currentDrinkSelection: {
                drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
            }
        });
        mainRef.current.scrollTo(0, 0);
    }

    const interactionCompleteCheckout = () => {
        if (loading() || (orderState.tipError && orderState.tipSelection == 4))
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

        tip = parseInt(tip * 100000);

        fetch(API_URL + "order/checkout", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
            body: JSON.stringify({
                paymentType: orderState.paymentType,
                tip: tip,
                orderID: orderIDState.orderID,
                cashierID: loginInfo.isLoggedIn ? loginInfo.id : -1,
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
                mainRef.current.scrollTo(0, 0);
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
        mainRef.current.scrollTo(0, 0);
    }

    const interactionCancelDrink = () => {
        changeOrderState({
            ...orderState, orderStep: 0, currentDrinkSelection: {
                drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
            }
        });
        mainRef.current.scrollTo(0, 0);
    }

    const interactionAddToOrder = () => {

        if (loading() || orderState.currentDrinkSelection.drink == null)
            return;

        changeOrderState({ ...orderState, drinkAddLoading: true });

        fetch(API_URL + "order/add", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
            body: JSON.stringify({
                drinkID: orderState.currentDrinkSelection.drink.id,
                sugarLvl: orderState.currentDrinkSelection.sugarLevel,
                iceLvl: orderState.currentDrinkSelection.iceLevel,
                toppings: orderState.currentDrinkSelection.toppings,
                orderID: orderIDState.orderID
            })
        })
            .then((response) => response.json())
            .then((r) => {

                // console.log(r)

                const priceUpdater = orderState.currentDrinkSelection;
                priceUpdater.price_raw = r["subtotal_raw"] - orderState.subtotal_raw;

                changeOrderState({
                    ...orderState, orderStep: 0, drinkSelections: [...orderState.drinkSelections, priceUpdater],
                    currentDrinkSelection: {
                        drink: null, iceLevel: 2, sugarLevel: 1, toppings: [], price_raw: 0
                    }, drinkAddLoading: false, oldsubtotal_raw: orderState.subtotal_raw, subtotal: r["subtotal"], subtotal_raw: r["subtotal_raw"]
                });
                mainRef.current.scrollTo(0, 0);
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
        if (loading()) return;

        if (orderState.tipSelection != option) {
            changeOrderState({ ...orderState, tipSelection: option }), () => {
                if (option == 4) {
                    inputRef.current.focus();
                }
            }
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
        if (loading()) return;
        if (orderState.tipError || orderState.tipSelection != 4) return;

        if (orderState.customTipChoice == 0) {
            changeOrderState({ ...orderState, tipError: false, tipSelection: 0, customTipChoice: 0, customTipChoice_raw: "" })
            return;
        }

        changeOrderState({ ...orderState, tipSelection: 4, customTipChoice_raw: currencyFormatter.format(orderState.customTipChoice).replace("$", "") })
    }

    const interactionSelectPaymentType = (type) => {
        if (loading()) return;
        changeOrderState({ ...orderState, paymentType: type })
    }

    const itemList = [];

    for (let item in orderState.drinkSelections) {
        const price_formatted = currencyFormatter.format(orderState.drinkSelections[item].price_raw / 100000);
        itemList.push(<li>{parseInt(item) + 1}. ({price_formatted}) {orderState.drinkSelections[item].drink.name}</li>);
    }

    let orderStepHTML;

    if (orderState.orderStep == 0) {

        const enableCheckout = orderState.drinkSelections.length > 0 && orderState.orderStep != 2 && !loading();
        const checkoutText = orderState.orderStep == 2 ? "Pending..." : (loading()) ? "Loading..." : ("Checkout: " + orderState.subtotal)

        const categoryButtons = [];
        for (let i in menuState.categories) {
            // console.log(menuState.categories[i]);
            categoryButtons.push(<button className={kioskStyles.drinkbuttonitem + ' ' + kioskStyles.catbuttonitem + ' gray'} onClick={() => interactionCategorySelection(i)}>{i}</button>)
        }

        orderStepHTML = (
            <>
                <div className='headerbar one'>
                    <h1>Select Category</h1>
                    <div></div>
                    <hr className='phone' />
                    <Link to="/"><button className='darkgray'>Start Over</button></Link>
                </div>
                <div className={kioskStyles.drinkgrid + ' ' + kioskStyles.catgrid}>
                    {loading() ?
                        <p className='centeralign'>Loading...</p> :
                        <div className={kioskStyles.catbuttons}>{categoryButtons}</div>
                    }
                    <div>
                        <div className={kioskStyles.itemlist + ' ' + kioskStyles.hideitemlist}>
                            <hr className='full' />
                            <h3 className='centeralign'>Current Order</h3>
                            <hr className='full' />
                            {itemList.length == 0 ? <p className='centeralign'>Empty order.</p> :
                                <ol>
                                    {itemList}
                                </ol>}
                        </div>
                    </div>
                    <div className={kioskStyles.addbutton}>
                        <button disabled={!enableCheckout} className={kioskStyles.finalcheckout + ' ' + (enableCheckout ? ' blue' : kioskStyles.invisible)} onClick={interactionOrderComplete}>{checkoutText}</button>
                    </div>
                </div></>
        );
    } else if (orderState.orderStep == 1) {
        const drinkArray = [];
        const iceArray = [];
        const sugarArray = [];
        const toppingArray = [];
        for (let i in menuState.categories[orderState.selectedCategory]) {
            const drink = menuState.categories[orderState.selectedCategory][i];
            const selected = orderState.currentDrinkSelection.drink && (orderState.currentDrinkSelection.drink.name == drink.name);
            drinkArray.push(<button disabled={selected} onClick={() => interactionChangeDrink(drink)} className={kioskStyles.drinkbuttonitem + ' ' + (selected ? 'darkgray' : 'gray')}>{drink.name + ' (' + drink.price + ')'}</button>)
        }
        for (let i = 2; i >= 0; i--) {
            const name = i == 2 ? "Regular Ice" : i == 1 ? "Less Ice" : "No Ice";
            const selected = orderState.currentDrinkSelection.iceLevel == i;
            iceArray.push(<button disabled={selected} onClick={() => interactionChangeIceLevel(i)} className={kioskStyles.drinkbuttonitem + ' ' + (selected ? 'darkgray' : 'gray')}>{name}</button>)
        }
        for (let i = 4; i >= 0; i--) {
            let amount = 0;
            if (i == 4) amount = 1;
            else if (i == 3) amount = 0.8;
            else if (i == 2) amount = 0.5;
            else if (i == 1) amount = 0.3;

            const selected = orderState.currentDrinkSelection.sugarLevel == amount;
            sugarArray.push(<button disabled={selected} onClick={() => interactionChangeSugarLevel(amount)} className={kioskStyles.drinkbuttonitem + ' ' + (selected ? 'darkgray' : 'gray')}>{amount * 100}%</button>)
        }
        for (let i in toppingsState.toppings) {
            const topping = toppingsState.toppings[i];
            let color = "gray";
            if (!topping["in_stock"]) color = "black";
            else if (orderState.currentDrinkSelection.toppings.includes(topping["name"])) color = "darkgray";
            toppingArray.push(<button disabled={topping["in_stock"] ? false : true} className={kioskStyles.drinkbuttonitem + ' ' + color} onClick={() => interactionChangeTopping(topping["name"])
            }> {topping["name"]}</button >)
        }

        const addButtonEnabled = orderState.currentDrinkSelection.drink != null && !loading();
        const addButtonText = loading() ? "Loading..." : "Add to Order +";

        orderStepHTML =
            <>
                <div className='headerbar one'>
                    <h1>{orderState.selectedCategory}</h1>
                    <hr className='phone' />
                    <button className='darkgray backButton' onClick={() => interactionCancelDrink()}>Back</button>
                    {/* <hr className='phone' /> */}
                    {/* <button disabled={!addButtonEnabled} className={"totalButton " + (addButtonEnabled ? 'blue' : 'black')} onClick={() => interactionAddToOrder()}>{addButtonText}</button> */}
                </div >
                <div className={kioskStyles.drinkgrid}>
                    <div>
                        <h2>Select Drink <span className='subtext'>(Required)</span></h2>
                        <div className={kioskStyles.drinkbuttons}>{drinkArray}</div>
                    </div>
                    <div>
                        <h2>Ice Level</h2>
                        <div className={kioskStyles.drinkbuttons}>
                            {iceArray}
                        </div>
                    </div>
                    <div>
                        <h2>Sugar Level</h2>
                        <div className={kioskStyles.drinkbuttons}>
                            {sugarArray}
                        </div>
                    </div>
                    <div >
                        <h2>Toppings <span className='subtext'>($0.75 each, creama $1.00)</span></h2>
                        {toppingsState.toppingsLoading ?
                            <p className='centeralign'>Loading...</p> :
                            <div className={'spacer ' + kioskStyles.drinkbuttons}>{toppingArray}</div>
                        }
                    </div>
                    {/* <hr /> */}
                    <div className={kioskStyles.addbutton}>
                        <button disabled={!addButtonEnabled} className={kioskStyles.finalcheckout + " " + (addButtonEnabled ? 'blue' : 'black')} onClick={() => interactionAddToOrder()}>{addButtonText}</button>
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
                <hr className='phone' />
                <button disabled={loading()} className='darkgray backButton' onClick={() => interactionCancelDrink()}>Back</button>
            </div>
            <div className={kioskStyles.drinkgrid}>
                <div>
                    <h2 className='h3'>Would you like to leave a Tip?</h2>
                    <div className={kioskStyles.drinkbuttons + ' ' + kioskStyles.tips} >
                        <button onClick={() => interactionChangeTip(0)} className={kioskStyles.drinkbuttonitem + ' ' + kioskStyles.tips + ' ' + (orderState.tipSelection == 0 ? 'darkgray' : 'gray')}><h2>0%</h2><h2 className={kioskStyles.h3}>$0.00</h2></button>
                        <button onClick={() => interactionChangeTip(1)} className={kioskStyles.drinkbuttonitem + ' ' + kioskStyles.tips + ' ' + (orderState.tipSelection == 1 ? 'darkgray' : 'gray')}><h2>15%</h2><h2 className={kioskStyles.h3}>{currencyFormatter.format(0.15 * orderState.subtotal_raw / 100000)}</h2></button>
                        <button onClick={() => interactionChangeTip(2)} className={kioskStyles.drinkbuttonitem + ' ' + kioskStyles.tips + ' ' + (orderState.tipSelection == 2 ? 'darkgray' : 'gray')}><h2>20%</h2><h2 className={kioskStyles.h3}>{currencyFormatter.format(0.2 * orderState.subtotal_raw / 100000)}</h2></button>
                        <button onClick={() => interactionChangeTip(3)} className={kioskStyles.drinkbuttonitem + ' ' + kioskStyles.tips + ' ' + (orderState.tipSelection == 3 ? 'darkgray' : 'gray')}><h2>25%</h2><h2 className={kioskStyles.h3}>{currencyFormatter.format(0.25 * orderState.subtotal_raw / 100000)}</h2></button>
                        {/* <button onClick={() => interactionChangeTip(4)} className={'drinkbuttonitem tips ' + (orderState.tipSelection == 4 ? 'darkgray' : 'gray')}><h2>Other</h2></button> */}
                    </div>
                    <div className={kioskStyles.tips + ' ' + kioskStyles.inputbutton + ' ' + (orderState.tipSelection == 4 ? 'darkgray' : 'gray') + ' ' + (orderState.tipSelection == 4 ? "visible" : "invisible")} onClick={() => interactionChangeTip(4)}>
                        <span>{orderState.tipSelection == 4 ? "$" : "Other"}</span>
                        <input id={kioskStyles.customtipfield} ref={inputRef} onChange={(event) => interactionChangeTip(4, event)} onBlur={() => interactionFinalizeTip()} value={orderState.tipSelection == 4 ? orderState.customTipChoice_raw : ''} maxLength={5} placeholder='0.00' type="text" />
                    </div>
                    {orderState.tipError && orderState.tipSelection == 4 ? <h2 className={kioskStyles.tips + ' ' + kioskStyles.error}>Invalid tip choice.</h2> : <></>}
                </div>
                <div>
                    <h2 className='h3'>Select your payment type.</h2>
                    <div className={kioskStyles.drinkbuttons}>
                        <button onClick={() => interactionSelectPaymentType(0)} className={kioskStyles.drinkbuttonitem + ' ' + (orderState.paymentType == 0 ? 'darkgray' : 'gray')}>Credit Card</button>
                        <button onClick={() => interactionSelectPaymentType(1)} className={kioskStyles.drinkbuttonitem + ' ' + (orderState.paymentType == 1 ? 'darkgray' : 'gray')}>Cash</button>
                    </div>
                </div>
                <div className={kioskStyles.orderdetails}>
                    <h2 className='subtext'>Subtotal: {orderState.subtotal}</h2>
                    <h2 className='subtext'>Tax: {currencyFormatter.format(tax)}</h2>
                    <h2 className='subtext'>Tip: {currencyFormatter.format(tip)}</h2>
                    <h2 className=''>Total: {currencyFormatter.format(total)}</h2>
                    <div><button onClick={() => interactionCompleteCheckout()} className={kioskStyles.finalcheckout + ' ' + (loading() || (orderState.tipError && orderState.tipSelection == 4) ? 'black' : orderState.checkoutError ? 'red' : 'blue')}>{checkoutFinalText}</button></div>
                </div>
            </div>
        </>;
    } else if (orderState.orderStep == 3) {
        orderStepHTML = (
            <>
                <Confetti style={{ maxHeight: '100%', maxWidth: '100%' }} width={window.innerWidth} height={window.innerHeight} numberOfPieces={300} recycle={false} initialVelocityY={10} gravity={0.2} initialVelocityX={5} tweenDuration={2000} run={true} onConfettiComplete={(confetti) => confetti.reset()} />
                <div className={kioskStyles.completedscreen}>
                    <h1>Thank You!</h1>
                    <p>Your order is complete.</p>
                    <Link to="/"><button className='blue'>Start Another Order</button></Link>
                </div>
            </>
        )
    }

    // const addButtonEnabled = orderState.currentDrinkSelection.drink != null && !orderState.drinkAddLoading;
    // const addButtonText = orderState.drinkAddLoading ? "Loading..." : "Add to Order +";
    // <button disabled={!enableCheckout} className={'totalButton' + (enableCheckout ? ' blue' : ' black')} onClick={interactionOrderComplete}>{checkoutText}</button>
    return (
        <div className={orderState.orderStep == 3 ? kioskStyles.layout + " " + kioskStyles.complete : kioskStyles.layout}>
            <div className="mainBody" id="mainBody" ref={mainRef}>
                <div id='scaler'>

                    {orderStepHTML}
                </div>
            </div>
            {orderState.orderStep != 3 ?
                <div className={kioskStyles.subtotal}>
                    <div className={kioskStyles.itemlist}>
                        <h3 className='centeralign'>Current Order</h3>
                        <hr />
                        {itemList.length == 0 ? <p className='centeralign'>Empty order.</p> :
                            <ol>
                                {itemList}
                            </ol>}
                    </div>

                </div> : <></>
            }
        </div>
    )
}