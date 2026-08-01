'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/client';
import { motion, Reorder } from 'motion/react';
import { Plus, GripVertical, Trash2, Edit2, Link as LinkIcon, DollarSign, Calendar, Building, Briefcase, MapPin, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

export interface JobApplication {
  id: string;
  company_name: string;
  role_title: string;
  status: JobStatus;
  url?: string;
  salary_range?: string;
  notes?: string;
  created_at: string;
}

const COLUMNS: JobStatus[] = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

export function JobTracker() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    status: 'Saved' as JobStatus,
    url: '',
    salary_range: '',
    notes: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseClient
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load jobs');
      console.error(error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const handleDragEnd = async (job: JobApplication, newStatus: JobStatus) => {
    if (job.status === newStatus) return;

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', job.id);

    if (error) {
      toast.error('Failed to update job status');
      fetchJobs(); // Revert
    } else {
      toast.success(`Moved to ${newStatus}`);
    }
  };

  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.role_title) {
      toast.error("Company and Role are required");
      return;
    }

    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) return;

    if (editingJob) {
      const { error } = await supabaseClient
        .from('job_applications')
        .update({
          company_name: formData.company_name,
          role_title: formData.role_title,
          status: formData.status,
          url: formData.url,
          salary_range: formData.salary_range,
          notes: formData.notes,
        })
        .eq('id', editingJob.id);

      if (error) {
        toast.error('Failed to update job');
      } else {
        toast.success('Job updated');
        setIsAddModalOpen(false);
        setEditingJob(null);
        fetchJobs();
      }
    } else {
      const { error } = await supabaseClient
        .from('job_applications')
        .insert([{
          user_id: user.id,
          company_name: formData.company_name,
          role_title: formData.role_title,
          status: formData.status,
          url: formData.url,
          salary_range: formData.salary_range,
          notes: formData.notes,
        }]);

      if (error) {
        toast.error('Failed to add job');
      } else {
        toast.success('Job added');
        setIsAddModalOpen(false);
        fetchJobs();
      }
    }
  };

  const deleteJob = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('job_applications')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete job');
    } else {
      toast.success('Job deleted');
      fetchJobs();
    }
  };

  const openEditModal = (job: JobApplication) => {
    setEditingJob(job);
    setFormData({
      company_name: job.company_name,
      role_title: job.role_title,
      status: job.status,
      url: job.url || '',
      salary_range: job.salary_range || '',
      notes: job.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const openNewModal = (initialStatus: JobStatus = 'Saved') => {
    setEditingJob(null);
    setFormData({
      company_name: '',
      role_title: '',
      status: initialStatus,
      url: '',
      salary_range: '',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const columnConfig = {
    'Saved': { color: 'border-gray-200 bg-gray-50/50', header: 'bg-gray-100 text-gray-700' },
    'Applied': { color: 'border-blue-200 bg-blue-50/50', header: 'bg-blue-100 text-blue-800' },
    'Interviewing': { color: 'border-purple-200 bg-purple-50/50', header: 'bg-purple-100 text-purple-800' },
    'Offer': { color: 'border-green-200 bg-green-50/50', header: 'bg-green-100 text-green-800' },
    'Rejected': { color: 'border-red-200 bg-red-50/50', header: 'bg-red-100 text-red-800' },
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500">Track your job applications and interviews in one place.</p>
        </div>
        <button
          onClick={() => openNewModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm active:scale-95"
        >
          <Plus size={16} />
          <span>Add Opportunity</span>
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 snap-x">
        {COLUMNS.map(status => {
          const columnJobs = jobs.filter(j => j.status === status);
          const config = columnConfig[status];
          
          return (
            <div 
              key={status} 
              className={`flex-shrink-0 w-80 h-full max-h-full flex flex-col rounded-xl border ${config.color} snap-center`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const jobId = e.dataTransfer.getData('jobId');
                const job = jobs.find(j => j.id === jobId);
                if (job) handleDragEnd(job, status);
              }}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b border-white/50 flex justify-between items-center ${config.header} rounded-t-xl`}>
                <h3 className="font-bold text-sm">{status}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50">{columnJobs.length}</span>
              </div>
              
              {/* Column Body */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {columnJobs.map(job => (
                  <motion.div
                    key={job.id}
                    layoutId={job.id}
                    draggable
                    onDragStart={(e) => {
                      (e as any).dataTransfer.setData('jobId', job.id);
                    }}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-sm leading-tight">{job.role_title}</h4>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(job)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={12} /></button>
                        <button onClick={() => deleteJob(job.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                      <Building size={12} className="text-gray-400 shrink-0" />
                      <span className="font-medium truncate">{job.company_name}</span>
                    </div>

                    <div className="space-y-1.5">
                      {job.salary_range && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded w-fit">
                          <DollarSign size={10} className="text-gray-400 shrink-0" />
                          <span>{job.salary_range}</span>
                        </div>
                      )}
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-blue-600 hover:underline px-1 w-fit">
                          <LinkIcon size={10} className="shrink-0" />
                          <span className="truncate max-w-[200px]">View Posting</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {columnJobs.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200/60 rounded-xl">
                    <span className="text-xs font-medium text-gray-400">Empty</span>
                  </div>
                )}
                
                {/* Add Quick Job Button */}
                <button 
                  onClick={() => openNewModal(status)}
                  className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:bg-white rounded-lg hover:shadow-sm border border-transparent hover:border-gray-200 transition-all group/add"
                >
                  <Plus size={14} className="text-gray-400 group-hover/add:text-gray-900 transition-colors" />
                  <span className="group-hover/add:text-gray-900 transition-colors">Add to {status}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{editingJob ? 'Edit Opportunity' : 'Add Opportunity'}</h2>
            <p className="text-xs text-gray-500 mb-6">Keep track of your job search pipeline.</p>
            
            <form onSubmit={saveJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Company Name *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building size={14} /></div>
                    <input 
                      type="text" 
                      required
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Role Title *</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Briefcase size={14} /></div>
                    <input 
                      type="text" 
                      required
                      value={formData.role_title}
                      onChange={e => setFormData({...formData, role_title: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Pipeline Stage</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as JobStatus})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {COLUMNS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Salary Range</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><DollarSign size={14} /></div>
                    <input 
                      type="text" 
                      value={formData.salary_range}
                      onChange={e => setFormData({...formData, salary_range: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. $120k - $150k"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Job URL</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LinkIcon size={14} /></div>
                  <input 
                    type="url" 
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Notes & Contact Info</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                  placeholder="Hiring manager's email, specific things to mention in interview..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 active:scale-95"
                >
                  {editingJob ? 'Save Changes' : 'Add Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
