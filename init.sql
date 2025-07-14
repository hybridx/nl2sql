-- Create tables

DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS teachers;

CREATE TABLE students (
    id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    email VARCHAR(100)
);

CREATE TABLE teachers (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    department VARCHAR(50)
);

CREATE TABLE courses (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    teacher_id INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE enrollments (
    id INT PRIMARY KEY,
    student_id INT,
    course_id INT,
    enrollment_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE grades (
    id INT PRIMARY KEY,
    enrollment_id INT,
    grade CHAR(2),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);

-- Insert dummy data into students

INSERT INTO students VALUES
(1, 'Alice', 'Smith', '2004-03-15', 'alice.smith@example.com'),
(2, 'Bob', 'Johnson', '2003-07-22', 'bob.johnson@example.com'),
(3, 'Carol', 'Williams', '2004-01-05', 'carol.williams@example.com');

-- Insert dummy data into teachers

INSERT INTO teachers VALUES
(1, 'Dr. John Doe', 'j.doe@example.com', 'Mathematics'),
(2, 'Dr. Emily Clark', 'e.clark@example.com', 'Science');

-- Insert dummy data into courses

INSERT INTO courses VALUES
(1, 'Algebra 101', 1),
(2, 'Physics 101', 2);

-- Insert dummy data into enrollments

INSERT INTO enrollments VALUES
(1, 1, 1, '2023-09-01'),
(2, 2, 1, '2023-09-01'),
(3, 2, 2, '2023-09-02'),
(4, 3, 2, '2023-09-03');

-- Insert dummy data into grades

INSERT INTO grades VALUES
(1, 1, 'A'),
(2, 2, 'B'),
(3, 3, 'A'),
(4, 4, 'C');
