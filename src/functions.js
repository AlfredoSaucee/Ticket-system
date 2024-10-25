/**
 * A module exporting functions to access the ticket database.
 */
"use strict";

module.exports = {
    getFilteredTickets: getFilteredTickets,
    getUserFilteredTickets: getUserFilteredTickets,
    createTicket: createTicket,
    showSingleTicket: showSingleTicket,
    claimTicket: claimTicket,
    getCommentsByTicketId: getCommentsByTicketId,
    createComment: createComment,
    saveFile: saveFile,
    getFilesByTicketId: getFilesByTicketId,
    closeTicket: closeTicket,
    openTicket: openTicket,
    getCategories: getCategories,
    updateTicketCategory: updateTicketCategory,
    createCategory: createCategory,
};

const mysql  = require("promise-mysql");
const config = require("../config/config.json");
let db;

/**
 * Main function.
 * @async
 * @returns void
 */
(async function() {
    db = await mysql.createConnection(config.mariadb);

    process.on("exit", () => {
        db.end();
    });
})();

async function getFilteredTickets(filters) {
    const { category, status } = filters;
    let sql = `CALL getFilteredTickets(?, ?);`;
    let res;

    res = await db.query(sql, [category || null, status || null]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    return res;
}

async function getUserFilteredTickets(userId, filters) {
    const { category, status } = filters;
    let sql = `CALL getUserFilteredTickets(?, ?, ?);`;
    let res;

    res = await db.query(sql, [userId, category || null, status || null]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    return res;
}

// Function to fetch a single ticket by ticket id
async function showSingleTicket(ticketId) {
    let sql = `SELECT * FROM v_ticket_details WHERE ticket_id = ?;`;
    let res;

    try {
        res = await db.query(sql, [ticketId]);
        console.log(ticketId);
        return res;
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        throw error;
    }
}

// Function to fetch comments by ticket id
async function getCommentsByTicketId(ticketId) {
    let sql = `SELECT * FROM v_ticket_comments WHERE ticket_id = ?;`;
    let res;

    try {
        res = await db.query(sql, [ticketId]);
        return res;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
}

// Function to fetch files by ticket id
async function getFilesByTicketId(ticketId) {
    let sql = `SELECT * FROM v_ticket_files WHERE ticket_id = ?;`;
    let res;

    try {
        res = await db.query(sql, [ticketId]);
        return res;
    } catch (error) {
        console.error("Error fetching files:", error);
        throw error;
    }
}

// Function to create a ticket
async function createTicket(ticketName,  ticketDescription, userId, userName, category, userMail) {

    let sql = `CALL createTicket(?, ?, ?, ?, ?, ?);`;
    let res;

    res = await db.query(sql, [ticketName, ticketDescription, userId, userName, category, userMail]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0][0].ticketId);

    return res[0][0].ticketId;
}

// Function to create a comment
async function createComment(userName, ticketId, commentText) {
    let sql = `CALL addComment(?, ?, ?);`;
    let res;

    try {
        res = await db.query(sql, [userName, ticketId, commentText]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);

        return res[0];
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
}

// Function to save ticket file path to the database
async function saveFile({ ticketId, filename, filepath, mimetype, size }) {
    let sql = `CALL insert_ticket_file(?, ?, ?, ?, ?);`;
    let res;

    try {
        res = await db.query(sql, [ticketId, filename, filepath, mimetype, size]);
        console.info(`SQL: ${sql} got ${res.length} rows.`);
        return res[0];
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
}

// Function to claim a ticket as an agent
async function claimTicket(ticketId, agentName) {
    let sql = `CALL claimTicket(?, ?);`;
    let res;

    res = await db.query(sql, [ticketId, agentName]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0])

    return res[0];
}

// Function to close a ticket
async function closeTicket(ticketId) {
    let sql = `CALL closeTicket(?);`;
    let res;

    res = await db.query(sql, [ticketId]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);

    return res[0];
}

// Function to open a ticket
async function openTicket(ticketId) {
    let sql = `CALL openTicket(?);`;
    let res;

    res = await db.query(sql, [ticketId]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0])

    return res[0];
}

// Function to fetch categories
async function getCategories() {
    let sql = `CALL getCategories();`;
    let res;

    res = await db.query(sql);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0])

    return res[0];
}

// Function to change category of a ticket
async function updateTicketCategory(ticketId, category) {
    let sql = `CALL updateTicketCategory(?, ?);`;
    let res;

    res = await db.query(sql, [ticketId, category]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0])

    return res[0];
}

// Function to create a category
async function createCategory(categoryName) {
    let sql = `CALL createCategory(?);`;
    let res;

    res = await db.query(sql, [categoryName]);
    console.info(`SQL: ${sql} got ${res.length} rows.`);
    console.info(res[0])

    return res[0];
}
