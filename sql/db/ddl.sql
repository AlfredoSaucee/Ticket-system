--
-- Create scheme for database db_ticket.
--

--
-- Tables
--

DROP TABLE IF EXISTS t_user;
DROP TABLE IF EXISTS t_ticket;
DROP TABLE IF EXISTS t_comment;
DROP TABLE IF EXISTS t_ticket_files;
DROP TABLE IF EXISTS t_category;

CREATE TABLE t_user(
    user_id INT(9),
    user_name VARCHAR(16),
    user_password VARCHAR(100),
    user_email VARCHAR(255),
    user_status INT(1),

    PRIMARY KEY (user_id)
);

CREATE TABLE t_ticket(
    ticket_id INT AUTO_INCREMENT,
    ticket_title VARCHAR(255),
    ticket_description VARCHAR(255),
    ticket_status INT(1),
    ticket_category VARCHAR(255),
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    user_mail VARCHAR(255),
    agent_name VARCHAR(255),
    agent_mail VARCHAR(255),

    PRIMARY KEY (ticket_id)
);

CREATE TABLE t_comment(
    comment_id INT  AUTO_INCREMENT,
    ticket_id INT,
    comment_comment TEXT,
    comment_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name  VARCHAR(255),

    PRIMARY KEY (comment_id)
);

CREATE TABLE t_ticket_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    mimetype VARCHAR(50),
    size INT,
    FOREIGN KEY (ticket_id) REFERENCES t_ticket(ticket_id)
);

CREATE TABLE t_category(
    category_id INT  AUTO_INCREMENT,
    category_name VARCHAR(255),

    PRIMARY KEY (category_id)
);

CREATE VIEW v_ticket_details AS
SELECT 
    t.ticket_id,
    t.ticket_title,
    t.ticket_description,
    t.ticket_status,
    t.ticket_category,
    t.user_id,
    t.user_name,
    t.user_mail,
    t.agent_name,
    t.agent_mail
FROM 
    t_ticket t
ORDER BY 
    t.ticket_id DESC;

CREATE VIEW v_ticket_comments AS
SELECT 
    c.comment_id,
    c.comment_comment,
    DATE_FORMAT(c.comment_created_at, '%h:%i %p, %M %d, %Y') AS formatted_created_at,
    c.user_name AS comment_user_name,
    c.ticket_id
FROM 
    t_comment c;

CREATE VIEW v_ticket_files AS
SELECT 
    f.filename AS file_name,
    f.filepath AS file_path,
    f.mimetype AS file_type,
    f.size AS file_size,
    f.ticket_id
FROM 
    t_ticket_files f;

DELIMITER $$

-- Procedure to get all tickets with optional filtering
CREATE PROCEDURE getFilteredTickets(
    IN ticketCategory VARCHAR(255),
    IN ticketStatus INT
)
BEGIN
    SELECT * FROM t_ticket
    WHERE (ticketCategory IS NULL OR ticket_category = ticketCategory)
      AND (ticketStatus IS NULL OR ticket_status = ticketStatus);
END; $$

-- Procedure to get user tickets with optional filtering
CREATE PROCEDURE getUserFilteredTickets(
    IN userId VARCHAR(255),
    IN ticketCategory VARCHAR(255),
    IN ticketStatus INT
)
BEGIN
    SELECT * FROM t_ticket
    WHERE user_id = userId
      AND (ticketCategory IS NULL OR ticket_category = ticketCategory)
      AND (ticketStatus IS NULL OR ticket_status = ticketStatus);
END; $$

-- Create a procedure to get tickets for a specific user by ticket id
CREATE PROCEDURE getSingleTicket(
    IN ticketId INT
)
BEGIN
    SELECT * 
    FROM t_ticket
    WHERE ticket_id = ticketId;
END $$

-- Create a procedure to create tickets
CREATE PROCEDURE createTicket(
    IN ticketName VARCHAR(255),
    IN ticketDescription VARCHAR(255),
    IN userId VARCHAR(255),
    IN userName VARCHAR(255),
    IN category VARCHAR(28),
    IN userMail VARCHAR(255)
)
BEGIN
    INSERT INTO t_ticket (ticket_title, ticket_description, ticket_status, user_id, user_name, ticket_category, user_mail)

    VALUES (ticketName, ticketDescription, 0, userId, userName, category, userMail);

    SELECT LAST_INSERT_ID() AS ticketId;
END $$

CREATE PROCEDURE insert_ticket_file(
    IN p_ticket_id INT,
    IN p_filename VARCHAR(255),
    IN p_filepath VARCHAR(255),
    IN p_mimetype VARCHAR(50),
    IN p_size INT
)
BEGIN
    INSERT INTO t_ticket_files (ticket_id, filename, filepath, mimetype, size)
    VALUES (p_ticket_id, p_filename, p_filepath, p_mimetype, p_size);
END $$

CREATE PROCEDURE addComment(
    IN userName VARCHAR(255),
    IN ticketId INT,
    IN commentText TEXT
)
BEGIN
    INSERT INTO t_comment (user_name, ticket_id, comment_comment, comment_created_at)
    VALUES (userName, ticketId, commentText, NOW());
    
    SELECT LAST_INSERT_ID() AS comment_id;
END $$

-- Create a procedure to update the agent name and set ticket status to 2
CREATE PROCEDURE claimTicket(
    IN ticketId INT,
    IN agentName VARCHAR(255)
)
BEGIN
    UPDATE t_ticket
    SET agent_name = agentName,
        ticket_status = 2
    WHERE ticket_id = ticketId;
END $$

-- Procedure to close ticket
CREATE PROCEDURE closeTicket(
    IN ticketId INT
)
BEGIN
    UPDATE  t_ticket
    SET  ticket_status = 1
    WHERE ticket_id = ticketId;
END $$

-- Procedure to open ticket
CREATE PROCEDURE openTicket(
    IN ticketId INT
)
BEGIN
    UPDATE  t_ticket
    SET  ticket_status = 0,
    agent_name = NULL
    WHERE ticket_id = ticketId;
END $$

CREATE PROCEDURE getCategories(
)
BEGIN
    SELECT category_name FROM t_category;
END $$

CREATE PROCEDURE updateTicketCategory(
    IN p_ticketId INT,
    IN p_categoryName VARCHAR(255)
)
BEGIN
    UPDATE t_ticket
    SET ticket_category = p_categoryName
    WHERE ticket_id = p_ticketId;
END $$

CREATE PROCEDURE createCategory(
    IN categoryName VARCHAR(255)
)
BEGIN
    INSERT INTO t_category (category_name)
    VALUES (categoryName);
END $$

DELIMITER ;