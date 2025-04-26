
import '../styles/layout.css';
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
        <div className="startBody">
            <Link to='/order-kiosk'>
                <div className="logoContainer">
                    <img src={logo} alt="ShareTea Logo" className="logo" />
                </div>
                <p className="startTitle"> Tap to Start Order </p>
            </Link>
        </div>
    )
}