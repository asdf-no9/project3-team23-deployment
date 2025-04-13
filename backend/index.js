
const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const cors = require('cors');
const crypto = require('crypto');
const { error } = require('console');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: { rejectUnauthorized: false }
});

process.on('SIGINT', function () {
    pool.end();
    console.log('good terminate');
    process.exit(0);
});


const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
});

/**
 * A local cache of tokens. Stores until API resets.
 * 
 * ENTRY FORMAT:
 * {
 *      UUID: {
 *          "creation_date": UTC Timestamp,
 *          "id": User ID,
 *          "manager": boolean, if they are or are not a manager
 *      },
 * }
 */
const token_cache = {

}

const LOGGED_IN_EMPLOYEE = 1;
const LOGGED_IN_MANAGER = 2;

/**
 * Ping and Check Authentication
 * *****************************
 * URI: /
 * 
 * NEEDS AUTH: no
 * PARAMETERS:
 *      token: the token to check if the current user is auth'd
 * 
 * RESPONSE
 * {
 *     "message": "Welcome!",
 *     "auth": boolean
 * }
 */
app.get('/', (req, res) => {
    const data = {
        message: "Welcome!",
        auth: req.query.token && token_cache[req.query.token] ? true : false
    }
    res.status(200).send(data);
});

/**
 * Login / Authenticate
 * ********************
 * URI: /login
 * 
 * NEEDS AUTH: no
 * PARAMETERS:
 *      firstname: the user's first name
 *      lastname: the user's last name
 *      password: the user's attempted password
 * 
 * RESPONSE
 * {
 *      "error": SQL Error, (optional)
 *      "success": boolean, 
 *      "token": UUID,
 *      "is_manager": boolean
 * }
 */
app.get('/login', (req, res) => {
    first_name = req.query.firstname
    last_name = req.query.lastname
    password = req.query.password

    if (first_name == null || last_name == null || password == null) {
        res.status(401).send({ success: false, error: "Incorrect or missing credentials." })
        return
    }

    pool.query('SELECT login($1, $2, $3);', [first_name, last_name, password])
        .then(result => {
            if (result.rowCount == 1 && result.rows[0]["login"] != -1) {
                // SUCCESS
                user_id = result.rows[0]["login"]

                // GET PERMISSIONS
                pool.query('SELECT is_manager FROM employees WHERE id = $1', [user_id])
                    .then(
                        result2 => {
                            if (result2.rowCount == 1) {
                                //SUCCESS
                                is_manager = result2.rows[0]["is_manager"]

                                new_token = crypto.randomUUID()
                                token_cache[new_token] =
                                {
                                    creation_date: new Date().getTime(),
                                    id: user_id,
                                    manager: is_manager
                                }
                                res.status(200).send({ success: true, token: new_token, manager: is_manager })
                                return
                            } else {
                                res.status(500).send({ success: false, error: "Server error 1." })
                                return
                            }
                        }
                    )
                    .catch(err => {
                        console.error(err)
                        res.status(500).send({ success: false, error: "Server error 2." })
                        return
                    })
            } else {
                //FAILED
                res.status(401).send({ success: false, error: "Incorrect or missing credentials." })
                return
            }
        }).catch(err => {
            console.error(err)
            res.status(500).send({ success: false, error: "Server error 3." })
            return
        });
});

/**
 * Logout
 * *****************
 * URI: /logout
 * 
 * NEEDS AUTH: yes
 * PARAMETERS: n/a
 * RESPONSE: 
 * {
 *      "error": misc. errors
 *      "success": boolean
 * }
 */
app.get('/logout', (req, res) => {
    if (!auth(req, res)) return

    pool.query('SELECT logout($1);', [token_cache[token].id])
        .then(() => {
            res.status(200).send({ success: true })
        })
        .catch(err => {
            console.error(err)
            res.status(500).send({ success: false, error: "Server error." })
        });

    token_cache[token] = null
})

/**
 * Get Menu
 * *******************
 * URI: /menu
 * 
 * NEEDS AUTH: no
 * PARAMETERS: n/a
 * 
 * RESPONSE: 
 * {
 *      error: error message, (optional)
 *      categories: [
 *          category_name: [
 *              {
 *                  "name": text
 *                  "price": int
 *                  "in_stock": boolean
 *              },
 *          ],
 *      ]
 * }
 */
