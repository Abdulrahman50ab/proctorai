"""
Database seeder script for ProctorAI.
Creates a default examiner user and a sample Python & AI Assessment.
"""
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.exam import Exam
from app.models.question import Question

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if default examiner exists
        examiner = db.query(User).filter(User.email == "examiner@test.com").first()
        if not examiner:
            examiner = User(
                name="Prof. Sarah Connor",
                email="examiner@test.com",
                password_hash=get_password_hash("SecretPassword123!"),
                role="examiner"
            )
            db.add(examiner)
            db.commit()
            db.refresh(examiner)
            print("✓ Created default examiner: examiner@test.com / SecretPassword123!")
        else:
            print("✓ Default examiner already exists.")

        # Check if sample exam exists
        sample_exam = db.query(Exam).filter(Exam.title == "Python & AI Proctoring Assessment").first()
        if not sample_exam:
            sample_exam = Exam(
                title="Python & AI Proctoring Assessment",
                description="Standard candidate evaluation assessing Python programming, data structures, and computer vision concepts.",
                duration_minutes=25,
                proctoring_level="standard",
                passing_score=60,
                access_code="AIEXAM01",
                created_by=examiner.id
            )
            db.add(sample_exam)
            db.commit()
            db.refresh(sample_exam)

            # Add sample questions
            questions = [
                Question(
                    exam_id=sample_exam.id,
                    question_text="Which of the following data structures in Python is mutable?",
                    question_type="mcq",
                    options=["Tuple", "List", "String", "FrozenSet"],
                    correct_answer="List",
                    points=1,
                    explanation="Lists in Python can be modified after creation, unlike tuples and strings."
                ),
                Question(
                    exam_id=sample_exam.id,
                    question_text="In computer vision, what is MediaPipe Face Mesh primarily used for?",
                    question_type="mcq",
                    options=[
                        "Audio speech-to-text recognition",
                        "Estimating 468+ 3D facial landmarks in real time",
                        "Compiling Python bytecode",
                        "Database query indexing"
                    ],
                    correct_answer="Estimating 468+ 3D facial landmarks in real time",
                    points=1,
                    explanation="MediaPipe Face Mesh provides real-time 3D facial landmark estimation."
                ),
                Question(
                    exam_id=sample_exam.id,
                    question_text="What does a YOLO model do in real-time proctoring?",
                    question_type="mcq",
                    options=[
                        "Formats JSON payloads",
                        "Detects unauthorized objects like mobile phones and laptops",
                        "Encrypts passwords",
                        "Renders CSS styles"
                    ],
                    correct_answer="Detects unauthorized objects like mobile phones and laptops",
                    points=1,
                    explanation="YOLO is an object detection algorithm used to detect prohibited physical devices."
                ),
                Question(
                    exam_id=sample_exam.id,
                    question_text="True or False: An AI proctoring system should make automated final disqualification decisions without human review.",
                    question_type="mcq",
                    options=["True", "False"],
                    correct_answer="False",
                    points=1,
                    explanation="AI proctoring acts as an assistance and signal engine; human reviewers make final decisions."
                )
            ]
            for q in questions:
                db.add(q)
            db.commit()
            print("✓ Created sample exam with 4 questions.")
        else:
            print("✓ Sample exam already exists.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
