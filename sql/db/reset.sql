--
-- Reset file for db_ticket
--

DROP DATABASE IF EXISTS db_ticket;
CREATE DATABASE db_ticket;

USE db_ticket;

source ddl.sql
source insert.sql