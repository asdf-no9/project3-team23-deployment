import { Link } from 'react-router';
import {useState, useEffect } from 'react';
import '../styles/managerInventory.css';
import '../styles/layout.css'

const API_URL = import.meta.env.VITE_API_URL;

export default function ManagerInventory() {

    const [inventory, setInventory] = useState([]);
    const [disableButton, setDisableButton] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect( () => {
        setLoading(true);
        fetch(API_URL + 'inventory')
            .then((response) => response.json())
            .then((r) => setInventory(r.inventory))
            .catch((e) => {
                console.log(e);
            })
            .finally(() => setLoading(false))
    }, [])

    const addItem = () => {
        setDisableButton(true);
        console.log('Add Item');

        /**
         * TODO:
         * Create Modal / Popup Component to collect data
         * Create state value for showing modal
         * Call inventory/add with the data collected
         * 
         * Modal can take props such as
         * api call needed ex. inventory/add
         * information to collect for api call (maybe pass as array then call array.map() ?)
         */
        
        setDisableButton(false);
    }

    const deleteItem = () => {
        setDisableButton(true);
        console.log('Delete Item');
        setDisableButton(false);
    }

    const editItem = () => {
        setDisableButton(true);
        console.log('Edit Item');
        setDisableButton(false);
    }

    const runFillRate = () => {
        setDisableButton(true);
        console.log('Refresh fill Rate');
        setDisableButton(false);
    }

    return (
        <div className="manager-inventory-page">
            <div className="header">
                <h1>Inventory</h1>
                <div className='action-buttons'>
                    <button onClick={addItem} disabled={disableButton} className="add-button">Add</button>
                    <button onClick={deleteItem} disabled={disableButton} className="delete-button">Delete</button>
                    <button onClick={editItem} disabled={disableButton} className="edit-button">Edit</button>
                    <button onClick={runFillRate} disabled={disableButton} className="refresh-button">Refresh</button>
                </div>
            </div>
            {loading ? <p>Loading Inventory...</p> : <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Quantity</th>
                            <th>Rec. Fill Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item,idx) => 
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
        </div>
    )
}