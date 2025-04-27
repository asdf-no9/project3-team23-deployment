
import styles from '../styles/startOrder.module.css';
import logo from '../assets/ShareTeaLogo.png';
import { Link } from 'react-router';

/**
 * This component renders the initial order screen for the kiosk.
 * It prompts the user to start their order by interacting with the screen.
 * @returns startOrder component
 * @author Antony Quach
 */

export default function StartOrder() {
    return (
        <div className={styles.startBody}>
            <Link to='/order-kiosk'>
                <div className={styles.logoContainer}>
                    <img src={logo} alt="ShareTea Logo" className="logo" />
                </div>
                <p className={styles.startTitle} > Tap to Start Order </p>
            </Link >
        </div >
    )
}