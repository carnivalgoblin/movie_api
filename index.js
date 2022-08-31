const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    Models = require('./models.js');
const { isBuffer } = require('lodash'),
    { check, validationResult } = require('express-validator');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('common'));

let allowedOrigins = ['http://localhost:4200', 'http://localhost:8080', 'http://localhost:1234', 'https://carnivalgoblin.github.io', 'https://carnivalgoblin.github.io/myFlix-Angular-client', 'https://rpmyflix.netlify.app', 'https://dev-exc-7--rpmyflix.netlify.app'];

const cors = require('cors');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const Movies = Models.Movie;
const Users = Models.User;

/* mongoose.connect('mongodb://localhost:27017/flixDB', { useNewUrlParser: true, useUnifiedTopology: true }); */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


/**
 * GET: Returns welcome message from '/' request URL
 * @returns Welcome message
 */
app.get('/', (req, res) => {
    res.send('Welcome to the Movie Club!');
});

/**
 * GET: returns a list of ALL movies to the user
 * Request body: Bearer Token
 * @returns array of movie objects
 * @requires passport
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    /* app.get("/movies", function (req, res) { */
    Movies.find()
        .then(function (movies) {
            res.status(201).json(movies);
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send("Error: " + error);
        });
});

/**
 * GET: Returns data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user
 * Request body: Bearer token
 * @param Title (of movie)
 * @returns movie object
 * @requires passport
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(200).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * GET: Returns description about a genre by name to the user
 * REquest body: Bearer token
 * @param Name (of genre)
 * @returns genre object
 * @requires passport
 */
app.get('/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Genre);
            } else {
                res.status(400).send('Genre not found.');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * GET: Returns data (Name, Bio, Birthday) about a director by name to the user
 * REquest body: Bearer token
 * @param Name (of genre)
 * @returns director object
 * @requires passport
 */
app.get('/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
        .then((movie) => {
            if (movie) {
                res.status(200).json(movie.Director);
            } else {
                res.status(400).send('Director not found.');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * PATCH: Allows users to add a movie to their list of favorites
 * Request body: Bearer token
 * @param username
 * @param movieId
 * @returns user object
 * @requires passport
 */
app.patch('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { Favorites: req.params.MovieID }
    },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

/**
 * DELETE: Allows users to delete a movie from their list of favorites
 * Request body: Bearer token
 * @param username
 * @param movieId
 * @returns user object
 * @requires passport
 */
app.delete('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { Favorites: req.params.MovieID }
    },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

/**
 * GET: Returns a list of favorite movies from the user
 * Request body: Bearer token
 * @param Username
 * @returns array of favorite movies
 * @requires passport
 */
app.get('/users/:Username/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            if (user) { // If a user with the corresponding username was found, return user info
                res.status(200).json(user.Favorites);
            } else {
                res.status(400).send('Could not find favorite movies for this user');
            };
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//USERS Specific -start-

/**
 * POST: Allow new users to register, Username password & Email are required fields!
 * Request body: Bearer token, JSON with user information
 * @returns user object
 */
app.post('/users/register',
    [
        check('Username', 'Username is required.').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric charachters - not allowed.').isAlphanumeric(),
        check('Password', 'Pasword is required.').not().isEmpty(),
        check('Email', 'Email does not appear ro be valid.').isEmail()
    ], (req, res) => {

        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOne({ Username: req.body.Username })
            .then((user) => {

                if (user) {
                    return res.status(400).send(req.body.Username + ' already exists.');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        })
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

/**
 * PUT: Allow users to update their user info (find by username)
 * Request body: Bearer token, updated user info
 * @param Username
 * @returns user object with updates
 * @requires passport
 */
app.put('/users/:Username',
    [
        check('Username', 'Username is required.').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric charachters - not allowed.').isAlphanumeric(),
        check('Password', 'Pasword is required.').not().isEmpty(),
        check('Email', 'Email does not appear ro be valid.').isEmail()
    ],
    passport.authenticate('jwt', { session: false }), (req, res) => {
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.json(updatedUser);
                }
            });
    });

/**
 * DELETE: Allows existing users to deregister
 * Request body: Bearer token
 * @param Username
 * @returns success message
 * @requires passport
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(rey.params.Username + ' was not found.');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * GET: Returns data on all users (user object) by username
 * Request body: Bearer token
 * @param none
 * @returns user array
 * @requires passport
 */
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * GET: Returns data on a single user (user object) by username
 * Request body: Bearer token
 * @param Username
 * @returns user object
 * @requires passport
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//USERS Specific -end-


app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port);
});
