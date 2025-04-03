import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';

export default function Sidebar() {
    return (
        <div>
            <div className="sidebarContent">
                <div className="logoContainer">
                    <img src={logo} alt="ShareTea Logo" className="logo" />
                </div>
                <div className = "buttonContainer">
                    <button className="drinks">Drinks</button>
                    <button className="iceCream">Ice Cream</button>
                    <button className="food">Food</button>
                    <button className="specialItems">Special Items</button>
                </div>

                <div className = "accessibleFeatures">
                    <button className="language">Language</button>
                    <button className="highContrast">High-Contrast Theme</button>
                    <button className="food">Food</button>
                    <button className="specialItems">Special Items</button>
                </div>
            </div>
        </div>
    )
}