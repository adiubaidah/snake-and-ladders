CREATE KEYSPACE IF NOT EXISTS quiz_app 
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE quiz_app;

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY,
    question_text TEXT,
    answers MAP<TEXT, BOOLEAN> // key: answer text, value: is_correct
);