
import { useState } from 'react';
import loginStyles from '../styles/login.module.css'
import { Link, useNavigate } from 'react-router';
import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import fb_app from '../firebase';

/**
 *This component renders the login screen for the kiosk.
 *@returns Login component
 *@author Elliot Michlin
 */

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ loginInfo, logIn, logOut }) {

    const [loginStatus, setLoginStatus] = useState("");
    const navigate = useNavigate();

    const { t } = useTranslation('common'); //For i18n translation

    /**
     * Submits login information to the API and adds a token to cookies if successful
     * @param {*} event The form event that triggers on submit
     */
    const interactionLoginSubmit = (event) => {
        event.preventDefault();

        if (!loginInfo.isLoggedIn) {

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            fetch(API_URL + 'login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'language': Cookies.get('language') ? Cookies.get('language') : "en"
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => response.json())
                .then((response) => {
                    if (response.error) {
                        setLoginStatus(response.error);
                        return;
                    } else {
                        setLoginStatus("");
                        // console.log(response)
                        const fb_auth = getAuth(fb_app);
                        signInWithCustomToken(fb_auth, response.token)
                            .then(() => {
                                logIn(username, response.manager, response.id, response.token);
                                navigate('/');
                            })
                            .catch((err) => {
                                console.log(err);
                                setLoginStatus(t('errorOccurred'));
                            })
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setLoginStatus(t('errorOccurred'));
                })
        } else {
            // If the user is already logged in, log them out
            logOut();
            setLoginStatus(t('logoutSuccess'));
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }
    }

    return (
        <div className="mainBody" id="mainBody">
            <div id='scaler' className='left'>
                <div className="headerbar">
                    <h1>{!loginInfo.isLoggedIn ? t('sidebar.login') : t('sidebar.logout')}</h1>
                </div>
                <div className='mainContent'>
                    <form className={loginStyles.login} onSubmit={(event) => interactionLoginSubmit(event)}>
                        {!loginInfo.isLoggedIn ?
                            <>
                                <div>
                                    <h2 className={loginStyles.h3}>{t('username')}</h2>
                                    <input type="text" id="username" name="username" minLength="2" required />
                                </div>
                                <div>
                                    <h2 className={loginStyles.h3}>{t('password')}</h2>
                                    <input type="password" id="password" name="password" minLength="2" required />
                                </div>
                            </> : <></>
                        }
                        <p className={loginStyles.error}>{loginStatus}</p>
                        <button className='blue' id="submit" type="submit">
                            {!loginInfo.isLoggedIn ?
                                <><i class="fa-solid fa-arrow-right-to-bracket"></i> {t('signin')}</> :
                                <><i class="fa-solid fa-arrow-right-from-bracket"></i> {t('signout')}</>}</button>
                    </form>
                </div>
            </div>
        </div>
    )
}