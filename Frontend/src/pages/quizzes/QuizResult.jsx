import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Trophy,
    XCircle,
    CheckCircle2,
    ChevronRight,
    RotateCcw,
    Home,
    Search,
    AlertCircle
} from 'lucide-react';

const QuizResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { quizId } = useParams();
    const { result } = location.state || {};

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                <AlertCircle className="w-16 h-16 text-slate-300" />
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">Result Not Found</h2>
                    <p className="text-slate-500 font-medium">We couldn't find your attempt record. Please return to the quiz list.</p>
                </div>
                <Button onClick={() => navigate('/quizzes')} className="rounded-2xl font-bold px-8">Back to Quizzes</Button>
            </div>
        );
    }

    const { attempt, message } = result;
    const isPassed = attempt.isPassed;

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Success/Fail Banner */}
            <div className={`relative -mx-4 md:-mx-8 p-12 md:p-20 text-white overflow-hidden rounded-b-[4rem] shadow-2xl transition-colors duration-700 ${isPassed ? 'bg-green-600' : 'bg-red-600'
                }`}>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 blur-[120px] rounded-full"></div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-4">
                        {isPassed ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
                    </div>
                    <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                        {isPassed ? 'Passed' : 'Not Passed'}
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
                        {isPassed ? 'Congratulations!' : 'Keep Practicing.'}
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-white text-center p-10 space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Percentage</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className={`text-6xl font-black tracking-tighter ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${attempt.percentage}%` }}
                        />
                    </div>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] bg-slate-900 text-white p-10 space-y-4 flex flex-col justify-center text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Points Earned</p>
                    <div className="text-6xl font-black tracking-tighter">
                        {attempt.totalPoints}
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Attempt #{attempt.attemptNumber}</p>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center px-4">
                <Button
                    onClick={() => navigate(`/quizzes/attempt/${quizId}`)}
                    variant="outline"
                    className="h-16 px-10 rounded-2xl border-2 border-slate-100 font-black text-sm uppercase tracking-widest hover:bg-slate-50 flex-1 md:flex-none"
                >
                    <RotateCcw className="w-5 h-5 mr-3" /> Try Again
                </Button>
                <Button
                    onClick={() => navigate('/quizzes')}
                    className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 flex-1 md:flex-none"
                >
                    <Home className="w-5 h-5 mr-3" /> Back to Quizzes
                </Button>
            </div>
        </div>
    );
};

export default QuizResult;
