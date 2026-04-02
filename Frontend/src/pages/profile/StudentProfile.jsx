import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import { updateProfile } from '../../api/student';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import {
    User,
    Mail,
    Shield,
    Calendar,
    Edit2,
    Save,
    X,
    GraduationCap,
    Award,
    BookOpen,
    Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentProfile = () => {
    const { user, setUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        profilePicture: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            const profileData = response.data.data;
            setProfile(profileData);
            setFormData({
                name: profileData.user?.name || '',
                profilePicture: profileData.user?.profilePicture || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await updateProfile(formData);
            const updatedUser = response.data.data.user;

            // Update local state and context
            setProfile(prev => ({ ...prev, user: updatedUser }));
            setUser(updatedUser);

            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Profile...</div>;

    const studentData = profile?.student || {};
    const userData = profile?.user || {};

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Hero */}
            <div className="relative h-48 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
                <div className="absolute -bottom-12 left-12 flex items-end gap-6">
                    <div className="relative group">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-2xl rounded-[2rem]">
                            <AvatarImage src={userData.profilePicture} />
                            <AvatarFallback className="bg-primary text-white text-4xl font-black">
                                {userData.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <button className="absolute inset-0 bg-black/40 rounded-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white w-8 h-8" />
                            </button>
                        )}
                    </div>
                    <div className="mb-4 space-y-1">
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            {userData.name}
                            <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black px-2">Student</Badge>
                        </h1>
                        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">{studentData.studentId || 'ID Pending'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16 px-4">
                {/* Left Column: Stats & Basic Info */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Academic Stats */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" /> Academic Standing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GPA</p>
                                    <p className="text-2xl font-black text-slate-900">{studentData.gpa?.toFixed(2) || '0.00'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credits</p>
                                    <p className="text-2xl font-black text-slate-900">{studentData.totalCreditsCompleted || 0}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Completed Courses</span>
                                    <span className="font-black text-primary">{studentData.completedCourses?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Current Semester</span>
                                    <span className="font-black text-slate-900">{studentData.semester || 1}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enrollment Date</span>
                                    <span className="font-black text-slate-900">
                                        {studentData.enrollmentDate ? new Date(studentData.enrollmentDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <div className="bg-white p-6 space-y-6 rounded-[2rem] shadow-xl shadow-slate-200/40">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                                    <p className="font-bold text-slate-900">{userData.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Status</p>
                                    <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px]">Active</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Profile / Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem]">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
                            <div>
                                <CardTitle className="text-2xl font-black">Profile Management</CardTitle>
                                <CardDescription>Update your personal information and profile picture</CardDescription>
                            </div>
                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="rounded-xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                                >
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleUpdate} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                            <Input
                                                disabled={!isEditing}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="pl-12 h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary font-bold shadow-inner"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Profile Picture URL</label>
                                        <div className="relative">
                                            <Camera className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                            <Input
                                                disabled={!isEditing}
                                                value={formData.profilePicture}
                                                onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                                                className="pl-12 h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-primary font-bold shadow-inner"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                                        <Button
                                            type="submit"
                                            className="flex-1 rounded-xl h-12 font-black shadow-xl shadow-primary/20"
                                        >
                                            <Save className="w-4 h-4 mr-2" /> Save Changes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    name: userData.name,
                                                    profilePicture: userData.profilePicture || ''
                                                });
                                            }}
                                            className="flex-1 rounded-xl h-12 font-black text-slate-400 hover:text-slate-900"
                                        >
                                            <X className="w-4 h-4 mr-2" /> Cancel
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {/* Quick Links / Recent Achievements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-primary text-white overflow-hidden relative group cursor-pointer hover:translate-y-[-4px] transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <Award className="w-24 h-24" />
                            </div>
                            <CardContent className="p-8 space-y-4">
                                <h3 className="text-xl font-black">My Achievements</h3>
                                <p className="text-primary-foreground/80 font-medium text-sm">View certificates and badges earned from completed courses</p>
                                <Button variant="secondary" className="bg-white text-primary rounded-xl font-black px-6">View Gallery</Button>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-slate-900 text-white overflow-hidden relative group cursor-pointer hover:translate-y-[-4px] transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-24 h-24" />
                            </div>
                            <CardContent className="p-8 space-y-4">
                                <h3 className="text-xl font-black">Continue Learning</h3>
                                <p className="text-slate-400 font-medium text-sm">Jump back into your most recently accessed lecture</p>
                                <Button variant="secondary" className="bg-white text-slate-900 rounded-xl font-black px-6">Resume Now</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
