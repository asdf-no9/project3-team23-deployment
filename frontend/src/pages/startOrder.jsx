
import '../styles/layout.css'
import logo from '../assets/ShareTeaLogo.png';

export default function startOrder() {
    //This is for the page navigation
    
    
    return (
        <div>
            <div className="logoContainer">
                <img src={logo} alt="Logo" className="logo" />
                <p className="startTitle"> Tap to Start Order </p>
            </div>
        </div>
        )   
}