import { useState, useEffect } from 'react';
import '../styles/managerInventory.css';
import '../styles/layout.css';
import Modal from '../components/modal';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL;

export default function ManagerMenu() {

    const [menu, setMenu] = useState([]);
    const [disableButton, setDisableButton] = useState(false);
    const [loading, setLoading] = useState(true);

    const [modalMode, setModalMode] = useState('');
    const [itemName, setItemName] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');
    const [isTopping, setIsTopping] = useState(false);

    useEffect(() => {
        loadInventory();
    }, [])

    const loadInventory = () => {
        setLoading(true);
        fetch(API_URL + 'menu/get', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => setInventory(r ? r.result ? r.result : [] : []))
            .catch((e) => {
                console.log(e);
            })
            .finally(() => setLoading(false))
    }

    const closeModal = () => {
        setModalMode('');
        setItemName('');
        setItemQuantity('');
        setIsTopping(false);
    }

    // Function used for taking data from the form and then calling the specified api
    // Uses the modalMode to determine which api to call
    // Uses other state values to pass data to backend
    const handleSubmit = e => {
        e.preventDefault();

        setDisableButton(true);

        let url = API_URL + 'inventory/';
        let data = {};

        if (modalMode === 'add') {
            url += 'add';
            data = {
                name: itemName,
                quantity: parseInt(itemQuantity),
                is_topping: isTopping
            }
        }
        else if (modalMode === 'delete') {
            url += 'delete'
            data = {
                name: itemName
            }
        }
        else if (modalMode === 'edit') {
            url += 'edit'
            data = {
                name: itemName,
                quantity: parseInt(itemQuantity)
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
                .finally( () => {
                    closeModal();
                    loadInventory();
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

    const runFillRate = () => {
        setDisableButton(true);

        fetch(API_URL + 'inventory?fillUpdate=false', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            }
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
            .catch(e => console.log(e));

        loadInventory();
        setDisableButton(false);
    }

    return (
        <div className="manager-inventory-page">
            <div className="header">
                <h1>Inventory Levels</h1>
                <div className='action-buttons'>
                    <button onClick={addItem} disabled={disableButton} className="add-button">Add</button>
                    <button onClick={deleteItem} disabled={disableButton} className="delete-button">Delete</button>
                    <button onClick={editItem} disabled={disableButton} className="edit-button">Edit</button>
                    <button onClick={runFillRate} disabled={disableButton} className="refresh-button">&#8634;</button>
                </div>
            </div>
            {loading ?
                <p>Loading Inventory...</p> :
                <div className='table-container'>
                    <table>
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Quantity</th>
                                <th>Rec. Fill Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item, idx) =>
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity} {item.unit}</td>
                                    <td>{item.fill_rate} {item.unit}/wk</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            }

            <Modal
                isOpen={modalMode !== ''}
                title={modalMode.charAt(0).toUpperCase() + modalMode.slice(1) + " Inventory Item"}
                onClose={closeModal}
            >
                <form onSubmit={handleSubmit} className='modal-form'>
                    <div>
                        <label htmlFor="item-name">Name:</label>
                        {modalMode === 'add' ? (
                            <input
                                type="text"
                                id="item-name"
                                placeholder='Item Name'
                                value={itemName}
                                onChange={e => setItemName(e.target.value)}
                                required
                            />
                        ) : (
                            <select
                                id="item-name"
                                value={itemName}
                                onChange={e => setItemName(e.target.value)}
                            >
                                <option value="">Select item</option>
                                {inventory.map(item => (
                                    <option key={item.name} value={item.name}>{item.name}</option>
                                ))}
                            </select>
                        )}

                        {(modalMode === 'add' || modalMode === 'edit') && (
                            <>
                                <label htmlFor="item-quantity">Quantity:</label>
                                <input
                                    type="number"
                                    id="item-quantity"
                                    placeholder='Enter quantity'
                                    value={itemQuantity}
                                    onChange={e => setItemQuantity(e.target.value)}
                                    required
                                />
                            </>
                        )}

                        {modalMode === 'add' && (
                            <>
                                <label htmlFor="item-topping">Topping:</label>
                                <input
                                    type="checkbox"
                                    id="item-topping"
                                    value={isTopping}
                                    onChange={e => setIsTopping(e.target.value)}
                                />
                            </>
                        )}

                        <button type='submit' disabled={disableButton}>
                            Submit
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}