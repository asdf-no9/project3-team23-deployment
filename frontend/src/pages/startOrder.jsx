
import styles from '../styles/startOrder.module.css';
import kioskStyles from '../styles/orderKiosk.module.css';
import logo from '../assets/ShareTeaLogo.png';
import { Link } from 'react-router';
import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * This component renders the initial order screen for the kiosk.
 * It prompts the user to start their order by interacting with the screen.
 * @returns startOrder component
 * @author Antony Quach
 */

export default function StartOrder({ rec }) {

    const mainRef = useRef(null);

    useEffect(() => {
        mainRef.current.scrollTo(0, 0);
    }, [])


    return (
        <div className="mainBody" ref={mainRef} id="mainBody">
            <div id='scaler'>
                <div className={styles.startBody}>

                    <Link to='/order-kiosk' tabindex="-1">
                        <div className={styles.logoContainer}>
                            <img src={logo} alt="ShareTea Logo" className="logo" />
                        </div>
                        <Link to='/order-kiosk'><h2 className={'centeralign ' + styles.start}> Tap to Start Order </h2></Link>
                        <h2 className={"h3 centeralign " + styles.rec}> {rec} </h2>
                        {/* <button className={'blue ' + kioskStyles.finalcheckout}> */}

                        {/* </button> */}

                    </Link>
                </div>
            </div>
        </div>
    )
}