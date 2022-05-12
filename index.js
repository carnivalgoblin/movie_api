const express = require('express'),
    morgan = require('morgan');
/* fs = require('fs'),
path = require('path'); */

const app = express();

app.use(morgan('common'));
/* const accesLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

app.use(morgan('combined', { stream: accesLogStream })); */

let topMovies = [
    {
        title: 'The Great Escape',
        year: '1963'
    },
    {
        title: 'The Magnificent Seven',
        year: '1960'
    },
    {
        title: 'Back to the Future',
        year: '1985'
    },
    {
        title: 'Back to the Future II',
        year: '1989'
    },
    {
        title: 'Back to the Future III',
        year: '1990'
    },
    {
        title: 'Indiana Jones: Raiders of the Lost Ark)',
        year: '1981'
    },
    {
        title: "Marvel's The Avengers",
        year: '2012'
    },
    {
        title: 'Forrest Gump',
        year: '1994'
    },
    {
        title: 'Home Alone',
        year: '1990'
    },
    {
        title: 'E.T.',
        year: '1982'
    }
]

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to the Movie Club!');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});