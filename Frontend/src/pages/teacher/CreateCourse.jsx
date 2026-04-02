import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createCourse } from '../../api/courses';

const CreateCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        description: '',
        credits: 3,
        semester: 1,
        capacity: 50,
        department: '',
        schedule: [],
        prerequisites: [],
        syllabus: '',
        textbooks: [],
        assessmentWeights: null,
    });

    // Validation rules
    const validateForm = () => {
        const newErrors = {};

        // courseCode validation: letters + numbers (e.g., CS101)
        if (!formData.courseCode.trim()) {
            newErrors.courseCode = 'Course code is required';
        } else if (!/^[A-Z]{2,4}\d{3,4}$/i.test(formData.courseCode.trim())) {
            newErrors.courseCode = 'Invalid format (e.g., CS101, MATH201)';
        }

        // courseName validation
        if (!formData.courseName.trim()) {
            newErrors.courseName = 'Course name is required';
        } else if (formData.courseName.trim().length < 5) {
            newErrors.courseName = 'Course name must be at least 5 characters';
        } else if (formData.courseName.trim().length > 100) {
            newErrors.courseName = 'Course name cannot exceed 100 characters';
        }

        // description validation
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        } else if (formData.description.trim().length > 1000) {
            newErrors.description = 'Description cannot exceed 1000 characters';
        }

        // credits validation
        const creditsNum = parseInt(formData.credits);
        if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 6) {
            newErrors.credits = 'Credits must be between 1 and 6';
        }

        // semester validation
        const semesterNum = parseInt(formData.semester);
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
            newErrors.semester = 'Semester must be between 1 and 8';
        }

        // capacity validation
        const capacityNum = parseInt(formData.capacity);
        if (isNaN(capacityNum) || capacityNum < 10 || capacityNum > 500) {
            newErrors.capacity = 'Capacity must be between 10 and 500';
        }

        // department validation
        if (!formData.department.trim()) {
            newErrors.department = 'Department is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            toast.error('Please fix all validation errors');
            return;
        }

        setLoading(true);

        try {
            // Prepare data for submission
            const submitData = {
                courseCode: formData.courseCode.trim().toUpperCase(),
                courseName: formData.courseName.trim(),
                description: formData.description.trim(),
                credits: parseInt(formData.credits),
                semester: parseInt(formData.semester),
                capacity: parseInt(formData.capacity),
                department: formData.department.trim(),
            };

            // Add optional fields only if they have values
            if (formData.schedule && formData.schedule.length > 0) {
                submitData.schedule = formData.schedule;
            }
            if (formData.prerequisites && formData.prerequisites.length > 0) {
                submitData.prerequisites = formData.prerequisites;
            }
            if (formData.syllabus && formData.syllabus.trim()) {
                submitData.syllabus = formData.syllabus.trim();
            }
            if (formData.textbooks && formData.textbooks.length > 0) {
                submitData.textbooks = formData.textbooks;
            }
            if (formData.assessmentWeights) {
                submitData.assessmentWeights = formData.assessmentWeights;
            }

            // Call API
const response = await createCourse(submitData);

if (response?.data?.success) {
    toast.success('Course created successfully!');
    navigate('/teacher/courses', { replace: true });
} else {
    toast.error(response?.data?.message || 'Failed to create course');
}
        } catch (error) {
            console.error('Course creation error:', error);

            // Handle specific error cases
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('You are not authorized to create courses');
                navigate('/login');
            } else if (error.response?.data?.message) {
                // Backend validation error
                toast.error(error.response.data.message);
                // If there are field-level errors, set them
                if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
                    const fieldErrors = {};
                    error.response.data.errors.forEach(err => {
                        if (err.field) {
                            fieldErrors[err.field] = err.message;
                        }
                    });
                    setErrors(fieldErrors);
                }
            } else if (error.message === 'Network Error' || !error.response) {
                toast.error('Network error. Please check your connection.');
            } else {
                toast.error('Failed to create course. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/teacher/courses')}
                    className="rounded-full hover:bg-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                        Create New <span className="text-primary">Course</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-serif italic mt-2">
                        Add a new course to your teaching portfolio
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1: Course Code and Course Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Course Code */}
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                    Course Code <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="courseCode"
                                    value={formData.courseCode}
                                    onChange={(e) => {
                                        const value = e.target.value.toUpperCase();
                                        setFormData(prev => ({ ...prev, courseCode: value }));
                                    }}
                                    placeholder="e.g., CS101"
                                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={loading}
                                />
                                {errors.courseCode && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.courseCode}</span>
                                    </div>
                                )}
                            </div>

                            {/* Course Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                    Course Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="courseName"
                                    value={formData.courseName}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Introduction to Computer Science"
                                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={loading}
                                />
                                {errors.courseName && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.courseName}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Description */}
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Provide a comprehensive description of the course (20-1000 characters)"
                                rows="4"
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary focus:ring-1 resize-none"
                                disabled={loading}
                            />
                            <div className="flex justify-between items-center">
                                {errors.description && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.description}</span>
                                    </div>
                                )}
                                <span className={`text-xs font-semibold ml-auto ${formData.description.length > 1000 ? 'text-red-600' : formData.description.length > 800 ? 'text-yellow-600' : 'text-slate-400'}`}>
                                    {formData.description.length}/1000
                                </span>
                            </div>
                        </div>

                        {/* Row 3: Credits, Semester, Capacity */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Credits */}
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                    Credits <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    name="credits"
                                    value={formData.credits}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="6"
                                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={loading}
                                />
                                {errors.credits && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.credits}</span>
                                    </div>
                                )}
                            </div>

                            {/* Semester */}
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                    Semester <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={loading}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                                {errors.semester && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.semester}</span>
                                    </div>
                                )}
                            </div>

                            {/* Capacity */}
                            <div className="space-y-2">
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                    Capacity <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    min="10"
                                    max="500"
                                    className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                    disabled={loading}
                                />
                                {errors.capacity && (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-semibold">{errors.capacity}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 4: Department */}
                        <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                placeholder="e.g., Computer Science"
                                className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary"
                                disabled={loading}
                            />
                            {errors.department && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs font-semibold">{errors.department}</span>
                                </div>
                            )}
                        </div>

                        {/* Row 5: Optional Syllabus */}
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
                                Syllabus (Optional)
                            </label>
                            <textarea
                                name="syllabus"
                                value={formData.syllabus}
                                onChange={handleInputChange}
                                placeholder="Add course syllabus details..."
                                rows="3"
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-primary focus:ring-1 resize-none"
                                disabled={loading}
                            />
                            <p className="text-xs text-slate-500 font-medium">
                                You can add more details to your course after creation
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-2xl py-6 font-black"
                                onClick={() => navigate('/teacher/courses')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl py-6 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Course'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateCourse;
