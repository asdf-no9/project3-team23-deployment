import '../styles/layout.css';
import logo from '../assets/ShareTeaLogo.png';
import { useLocation, Link } from 'react-router-dom';

export default function Sidebar() {

    const path = useLocation().pathname.split('/');
    const selectedCategory = path.length > 2 ? path[2] : "";

    return (
        <div>
            <div className="sidebarContent">
                <div className='sidebarlogocontainer'>
                    <Link to="/">
                        <img src={logo} alt="ShareTea Logo" className="logo" />
                    </Link>
                </div>
                <div className="buttonContainer" style={{ visibility: location.pathname == "/" ? 'hidden' : 'visible' }}>
                    <CatButton category="drinks" displayName="Drinks" selectedCategory={selectedCategory} />
                    <CatButton category="ice-cream" displayName="Ice Cream" selectedCategory={selectedCategory} />
                    <CatButton category="food" displayName="Food" selectedCategory={selectedCategory} />
                    <CatButton category="specialty" displayName="Special Items" selectedCategory={selectedCategory} />
                </div>
                <div className="accessibleFeatures">
                    <div></div>
                    <button className="language">Language</button>
                    <button className="highContrast">High-Contrast Theme</button>
                    <button className="highContrast">Login</button>
                </div>
            </div>
        </div>
    )
}

function CatButton(props) {
    return (<Link to={'/order-kiosk/' + props.category}><button className={props.selectedCategory == props.category ? "darkgray" : "white"}>{props.displayName}</button></Link>)
}