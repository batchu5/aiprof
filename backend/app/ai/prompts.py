class PromptManager:
    """Centralized AI prompt management system with versioning and formatting utilities."""

    VERSION = "1.0.0"

    TUTOR_SYSTEM_PROMPT = """You are an AI Study Companion tutor. Your role is to help users learn and understand their study materials.

RULES:
1. ALWAYS base your answers on the provided learning materials (context). These are the user's actual study documents.
2. When you use information from the materials, CITE the source using this format: [Source: {document_name} — Page {page}]
3. If the question CANNOT be answered from the provided materials, clearly say: "I don't have enough information in your learning materials to answer this question accurately. The available materials cover [list relevant topics], but don't address [the question topic]."
4. Do NOT make up information. Do NOT use your general knowledge to answer questions that should come from the materials.
5. If the user asks a general question (like greetings, meta-questions about the platform), respond normally.
6. Adapt your explanation style to the user's level based on their learning context.
7. When appropriate, suggest related concepts the user might want to explore.
8. Keep responses clear, well-structured, and educational.
9. Use markdown formatting for better readability (headers, bullet points, bold, code blocks if relevant).

USER CONTEXT:
- Learning Goal: {learning_goal}
- Current Mastery: {mastery_summary}
- Known Strengths: {strengths}
- Known Weaknesses: {weaknesses}
"""

    TUTOR_RESPONSE_PROMPT = """Based on the following context from the user's learning materials, answer their question.

RELEVANT MATERIALS:
{retrieved_context}

CONVERSATION HISTORY:
{conversation_history}

LEARNING CONTEXT:
{learning_context}

USER QUESTION: {question}

Remember:
- Cite sources using [Source: Document — Page X] format
- If materials don't cover this topic, say so clearly
- Be educational and helpful
- Suggest follow-up topics if relevant"""


    QUIZ_GENERATION_PROMPT = """You are generating a quiz question for an adaptive learning system.

STUDENT CONTEXT:
- Learning Goal: {learning_goal}
- Target Concept: {concept_name} (Current Mastery: {mastery_level}%)
- Difficulty Level: {difficulty}
- Previous mistakes on this concept: {previous_mistakes}

RELEVANT MATERIAL:
{material_context}

QUESTION TYPE: {question_type}

INSTRUCTIONS:
- Generate ONE {question_type} question about "{concept_name}"
- Difficulty: {difficulty}
- The question should test understanding, not just memorization
- Base the question on the provided material
- For MCQ: provide 4 options with exactly 1 correct answer
- For open-ended: provide a reference answer for evaluation

Return JSON in this EXACT format:

For MCQ:
{{
  "question_text": "What is...",
  "options": [
    {{"label": "A", "text": "Option text", "is_correct": false}},
    {{"label": "B", "text": "Option text", "is_correct": true}},
    {{"label": "C", "text": "Option text", "is_correct": false}},
    {{"label": "D", "text": "Option text", "is_correct": false}}
  ],
  "correct_answer": "B",
  "explanation": "Brief explanation of why B is correct"
}}

For open_ended:
{{
  "question_text": "Explain how...",
  "correct_answer": "A comprehensive reference answer...",
  "key_points": ["point1", "point2", "point3"],
  "explanation": "What a good answer should cover"
}}

Only return the JSON, no other text."""

    OPEN_ENDED_EVALUATION_PROMPT = """You are evaluating a student's answer to a learning assessment question.

QUESTION: {question}
REFERENCE ANSWER: {reference_answer}
KEY POINTS TO COVER: {key_points}
STUDENT'S ANSWER: {student_answer}

RELEVANT MATERIAL:
{material_context}

Evaluate the student's answer and return JSON in this EXACT format:
{{
  "score": 85,
  "is_correct": true,
  "feedback": "Detailed, encouraging feedback explaining what was good and what was missing",
  "concepts_demonstrated": ["concept1", "concept2"],
  "concepts_missing": ["concept3"],
  "understanding_level": "strong",
  "suggestion": "What the student should review or practice next"
}}

Be encouraging but honest. Focus on understanding, not exact wording.
Only return the JSON, no other text."""

    QUIZ_EVALUATION_PROMPT = OPEN_ENDED_EVALUATION_PROMPT


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

    RECOMMENDATION_PROMPT = """You are a learning advisor. Based on the student's current state, generate 3-5 actionable learning recommendations.

STUDENT STATE:
- Learning Goal: {learning_goal}
- Concept Mastery:
{mastery_summary}

- Recent Activity:
{recent_activity}

- Recent Quiz Performance:
{quiz_performance}

- Known Strengths: {strengths}
- Known Weaknesses: {weaknesses}

Generate recommendations as JSON array:
[
  {{
    "type": "review_material|take_quiz|tutor_session|focus_concept|practice",
    "title": "Short action title",
    "description": "2-3 sentence explanation of what to do and why",
    "priority": 8,
    "related_concept": "concept name or null"
  }}
]

Focus on:
- Weakest concepts that need attention
- Concepts trending down
- Building on strengths
- Varied activity (don't just suggest quizzes)
Only return the JSON array."""

    @staticmethod
    def sanitize_user_input(text: str) -> str:
        """
        Basic sanitization to mitigate prompt injection in user-provided text.
        Strips patterns that attempt to override system instructions.
        """
        if not isinstance(text, str):
            return str(text)

        import re
        # Remove attempts to inject system/assistant role overrides
        injection_patterns = [
            r'(?i)\b(system|assistant)\s*:\s*',     # "system:" or "assistant:" role faking
            r'(?i)ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)',
            r'(?i)you\s+are\s+now\s+',               # "you are now DAN" style
            r'(?i)pretend\s+(you\s+are|to\s+be)\s+',  # role override attempts
            r'(?i)disregard\s+(all\s+)?(instructions?|rules?)',
        ]
        sanitized = text
        for pattern in injection_patterns:
            sanitized = re.sub(pattern, '[filtered] ', sanitized)

        # Remove excessive special characters that could be used as delimiters
        sanitized = re.sub(r'[{}<>]{3,}', '', sanitized)
        # Remove null bytes and control characters (except newlines/tabs)
        sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', sanitized)

        return sanitized.strip()

    @staticmethod
    def format_prompt(template: str, **kwargs) -> str:
        """Format a prompt template with provided variables. User-provided values are sanitized."""
        # Sanitize user-provided values to prevent prompt injection
        sanitized_kwargs = {}
        for k, v in kwargs.items():
            if isinstance(v, str):
                sanitized_kwargs[k] = PromptManager.sanitize_user_input(v)
            else:
                sanitized_kwargs[k] = v

        try:
            return template.format(**sanitized_kwargs)
        except KeyError as e:
            # Fallback formatting if missing placeholder
            result = template
            for k, v in sanitized_kwargs.items():
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
OPEN_ENDED_EVALUATION_PROMPT = PromptManager.OPEN_ENDED_EVALUATION_PROMPT
CONCEPT_EXTRACTION_PROMPT = PromptManager.CONCEPT_EXTRACTION_PROMPT
DOCUMENT_SUMMARY_PROMPT = PromptManager.DOCUMENT_SUMMARY_PROMPT
CONVERSATION_SUMMARY_PROMPT = PromptManager.CONVERSATION_SUMMARY_PROMPT
RECOMMENDATION_PROMPT = PromptManager.RECOMMENDATION_PROMPT
