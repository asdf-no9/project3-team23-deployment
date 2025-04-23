
import { useState } from 'react';
import '../styles/layout.css';
import '../styles/login.css'
import { Link, useNavigate } from 'react-router';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ loginInfo, logIn, logOut }) {

    const [loginStatus, setLoginStatus] = useState("");

    const navigate = useNavigate();

    const interactionLoginSubmit = (event) => {
        event.preventDefault();

        if (!loginInfo.isLoggedIn) {

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
                        // console.log(response)
                        logIn(username, response.manager, response.id, response.token);
                        navigate('/');
                        return;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setLoginStatus("Sorry, an error occurred. Please try again.");
                })
        } else {
            // If the user is already logged in, log them out
            logOut();
            setLoginStatus("You have been logged out successfully.");
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        }
    }

    return (
        <div className="mainBody" id="mainBody">
            <div id='scaler' className='left'>
                <div className='headerbar'>
                    <h1>{!loginInfo.isLoggedIn ? "Login" : "Logout"}</h1>
                </div>
                <div className='mainContent'>
                    <form onSubmit={(event) => interactionLoginSubmit(event)}>
                        {!loginInfo.isLoggedIn ?
                            <>
                                <div>
                                    <h2 className='h3'>Username</h2>
                                    <input type="text" id="username" name="username" minlength="2" required />
                                </div>
                                <div>
                                    <h2 className='h3'>Password</h2>
                                    <input type="password" id="password" name="password" minlength="2" required />
                                </div>
                            </> : <></>
                        }
                        <p className='error'>{loginStatus}</p>
                        <button className='blue' id="submit" type="submit">{!loginInfo.isLoggedIn ? "Sign In" : "Sign Out"}</button>
                    </form>
                </div>
            </div>
        </div>
    )
}