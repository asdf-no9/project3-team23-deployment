
import styles from '../styles/startOrder.module.css';
import logo from '../assets/ShareTeaLogo.png';
import { Link } from 'react-router';
import {useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * This component renders the initial order screen for the kiosk.
 * It prompts the user to start their order by interacting with the screen.
 * @returns startOrder component
 * @author Antony Quach
 */

export default function StartOrder() {
    const [forecast, setForecast] = useState('');
    const [rec, setRec] = useState('');

    useEffect(() => {

        fetch(API_URL)
            .then(res => res.json())
            .then(data => {

                const temp = data.temp;
                setForecast(data.weather + ', ' + temp + '°F');
                const msg = "How about a drink to ";
                if (temp > 80) {
                    setRec(msg + "cool you down?");
                } else if (temp > 70) {
                    setRec(msg + "keep you cool?");
                } else {
                    setRec(msg + "warm you up?");
                }

            })
            .catch(err => console.log(err));
    }, []);

    return (
        <div className={styles.startBody}>
            <p className={styles.welcomeMsg}> {forecast} <br/> {rec} </p>
            <Link to='/order-kiosk'>
                <div className={styles.logoContainer}>
                    <img src={logo} alt="ShareTea Logo" className="logo"/>
                </div>
                <p className={styles.startTitle}> Tap to Start Order </p>
            </Link>
        </div>
    )
}