import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  ArrowLeft,
  Calendar,
  Sparkles,
  Heart,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const apiUrl = import.meta.env.VITE_APP_API_URL;

interface Member {
  email: string;
  role: string;
  isVirtual: boolean;
}

interface Profile {
  profileId: number;
  fullName: string;
  relationship: string;
  dateOfBirth?: string;
  isVirtual: boolean;
}

interface FamilyData {
  inFamily: boolean;
  groupName?: string;
  familyGroupId?: number;
  members: Member[];
  profiles: Profile[];
}

export default function Family() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileRelationship, setProfileRelationship] = useState("Spouse");
  const [profileDob, setProfileDob] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/user`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data && data.authenticated === true) {
            setIsAuthenticated(true);
            return;
          }
        }
        setIsAuthenticated(false);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/auth/login");
    } else if (isAuthenticated === true) {
      fetchFamilyData();
    }
  }, [isAuthenticated, navigate]);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/family/members`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyData(data);
      } else {
        throw new Error("Failed to load family data");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while fetching family data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`${apiUrl}/family/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName: groupNameInput }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Family group created successfully!");
        setGroupNameInput("");
        fetchFamilyData();
      } else {
        throw new Error(data.message || "Failed to create family group");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`${apiUrl}/family/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`User ${inviteEmail} added to your family group successfully!`);
        setInviteEmail("");
        fetchFamilyData();
      } else {
        throw new Error(data.message || "Failed to invite user");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`${apiUrl}/family/profiles/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileName,
          relationship: profileRelationship,
          dateOfBirth: profileDob,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Virtual family profile added successfully!");
        setProfileName("");
        setProfileDob("");
        fetchFamilyData();
      } else {
        throw new Error(data.message || "Failed to add profile");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            {isAuthenticated === null ? "Checking authorization..." : "Loading family details..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-indigo-600" />
              Family Insurance Workspace
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your family members and coordinate your insurance coverage together.
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!familyData?.inFamily ? (
          <Card className="border-indigo-100 shadow-md">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Create a Family Group</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Group up to list your policy cards together. You will be able to tag cards with family profiles and invite members to view them!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGroup} className="max-w-md mx-auto flex gap-3 mt-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Group Name (e.g. Melvin Family)"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    required
                    className="border-indigo-100 focus:border-indigo-300"
                  />
                </div>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Create Group
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col - Current Group info & Members */}
            <div className="lg:col-span-2 space-y-8">
              {/* Group Name Card */}
              <Card className="border-indigo-50 shadow-sm overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-800">
                        {familyData.groupName}
                      </CardTitle>
                      <CardDescription>Active Family Insurance Group</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      ID: #{familyData.familyGroupId}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Registered Members
                  </h3>
                  <div className="space-y-3">
                    {familyData.members.map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{member.email}</p>
                            <p className="text-xs text-slate-400">Linked User Account</p>
                          </div>
                        </div>
                        <Badge className={member.role === "ADMIN" ? "bg-indigo-600" : "bg-slate-500"}>
                          {member.role}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-8 mb-4">
                    Virtual Member Profiles
                  </h3>
                  {familyData.profiles.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-slate-200 rounded-lg text-slate-400">
                      No virtual family profiles added yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {familyData.profiles.map((profile) => (
                        <div
                          key={profile.profileId}
                          className="p-4 rounded-lg border border-indigo-50 bg-white shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-slate-800">{profile.fullName}</h4>
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50">
                                {profile.relationship}
                              </Badge>
                            </div>
                            {profile.dateOfBirth && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                DOB: {new Date(profile.dateOfBirth).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col - Action Panel */}
            <div className="space-y-6">
              {/* Add Virtual Profile */}
              <Card className="shadow-sm border-slate-100">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-indigo-500" />
                    Add Virtual Member
                  </CardTitle>
                  <CardDescription>
                    Add family members (like children or dependents) to tag them with policies.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProfile} className="space-y-4">
                    <div>
                      <Label htmlFor="vName">Full Name</Label>
                      <Input
                        id="vName"
                        placeholder="e.g. Liam Melvin"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vRel">Relationship</Label>
                      <select
                        id="vRel"
                        value={profileRelationship}
                        onChange={(e) => setProfileRelationship(e.target.value)}
                        className="w-full mt-1 border border-slate-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="vDob">Date of Birth</Label>
                      <Input
                        id="vDob"
                        type="date"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2">
                      <Plus className="h-4 w-4" /> Add Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Invite User Card */}
              <Card className="shadow-sm border-slate-100">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-indigo-500" />
                    Link Family Member
                  </CardTitle>
                  <CardDescription>
                    Invite a registered member of InsureTracks to see the shared pool.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteUser} className="space-y-4">
                    <div>
                      <Label htmlFor="email">User Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="spouse@email.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900">
                      Link Member
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
