
import { useState } from 'react';
import '../styles/layout.css';
import '../styles/login.css'
import { Link } from 'react-router';
import Cookies from 'js-cookie';

/**
 *This component renders the login screen for the kiosk.
 *@returns Login component
 *@author Elliot Michlin
 */

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {

    const [loginStatus, setLoginStatus] = useState("");

    /**
     * Submits login information to the API and adds a token to cookies if successful
     * @param {*} event The form event that triggers on submit
     */
    const interactionLoginSubmit = (event) => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch(API_URL + 'login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
                    Cookies.remove('token')
                    Cookies.set('token', response.token, { expires: 7, secure: true, sameSite: 'Strict' });
                }
            })
            .catch((err) => {
                console.log(err);
                setLoginStatus("Sorry, an error occurred. Please try again.");
            })
    }

    return (
        <div className="mainBody" id="mainBody">
            <div id='scaler' className='left'>
                <div className='headerbar'>
                    <h1>Login</h1>
                </div>
                <div className='mainContent'>
                    <form onSubmit={(event) => interactionLoginSubmit(event)}>
                        <div>
                            <h2 className='h3'>Username</h2>
                            <input type="text" id="username" name="username" minlength="2" required />
                        </div>
                        <div>
                            <h2 className='h3'>Password</h2>
                            <input type="password" id="password" name="password" minlength="2" required />
                        </div>
                        <p className='error'>{loginStatus}</p>
                        <button className='blue' id="submit" type="submit">Sign In</button>
                    </form>
                </div>
            </div>
        </div>
    )
}