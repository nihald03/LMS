import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Check, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const LectureQuestionModal = ({ 
    question, 
    onSubmit, 
    onClose, 
    isLoading = false,
    submittedAnswer = null,
    isCorrect = null,
    pointsAwarded = null
}) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [hasAnswered, setHasAnswered] = useState(false);

    useEffect(() => {
        if (submittedAnswer) {
            setSelectedOption(submittedAnswer);
            setHasAnswered(true);
            setShowFeedback(true);
        }
    }, [submittedAnswer]);

    const handleSubmit = async () => {
        if (!selectedOption) {
            alert('Please select an option');
            return;
        }

const result = await onSubmit(selectedOption);

// ✅ lock after first attempt
setHasAnswered(true);
setShowFeedback(true);
    };

    if (!question) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-slate-800">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                            Question
                        </Badge>
                        <span className="text-sm font-bold text-slate-400">
                            {question.points} {question.points === 1 ? 'point' : 'points'}
                        </span>
                    </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                        <X className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Question Text */}
                    <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                        {question.questionText}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {question.options && question.options.length > 0 ? (
                            question.options.map((option) => (
                                <button
                                    key={option.optionId}
                                    onClick={() => !hasAnswered && setSelectedOption(option.optionId)}
                                    disabled={hasAnswered}
                                    className={cn(
                                        "w-full p-4 rounded-lg border-2 transition-all text-left font-semibold text-base",
                                        selectedOption === option.optionId
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-white/10 bg-slate-700/50 text-white hover:border-white/20 hover:bg-slate-700",
                                        hasAnswered && "cursor-not-allowed opacity-75",
                                        // Show correct/incorrect feedback
                                        showFeedback && hasAnswered && (
                                            option.isCorrect
                                                ? "border-green-500 bg-green-500/10 text-green-400"
                                                : selectedOption === option.optionId
                                                ? "border-red-500 bg-red-500/10 text-red-400"
                                                : "border-white/10 bg-slate-700/50 text-slate-400"
                                        )
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.optionText}</span>
                                        {showFeedback && hasAnswered && (
                                            <span>
                                                {option.isCorrect && (
                                                    <Check className="w-5 h-5 text-green-400" />
                                                )}
                                                {!option.isCorrect && selectedOption === option.optionId && (
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className="text-slate-400">No options available</p>
                        )}
                    </div>

                    {/* Feedback Message */}
                    {showFeedback && hasAnswered && (
                        <div className={cn(
                            "p-4 rounded-lg mb-8 border-l-4 flex items-start gap-3",
                            isCorrect === true
                                ? "bg-green-500/10 border-green-500 text-green-400"
                                : isCorrect === false
                                ? "bg-red-500/10 border-red-500 text-red-400"
                                : "bg-slate-700/50 border-white/10 text-white"
                        )}>
                            <div className="mt-0.5">
                                {isCorrect === true ? (
                                    <Check className="w-5 h-5" />
                                ) : isCorrect === false ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : null}
                            </div>
                            <div>
                                <p className="font-bold mb-1">
                                    {isCorrect === true
                                        ? '✓ Correct!'
                                        : isCorrect === false
                                        ? '✗ Incorrect'
                                        : ''}
                                </p>
                                <p className="text-sm opacity-90">
                                {isCorrect === true
                                    ? `You earned ${pointsAwarded} ${pointsAwarded === 1 ? 'point' : 'points'}`
                                    : isCorrect === false
                                    ? `Please review the material and try again`
                                    : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                        {!hasAnswered ? (
                            <>
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="border-white/20 text-slate-300 hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!selectedOption || isLoading}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold uppercase text-sm tracking-widest px-6"
                                >
                                    {isLoading ? 'Submitting...' : 'Submit Answer'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={onClose}
                                className="bg-primary hover:bg-primary/90 text-white font-bold uppercase text-sm tracking-widest px-6"
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LectureQuestionModal;
