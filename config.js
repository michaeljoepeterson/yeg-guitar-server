exports.DATABASE_URL = process.env.DATABASE_URL;
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.ADMIN_S = process.env.ADMIN_S;
exports.ADMIN_SECRET = process.env.ADMIN_SECRET;
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
exports.DOMAINS = process.env.DOMAINS;
//exports.ADMIN_EMAILS = process.env.ADMIN_EMAILS;
//exports.ADMIN_LOC = process.env.ADMIN_LOC;

const admin = require('firebase-admin');
//const serviceAccount = require('./admin.json');


let serviceAccount = {
    "type": process.env.type,
    "project_id": process.env.project_id,
    "private_key_id": process.env.private_key_id,
    "private_key": process.env.private_key.replace(/\\n/g, '\n'),
    "client_email": process.env.client_email,
    "client_id": process.env.client_id,
    "auth_uri": process.env.auth_uri,
    "token_uri": process.env.token_uri,
    "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.client_x509_cert_url
};


exports.fb = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://byh-app.firebaseio.com"
});