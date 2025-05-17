import { useState } from "react";
import axios from "axios";
import Label from "../Label";
import Input from "../input/InputField";
import TextArea from "../input/TextArea";
import Button from "../../ui/button/Button";
import Select from "../Select";
import { toastManager } from "../../ui/toast/ToastContainer";
import { Add as FiPlus, Delete as FiTrash2 } from "@mui/icons-material";
import Radio from "../input/Radio";

interface ValidationErrors {
  questionText?: string;
  questionType?: string;
  options?: string;
  correctAnswer?: string;
  points?: string;
  newOption?: string;
  formError?: string;
}

interface AddQuestionFormProps {
  quizId: string;
  onSuccess: (addAnother?: boolean) => void;
  onCancel: () => void;
}

interface Option {
  text: string;
  isCorrect: boolean;
}

export default function AddQuestionForm({ quizId, onSuccess, onCancel }: AddQuestionFormProps) {
  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "multiple-choice",
    options: [] as Option[],
    correctAnswer: "",
    points: 1
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [selectedCorrectOption, setSelectedCorrectOption] = useState<number | null>(null);

  // Question types
  const questionTypes = [
    { value: "multiple-choice", label: "multiple-choice" },
    { value: "true-false", label: "true-false" },
    { value: "short-answer", label: "short-answer" }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    const errors = { ...validationErrors };

    if (name === "questionText") {
      // Clear existing error
      delete errors.questionText;

      // Real-time validation of the question text
      if (value.length > 0 && value.length < 5) {
        errors.questionText = "The question text must contain at least 5 characters";
      } else if (value.length > 500) {
        errors.questionText = "The question text must not exceed 500 characters";
      }
    } else if (name === "correctAnswer") {
      // Clear existing error
      delete errors.correctAnswer;

      // Real-time validation of the correct answer
      if (formData.questionType === "short-answer") {
        if (value.length > 100) {
          errors.correctAnswer = "The correct answer must not exceed 100 characters.";
        }
      }
    } else if (validationErrors[name as keyof ValidationErrors]) {
      // For other fields, simply clear the error
      delete errors[name as keyof ValidationErrors];
    }

    setValidationErrors(errors);
  };

  const handleSelectChange = (value: string) => {
    // Reset options if question type changes
    let newOptions: Option[] = [];
    let newCorrectAnswer = "";

    if (value === "true-false") {
      // Pre-fill with True/False for this type
      newOptions = [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ];
      setSelectedCorrectOption(0); // "True" is selected by default
    }

    setFormData({
      ...formData,
      questionType: value,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    });

    // Clear validation error for question type
    if (validationErrors.questionType) {
      setValidationErrors({
        ...validationErrors,
        questionType: undefined
      });
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData({
        ...formData,
        points: value
      });
    }
  };

  const handleAddOption = () => {
    // Option validation
    if (!newOptionText.trim()) {
      setValidationErrors({
        ...validationErrors,
        newOption: "Option text cannot be empty"
      });
      return;
    }

    // Check if the option already exists
    if (formData.options.some(opt => opt.text.trim().toLowerCase() === newOptionText.trim().toLowerCase())) {
      setValidationErrors({
        ...validationErrors,
        newOption: "This option already exists"
      });
      return;
    }

    // Check the option length
    if (newOptionText.length > 200) {
      setValidationErrors({
        ...validationErrors,
        newOption: "The option must not exceed 200 characters"
      });
      return;
    }

    // Clear validation error for options
    const errors = { ...validationErrors };
    delete errors.newOption;
    delete errors.options;
    setValidationErrors(errors);

    const newOption: Option = {
      text: newOptionText,
      isCorrect: false
    };

    setFormData({
      ...formData,
      options: [...formData.options, newOption]
    });

    setNewOptionText("");
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...formData.options];
    newOptions.splice(index, 1);

    // Adjust the correct option index if necessary
    let newSelectedCorrectOption = selectedCorrectOption;
    if (selectedCorrectOption !== null) {
      if (selectedCorrectOption === index) {
        newSelectedCorrectOption = null;
      } else if (selectedCorrectOption > index) {
        newSelectedCorrectOption = selectedCorrectOption - 1;
      }
    }

    setSelectedCorrectOption(newSelectedCorrectOption);

    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const handleSelectCorrectOption = (index: number) => {
    const newOptions = formData.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));

    setSelectedCorrectOption(index);

    setFormData({
      ...formData,
      options: newOptions
    });
  };

  // Field validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Question text validation
    if (!formData.questionText.trim()) {
      errors.questionText = "Question text is required";
      isValid = false;
    } else if (formData.questionText.length < 5) {
      errors.questionText = "The question text must contain at least 5 characters";
      isValid = false;
    } else if (formData.questionText.length > 500) {
      errors.questionText = "The question text must not exceed 500 characters";
      isValid = false;
    }

    // Question type validation
    if (!formData.questionType) {
      errors.questionType = "Question type is required";
      isValid = false;
    }

    // Options validation for multiple choice questions
    if (formData.questionType === "multiple-choice") {
      if (formData.options.length < 2) {
        errors.options = "At least two options are required";
        isValid = false;
      } else if (!formData.options.some(opt => opt.isCorrect)) {
        errors.options = "Please select a correct option";
        isValid = false;
      }

      // Check that each option has valid text
      const invalidOptions = formData.options.filter(opt => opt.text.trim().length < 1);
      if (invalidOptions.length > 0) {
        errors.options = "All options must contain text";
        isValid = false;
      }
    }

    // Correct answer validation for short answer questions
    if (formData.questionType === "short-answer") {
      if (!formData.correctAnswer.trim()) {
        errors.correctAnswer = "Correct answer is required";
        isValid = false;
      } else if (formData.correctAnswer.length > 100) {
        errors.correctAnswer = "The correct answer must not exceed 100 characters.";
        isValid = false;
      }
    }

    // Points validation
    if (formData.points < 1) {
      errors.points = "The question must be worth at least 1 point";
      isValid = false;
    } else if (formData.points > 10) {
      errors.points = "The question cannot be worth more than 10 points.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data to send
      const questionData = {
        ...formData
      };

      // For short answer questions, we use correctAnswer
      // For multiple choice questions, we use options with isCorrect

      const response = await axios.post(
        `http://localhost:5000/quizzes/${quizId}/questions`,
        questionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response received:", response.data);
      toastManager.addToast({
        title: "success",
        description: "The question has been added successfully.",
        type: "success",
      });

      // Reset the form if adding another question
      if (addAnother) {
        setFormData({
          questionText: "",
          questionType: "multiple-choice",
          options: [],
          correctAnswer: "",
          points: 1
        });
        setNewOptionText("");
        setSelectedCorrectOption(null);
      }

      // Call the success function
      onSuccess(addAnother);
    } catch (error) {
      console.error("Error adding question:", error);
      toastManager.addToast({
        title: "error",
        description: "An error occurred while adding the question",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationErrors.formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{validationErrors.formError}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Added question</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
          You can add multiple questions to your quiz. After adding this question, you can add more.
        </p>
      </div>
      <div>
        <Label htmlFor="questionText">Question text <span className="text-red-500">*</span></Label>
        <TextArea
          id="questionText"
          name="questionText"
          value={formData.questionText}
          onChange={(value) => handleInputChange({ target: { name: "questionText", value } } as any)}
          placeholder="Enter the text of your question"
          error={!!validationErrors.questionText}
          hint={validationErrors.questionText}
          rows={3}
          required
        />
        {!validationErrors.questionText && (
          <p className="mt-1 text-xs text-gray-500">{formData.questionText.length}/500 characters</p>
        )}
      </div>

      <div>
        <Label htmlFor="questionType">Question type <span className="text-red-500">*</span></Label>
        <Select
          id="questionType"
          options={questionTypes}
          placeholder="Select a question type"
          onChange={handleSelectChange}
          value={formData.questionType}
          className={validationErrors.questionType ? "border-red-500" : ""}
          required
        />
        {validationErrors.questionType && (
          <p className="mt-1 text-sm text-red-500">{validationErrors.questionType}</p>
        )}
      </div>

      {formData.questionType === "multiple-choice" && (
        <div className="space-y-3">
          <Label>Answer options</Label>

          {formData.options.length > 0 && (
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Radio
                    id={`option-${index}`}
                    name="correctOption"
                    value={index.toString()}
                    checked={option.isCorrect}
                    onChange={() => handleSelectCorrectOption(index)}
                    label={option.text}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-1 ml-auto"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {validationErrors.options && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.options}</p>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              value={newOptionText}
              onChange={(e) => {
                setNewOptionText(e.target.value);
                // Clear validation error for the option
                if (validationErrors.newOption) {
                  setValidationErrors({
                    ...validationErrors,
                    newOption: undefined
                  });
                }
              }}
              placeholder="New option"
              className="flex-1"
              error={!!validationErrors.newOption}
            />
            <Button
              variant="outline"
              type="button"
              onClick={handleAddOption}
              disabled={!newOptionText.trim()}
            >
              <FiPlus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {validationErrors.newOption && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.newOption}</p>
          )}

          {formData.options.length === 0 && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <span className="font-semibold">Attention:</span> You must add at least two options and select one correct answer.
              </p>
            </div>
          )}
        </div>
      )}

      {formData.questionType === "short-answer" && (
        <div>
          <Label htmlFor="correctAnswer">Correct answer <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            id="correctAnswer"
            name="correctAnswer"
            value={formData.correctAnswer}
            onChange={handleInputChange}
            placeholder="Enter the correct answer"
            error={!!validationErrors.correctAnswer}
            hint={validationErrors.correctAnswer}
            required
          />
          {!validationErrors.correctAnswer && (
            <p className="mt-1 text-xs text-gray-500">{formData.correctAnswer.length}/100 characters</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="points">Points <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          id="points"
          name="points"
          value={formData.points.toString()}
          onChange={handlePointsChange}
          min="1"
          max="10"
          error={!!validationErrors.points}
          hint={validationErrors.points}
          required
        />
        <p className="mt-1 text-xs text-gray-500">Value between 1 and 10 points</p>
      </div>

      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={loading}
          onClick={(e) => handleSubmit(e as any, true)}
          className="w-full sm:w-auto"
        >
          {loading ? "Adding..." : "Add and continue"}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Adding..." : "Add and finish"}
        </Button>
      </div>
    </form>
  );
}
