# Quiz Module Documentation

## Overview
The Quiz module provides the core logic for rendering, taking, and submitting quizzes. It supports multiple-choice questions, explanations, review mode, and responsive design for desktop and mobile.

## Main Components
- `Quiz.tsx`: Main quiz UI component. Handles question navigation, answer selection, review, and submission.
- `data/quiz.ts`: Quiz data definitions (types, sample quizzes).
- `components/ui/`: UI primitives used in the quiz (button, dialog, progress, etc).

## Features
- **Multiple Choice Support:** Single and multiple answer questions.
- **Explanations:** Markdown-formatted explanations for each question.
- **Review Mode:** Users can review and change answers before submitting.
- **Timer:** Countdown timer with auto-submit on expiration.
- **Responsive UI:** Optimized for desktop, tablet, and mobile.
- **Accessibility:** Keyboard navigation supported.

## How It Works
1. **Quiz Data:** Loaded from the backend or static files.
2. **Rendering:** Each question and its options are rendered. Explanations are shown as markdown.
3. **Answer Selection:** User selects answers, which are tracked in state.
4. **Review:** User can mark questions for review and navigate between them.
5. **Submission:** On submit, results are saved and a report is generated.

## Customization
- To add new question types, extend the `Question` and `Option` types in `data/quiz.ts` and update `Quiz.tsx`.
- To change UI, edit the components in `components/ui/` or the main `Quiz.tsx`.

## Example Usage
Import and use the `QuizUI` component in a page:
```tsx
import QuizUI from '@/components/Quiz';
import { sampleQuiz } from '@/data/quiz';

export default function QuizPage() {
  return <QuizUI quizData={sampleQuiz} />;
}
```

---
For more details, see the code comments in `Quiz.tsx`.