app.get('/menu', (req, res) => {
    pool.query('SELECT * FROM menu;')
        .then((result) => {
            if (result.rowCount == 0) {
                result.status(500).send({ error: "Menu empty.", categories: [] })
                return
            }

            menu = {}

            for (let i in result.rows) {
                const row = result.rows[i]
                const cat_name_capital = capitalizeEveryWord(String(row["category"]).toLowerCase())

                // create empty list if category is new
                if (!menu[cat_name_capital])
                    menu[cat_name_capital] = []

                let price = currencyFormatter.format(row["price"] / 100000);

                menu[cat_name_capital].push({
                    id: row["id"],
                    name: row["name"],
                    price: price,
                    in_stock: row["in_stock"]
                })
            }

            res.status(200).send({ categories: menu })

        })
        .catch((err) => {
            console.error(err)
            res.status(500).send({ error: "Server error.", categories: [] })
        })
})

/**
 * Modify Menu
 * *******************
 * URI: /menu/edit
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 *      quantity: int
 * }
 * 
 * RESPONSE:
 * {
 *     name: text,
 *     price: float,
 * }
 *
 */
app.post('/menu/edit', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name, price } = req.body;
    price = parseFloat(price);

    if (typeof name != "string" || typeof price != "number") {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, price: price });
        return;
    }

    pool.query("UPDATE menu SET price = $1 WHERE name = $2", [price * 100_000, name])
        .then((result) => {
            if (result.rowCount < 1) {
                res.status(500).send({ error: "Menu item not found", name: name, price: price });
                return;
            }
            res.status(200).send({ name: name, price: price });
        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name, price: price });
        })
})

/**
 * Add Menu item
 * *******************
 * URI: /menu/add
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 *      price: float,
 *      option_hot
 * }
 * 
 * RESPONSE:
 * {
 *      name: text,
 *      price: float,
 *      in_stock: bool
 * }
 */
app.post('/menu/add', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name, category, price, option_hot } = req.body;
    price = parseFloat(price);
    option_hot = (option_hot === "true")

    if (typeof name != "string" || typeof category != "string" || typeof price != "number" || typeof option_hot != "boolean") {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, category: category, price: price, in_stock: null, option_hot: option_hot, ingredients: [] });
        return;
    }

    pool.query("INSERT INTO menu(name, category, price, in_stock, option_hot, ingredients) VALUES ($1, $2, $3, $4, $5, $6)", [name, category, price * 100_000, true, option_hot, []])
        .then((result) => {
            if (result.rowCount < 1) {
                res.status(500).send({ error: "Unable to add item", name: name, category: category, price: price, in_stock: null, option_hot: option_hot, ingredients: [] });
                return;
            }
            res.status(200).send({ name: name, category: category, price: price, in_stock: true, option_hot: option_hot, ingredients: [] });
        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name, category: category, price: price, in_stock: null, option_hot: option_hot, ingredients: [] });
        })
})

app.get('/menu/get', (req, res) => {
    pool.query("SELECT * FROM menu ORDER BY id ASC")
        .then((result) => {
            res.status(500).send({ result: result.rows });
        })
})

/**
 * Delete Menu Item
 * *******************
 * URI: /menu/edit
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 * }
 * 
 * RESPONSE:
 * {
 *     name: text,
 * }
 *
 */
app.post('/menu/delete', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name } = req.body;

    if (typeof name != "string") {
        res.status(500).send({ error: "Unable to delete, please check properties", name: name });
        return;
    }

    pool.query("DELETE FROM menu WHERE name = $1", [name])
        .then((result) => {
            if (result.rowCount < 1) {
                res.status(500).send({ error: "Menu item not found", name: name });
                return;
            }
            res.status(200).send({ name: name });
        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name });
        })
})

/**
 * Get Inventory
 * *******************
 * URI: /inventory
 * 
 * NEEDS AUTH: manager
 * PARAMETERS: 
 *      fillupdate: bool //whether or not to update the fillrate column before returning data
 * 
 * RESPONSE: 
 * {
 *      error: error message, (optional)
 *      inventory: [
 *          inventory_item: [
 *              {
 *                  "name": text,
 *                  "quantity": int,
 *                  "fill_rate": int,
 *                  "unit": text
 *              },
 *          ],
 *      ]
 * }
 */
