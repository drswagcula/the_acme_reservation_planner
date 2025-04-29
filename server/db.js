// server/db.js
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: '34 planner', 
    password: 'UKYO0083', 
    port: 5432,
});

client.connect();

const createTables = async () => {
    try {
        await client.query('DROP TABLE IF EXISTS reservations');
        await client.query('DROP TABLE IF EXISTS restaurants');
        await client.query('DROP TABLE IF EXISTS customers');

        await client.query(`
            CREATE TABLE customers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE restaurants (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL
            )
        `);

        await client.query(`
            CREATE TABLE reservations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                date DATE NOT NULL,
                party_count INTEGER NOT NULL,
                restaurant_id UUID REFERENCES restaurants(id) NOT NULL,
                customer_id UUID REFERENCES customers(id) NOT NULL
            )
        `);
        console.log("Tables created successfully");
    } catch (error) {
        console.error("Error creating tables:", error);
        throw error; 
    }
};

const createCustomer = async (name) => {
    try {
        const result = await client.query(
            'INSERT INTO customers (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
};

const createRestaurant = async (name) => {
    try {
        const result = await client.query(
            'INSERT INTO restaurants (name) VALUES ($1) RETURNING *',
            [name]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error creating restaurant:", error);
        throw error;
    }
};

const fetchCustomers = async () => {
    try {
        const result = await client.query('SELECT * FROM customers');
        return result.rows;
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

const fetchRestaurants = async () => {
    try {
        const result = await client.query('SELECT * FROM restaurants');
        return result.rows;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        throw error;
    }
};

const createReservation = async (date, party_count, restaurant_id, customer_id) => {
    try {
        const result = await client.query(
            'INSERT INTO reservations (date, party_count, restaurant_id, customer_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [date, party_count, restaurant_id, customer_id]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Error creating reservation:", error);
        throw error;
    }
};

const destroyReservation = async (id) => {
    try {
        const result = await client.query('DELETE FROM reservations WHERE id = $1', [id]);
         if (result.rowCount === 0) {
           
            return null; 
        }
        return result;
    } catch (error) {
        console.error("Error deleting reservation:", error);
        throw error;
    }
};

module.exports = {
    client,
    createTables,
    createCustomer,
    createRestaurant,
    fetchCustomers,
    fetchRestaurants,
    createReservation,
    destroyReservation,
};
