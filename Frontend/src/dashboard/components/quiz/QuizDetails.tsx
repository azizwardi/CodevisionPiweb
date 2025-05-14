import { useState, useEffect } from "react";
import axios from "axios";

import { Edit as FiEdit, Delete as FiTrash2, Add as FiPlus } from "@mui/icons-material";
import Button from "../ui/button/Button";
import { toastManager } from "../ui/toast/ToastContainer";
import { formatDate } from "../../utils/formatDate";
import Badge from "../ui/badge/Badge";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
  creator: {
    _id: string;
    username: string;
    email: string;
  };
  questions: string[];
  createdAt: string;
  updatedAt: string;
}

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer: string;
  points: number;
  order: number;
}

interface QuizDetailsProps {
  quizId: string;
  onEdit: (quizId: string) => void;
  onAddQuestion: (quizId: string) => void;
  onBack: () => void;
}

export default function QuizDetails({ quizId, onEdit, onAddQuestion, onBack }: QuizDetailsProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to retrieve quiz details
  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const quizResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}`);
      setQuiz(quizResponse.data);

      // Retrieve quiz questions
      const questionsResponse = await axios.get(`http://localhost:5000/quizzes/${quizId}/questions`);
      setQuestions(questionsResponse.data);

      setError(null);
    } catch (error) {
      console.error("Error retrieving quiz details:", error);
      setError("Unable to load quiz details");
    } finally {
      setLoading(false);
    }
  };

  // Load quiz details when component mounts
  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  // Function to delete a question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/quizzes/questions/${questionId}`);
      toastManager.addToast({
        title: "Success",
        description: "The question has been successfully deleted",
        type: "success",
      });
      fetchQuizDetails(); // Refresh data after deletion
    } catch (error) {
      console.error("Error deleting the question:", error);
      toastManager.addToast({
        title: "Error",
        description: "An error occurred while deleting the question",
        type: "error",
      });
    }
  };

  // Function to publish a quiz
  const handlePublishQuiz = async () => {
    console.log("Attempting to publish quiz:", quizId);
    console.log("Number of questions:", questions.length);

    if (questions.length === 0) {
      console.log("Cannot publish a quiz without questions");
      toastManager.addToast({
        title: "Warning",
        description: "You cannot publish a quiz without questions",
        type: "warning",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to publish this quiz? Once published, it will be visible to all users.")) {
      return;
    }

    try {
      console.log("Sending POST request to http://localhost:5000/quizzes/" + quizId + "/publish");
      const response = await axios.post(`http://localhost:5000/quizzes/${quizId}/publish`);
      console.log("Response received:", response.data);

      toastManager.addToast({
        title: "Success",
        description: "The quiz has been successfully published",
        type: "success",
      });
      fetchQuizDetails(); // Refresh data after publication
    } catch (error: any) {
      console.error("Error publishing the quiz:", error);

      // Display additional error details
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);

        toastManager.addToast({
          title: "Error " + error.response.status,
          description: error.response.data.message || "An error occurred while publishing the quiz",
          type: "error",
        });
      } else if (error.request) {
        console.error("Request without response:", error.request);

        toastManager.addToast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please verify that the backend is running.",
          type: "error",
        });
      } else {
        console.error("Configuration error:", error.message);

        toastManager.addToast({
          title: "Error",
          description: "An error occurred while publishing the quiz: " + error.message,
          type: "error",
        });
      }
    }
  };

  // Function to get the category label
  const getCategoryLabel = (categoryValue: string): string => {
    const categories: Record<string, string> = {
      "education": "Education",
      "technology": "Technology",
      "science": "Science",
      "history": "History",
      "geography": "Geography",
      "entertainment": "Entertainment",
      "sports": "Sports",
      "other": "Other"
    };

    return categories[categoryValue] || categoryValue;
  };

  // Function to get the question type label
  const getQuestionTypeLabel = (typeValue: string): string => {
    const types: Record<string, string> = {
      "multiple-choice": "Multiple Choice",
      "true-false": "True or False",
      "short-answer": "Short Answer"
    };

    return types[typeValue] || typeValue;
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz details...</div>;
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-8 text-red-500">
        {error || "Quiz not found"}
        <div className="mt-4">
          <Button variant="outline" onClick={onBack}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with quiz information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onEdit(quiz._id)}>
              <FiEdit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button variant="primary" onClick={() => onAddQuestion(quiz._id)}>
              <FiPlus className="h-4 w-4 mr-1" /> Add Question
            </Button>
            {!quiz.isPublished && questions.length > 0 && (
              <Button variant="primary" className="bg-green-600 hover:bg-green-700" onClick={handlePublishQuiz}>
                Publish
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
            <p>{getCategoryLabel(quiz.category)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p>
              {quiz.isPublished ? (
                <Badge color="success">Published</Badge>
              ) : (
                <Badge color="warning">Draft</Badge>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Created on</p>
            <p>{formatDate(quiz.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Question list */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Questions ({questions.length})</h3>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No questions have been added to this quiz.</p>
            <Button variant="outline" className="mt-4" onClick={() => onAddQuestion(quiz._id)}>
              <FiPlus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question._id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge color="primary">{getQuestionTypeLabel(question.questionType)}</Badge>
                      <Badge color="secondary">{question.points} point{question.points > 1 ? 's' : ''}</Badge>
                    </div>
                    <p className="mt-2">{question.questionText}</p>

                    {/* Display options for multiple choice questions */}
                    {question.questionType === "multiple-choice" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Options:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {question.options.map((option, optIndex) => (
                            <li key={optIndex} className={option.isCorrect ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                              {option.text} {option.isCorrect && "(Correct)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Display correct answer for short answer questions */}
                    {question.questionType === "short-answer" && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Correct answer:</p>
                        <p className="text-green-600 dark:text-green-400 font-medium">{question.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="p-1.5"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onBack}>
          Back to list
        </Button>
      </div>
    </div>
  );
}






