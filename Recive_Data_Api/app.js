// Import required modules
const express = require('express');
const sql = require('mssql');
const app = express();
const port = process.env.PORT || 5000;

// Set up the database connection configuration
const config = {
    user: 'your_username', // Your Azure SQL Database username
    password: 'your_password', // Your Azure SQL Database password
    server: 'your_server.database.windows.net', // Your Azure SQL Server name
    database: 'your_database', // Your Azure SQL Database name
    options: {
        encrypt: true,  // Use encryption for security
        trustServerCertificate: false // Set to true for local development
    }
};

// Route to fetch data
app.get('/data', async (req, res) => {
    try {
        // Connect to the Azure SQL Database
        await sql.connect(config);

        // Query to fetch data from the table
        const result = await sql.query('SELECT * FROM your_table_name');

        // Process the data to calculate success/failure and create the details array
        const totalRecords = result.recordset.length;
        const successCount = result.recordset.filter(item => item.status === 'SENT').length;
        const failureCount = totalRecords - successCount;

        // Create the details array
        const details = result.recordset.map(record => ({
            customer_phone_number: record.customer_phone_number,
            customer_name: record.customer_name,
            message_text: record.message_text,
            status: record.status,
            statusCode: record.statusCode,
            attempts: record.attempts
        }));

        // Construct the final response JSON
        const response = {
            message: "SMS sending completed.",
            Data: {
                totalRecords,
                successCount,
                failureCount,
                details,
                fileUrl: "https://huskpowersystems.blob.core.windows.net/notification-service-files-nigeria/sms_summary_1749633097352.xlsx"
            }
        };

        // Send the response as JSON
        res.json(response);
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    } finally {
        // Close the database connection
        sql.close();
    }
});

// Start the server
app.listen(port, () => {
    console.log(`API is running on http://localhost:${port}`);
});
