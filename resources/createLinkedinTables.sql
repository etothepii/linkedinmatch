USE db_name;
DROP TABLE IF EXISTS Skill;
CREATE TABLE Skill (
    ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    INDEX `NAME` (`NAME`));
DROP TABLE IF EXISTS User;
CREATE TABLE User (
    ID VARCHAR(16) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    FIRST_NAME VARCHAR(255) NOT NULL,
    LAST_NAME VARCHAR(255) NOT NULL,
    LAST_UPDATED BIGINT NOT NULL,
    PICTURE_URL TEXT NULL,
    PLAYED BOOLEAN NOT NULL);
DROP TABLE IF EXISTS Comparison;
CREATE TABLE Comparison (
    LEFT VARCHAR(16) NOT NULL,
    RIGHT VARCHAR(16) NOT NULL,
    SKILL INT NOT NULL,
    SCORE INT NOT NULL,
    USER VARCHAR(16) NOT NULL,
    TIMESTAMP TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `LEFT` (`LEFT`),
    INDEX `RIGHT` (`RIGHT`),
    INDEX `SKILL` (`SKILL`));
DROP TABLE IF EXISTS Connections;
CREATE TABLE Connections (
    PERSON VARCHAR(16) NOT NULL,
    CONNECTION VARCHAR(16) NOT NULL,
    INDEX `PERSON` (`PERSON`),
    INDEX `CONNECTION` (`CONNECTION`));
