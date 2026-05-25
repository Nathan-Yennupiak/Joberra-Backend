import dotenv from 'dotenv';
// Load the environment variables from the .env file so we can use them in our app
dotenv.config();

// Import our fully configured Express application
import app from './app';

// Choose a port. Use the one provided in the environment (.env), or default to 5000
const PORT = process.env.PORT || 9000;

// Tell the Express app to start listening for incoming connections
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
