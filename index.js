const express = require('express'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

const app = express();
const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/flixDB', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('common'));

let topMovies = [
    {
        title: 'The Great Escape',
        year: '1963',
        genre: 'Thriller'
    },
    {
        title: 'The Magnificent Seven',
        year: '1960',
        genre: 'Western'
    },
    {
        title: 'Back to the Future',
        year: '1985',
        genre: 'Sci-Fi'
    },
    {
        title: 'Back to the Future II',
        year: '1989',
        genre: 'Sci-Fi'
    },
    {
        title: 'Back to the Future III',
        year: '1990',
        genre: 'Sci-Fi'
    },
    {
        title: 'Indiana Jones: Raiders of the Lost Ark)',
        year: '1981',
        genre: 'Thriller'
    },
    {
        title: "Marvel's The Avengers",
        year: '2012',
        genre: 'Action'
    },
    {
        title: 'Forrest Gump',
        year: '1994',
        genre: 'Drama'
    },
    {
        title: 'Home Alone',
        year: '1990',
        genre: 'Family'
    },
    {
        title: 'E.T.',
        year: '1982',
        genre: 'Sci-Fi'
    }
]

app.get('/', (req, res) => {
    res.send('Welcome to the Movie Club!');
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/movies/:title', (req, res) => {
    res.send('Successful GET request returning data on a single movie.');
});

app.get('/genres/:genre', (req, res) => {
    res.send('Successful GET request returning data on a genre.');
});

app.get('/directors/:name', (req, res) => {
    res.send('Successful GET request returning data on a director by name.')
});

app.post('/users/register', (req, res) => {
    res.send('Successful POST request for adding user.')
});

app.put('/users/:userID', (req, res) => {
    res.send('Successful PUT request for updating user info.')
});

app.patch('/users/:userID/favorites/:movieID', (req, res) => {
    res.send('Successful PATCH request for adding a movie to the favorites list.')
});

app.delete('/users/:userID/favorites/:movieID', (req, res) => {
    res.send('Successful DELETE request for removing a movie from the favorites list.')
});

app.delete('/users/:userID', (req, res) => {
    res.send('Successful DELETE request for removing user.')
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});