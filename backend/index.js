
const express = require('express');
const { Pool } = require('pg');
const format = require('pg-format');
const dotenv = require('dotenv').config();
const cors = require('cors');
const crypto = require('crypto');
const { error } = require('console');
const bodyParser = require('body-parser');
const { formatInTimeZone } = require('date-fns-tz');

const fs = require('fs');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ACC))
});
const { translateText } = require('./geminiService');
const translationCache = {}; //Store translations in a cache or dictionary

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

const getCentralTime = () => {
    const date = new Date();
    return formatInTimeZone(date, 'America/Chicago', 'yyyy-MM-dd');
}

let weather_cache = {
    last_temp: null,
    last_weather: null,
    last_icon: null,
    last_update: 0
};

/**
 * A local cache of tokens. Stores until API resets.
 * 
 * ENTRY FORMAT:
 * {
 *      UUID: {
 *          "creation_date": UTC Timestamp,
 *          "username": username,
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
 *     "username: string,
 *     "auth": boolean,
 *     "id": int,
 * }
 */
app.get('/', async (req, res) => {

    let authCode = 0;
    let username = 'Self-Serve Kiosk'
    let id = -1;

    if (req.query.token && token_cache[req.query.token]) {
        username = token_cache[req.query.token].username.join(" ");
        id = token_cache[req.query.token].id;
        if (token_cache[req.query.token].manager)
            authCode = 2;
        else
            authCode = 1;
    }

    const data = {
        message: "Welcome!",
        username: username,
        auth: authCode,
        id: id,
        temp: weather_cache.last_temp,
        weather: await translate(weather_cache.last_weather, req.header('Language'))
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
 *      username: the user's username
 *      password: the user's attempted password
 * 
 * RESPONSE
 * {
 *      "error": SQL Error, (optional)
 *      "success": boolean, 
 *      "token": UUID,
 *      "is_manager": boolean,
 *      "id": the employee ID
 * }
 */
app.post('/login', async (req, res) => {

    if (!req.body) {
        res.status(401).send({ success: false, error: await translate("Incorrect or missing credentials.") })
        return
    }

    let { username, password } = req.body; // Use body-parser to get the body of the request

    if (username == undefined || username == null || password == null || password == undefined || String(username).split(" ").length != 2) {
        res.status(401).send({ success: false, error: await translate("Incorrect or missing credentials.") })
        return
    }

    username = String(username).split(" ");
    let first_name = username[0];
    let last_name = username[1];

    pool.query('SELECT login($1, $2, $3);', [first_name, last_name, password])
        .then(async (result) => {
            if (result.rowCount == 1 && result.rows[0]["login"] != -1) {
                // SUCCESS
                user_id = result.rows[0]["login"]

                // GET PERMISSIONS
                pool.query('SELECT is_manager FROM employees WHERE id = $1', [user_id])
                    .then(
                        async (result2) => {
                            if (result2.rowCount == 1) {
                                //SUCCESS
                                is_manager = result2.rows[0]["is_manager"]

                                admin.auth().createCustomToken(user_id.toString())
                                    .then(async (customToken) => {
                                        token_cache[customToken] =
                                        {
                                            creation_date: new Date().getTime(),
                                            id: user_id,
                                            manager: is_manager,
                                            username: username
                                        }
                                        res.status(200).send({ success: true, token: customToken, id: user_id, manager: is_manager })
                                    })
                                    .catch(async (err) => {
                                        console.error(err)
                                        res.status(500).send({ success: false, error: await translate("Server error.") })
                                    })

                            } else {
                                res.status(500).send({ success: false, error: await translate("Server error.") })
                                return
                            }
                        }
                    )
                    .catch(async (err) => {
                        console.error(err)
                        res.status(500).send({ success: false, error: await translate("Server error.") })
                        return
                    })
            } else {
                //FAILED
                res.status(401).send({ success: false, error: await translate("Incorrect or missing credentials.") })
                return
            }
        }).catch(async (err) => {
            console.error(err)
            res.status(500).send({ success: false, error: await translate("Server error.") })
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
app.get('/menu', async (req, res) => {
    let allergens = [];
    try {
        let header = req.header('Filter');
        if (header) {
            allergens = JSON.parse(decodeURIComponent(header));
        }
    } catch (err) {
        allergens = [];
        console.error(err);
    }
    let ordered_query = 'SELECT * FROM menu WHERE NOT (ingredients && ARRAY[%L]::text[]) ORDER BY option_hot';
    if (weather_cache.last_temp > 70) {
        ordered_query += ';'
    } else {
        ordered_query += ' DESC;';
    }
    let format_query = format(ordered_query, allergens);
    pool.query(format_query)
        .then(async (result) => {
            if (result.rowCount == 0) {
                result.status(500).send({ error: "Menu empty.", categories: [] })
                return
            }

            menu = {}

            for (let i in result.rows) {
                const row = result.rows[i]
                const cat_name_capital = await translate(capitalizeEveryWord(String(row["category"]).toLowerCase()), req.header('Language'))

                // create empty list if category is new
                if (!menu[cat_name_capital])
                    menu[cat_name_capital] = []

                let price = currencyFormatter.format(row["price"] / 100000);

                menu[cat_name_capital].push({
                    id: row["id"],
                    name: await translate(row["name"], req.header('Language')),
                    price: price,
                    in_stock: row["in_stock"],
                    hot: row["option_hot"] ? true : false,
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

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
 *      option_hot: boolean,
 *      category: string,
 *      ingredients: [string, ...]
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { name, category, price, option_hot, ingredients } = req.body;
    price = parseFloat(price);

    if (typeof name != "string" || typeof category != "string" || typeof price != "number" || typeof option_hot != "boolean" || !Array.isArray(ingredients)) {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, category: category, price: price, in_stock: null, option_hot: option_hot, ingredients: [] });
        return;
    }

    ingredients = ingredients.map(ingredient => ingredient.toLowerCase());

    pool.query("INSERT INTO menu(name, category, price, in_stock, option_hot, ingredients) VALUES ($1, $2, $3, $4, $5, $6)", [name, category, price * 100_000, true, option_hot ? true : false, ingredients])
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

/**
 * Get Menu
 * *******************
 * URI: /menu/get
 * TYPE: Get
 *
 * NEEDS AUTH: manager
 * PARAMETERS: none
 *
 * RESPONSE:
 * {
 *      error: error message, (optional)
 *      menu: [
 *          {
 *              "name": text,
 *              "category": text,
 *              "price": int,
 *          },
 *      ]
 * }
 */
app.get('/menu/get', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    pool.query("SELECT * FROM menu ORDER BY id ASC")
        .then((result) => {
            res.status(200).send({ result: result.rows });
        })
        .catch((error) => {
            res.status(500).send({ error: "Server Error." });
            console.log(error);
        });
})

/**
 * Delete Menu Item
 * *******************
 * URI: /menu/delete
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

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
 * Get Staff List
 * *******************
 * URI: /staff/get
 * TYPE: Get
 *
 * NEEDS AUTH: manager
 * PARAMETERS: none
 *
 * RESPONSE:
 * {
 *      error: error message, (optional)
 *      menu: database results
 * }
 */
app.get('/staff/get', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    pool.query("SELECT first_name, last_name, id, is_manager, last_login FROM employees ORDER BY id ASC")
        .then((result) => {
            res.status(200).send({ result: result.rows });
        })
        .catch((error) => {
            res.status(500).send({ error: "Server Error." });
            console.log(error);
        });
})

/**
 * Edit Staff Roles
 * *******************
 * URI: /staff/edit
 *
 * NEEDS AUTH: manager
 *
 * PARAMETERS: {
 *      id: int,
 *      is_manager: boolean,
 * }
 *
 * RESPONSE:
 * {
 *     error: error message, (optional)
 *     success: boolean,
 * }
 *
 */
app.post('/staff/edit', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { id, is_manager } = req.body;

    if (typeof id != "number" || !Number.isInteger(id) || typeof is_manager != "boolean" || id < 0) {
        res.status(400).send({ error: "Invalid parameters", success: false });
        return;
    }

    pool.query("UPDATE employees SET is_manager = $1 WHERE id = $2", [is_manager ? true : false, parseInt(id)])
        .then(() => {
            res.status(200).send({ success: true });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send({ error: "Server Error", success: false });
        })
})

/**
 * Add Staff
 * *******************
 * URI: /staff/add
 *
 * NEEDS AUTH: manager
 *
 * PARAMETERS: {
 *      first_name: string,
 *      last_name: string,
 *      is_manager: boolean,
 *      password: password
 * }
 *
 * RESPONSE:
 * {
 *     error: error message, (optional)
 *     success: boolean,
 * }
 */
app.post('/staff/add', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { first_name, last_name, is_manager, password } = req.body;

    if (typeof first_name != "string" || typeof password != "string" || typeof is_manager != "boolean" ||
        typeof last_name != "string" || first_name.length < 1 || last_name.length < 1 ||
        first_name.split(" ").length != 1 || last_name.split(" ").length != 1 || first_name.length > 50 ||
        last_name.length > 50 || password.length < 5 || password.length > 50) {

        res.status(400).send({ error: "Invalid parameters", success: false });

        return;
    }

    pool.query("INSERT INTO employees(first_name, last_name, is_manager, acc_pw) VALUES ($1, $2, $3, $4)", [first_name, last_name, is_manager ? true : false, password])
        .then(() => {
            res.status(200).send({ success: true });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send({ error: "Server Error", success: false });
        })
})


/**
 * Delete Staff Member
 * *******************
 * URI: /staff/delete
 *
 * NEEDS AUTH: manager
 *
 * PARAMETERS: {
 *      id: integer,
 * }
 *
 * RESPONSE:
 * {
 *     error: error message, (optional)
 *     success: boolean,
 * }
 *
 */
app.post('/staff/delete', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { id } = req.body;

    if (typeof id != "number" || !Number.isInteger(id) || id < 0) {
        res.status(400).send({ error: "Invalid parameters", success: false });
        return;
    }

    pool.query("DELETE FROM employees WHERE id = $1", [id])
        .then(() => {
            res.status(200).send({ success: true });
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send({ error: "Server Error", success: false });
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
 *          {
 *              "name": text,
 *              "quantity": int,
 *              "fill_rate": int,
 *              "unit": text
 *          },
 *      ]
 * }
 */
app.get('/inventory', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let fillUpdate = (req.query.fillUpdate === 'false') ? false : true;

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
                        unit: row["unit"],
                        is_topping: row["is_topping"],
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
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send({ error: "Server error.", inventory: [] });
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { name, quantity } = req.body;
    quantity = parseInt(quantity);

    if (typeof name != "string" || typeof quantity != "number") {
        res.status(500).send({ error: "Unable to add, please check properties", name: name, quantity: quantity });
        return;
    }

    pool.query("UPDATE inventory SET quantity = $1 WHERE name = $2", [quantity, name.toLowerCase()])
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { name, quantity, is_topping, unit } = req.body;
    quantity = parseInt(quantity);
    is_topping = Boolean(is_topping);

    if (typeof name != "string" || typeof unit != "string" || unit.length > 10 || typeof quantity != "number" || typeof is_topping != "boolean") {
        res.status(500).send({ error: "Invalid parameters" });
        return;
    }

    name = name.toLowerCase();

    pool.query("INSERT INTO Inventory(name, quantity, unit_base_consumption, req_fill_rate, is_topping, unit) VALUES ($1, $2, $3, $4, $5, $6)", [name, quantity, 1, 0, is_topping, unit])
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
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { name } = req.body;

    if (typeof name != "string") {
        res.status(500).send({ error: "Unable to delete please check properties", name: name });
        return;
    }

    name = name.toLowerCase();

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
app.get('/toppings', async (req, res) => {
    pool.query('SELECT name, quantity, unit_base_consumption FROM inventory WHERE is_topping = true;')
        .then(async (result) => {
            if (result.rowCount == 0) {
                result.status(500).send({ error: "Topping list empty.", categories: [] })
                return
            }

            const toppings = []

            for (let i in result.rows) {
                const row = result.rows[i]

                toppings.push({
                    name: await translate(capitalizeEveryWord(row["name"]), req.header('Language')),
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
 * Order Start
 * *******************
 * URI: /order/start
 * Type: POST
 * 
 * NEEDS AUTH: no
 * PARAMETERS: {}
 * 
 * RESPONSE: 
 * {
 *      error: error msg (optional),
 *      orderID: UUID
 * }
 */
app.post('/order/start', (req, res) => {

    const ORDERID = crypto.randomUUID();

    // if (req.headers.authorization.length > 7)
    //     console.log(req.headers.authorization.substring(7));

    pool.query("SELECT new_order($1);", [ORDERID])
        .then((response) => {
            if (response.rowCount != 1) {
                res.status(500).send({ success: false, error: "Server Error. No response." })
                return
            }

            const orderID = response.rows[0]["new_order"];
            if (orderID == null) {
                res.status(500).send({ success: false, error: "Server Error." })
                return
            }

            res.status(200).send({ success: true, orderID: orderID });
        }).catch((err) => {
            res.status(500).send({ success: false, error: "Server Error." })
            console.log(err)
            return
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
 *      orderID: UUID,
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
    let { orderID, drinkID, sugarLvl, iceLvl, toppings } = req.body;

    // const auth = null;
    // if (req.headers.authorization.length > 7)
    //     auth = req.headers.authorization.substring(7);

    if (orderID == null || drinkID == null || sugarLvl == null || iceLvl == null) {
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

    pool.query("SELECT add_to_order($1, $2, CAST($3 AS numeric), $4, $5);", [orderID, drinkIDInt, sugarLvl, iceLvlString, toppings])
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
 *      orderID: UUID,
 *      paymentType: int,
 *      tip: int
 * }
 * 
 * RESPONSE: 
 * {
 *      error: error msg (optional),
 *      success: boolean
 * }
 */
app.post('/order/checkout', (req, res) => {
    let { tip, paymentType, orderID, cashierID } = req.body;
    if (orderID == null || paymentType == null) {
        res.status(400).send({ success: false, error: "Invalid parameters." })
        return
    }
    if (tip == null)
        tip = 0;

    let auth = null;
    if (req.headers.authorization.length > 7)
        auth = req.headers.authorization.substring(7);

    if (auth != null && token_cache[auth])
        cashierID = token_cache[auth].id;
    else
        cashierID = -1;

    if (typeof tip == 'float') {
        res.status(400).send({ success: false, error: "Invalid parameters." })
        return
    }

    pool.query('SELECT checkout($1, $2, $3, $4);', [orderID, cashierID, paymentType, tip])
        .then((response) => {
            res.status(200).send({ success: true });
        }).catch((err) => {
            console.log(err);
            res.status(500).send({ error: "Server Error", success: false });
        })
})


/**
 * Inventory Usage Report
 * *******************
 * URI: /reports/inventory
 * Type: GET
 *
 * NEEDS AUTH: yes
 * PARAMETERS: {
 *      from: date string in YYYY-MM-DD format,
 *      to: date string in YYYY-MM-DD format (optional - defaults to today),
 * }
 *
 * RESPONSE:
 * {
 *      error: error msg (optional),
 *      columns: ["Item Name", "Current Stock", "Units Consumed", "Usage Rate"],
 *      report: [
 *           [
 *              text,
 *              "int unit",
 *              "int unit",
 *              "int unit",
 *           ],
 *      ],
 * }
 */
app.get('/reports/inventory', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    let { from, to } = req.query;
    if (from == null) {
        res.status(400).send({ error: "Invalid parameters." })
        return
    }

    if (to == null)
        to = getCentralTime();

    pool.query('SELECT get_usage($1, $2);', [from, to])
        .then((response) => {
            if (response.rowCount == 0) {
                res.status(500).send({ error: "No inventory information." })
                return
            }

            const report = []

            for (let row in response.rows) {
                let temp = String(response.rows[row]["get_usage"]).replace(/[\(\)\"]/g, "").split(",");
                report.push([
                    capitalizeEveryWord(temp[0]),
                    temp[1] + " " + temp[4],
                    temp[2] + " " + temp[4],
                    temp[3] + " " + temp[4],
                ])
            }

            res.status(200).send({
                columns: ["Item Name", "Current Stock", "Units Consumed", "Usage Rate"],
                report: report
            });
        }).catch((err) => {
            console.log(err);
            res.status(500).send({ error: "Server Error." })
        })
});

/**
 * X Report
 * *******************
 * URI: /reports/x
 * Type: GET
 *
 * NEEDS AUTH: yes
 * PARAMETERS: none
 *
 * RESPONSE:
 * {
 *      error: error msg (optional),
 *      columns: ["Hour", "Total Orders", "Total Items", "Total Tips", "Cash Sales", "Total Sales"],
 *      report: [
 *           [
 *              text,
 *              int,
 *              int,
 *              text,
 *           ],
 *      ],
 * }
 */
app.get('/reports/x', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    pool.query('SELECT x_report();')
        .then((response) => {
            if (response.rowCount == 0) {
                res.status(500).send({ error: "X-Report Empty", report: [] })
                return
            }

            const report = []

            for (let row in response.rows) {
                // console.log(response.rows[row])
                let temp = String(response.rows[row]["x_report"]).replace(/[\(\)\"]/g, "").split(",");
                let hr = parseInt(temp[0]);
                if (hr < 10) {
                    temp[0] = "0" + hr + ":00 - 0" + hr + ":59";
                } else {
                    temp[0] = hr + ":00 - " + hr + ":59";
                }

                report.push([
                    temp[0],
                    temp[1],
                    temp[2],
                    currencyFormatter.format(temp[4] / 100000),
                    currencyFormatter.format(temp[5] / 100000),
                    currencyFormatter.format(temp[3] / 100000),
                ])
            }

            res.status(200).send({ columns: ["Hour", "Total Orders", "Total Items", "Total Tips", "Cash Sales", "Total Sales"], report: report });
        }).catch((err) => {
            console.log(err);
            res.status(500).send({ error: "Server Error." })
        })
});

/**
 * Z Report
 * *******************
 * URI: /reports/z
 * Type: GET
 *
 * NEEDS AUTH: yes
 * PARAMETERS: none
 *
 * RESPONSE:
 * {
 *      error: error msg (optional),
 *      columns: ["Date", "Total Orders", "Total Items Ordered", "Total Sales Gross", "Total Tax Owed", "Total Sales Next"],
 *      report: [
 *           date string in YYYY-MM-DD format,
 *           int,
 *           int,
 *           $text,
 *           $text,
 *           $text
 *      ],
 * }
 */
app.get('/reports/z', (req, res) => {
    if (!auth(req, res, LOGGED_IN_MANAGER)) return;

    pool.query('SELECT z_run_date FROM xreport_helper LIMIT 1;')
        .then((r1) => {
            console.log(r1.rows)
            if (r1.rowCount > 0) {
                const date = r1.rows[0]["z_run_date"];
                if (date != null && date.toISOString().split('T')[0] == getCentralTime()) {
                    res.status(500).send({ error: "Z-Report has already run today." })
                    return
                }
            }

            pool.query('SELECT z_report();')
                .then((response) => {
                    if (response.rowCount == 0) {
                        res.status(500).send({ error: "Z-Report Empty", report: [] })
                        return
                    }

                    const reportRow = String(response.rows[0]["z_report"]).replace(/[\(\)\"]/g, "").split(",");


                    res.status(200).send({
                        columns: ["Date", "Total Orders", "Total Items Ordered", "Total Sales Gross", "Total Tips", "Total Tax Owed", "Total Sales Next"],
                        report: [[
                            getCentralTime(),
                            reportRow[0],
                            reportRow[1],
                            currencyFormatter.format(reportRow[2] / 100000),
                            currencyFormatter.format(reportRow[3] / 100000),
                            currencyFormatter.format(reportRow[4] / 100000),
                            currencyFormatter.format(reportRow[5] / 100000)
                        ]
                        ]
                    });


                }).catch((err) => {
                    console.log(err);
                    res.status(500).send({ error: "Server Error." })
                })
        }
        ).catch((err) => {
            console.log(err);
            res.status(500).send({ error: "Server Error." })
        });
})


/**
 * Fetch weather icon for sidebar
 * *****************************
 * URI: /weather_icon
 *
 * NEEDS AUTH: no
 * PARAMETERS:
 *      none
 *
 * RESPONSE:
 *     link to icon, or nothing if no link available
 */
app.get('/weather_icon', (req, res) => {
    if (weather_cache.last_icon) {
        res.status(200).send(weather_cache.last_icon);
    } else {
        res.status(500).send();
    }
});

app.get('/ingredients', async (req, res) => {
    pool.query("SELECT name FROM inventory WHERE unit <> '';")
        .then(async (result) => {
            if (result.rowCount === 0) {
                return result.status(500).send([]);
            } else {
                const ingrs = []

                for (let i in result.rows) {
                    const row = result.rows[i]
                    ingrs.push(await translate(row.name, req.header('Language')))
                }

                return res.status(200).send(ingrs);
            }
        })
        .catch((err) => {
            console.error(err);
            return result.status(500).send({ error: "Bad query" });
        });
});


/**
 * Authorizes a connection for a certain user level.
 * @param {*} req The request object
 * @param {*} res The response object
 * @param {*} level The desired level for authorization
 * @returns If the user is authorized or not
 */
function auth(req, res, level = LOGGED_IN_EMPLOYEE) {
    if (!req || !req.headers || !req.headers.authorization) {
        res.status(401).send({ success: false, error: "Not authenticated." })
        return false
    }


    let token = null;
    if (req.headers.authorization.length > 7)
        token = req.headers.authorization.substring(7);

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

async function getWeather() {
    try {

        const api_req = await fetch('https://api.weather.gov/gridpoints/HGX/28,135/forecast/hourly', {
            headers: { 'User-Agent': '(project3-team23-deployment.onrender.com, zhanggl@tamu.edu)' }
        });
        const api_data = await api_req.json();
        weather_cache.last_temp = api_data.properties.periods[0].temperature;
        weather_cache.last_weather = api_data.properties.periods[0].shortForecast;
        weather_cache.last_icon = api_data.properties.periods[0].icon;
        weather_cache.last_update = Date.now();
    } catch (e) {
        console.error(e);
    }
}
getWeather().then();
setInterval(getWeather, 15 * 60 * 1000);


app.listen(port, () => {
    console.log(`Listening on port at http://localhost:${port}`);
});

/**
 * Translates text using Gemini API to target language. Otherwise it returns null.
 * @param {string} text The desired text to translate.
 * @param {string} targetLanguage The user's desired language.
 * @returns {string} The translated text or null if an error occurs.
*/

app.post('/translate', async (req, res) => {
    const { text, targetLanguage } = req.body;
    try {
        const translatedText = await translateText(text, targetLanguage);
        res.json({ translatedText });
    } catch (error) {
        console.error('Error translating text:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

/**
 * Translates text using Gemini API to the target language, caching results for future use.
 * @param {string} text The desired text to translate.
 * @param {string} targetLanguage The user's desired language.
 * @returns {Promise<string>} TThe translated text or null if an error occurs.
 */
async function translate(text, targetLanguage) {
    if (targetLanguage === 'en') {
        return text; // No translation needed for English
    }

    // if (targetLanguage === 'es') //prevent abuse
    targetLanguage = 'Spanish'

    const cacheKey = `${text}-${targetLanguage}`; // Create a unique key for caching

    if (translationCache[cacheKey]) {
        return translationCache[cacheKey]; // Return cached translation
    }

    try {
        const translatedText = await translateText(text, targetLanguage); //Use geminiService.js
        translationCache[cacheKey] = translatedText; // Store translation in cache
        return translatedText;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; //Return original text on error
    }
}