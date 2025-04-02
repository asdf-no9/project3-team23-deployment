
import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { Link } from 'react-router';

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