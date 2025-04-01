
import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { useNavigate } from 'react-router-dom';

export default function StartOrder() {
    //This is for the page navigation
    const navigate = useNavigate();
    
    //Navigate to order kiosk upon action
    const handleStartOrder = () => {
        navigate('/order-kiosk');
    };

    return (
        <div>
            <div className="logoContainer">
                <img src={logo} alt="ShareTea Logo" className="logo" />
            </div>
            <p className="startTitle"> Tap to Start Order </p>
        </div>
        )   
}