import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import routerSpotify from './Routes/Spotify.routes';
import routerDatabase from './Routes/Database.routes';
import routerCredentials from './Routes/Credentials.routes';

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use(cors()); // Middleware to enable CORS
app.use(cookieParser()); // Middleware to enable cookies
app.use(bodyParser.json()); // Middleware to enable cookies

const PORT = process.env.PORT || 3000;

app.use('/credentials', routerCredentials);
app.use('/spotify', routerSpotify);
app.use('/database', routerDatabase);
app.get('/', (_req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
