// server/index.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
    createTables,
    createCustomer,
    createRestaurant,
    fetchCustomers,
    fetchRestaurants,
    createReservation,
    destroyReservation,
} = require('./db'); // Import functions from db.js

const app = express();
const port = 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Error handling middleware (Added bonus)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Test route
app.get('/', (req, res) => {
    res.send('Hello, Acme Reservation Planner API!');
});

// GET /api/customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await fetchCustomers();
        res.json(customers);
    } catch (error) {
        next(error); // Pass error to error handling middleware
    }
});

// GET /api/restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await fetchRestaurants();
        res.json(restaurants);
    } catch (error) {
        next(error);
    }
});

// GET /api/reservations
app.get('/api/reservations', async (req, res) => {
    try {
        // Join query to get customer and restaurant names in the results
        const result = await db.client.query(`
            SELECT 
                r.id, 
                r.date, 
                r.party_count, 
                rest.name AS restaurant_name, 
                c.name AS customer_name,
                r.customer_id,
                r.restaurant_id
            FROM reservations r
            JOIN customers c ON r.customer_id = c.id
            JOIN restaurants rest ON r.restaurant_id = rest.id
        `);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// POST /api/customers/:customer_id/reservations
app.post('/api/customers/:customer_id/reservations', async (req, res) => {
    const { customer_id } = req.params;
    const { restaurant_id, date, party_count } = req.body;

    // Input validation
    if (!restaurant_id || !date || !party_count) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Check if customer and restaurant exist
        const customerExists = await db.client.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
        const restaurantExists = await db.client.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);

        if (customerExists.rows.length === 0) {
            return res.status(400).json({ error: `Customer with id ${customer_id} not found` });
        }
        if (restaurantExists.rows.length === 0) {
             return res.status(400).json({ error: `Restaurant with id ${restaurant_id} not found` });
        }
        const reservation = await createReservation(date, party_count, restaurant_id, customer_id);
        res.status(201).json(reservation);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/customers/:customer_id/reservations/:id
app.delete('/api/customers/:customer_id/reservations/:id', async (req, res) => {
    const { id, customer_id } = req.params;

     try {
        // Check if the reservation exists and belongs to the customer
        const reservationExists = await db.client.query(
            'SELECT id FROM reservations WHERE id = $1 AND customer_id = $2',
            [id, customer_id]
        );
        if (reservationExists.rows.length === 0) {
             return res.status(404).json({ error: `Reservation with id ${id} for customer ${customer_id} not found` });
        }
        const result = await destroyReservation(id);
        if (result === null)
        {
             res.status(404).send(); // 404 Not Found
        }
        else{
            res.status(204).send();
        }

    } catch (error) {
        next(error);
    }
});



// Initialize the database and start the server
const init = async () => {
    try {
        await createTables();

        // Create initial data for testing
        const customer1 = await createCustomer('Alice');
        const customer2 = await createCustomer('Bob');
        const restaurant1 = await createRestaurant('Pizza Palace');
        const restaurant2 = await createRestaurant('Burger Joint');

        // create a reservation
        const reservation1 = await createReservation(new Date(), 4, restaurant1.id, customer1.id);


        console.log('Initialized database with sample data:', { customer1, customer2, restaurant1, restaurant2, reservation1 });
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Handle the error appropriately, e.g., exit the application or retry the initialization
        process.exit(1); // Exit the process with an error code
    }
};

init(); // Call the init function to start the process
