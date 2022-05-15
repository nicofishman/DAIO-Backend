import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import routerSpotify from './Routes/Spotify.routes';
import routerCredentials from './Routes/Credentials.routes';
import routerDatabase from './Routes/Database.routes';

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use(cors()); // Middleware to enable CORS
app.use(cookieParser()); // Middleware to enable cookies
app.use(bodyParser.json()); // Middleware to enable cookies

const PORT = 3000;

app.use('/spotify', routerSpotify);
app.use('/credentials', routerCredentials);
app.use('/database', routerDatabase);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
