import css_sheet from '../styles/allergenFilter.module.css';
import manager_style from '../styles/managerInventory.module.css'
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { capitalizeEveryWord } from '../main.jsx';
import { useTranslation } from 'react-i18next';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Component render and logic for an allergen filter that users can customize to remove menu items
 * from the drink selection that contain ingredients they are allergic to/do not wish to consume
 * @param stateLang     state monitor to trigger refresh on language change
 * @param backButton    function trigger to switch to homepage
 * @returns {JSX.Element}   AllergenFilter component HTML to render on webpage
 * @constructor
 */
export default function AllergenFilter({ stateLang, backButton }) {
    // const mainRef = useRef(null);
    const tabRef = useRef(null);
    const { t } = useTranslation('common'); //For i18n translation
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

    /**
     * Refresh hook on language cookie change
     */
    useEffect(() => {
        tabRef.current?.focus()
        fetch(API_URL + 'ingredients', {
            headers: {
                'language': Cookies.get('language') ? Cookies.get('language') : "en"
            }
        })
            .then(res => res.json())
            .then(arr => {
                // mainRef.current.scrollTo(0, 0);
                setIngredients(arr);
                setLoading(false);
            })
            .catch(err => { console.log(err); });
    }, [stateLang]);

    /**
     * Update cookie hook on allergen selection change
     */
    useEffect(() => {

        Cookies.set('allergens', JSON.stringify(allergens), { expires: 7, path: '/', secure: true, sameSite: 'Strict' });
    }, [allergens]);

    /**
     * Adds the allergen to the filter on select/removes on unselect
     * @param ingr  allergen to toggle
     */
    const toggleAllergen = (ingr) => {
        setAllergens((current) => {
            return current.includes(ingr) ? current.filter((i) => i !== ingr) : [...current, ingr];
        });
    }

    const ingredientButtons = [];

    for (let i in ingredients) {
        const ingr = ingredients[i];
        let color = allergens.includes(ingr) ? "darkgray" : "gray";
        ingredientButtons.push(<button className={css_sheet.optionbuttonitem + ' ' + color} onClick={() => toggleAllergen(ingr)}>
            {capitalizeEveryWord(ingr)}
        </button >)
    }

    return (
        // <div className={css_sheet.layout}>
        //     <div className="mainBody" id="mainBody" ref={mainRef}>
        //         <div id="scaler">
        <>
            <div className='headerbar'>
                <div>
                    <h1> {t('orderKiosk.editAllergenFilter')}</h1>
                    <h2 className='h3 subtext'> {t('orderKiosk.selectAllAlergicTo')} </h2>
                </div>

                <hr className='phone' />
                <div></div>
                <div className={manager_style.actionbuttons}>
                    <Link to="/"><button tabIndex={-1} className='blue'> {t('orderKiosk.applyAndRestart')} </button></Link>
                    <button onClick={backButton} className='darkgray'> {t('orderKiosk.back')} </button>
                </div>
            </div >
            <div className={css_sheet.optionsgrid}>
                <div> {
                    loading ? <p className='centeralign'> {t('orderKiosk.loading')} </p> :
                        <div className={'spacer ' + css_sheet.optionbuttons}> {ingredientButtons} </div>
                } </div>
            </div>
        </>
        //         </div>
        //     </div>
        // </div>
    );
}
