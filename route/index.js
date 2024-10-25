"use strict";

var express = require('express');
var router  = express.Router();

const { requiresAuth } = require('express-openid-connect');
const { auth } = require('express-openid-connect');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db    = require("../src/functions.js"); 
const bodyParser = require("body-parser");
const multer = require('multer');
const urlencodedParser = bodyParser.urlencoded({ extended: false});
const config = require("../config/config.json");
const middleware = require("../middleware/index.js")


// Auth0-config
const auth0config = {
  authRequired: false,
  auth0Logout: true,
  secret: config.auth0.secret,
  baseURL: config.auth0.baseURL,
  clientID: config.auth0.clientID,
  issuerBaseURL: 'https://dev-jwb6w1rsc4oq8i7f.us.auth0.com',
  logoutParams: { federated: true }
};

// Session-config
router.use(
    session({
      secret: config.auth0.secret,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
    })
);

// Multer setup for saving files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const userId = req.session.user.sub;
        const ext = path.extname(file.originalname);
        cb(null, `${userId}_${file.fieldname}_${uniqueSuffix}${ext}`);
    }
});

// File type filter function to allow only PDF and image files
const fileFilter = function (req, file, cb) {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
};

// Initialize Multer with storage and file type filtering
const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter 
});

// Auth0 middleware
router.use(auth(auth0config));

router.get('/logout1', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect(`https://dev-jwb6w1rsc4oq8i7f.us.auth0.com/v2/logout?client_id=${config.auth0.clientID}&returnTo=http://${config.logout.ip}:${config.logout.port}/login&federated=true`)
    });
});

// req.isAuthenticated auth controll
router.get('/', (req, res) => {
    if (req.oidc.isAuthenticated()) {
      req.session.user = req.oidc.user;
      const roles = req.oidc.user['https://ticketsystem/roles'];
      req.session.roles = roles || [];
      res.redirect('/profile');
    } else {
        res.redirect('/login');
    }
});

//Route for main page (dashboard)
router.get('/profile', requiresAuth(), async (req, res) => {
    try {
        let ticketsData;
        const { category, status } = req.query;

        // Check wether a person is logged in as agent or user
        if (req.session.roles.includes('agent')) {
            ticketsData = await db.getFilteredTickets({ category, status });
        } else if (req.session.roles.includes('user')) {
            const userId = req.session.user.sub;
            ticketsData = await db.getUserFilteredTickets(userId, { category, status });
        } else {
            return res.status(403).send('Unauthorized: You do not have permission to view this page.');
        }

        // Check if user session exists and pass the user data to the template
        if (req.session.user) {
            res.render('profile', { 
                name: req.session.user.name, 
                roles: req.session.roles,
                tickets: ticketsData,
                filters: {
                    category: category || '',
                    status: status || ''
                }
            });
        } else {
            res.send('No user data in session');
        }
    } catch (error) {
        console.error("Error fetching profile data: ", error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for creating tickets
router.get("/create", async (req, res) => {
    const categories = await db.getCategories();
    res.render('create', { 
                name: req.session.user.name, 
                roles: req.session.roles,
                categories: categories
            });
});

// Post route for creating tickets
router.post("/create-ticket", upload.array('files', config.multer.fileLimit), urlencodedParser, async (req, res) => {
    const userId = req.session.user.sub;
    const userMail = req.session.user.email;
    const { title, description, category } = req.body;
    const files = req.files;

    // Create a new ticket and get back ticketId
    const ticketId = await db.createTicket(title, description, userId, req.session.user.name, category, userMail);

    // If files were uploaded, store the path in the DB
    if (files && files.length > 0) {
        for (const file of files) {
            const filePath = `/uploads/${file.filename}`;
            console.log("Saving file path in DB...");

            await db.saveFile({
                ticketId: ticketId,
                filename: file.originalname,   
                filepath: filePath,            
                mimetype: file.mimetype,       
                size: file.size
            });
        }
    }

    res.redirect("/profile");
});

// Route for ticket view
router.get("/ticket-view/:id", async (req, res) => {
    const id = req.params.id;
    const categories = await db.getCategories();
    const data = {
        title: `Ticket ${id}`,
        name: req.session.user.name, 
        roles: req.session.roles,
        account: id,
        ticket: null,
        comments: [],
        files: [],
        categories: categories
    };

    try {
        // Fetch ticket data
        const ticketDetails = await db.showSingleTicket(id);
        if (ticketDetails && ticketDetails.length > 0) {
            data.ticket = ticketDetails[0]; // Assign the first ticket result
        }

        // Fetch comments related to this ticket
        data.comments = await db.getCommentsByTicketId(id);

        // Fetch files related to this ticket
        data.files = await db.getFilesByTicketId(id);
        console.log(data.files);

        res.render("ticket-view", data);

    } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).send("Server error");
    }
});


// Post route for creating comments
router.post("/create-comment", urlencodedParser ,async(req, res) => {
    const userName = req.session.user.name;
    const  { ticketId, commentText } = req.body;

    await db.createComment(userName, ticketId, commentText)
    res.redirect(`/ticket-view/${ticketId}`)
});

// Post route for claiming tickets as agent
router.post("/claim", middleware.checkAgentRole, urlencodedParser, async (req, res) => {
    const ticketId = req.body.ticketId;
    const agentName = req.session.user.name;

    try {
        await db.claimTicket(ticketId, agentName);
        res.redirect(`/ticket-view/${ticketId}`);
    } catch (error) {
        console.error('Error claiming ticket:', error);
        res.status(500).send("Internal Server Error");
    }
});

// Post route for opening/closing tickets
router.post('/ticket-action', urlencodedParser, async (req, res) => {
    const ticketId = req.body.ticketId;
    const actionType = req.body.actionType;

    try {
        if (actionType === 'close') {
            await db.closeTicket(ticketId);
        } else if (actionType === 'open') {
            await db.openTicket(ticketId);
        }

        res.redirect(`/ticket-view/${ticketId}`);
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Post route to update the ticket category
router.post('/change-category', middleware.checkAgentRole, urlencodedParser, async (req, res) => {
    const { ticketId, category } = req.body;

    try {
        await db.updateTicketCategory(ticketId, category);

        res.redirect(`/ticket-view/${ticketId}`);
    } catch (error) {
        console.error('Error updating ticket category:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route for admin panel
router.get("/admin", middleware.checkAgentRole, async (req, res) => {
    const categories = await db.getCategories();
    res.render('admin', { 
                name: req.session.user.name, 
                roles: req.session.roles,
                categories: categories
            });
});

// POST route for creating a new category
router.post('/create-category', middleware.checkAgentRole, urlencodedParser, async (req, res) => {
    const { categoryName } = req.body;

    try {
        await db.createCategory(categoryName);
        res.redirect('/profile');
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
