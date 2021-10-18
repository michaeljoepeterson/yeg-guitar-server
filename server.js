require('dotenv').config();
const express = require('express');
const passport = require('passport');
const {PORT, DATABASE_URL,DOMAINS } = require('./config');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const {router} = require('./routers/routerExports');
const {localStrategy, jwtStrategy} = require('./auth/strategies');
const {router: authRouter} = require('./auth/router');
const app = express();
mongoose.set('useFindAndModify', false);

app.use(jsonParser);
app.set('trust proxy', true)
app.use(function (req, res, next) {
    let origin = req.headers.origin;
    let allowedOrigins = DOMAINS.split(',');
    console.log('origin: ',origin);
    if(allowedOrigins.indexOf(origin) > -1){
      console.log('origin found: ',origin);
       res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,authtoken');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/auth/', authRouter);
app.use('/api',router);

function runServer( databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl,{ useNewUrlParser: true,useUnifiedTopology: true }, err => {
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      });
    });
  }
  
  function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
  
  if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
  module.exports = { app, runServer, closeServer };