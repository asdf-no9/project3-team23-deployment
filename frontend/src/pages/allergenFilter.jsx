import css_sheet from '../styles/allergenFilter.module.css';
import {useState, useEffect, useRef} from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL;

export default function AllergenFilter() {
    const mainRef = useRef(null);

    let stored = [];
    try {
        if (Cookies.get('allergens')) {
            stored = JSON.parse(decodeURIComponent(Cookies.get('allergens')));
        }
    } catch (err) {
        stored = [];
        console.log(err);
    }

    const [allergens, setAllergens] = useState(stored);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch(API_URL + 'ingredients')
            .then(res => res.json())
            .then(arr => {
                mainRef.current.scrollTo(0, 0);
                setIngredients(arr);
                setLoading(false);
            })
            .catch(err => { console.log(err); });
    }, []);

    useEffect(() => {
        Cookies.set('allergens', JSON.stringify(allergens), { expires: 7, path: '/', secure: true, sameSite: 'Strict' });
    }, [allergens]);

    const toggleAllergen = (ingr) => {
        setAllergens((current) => {
            return current.includes(ingr) ? current.filter((i) => i !== ingr) : [...current, ingr];
        });
    }

    const ingredientButtons = [];

    for (let i in ingredients) {
        const ingr = ingredients[i];
        let color = allergens.includes(ingr) ? "darkgray" : "gray";
        ingredientButtons.push(<button className={ css_sheet.optionbuttonitem + ' ' + color } onClick={ () => toggleAllergen(ingr) }>
            { ingr }
        </button >)
    }

    return (
        <div className={ css_sheet.layout }>
            <div className="mainBody" id="mainBody" ref={ mainRef }>
                <div id="scaler">
                    <div className='headerbar one'>
                        <h1> Edit Allergen Filter <span className='subtext'> Select all ingredients allergic to </span> </h1>
                        <hr className='phone'/>
                        <Link to="/order-kiosk">
                            <button className='darkgray backButton'> Back </button>
                        </Link>
                    </div >
                    <div className={ css_sheet.optionsgrid }>
                        <div> {
                                loading ? <p className='centeralign'> Loading... </p> :
                                <div className={ 'spacer' + css_sheet.optionbuttons }> { ingredientButtons } </div>
                        } </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
