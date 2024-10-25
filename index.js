/**
 * A sample Express server.
 */
"use strict";

const port    = process.env.DBWEBB_PORT || 1337;
const express = require("express");
const app     = express();
const routeIndex = require("./route/index.js");
const middleware = require("./middleware/index.js");
require("./services/mailhandler.js");
const path = require('path');
const bodyParser = require('body-parser');

app.use(middleware.logIncomingToConsole);
app.use("/", routeIndex);
app.listen(port, logStartUpDetailsToConsole);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");


// Parse JSON bodies (as sent by API clients)
app.use(express.json());
/**
 * Log app details to console when starting up.
 *
 * @return {void}
 */
function logStartUpDetailsToConsole() {
    let routes = [];

    // Find what routes are supported
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            // Routes registered directly on the app
            routes.push(middleware.route);
        } else if (middleware.name === "router") {
            // Routes added as router middleware
            middleware.handle.stack.forEach((handler) => {
                let route;

                route = handler.route;
                route && routes.push(route);
            });
        }
    });

    console.info(`Server is listening on port ${port}.`);
    console.info("Available routes are:");
    console.info(routes);
}
