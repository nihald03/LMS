import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuestionEditor = ({ question, onSave, onCancel, bulkMode = false }) => {
    const [formData, setFormData] = useState(question || {
        questionType: 'single_select',
        questionText: '',
        points: 1,
        options: [],
        correctAnswer: [],
        difficulty: 'medium'
    });

    const [newOption, setNewOption] = useState('');
    const [newCorrectAnswer, setNewCorrectAnswer] = useState('');

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddOption = () => {
        if (!newOption.trim()) {
            toast.error('Option text cannot be empty');
            return;
        }

        const option = {
            _id: `opt_${Date.now()}`,
            optionId: String.fromCharCode(65 + formData.options.length), // A, B, C, D, etc.
            optionText: newOption
        };

        setFormData(prev => ({
            ...prev,
            options: [...prev.options, option]
        }));
        setNewOption('');
    };

    const handleRemoveOption = (optionId) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter(opt => opt._id !== optionId)
        }));
    };

    const handleSetCorrectAnswer = (optionId) => {
        if (formData.questionType === 'single_select') {
            setFormData(prev => ({
                ...prev,
                correctAnswer: [optionId]
            }));
        } else {
            setFormData(prev => {
                const newAnswers = prev.correctAnswer.includes(optionId)
                    ? prev.correctAnswer.filter(id => id !== optionId)
                    : [...prev.correctAnswer, optionId];
                return { ...prev, correctAnswer: newAnswers };
            });
        }
    };

    const handleSubmit = () => {
        if (!formData.questionText.trim()) {
            toast.error('Question text is required');
            return;
        }
        if (formData.options.length < 2) {
            toast.error('Add at least 2 options');
            return;
        }
        if (formData.correctAnswer.length === 0) {
            toast.error('Select at least one correct answer');
            return;
        }

        onSave(formData);
    };

    const handleAddAnotherClick = () => {
        // Validate before saving
        if (!formData.questionText.trim()) {
            toast.error('Question text is required');
            return;
        }
        if (formData.options.length < 2) {
            toast.error('Add at least 2 options');
            return;
        }
        if (formData.correctAnswer.length === 0) {
            toast.error('Select at least one correct answer');
            return;
        }

        // Save and keep modal open (parent component handles this)
        onSave(formData);
    };

    return (
        <div className="space-y-6">
            {/* Question Type */}
            <div>
                <label className="block text-sm font-bold mb-2">Question Type *</label>
                <select
                    value={formData.questionType}
                    onChange={(e) => handleInputChange('questionType', e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="single_select">Multiple Choice (Single Answer)</option>
                    <option value="multiple_select">Multiple Answer</option>
                    <option value="true_false">True/False</option>
                </select>
            </div>

            {/* Question Text */}
            <div>
                <label className="block text-sm font-bold mb-2">Question Text *</label>
                <textarea
                    value={formData.questionText}
                    onChange={(e) => handleInputChange('questionText', e.target.value)}
                    placeholder="Enter your question here"
                    rows="3"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Points & Difficulty */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold mb-2">Points</label>
                    <Input
                        type="number"
                        value={formData.points}
                        onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                        min="1"
                        className="rounded-xl"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">Difficulty</label>
                    <select
                        value={formData.difficulty}
                        onChange={(e) => handleInputChange('difficulty', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
            </div>

            {/* Options */}
            <div>
                <label className="block text-sm font-bold mb-3">Options *</label>
                
                {formData.questionType === 'true_false' ? (
                    <div className="space-y-2">
                        {[
                            { id: 'true', text: 'True', optionId: 'A' },
                            { id: 'false', text: 'False', optionId: 'B' }
                        ].map(opt => (
                            <label key={opt.id} className="flex items-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="correct_answer"
                                    checked={formData.correctAnswer.includes(opt.id)}
                                    onChange={() => handleSetCorrectAnswer(opt.id)}
                                    className="w-5 h-5"
                                />
                                <span className="ml-4 font-bold flex-1">{opt.text}</span>
                                <Badge variant="outline" className="text-xs">{opt.optionId}</Badge>
                            </label>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="space-y-2 mb-4">
                            {formData.options.map((option) => (
                                <div key={option._id} className="flex items-center gap-2 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 group">
                                    <input
                                        type={formData.questionType === 'single_select' ? 'radio' : 'checkbox'}
                                        name="correct_answer"
                                        checked={formData.correctAnswer.includes(option._id)}
                                        onChange={() => handleSetCorrectAnswer(option._id)}
                                        className="w-5 h-5"
                                    />
                                    <Badge variant="outline" className="text-xs font-bold min-w-8 justify-center">
                                        {option.optionId}
                                    </Badge>
                                    <span className="flex-1 font-bold text-slate-900">{option.optionText}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(option._id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                                placeholder={`Enter option ${String.fromCharCode(65 + formData.options.length)}`}
                                className="rounded-xl"
                            />
                            <Button
                                type="button"
                                onClick={handleAddOption}
                                variant="outline"
                                className="rounded-xl px-6"
                            >
                                <Plus className="w-5 h-5" /> Add
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {/* Correct Answer Indicator */}
            {formData.correctAnswer.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm font-bold text-green-900 mb-2">Correct Answer(s):</p>
                    <div className="flex flex-wrap gap-2">
                        {formData.correctAnswer.map(answerId => {
                            const option = formData.options.find(o => o._id === answerId);
                            return (
                                <Badge key={answerId} className="bg-green-600 text-white">
                                    {option?.optionId || answerId}: {option?.optionText || answerId}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl px-8 h-11 font-bold"
                >
                    {bulkMode ? 'Done Adding' : 'Cancel'}
                </Button>
                {bulkMode && (
                    <Button
                        onClick={handleAddAnotherClick}
                        variant="outline"
                        className="rounded-xl px-8 h-11 font-bold"
                    >
                        {question ? 'Update & Add Another' : '+ Add Another'}
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    className="rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20"
                >
                    {question ? 'Update Question' : 'Add Question'}
                </Button>
            </div>
        </div>
    );
};

export default QuestionEditor;
