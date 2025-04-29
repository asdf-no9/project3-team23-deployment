import { useState, useEffect, useRef } from 'react';
import styles from '../styles/managerInventory.module.css';
import Modal from '../components/modal';
import Cookies from 'js-cookie';
import { currencyFormatter, capitalizeEveryWord } from '../main';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Used to display the manager menu
 * Used for adding, deleting, and editing menu itesm
 * Only accessible by managers
 * @author Brayden Bailey
 * @returns ManagerMenu component
 */
export default function ManagerMenu() {

    const mainRef = useRef(null);

    const [menu, setMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [disableButton, setDisableButton] = useState(false);
    const [loading, setLoading] = useState(false);

    const [modalMode, setModalMode] = useState('');
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [isHotItem, setIsHotItem] = useState(false);
    const [itemCategory, setItemCategory] = useState('');
    const [itemIngredients, setItemIngredients] = useState([]);

    const [selectedRow, setSelectedRow] = useState(null);

    useEffect(() => {
        mainRef.current.scrollTo(0, 0);
        loadMenu();
    }, [])

    /**
     * Loads menu information from the database. Is displayed directly into an HTML table.
     */
    const loadMenu = () => {
        setLoading(true);
        fetch(API_URL + 'menu/get', {
            headers: {
                'Authorization': Cookies.get('token') ? 'Bearer ' + Cookies.get('token') : '',
            },
        })
            .then((response) => response.json())
            .then((r) => {
                setMenu(r ? r.result ? r.result : [] : [])
                if (r && r.result) {
                    setCategories(Array.from(new Set(r.result.map(item => item.category))));
                }

                fetch(API_URL + 'inventory', {
                    headers: {
                        'Authorization': Cookies
                            .get('token') ? 'Bearer ' + Cookies.get('token') : '',
                    }
                }).then((r2) => r2.json())
                    .then((r3) => {
                        setIngredients(r3 ? r3.inventory ? r3.inventory.map((item) => item.name) : [] : [])
                    })
                    .catch((e) => {
                        console.log(e);
                    })
                    .finally(() => setLoading(false))
            }
            ).catch((e) => {
                console.log(e);
            })
    }

    /**
     * Closes the modal
     */
    const closeModal = () => {
        setModalMode('');
        setItemName('');
        setItemPrice('');
        setIsHotItem(false);
        setItemCategory('');
    }

    // Function used for taking data from the form and then calling the specified api
    // Uses the modalMode to determine which api to call
    // Uses other state values to pass data to backend
    const handleSubmit = e => {
        e.preventDefault();

        setDisableButton(true);

        let url = API_URL + 'menu/';
        let data = {};

        if (modalMode === 'add') {
            url += 'add';
            data = {
                name: itemName,
                category: itemCategory,
                price: parseFloat(itemPrice),
                option_hot: isHotItem,
                ingredients: itemIngredients
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
                price: parseFloat(itemPrice)
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
                    loadMenu();
                })
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setDisableButton(false);
        }
    }

    /**
     * Inits the add item modal
     */
    const addItem = () => {
        setDisableButton(true);
        setModalMode("add");
        setDisableButton(false);
    }

    /**
     * Inits the delete item modal
     */
    const deleteItem = () => {
        setDisableButton(true);
        setModalMode("delete");
        setDisableButton(false);
    }

    /**
     * Inits the edit item modal
     */
    const editItem = () => {
        setDisableButton(true);
        setModalMode("edit");
        setDisableButton(false);
    }

    /**
     * Handles the multi-select field for ingrediants when adding a new drink
     * This stores all the current ingrediant choices in the state
     * @param {*} e 
     */
    const handleSelectChange = (e) => {
        const options = e.target.options;
        const list = [];
        for (let i in options) {
            if (options[i].selected) {
                list.push(options[i].value);
            }
        }

        setItemIngredients(list);
    }

    return (
        <div className="mainBody" ref={mainRef} id="mainBody">
            <div id='scaler'>
                <div className={styles.page}>
                    <div className="headerbar phoneflip header">
                        <h1>Menu Levels</h1>
                        <hr className='phone' />
                        <div></div>
                        <div className={styles.actionbuttons}>
                            <button onClick={addItem} disabled={disableButton} className="blue">Add</button>
                            <button onClick={deleteItem} disabled={disableButton} className={/*selectedRow === null ? "black" : */"red"}>Delete</button>
                            <button onClick={editItem} disabled={disableButton} className={/*selectedRow === null ? "black" : */"third"}>Edit</button>
                        </div>
                    </div>
                    {loading ?
                        <p>Loading Menu...</p> :
                        <div className={styles.tablecontainer}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Item Category</th>
                                        <th>Price</th>
                                        <th>Hot Item</th>
                                        <th>In Stock</th>
                                        <th>Ingredients</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {menu.map((item, idx) =>
                                        <tr key={idx} onClick={() => setSelectedRow(idx)} className={selectedRow === idx ? styles.selected : ''}>
                                            <td>{item.name}</td>
                                            <td>{item.category}</td>
                                            <td>{currencyFormatter.format(item.price / 100000)}</td>
                                            <td>{item.option_hot ? "True" : "False"}</td>
                                            <td>{item.in_stock ? "True" : <b>False</b>}</td>
                                            <td>{item.ingredients ? capitalizeEveryWord(item.ingredients.join(", ")) : "None Listed"}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    }

                    <Modal
                        isOpen={modalMode !== ''}
                        title={modalMode.charAt(0).toUpperCase() + modalMode.slice(1) + " Menu Item"}
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
                                        {menu.map(item => (
                                            <option key={item.name} value={item.name}>{item.name}</option>
                                        ))}
                                    </select>
                                )}

                                {(modalMode === 'add' || modalMode === 'edit') && (
                                    <>
                                        <label htmlFor="item-price">Price:</label>
                                        <input
                                            type="number"
                                            id="item-price"
                                            placeholder='Enter price'
                                            value={itemPrice}
                                            step='0.01'
                                            onChange={e => setItemPrice(e.target.value)}
                                            required
                                        />
                                    </>
                                )}

                                {modalMode === 'add' && (
                                    <>
                                        <label htmlFor="item-category">Category (case sensitive)</label>
                                        <input
                                            type="text"
                                            id="item-category"
                                            placeholder='Item Category'
                                            value={itemCategory}
                                            onChange={e => setItemCategory(e.target.value)}
                                            required
                                            list="categories"
                                            autoComplete='off'
                                        />
                                        <datalist id="categories">
                                            {
                                                categories.map((item) => (
                                                    <option value={item}></option>
                                                ))
                                            }
                                        </datalist>
                                        <label htmlFor="item-hot-item">Hot Item:</label>
                                        <div className={styles.checkboxholder}>
                                            <input
                                                type="checkbox"
                                                id="item-hot-item"
                                                checked={isHotItem}
                                                onChange={e => setIsHotItem(e.target.checked)}
                                            />
                                        </div>
                                        <label htmlFor="ingredients">Ingredients (select all):</label>
                                        <select
                                            multiple
                                            type="text"
                                            id="ingredients"
                                            // value={itemCategory}
                                            onChange={e => handleSelectChange(e)}
                                        >
                                            {
                                                ingredients.map((item, idx) => (
                                                    <option key={idx} value={item} className={itemIngredients.includes(item) ? "blue" : ""}>{item}</option>
                                                ))
                                            }
                                        </select>
                                    </>
                                )}

                                <button type='submit' className="blue" disabled={disableButton}>
                                    Submit
                                </button>
                            </div>
                        </form>
                    </Modal>
                </div>
            </div>
        </div>
    )
}