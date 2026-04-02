import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getLectureQuestionAnalytics } from '../../api/inLectureQuestions';
import { toast } from 'react-hot-toast';

const QuestionAnalytics = ({ lectureId, onClose }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [lectureId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getLectureQuestionAnalytics(lectureId);
            setAnalytics(response.data);
            console.log("ANALYTICS FULL:", response);
            console.log("ANALYTICS FINAL:", response.data);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to fetch analytics';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (questionId) => {
        setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-4xl max-h-[90vh] border-none shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col">
                {/* Header */}
                <CardHeader className="bg-slate-50 p-8 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                            📊 Question Analytics
                        </CardTitle>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Detailed insights into student responses
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-slate-200"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </Button>
                </CardHeader>

                {/* Content */}
                <CardContent className="flex-1 overflow-y-auto p-8 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                            <p className="text-slate-600 font-medium">Loading analytics...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center py-12 text-red-600">
                            <AlertCircle className="w-8 h-8 mb-3" />
                            <p className="font-medium text-center">{error}</p>
                        </div>
                    ) : !analytics?.questions || analytics.questions.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-slate-500">
                            <AlertCircle className="w-8 h-8 mb-3" />
                            <p className="font-medium">No questions created for this lecture yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-2xl p-4">
                                    <p className="text-sm font-semibold text-blue-600">Total Questions</p>
                                    <p className="text-3xl font-black text-blue-700 mt-2">
                                        {analytics.totalQuestions}
                                    </p>
                                </div>
                                <div className="bg-emerald-50 rounded-2xl p-4">
                                    <p className="text-sm font-semibold text-emerald-600">Total Responses</p>
                                    <p className="text-3xl font-black text-emerald-700 mt-2">
                                        {analytics.questions.reduce((sum, q) => sum + q.totalResponses, 0)}
                                    </p>
                                </div>
                                <div className="bg-purple-50 rounded-2xl p-4">
                                    <p className="text-sm font-semibold text-purple-600">Avg Accuracy</p>
                                    <p className="text-3xl font-black text-purple-700 mt-2">
                                        {analytics.questions.length > 0
                                            ? (
                                                analytics.questions.reduce((sum, q) => sum + q.accuracy, 0) /
                                                analytics.questions.length
                                            ).toFixed(1)
                                            : 0}
                                        %
                                    </p>
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-4 mt-8">
                                {analytics.questions.map((question, index) => (
                                    <div
                                        key={question.questionId}
                                        className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-all"
                                    >
                                        {/* Question Header */}
                                        <button
                                            onClick={() => toggleExpanded(question.questionId)}
                                            className="w-full bg-slate-50 hover:bg-slate-100 p-6 flex items-start justify-between transition-colors"
                                        >
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-700">
                                                        Q{index + 1}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {question.timeMarker}s
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {question.questionText}
                                                </p>
                                            </div>
                                            {expandedQuestion === question.questionId ? (
                                                <ChevronUp className="w-5 h-5 text-slate-600 flex-shrink-0 ml-3 mt-1" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-600 flex-shrink-0 ml-3 mt-1" />
                                            )}
                                        </button>

                                        {/* Question Stats */}
                                        <div className="bg-white px-6 py-4 border-t border-slate-200 grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    Total Responses
                                                </p>
                                                <p className="text-2xl font-black text-slate-900 mt-1">
                                                    {question.totalResponses}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    Correct
                                                </p>
                                                <p className="text-2xl font-black text-emerald-600 mt-1">
                                                    {question.correctCount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                                    Incorrect
                                                </p>
                                                <p className="text-2xl font-black text-red-600 mt-1">
                                                    {question.wrongCount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                                    Accuracy
                                                </p>
                                                <p className="text-2xl font-black text-blue-600 mt-1">
                                                    {question.accuracy}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Responses Table */}
                                        {expandedQuestion === question.questionId && (
                                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                                                {question.responses.length === 0 ? (
                                                    <p className="text-slate-500 text-sm font-medium text-center py-4">
                                                        No responses yet
                                                    </p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b border-slate-200">
                                                                    <th className="text-left py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600">
                                                                        Student ID
                                                                    </th>
                                                                    <th className="text-left py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600">
                                                                        Selected Option
                                                                    </th>
                                                                    <th className="text-left py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600">
                                                                        Result
                                                                    </th>
                                                                    <th className="text-left py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600">
                                                                        Points
                                                                    </th>
                                                                    <th className="text-left py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600">
                                                                        Answered At
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {question.responses.map((response, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className="border-b border-slate-100 hover:bg-white transition-colors"
                                                                    >
                                                                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                                                                                    {response.studentId?.firstName
                                                                                    ? `${response.studentId.firstName} ${response.studentId.lastName}`
                                                                                    : 'Unknown Student'}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-slate-700 font-medium">
                                                                            {response.selectedOption || '-'}
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <Badge
                                                                                className={
                                                                                    response.isCorrect
                                                                                        ? 'bg-emerald-100 text-emerald-700 font-bold'
                                                                                        : 'bg-red-100 text-red-700 font-bold'
                                                                                }
                                                                            >
                                                                                {response.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="py-3 px-4 font-black text-slate-900">
                                                                            {response.pointsAwarded}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-slate-600 text-xs">
                                                                            {formatDate(response.answeredAt)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-8 flex justify-end">
                    <Button onClick={onClose} className="rounded-2xl h-12 px-8 font-black text-sm uppercase tracking-widest">
                        Close
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default QuestionAnalytics;