app.get('/inventory', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let fillUpdate = req.query.fillUpdate || false;

    const getInventory = () => {
        pool.query('SELECT * FROM Inventory ORDER BY name;')
            .then((result) => {
                if (result.rowCount == 0) {
                    res.status(500).send({ error: "Inventory empty.", inventory: [] });
                    return;
                }

                inventory_items = [];

                for (let i in result.rows) {
                    const row = result.rows[i];
                    const inventory_name_capital = capitalizeEveryWord(String(row["name"]).toLowerCase());

                    inventory_items.push({
                        name: inventory_name_capital,
                        quantity: row["quantity"],
                        fill_rate: row["rec_fill_wk"],
                        unit: row["unit"]
                    });
                }

                res.status(200).send({ inventory: inventory_items });

            })
            .catch((err) => {
                console.error(err);
                res.status(500).send({ error: "Server error.", inventory: [] });
            })
    }

    if (!fillUpdate) {
        pool.query('SELECT update_rec_fill()')
            .then(() => {
                getInventory();
                fillUpdate = true;
            });
    }
    else {
        getInventory();
    }

})


/**
 * Modify Inventory
 * *******************
 * URI: /inventory/edit
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 *      quantity: int
 * }
 * 
 * RESPONSE:
 * {
 *     name: text,
 *     quantity: int,
 * }
 *
 */
app.post('/inventory/edit', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name, quantity } = req.body;
    quantity = parseInt(quantity);

    if (typeof name != "string" || typeof quantity != "number") {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, quantity: quantity });
        return;
    }

    pool.query("UPDATE inventory SET quantity = $1 WHERE name = $2", [quantity, name])
        .then((result) => {
            if (result.rowCount < 1) {
                res.status(500).send({ error: "Inventory item not found", name: name, quantity: quantity });
                return;
            }
            res.status(200).send({ name: name, quantity: quantity });
        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name, quantity: quantity });
        })
})

/**
 * Add Inventory item
 * *******************
 * URI: /inventory/add
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 *      quantity: int,
 *      isTopping: bool
 * }
 * 
 * RESPONSE:
 * {
 *      name: text,
 *      quantity: int,
 *      unit_base_consumption: int,
 *      req_fill_rate: int,
 *      is_topping: bool
 * }
 */
app.post('/inventory/add', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name, quantity } = req.body;
    quantity = parseInt(quantity);
    let is_topping = (req.query.is_topping === "true")

    if (typeof name != "string" || typeof quantity != "number" || typeof is_topping != "boolean") {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, quantity: quantity, unit_base_consumption: 1, req_fill_rate: 0, is_topping: is_topping });
        return;
    }

    pool.query("INSERT INTO Inventory(name, quantity, unit_base_consumption, req_fill_rate, is_topping) VALUES ($1, $2, $3, $4, $5)", [name, quantity, 1, 0, is_topping])
        .then((result) => {
            if (result.rowCount < 1) {
                res.status(500).send({ error: "Unable to add item", name: name, quantity: quantity, unit_base_consumption: 1, req_fill_rate: 0, is_topping: is_topping });
                return;
            }
            res.status(200).send({ name: name, quantity: quantity, unit_base_consumption: 1, req_fill_rate: 0, is_topping: is_topping });
        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name, quantity: quantity, unit_base_consumption: 1, req_fill_rate: 0, is_topping: is_topping });
        })


})

/**
 * Delete Inventory item
 * *******************
 * URI: /inventory/delete
 * 
 * NEEDS AUTH: manager
 * 
 * PARAMETERS: {
 *      name: string,
 * }
 * 
 * RESPONSE:
 * {
 *     name: string
 * }
 *
 */
app.post('/inventory/delete', (req, res) => {
    // if (!auth(req, res, LOGGED_IN_MANAGER)) return;    

    let { name } = req.body;

    if (typeof name != "string") {
        res.status(500).send({ error: "Unable to delete please check properties", name: name });
        return;
    }

    pool.query("DELETE FROM inventory WHERE name = $1", [name])
        .then((result) => {
            if (result.rowCount < 1) {
                console.log(result);
                res.status(500).send({ error: "Inventory item not found", name: name });
                return;
            }
            res.status(200).send({ name: name });

        })
        .catch((error) => {
            console.log(error);
            res.status(200).send({ error: "Server Error, check console", name: name });
        })


})

/**
 * Get Toppings
 * *******************
 * URI: /toppings
 * 
 * NEEDS AUTH: no
 * PARAMETERS: n/a
 * 
 * RESPONSE: 
 * {
 *      error: error msg (optional),
 *      toppings: [
 *           {
 *               "name": text
 *               "in_stock": boolean
 *           },
 *      ]
 * }
 */
