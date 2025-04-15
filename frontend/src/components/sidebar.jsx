import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { useLocation, Link } from 'react-router-dom';
import { useHighContrast } from '../context/highContrast.jsx'; // Correct import

export default function Sidebar() {
    const { isHighContrast, toggleTheme } = useHighContrast(); // Correct hook usage
    const path = useLocation().pathname.split('/');
    const selectedCategory = path.length > 2 ? path[2] : "";

    return (
        <div className="sidebarContent">
            <div className="sidebarlogocontainer">
                <Link to="/" >
                    <img src={logo} alt="ShareTea Logo" className="logo" />
                </Link>
            </div>
            <div className="accessibleFeatures">
                <button className="language">Language</button>
                <button className="highContrast" onClick={toggleTheme}>
                    {isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
                </button>
                <Link to='/login'><button className="highContrast">Login</button></Link>
            </div>
        </div>
    );
}

//Category button component
function CatButton(props) {
    return (
        <Link to={'/order-kiosk/' + props.category}>
            <button
                className={props.selectedCategory === props.category ? "darkgray" : "white"}
            >
                {props.displayName}
            </button>
        </Link>
    );
}