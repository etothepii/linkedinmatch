USE db_name;
DROP TABLE IF EXISTS skill;
CREATE TABLE skill (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    INDEX `name` (`name`));
DROP TABLE IF EXISTS user;
CREATE TABLE user (
    id VARCHAR(16) NOT NULL PRIMARY KEY,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    pictureUrl TEXT NULL,
    skillsUpdated DATETIME NOT NULL,
    played BOOLEAN NOT NULL);
DROP TABLE IF EXISTS comparison;
CREATE TABLE comparison (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    left_id VARCHAR(16) NOT NULL,
    right_id VARCHAR(16) NOT NULL,
    skill_id INT NOT NULL,
    score INT NOT NULL,
    user_id VARCHAR(16) NOT NULL,
    timestamp TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX `left_id` (`left_id`),
    INDEX `right_id` (`right_id`),
    INDEX `skill_id` (`skill_id`));
DROP TABLE IF EXISTS skills;
CREATE TABLE skills (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id VARCHAR(16) NOT NULL,
    skill_id INT NOT NULL,
    INDEX `person_id` (`person_id`),
    INDEX `skill_id` (`skill_id`));
DROP TABLE IF EXISTS connections;
CREATE TABLE connections (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id VARCHAR(16) NOT NULL,
    connection_id VARCHAR(16) NOT NULL,
    INDEX `person_id` (`person_id`),
    INDEX `connection_id` (`connection_id`));