app.get('/toppings', (req, res) => {
    pool.query('SELECT name, quantity, unit_base_consumption FROM inventory WHERE is_topping = true;')
        .then((result) => {
            if (result.rowCount == 0) {
                result.status(500).send({ error: "Topping list empty.", categories: [] })
                return
            }

            const toppings = []

            for (let i in result.rows) {
                const row = result.rows[i]

                toppings.push({
                    name: capitalizeEveryWord(row["name"]),
                    in_stock: row["quantity"] > row["unit_base_consumption"]
                })
            }

            res.status(200).send({ toppings: toppings })
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send({ error: "Server error.", toppings: [] })
        })
})

/**
 * Add To Order
 * *******************
 * Type: POST
 * URI: /order/add
 * 
 * NEEDS AUTH: no
 * PARAMETERS: {
 *      orderID: int,
 *      drinkID: int,
 *      sugarLvl: double,
 *      iceLvl: string ('Regular', 'Less', 'No')
 *      toppings: [string, ...]
 * }
 * 
 * RESPONSE: 
 * {
 *      error: error msg (optional),
 *      success: boolean,
 *      subtotal: string,
 *      subtotal_raw: int
 * }
 */
app.post('/order/add', (req, res) => {
    let { drinkID, sugarLvl, iceLvl, toppings } = req.body;
    if (drinkID == null || sugarLvl == null || iceLvl == null) {
        res.status(400).send({ success: false, error: "Invalid parameters." })
        return
    }

    const iceLvlString = iceLvl == '2' ? 'Regular' : iceLvl == '1' ? 'Less' : 'No';
    const drinkIDInt = parseInt(drinkID);
    const sugarLvlFloat = parseFloat(sugarLvl);

    if (drinkIDInt == null || sugarLvlFloat == null || (sugarLvl != 1 && sugarLvl != 0.8 && sugarLvl != 0.5 && sugarLvl != 0.3 && sugarLvl != 0)) {
        res.status(400).send({ success: false, error: "Invalid parameters." })
        return
    }

    pool.query("SELECT add_to_order($1, CAST($2 AS numeric), $3, $4);", [drinkIDInt, sugarLvl, iceLvlString, toppings])
        .then((response) => {
            if (response.rowCount != 1) {
                res.status(500).send({ success: false, error: "Server Error. No response." })
                return
            }

            const subtotal_big = parseInt(response.rows[0]["add_to_order"]);
            if (subtotal_big == null) {
                res.status(500).send({ success: false, error: "Server Error. Incorrect response." })
                return
            }

            let price = currencyFormatter.format(subtotal_big / 100000);

            res.status(200).send({ success: true, subtotal: price, subtotal_raw: subtotal_big });
        }).catch((err) => {
            res.status(500).send({ success: false, error: "Server Error." })
            console.log(err)
            return
        })
})

/**
 * Checkout
 * *******************
 * URI: /order/checkout
 * Type: POST
 * 
 * NEEDS AUTH: no
 * PARAMETERS: {
 *      orderID: int,
 * }
 * 
 * RESPONSE: 
 * {
 *      error: error msg (optional),
 *      success: boolean
 * }
 */
app.post('/order/checkout', (req, res) => {
    // let { } = req.query;
    pool.query('SELECT checkout($1);', [-1])
        .then((response) => {
            res.status(200).send({ success: true });
        }).catch((err) => {
            console.log(err);
            res.status(500).send({ error: "Server Error", success: false });
        })
})

function auth(req, res, level = LOGGED_IN_EMPLOYEE) {
    token = req.query.token

    if (token && token_cache[token])
        if (level == LOGGED_IN_EMPLOYEE || (level == LOGGED_IN_MANAGER && token_cache[token].manager))
            return true

    res.status(401).send({ success: false, error: "Not authenticated." })
    return false
}

/**
 * Capitalizes every first-letter of a word in a string.
 * @param {string} input The string to modify
 * @returns {string} The new string
 */
function capitalizeEveryWord(input) {
    return input
        .split(" ")
        .map(w => w ? w[0].toUpperCase() + w.slice(1) : "")
        .join(" ");
}

app.listen(port, () => {
    console.log(`Listening on port at http://localhost:${port}`);
});