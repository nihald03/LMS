import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createInLectureQuestion } from '../../api/inLectureQuestions';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const AddQuestionModal = ({ lectureId, onClose, onSuccess }) => {
    // Form state
    const [questionText, setQuestionText] = useState('');
    const [timeMarker, setTimeMarker] = useState('');
    const [options, setOptions] = useState([
        { optionId: 'A', optionText: '' },
        { optionId: 'B', optionText: '' },
        { optionId: 'C', optionText: '' },
        { optionId: 'D', optionText: '' }
    ]);
    const [correctOption, setCorrectOption] = useState('A');

    // UI state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Handle option text change
    const handleOptionChange = (index, text) => {
        const newOptions = [...options];
        newOptions[index].optionText = text;
        setOptions(newOptions);
    };

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        // Validate question text
        if (!questionText.trim()) {
            newErrors.questionText = 'Question text cannot be empty';
        }

        // Validate timeMarker
        if (timeMarker === '') {
            newErrors.timeMarker = 'Time marker is required';
        } else if (isNaN(timeMarker) || timeMarker < 0) {
            newErrors.timeMarker = 'Time must be a positive number (in seconds)';
        }

        // Validate all options are filled
        options.forEach((opt, idx) => {
            if (!opt.optionText.trim()) {
                newErrors[`option_${idx}`] = `Option ${opt.optionId} cannot be empty`;
            }
        });

        // Validate correct option is selected
        if (!correctOption) {
            newErrors.correctOption = 'Please select the correct answer';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!lectureId) {
            toast.error('Lecture ID is missing');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Build question payload
            const questionPayload = {
                questionText: questionText.trim(),
                timeMarker: Number(timeMarker),
                options: options.map(opt => ({
                    optionId: opt.optionId,
                    optionText: opt.optionText.trim(),
                    isCorrect: opt.optionId === correctOption
                }))
            };

            console.log('📝 Creating question:', questionPayload);

            // Call API
            const response = await createInLectureQuestion(lectureId, questionPayload);

            console.log('✅ Question created:', response);

            // Show success message
            toast.success('Question created successfully!');

            // Trigger callback and close modal
            if (onSuccess) {
                onSuccess(response.data);
            }

            onClose();
        } catch (error) {
            console.error('❌ Error creating question:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create question. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[95vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-slate-800/95 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 font-bold">
                            Create Question
                        </Badge>
                        <span className="text-sm font-semibold text-slate-400">Add time-based MCQ</span>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Question Text Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-white uppercase tracking-wider">
                            Question Text
                        </label>
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Enter the question text here..."
                            disabled={loading}
                            className={cn(
                                "w-full h-24 bg-slate-700/50 border-2 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none font-medium",
                                errors.questionText ? "border-red-500/50" : "border-white/10"
                            )}
                        />
                        {errors.questionText && (
                            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                {errors.questionText}
                            </div>
                        )}
                    </div>

                    {/* Time Marker Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-white uppercase tracking-wider">
                            Time Marker (seconds)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={timeMarker}
                            onChange={(e) => setTimeMarker(e.target.value)}
                            placeholder="e.g., 45 (question will trigger at 45s)"
                            disabled={loading}
                            className={cn(
                                "w-full bg-slate-700/50 border-2 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium",
                                errors.timeMarker ? "border-red-500/50" : "border-white/10"
                            )}
                        />
                        {errors.timeMarker ? (
                            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                {errors.timeMarker}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-xs font-medium">
                                Question will appear when video reaches {timeMarker || '0'} seconds (±1 second tolerance)
                            </p>
                        )}
                    </div>

                    {/* Options Section */}
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-white uppercase tracking-wider">
                            Options
                        </label>
                        <div className="space-y-3">
                            {options.map((option, idx) => (
                                <div key={option.optionId} className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        {/* Radio button */}
                                        <div className="mt-3">
                                            <input
                                                type="radio"
                                                id={`correct_${option.optionId}`}
                                                name="correctOption"
                                                value={option.optionId}
                                                checked={correctOption === option.optionId}
                                                onChange={() => setCorrectOption(option.optionId)}
                                                disabled={loading}
                                                className="w-5 h-5 cursor-pointer accent-primary"
                                            />
                                        </div>

                                        {/* Option input */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <label className="inline-block min-w-8 font-bold text-primary text-lg">
                                                    {option.optionId}.
                                                </label>
                                                <input
                                                    type="text"
                                                    value={option.optionText}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    placeholder={`Enter option ${option.optionId}`}
                                                    disabled={loading}
                                                    className={cn(
                                                        "flex-1 bg-slate-700/50 border-2 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm",
                                                        errors[`option_${idx}`] ? "border-red-500/50" : "border-white/10"
                                                    )}
                                                />
                                                {correctOption === option.optionId && (
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                )}
                                            </div>
                                            {errors[`option_${idx}`] && (
                                                <p className="text-red-400 text-xs font-semibold mt-1">
                                                    {errors[`option_${idx}`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.correctOption && (
                            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                                <AlertCircle className="w-4 h-4" />
                                {errors.correctOption}
                            </div>
                        )}
                        <p className="text-slate-400 text-xs font-medium">
                            Select the radio button next to the correct answer
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-6 border-t border-white/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-white font-semibold px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-2 rounded-lg shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Question'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddQuestionModal;
