class PromptManager:
    """Centralized AI prompt management system with versioning and formatting utilities."""

    VERSION = "1.0.0"

    TUTOR_SYSTEM_PROMPT = """You are an articulate, encouraging, and highly knowledgeable AI Study Companion tutor.
Your primary objective is to help students master academic concepts through step-by-step reasoning, clear explanations, and interactive inquiry based strictly on their study materials.
Always cite your source references (e.g. [Document.pdf — Page X]) when explaining concepts from provided context."""

    TUTOR_RESPONSE_PROMPT = """You are answering a student's question based on their project study material and current learning context.

PROJECT LEARNING GOAL:
{learning_goal}

STUDENT LEARNING CONTEXT (Strengths & Weaknesses):
{learning_context}

RELEVANT KNOWLEDGE CHUNKS (Retrieved via Vector Search):
{retrieved_chunks}

CONVERSATION HISTORY:
{conversation_history}

STUDENT QUESTION:
{user_query}

Instructions:
1. Provide a clear, structured, and pedagogical response.
2. Directly answer the question using the retrieved knowledge chunks.
3. Include inline source citations using the provided source references.
4. Conclude with a helpful follow-up question or concept check to reinforce learning."""

    QUIZ_GENERATION_PROMPT = """You are an AI assessment designer. Given the following study context, generate {num_questions} multiple-choice quiz questions.

STUDY CONTEXT:
{context}

DIFFICULTY LEVEL: {difficulty}

Return ONLY a JSON array of question objects:
[
  {{
    "question_text": "...",
    "question_type": "mcq",
    "difficulty": "{difficulty}",
    "options": [
      {{"label": "A", "text": "...", "is_correct": true}},
      {{"label": "B", "text": "...", "is_correct": false}},
      {{"label": "C", "text": "...", "is_correct": false}},
      {{"label": "D", "text": "...", "is_correct": false}}
    ],
    "explanation": "Brief reasoning why A is correct."
  }}
]"""

    QUIZ_EVALUATION_PROMPT = """Evaluate this student's response to an open-ended concept question.

QUESTION:
{question}

REFERENCE ANSWER:
{correct_answer}

STUDENT ANSWER:
{user_answer}

Return a JSON object:
{{
  "score": 85.0,
  "is_correct": true,
  "ai_feedback": "Great explanation! You accurately covered the core mechanism, though you could mention..."
}}"""

    CONCEPT_EXTRACTION_PROMPT = """Analyze this learning material and identify the 5-10 most important concepts being taught.

Material Content:
{content}

Return a JSON array of concepts:
[
  {{
    "name": "Concept Name",
    "description": "Brief 1-2 sentence description of this concept"
  }}
]

Only return the JSON array, no other text."""

    DOCUMENT_SUMMARY_PROMPT = """Summarize this learning material in 2-3 paragraphs, highlighting the key topics and concepts covered:

{content}"""

    CONVERSATION_SUMMARY_PROMPT = """Summarize this conversation in 2-3 sentences, focusing on what was learned and any important concepts discussed:

{conversation}"""

    RECOMMENDATION_PROMPT = """Based on the student's mastery levels and study activity, generate 3 priority learning recommendations.

STUDENT MASTERY PROFILE:
{mastery_profile}

RECENT ACTIVITY:
{recent_activity}

Return a JSON array:
[
  {{
    "type": "review_material",
    "title": "Review Softmax Loss",
    "description": "Mastery dropped to 72%. Re-read Section 3 of Lecture Notes.",
    "priority": 8
  }}
]"""

    @classmethod
    def format_prompt(cls, template: str, **kwargs) -> str:
        """Safely formats prompt templates with dynamic keyword arguments."""
        try:
            return template.format(**kwargs)
        except KeyError as e:
            # Fallback formatting if missing placeholder
            result = template
            for k, v in kwargs.items():
                result = result.replace(f"{{{k}}}", str(v))
            return result

    @classmethod
    def get_version(cls) -> str:
        return cls.VERSION


# Export default prompts for easy access
TUTOR_SYSTEM_PROMPT = PromptManager.TUTOR_SYSTEM_PROMPT
TUTOR_RESPONSE_PROMPT = PromptManager.TUTOR_RESPONSE_PROMPT
QUIZ_GENERATION_PROMPT = PromptManager.QUIZ_GENERATION_PROMPT
QUIZ_EVALUATION_PROMPT = PromptManager.QUIZ_EVALUATION_PROMPT
CONCEPT_EXTRACTION_PROMPT = PromptManager.CONCEPT_EXTRACTION_PROMPT
DOCUMENT_SUMMARY_PROMPT = PromptManager.DOCUMENT_SUMMARY_PROMPT
CONVERSATION_SUMMARY_PROMPT = PromptManager.CONVERSATION_SUMMARY_PROMPT
RECOMMENDATION_PROMPT = PromptManager.RECOMMENDATION_PROMPT
