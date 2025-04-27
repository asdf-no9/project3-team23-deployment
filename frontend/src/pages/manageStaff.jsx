import { useState, useEffect, useRef } from 'react';
import styles from '../styles/managerInventory.module.css';
import Modal from '../components/modal';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL;

export default function ManagerStaff() {

    const mainRef = useRef(null);

    const [staffList, setStaffList] = useState([]);
    const [disableButton, setDisableButton] = useState(false);
    const [loading, setLoading] = useState(true);

    const [modalMode, setModalMode] = useState('');
    const [fullName, setFullName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isManager, setIsManager] = useState(false);

    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        mainRef.current.scrollTo(0, 0);
        loadStaffList();
    }, [])

    const loadStaffList = () => {
        setLoading(true);
        fetch(API_URL + 'staff/get', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => setStaffList(r ? r.result ? r.result : [] : []))
            .catch((e) => {
                console.log(e);
            })
            .finally(() => setLoading(false))
    }

    const closeModal = () => {
        setModalMode('');
        setFullName('');
        setIsManager(false);
    }

    // Function used for taking data from the form and then calling the specified api
    // Uses the modalMode to determine which api to call
    // Uses other state values to pass data to backend
    const handleSubmit = e => {
        e.preventDefault();

        setDisableButton(true);

        let url = API_URL + 'staff/';
        let data = {};

        if (modalMode === 'add') {
            url += 'add';
            data = {
                first_name: firstName,
                last_name: lastName,
                is_manager: isManager
            }
        }
        else if (modalMode === 'delete') {
            url += 'delete'
            data = {
                name: fullName
            }
        }
        else if (modalMode === 'edit') {
            url += 'edit'
            data = {
                name: fullName,
                is_manager: isManager
            }
        }

        try {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
                },
                body: JSON.stringify(data)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error("server error: ", text);
                            throw new Error(`Server returned ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then((r) => console.log(r))
                .finally(() => {
                    closeModal();
                    loadStaffList();
                })
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setDisableButton(false);
        }
    }

    const addItem = () => {
        setDisableButton(true);
        setModalMode("add");
        setDisableButton(false);
    }

    const deleteItem = () => {

        setDisableButton(true);
        setModalMode("delete");
        setDisableButton(false);
    }

    const editItem = () => {

        setDisableButton(true);
        setModalMode("edit");
        setDisableButton(false);
    }


    return (
        <div className="mainBody" ref={mainRef} id="mainBody">
            <div id='scaler'>
                <div className={styles.page}>
                    <div className="headerbar phoneflip header">
                        <h1>Manage Staff</h1>
                        <hr className='phone' />
                        <div></div>
                        <div className={styles.actionbuttons}>
                            <button onClick={addItem} disabled={disableButton} className="blue">Add</button>
                            <button onClick={deleteItem} disabled={disableButton} className={/*selectedRow === null ? "black" : */"red"}>Delete</button>
                            <button onClick={editItem} disabled={disableButton} className={/*selectedRow === null ? "black" : */"third"}>Edit Roles</button>
                        </div>
                    </div>
                    {loading ?
                        <p>Loading Staff List...</p> :
                        <div className={styles.tablecontainer}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th>Role</th>
                                        <th>Last Logged In</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((item, idx) =>
                                        <tr key={idx} onClick={() => setSelectedRow(idx)} className={selectedRow === idx ? styles.selected : ''}>
                                            <td>{item.first_name + " " + item.last_name}</td>
                                            <td>{item.id}</td>
                                            <td>{item.is_manager ? "Manager" : "Employee"}</td>
                                            <td>{item.last_login}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>
            <Modal
                isOpen={modalMode !== ''}
                title={modalMode.charAt(0).toUpperCase() + modalMode.slice(1) + " Staff"}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit} className='modal-form'>
                    <div>

                        {modalMode === 'add' ? (
                            <>
                                <label htmlFor="first-name">First Name:</label>
                                <input
                                    type="text"
                                    id="first-name"
                                    placeholder='First Name'
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    required
                                />
                                <label htmlFor="last-name">Last Name:</label>
                                <input
                                    type="text"
                                    id="last-name"
                                    placeholder='Last Name'
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    required
                                />
                            </>
                        ) : (
                            <>
                                <label htmlFor="name">Name:</label>
                                <select
                                    id="name"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                >
                                    <option value="">Select name</option>
                                    {staffList.map((item, idx) => (
                                        <option key={idx} value={item.first_name + " " + item.last_name}>{item.first_name + " " + item.last_name}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {(modalMode === 'add' || modalMode === 'edit') ? (
                            <>
                                <label htmlFor="item-manager">Manager:</label>
                                <input
                                    type="checkbox"
                                    id="item-manager"
                                    value={isManager}
                                    onChange={e => setIsManager(e.target.value)}
                                />
                            </>
                        ) : <></>}

                        <button type='submit' className='blue' disabled={disableButton}>
                            Submit
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}