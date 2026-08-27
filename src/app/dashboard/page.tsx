'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Upload, LogOut, Search, Clock, Users, Trash2, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface Document {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  ownerId: string;
  owner: User;
  shares: { id: string; permission: string; user: User }[];
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [authRes, docsRes] = await Promise.all([
        fetch('/api/auth/login'),
        fetch('/api/documents'),
      ]);

      const authData = await authRes.json();
      if (!authData.user) {
        router.push('/');
        return;
      }
      setCurrentUser(authData.user);

      const docsData = await docsRes.json();
      if (docsRes.ok) {
        setOwnedDocs(docsData.owned || []);
        setSharedDocs(docsData.shared || []);
      }
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const createDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const { document } = await res.json();
        router.push(`/documents/${document.id}`);
      } else {
        toast.error('Failed to create document');
      }
    } catch {
      toast.error('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const deleteDocument = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document deleted');
        loadData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`"${file.name}" imported successfully`);
        if (data.importHtml) {
          // Save to localStorage instead of URL to avoid length limits
          localStorage.setItem(`import_html_${data.document.id}`, data.importHtml);
          router.push(`/documents/${data.document.id}?imported=true`);
        } else {
          router.push(`/documents/${data.document.id}`);
        }
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setShowUpload(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const filterDocs = (docs: Document[]) => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter((d) => d.title.toLowerCase().includes(q));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              DocFlow
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2 mr-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: currentUser.avatarColor }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-sm text-surface-300 hidden sm:block">{currentUser.name}</span>
              </div>
            )}
            <button onClick={handleLogout} className="btn-secondary !py-2 !px-3 flex items-center gap-1.5 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Switch User</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUpload(true)} className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button onClick={createDocument} disabled={creating} className="btn-primary flex items-center gap-2">
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              New Document
            </button>
          </div>
        </div>

        {/* My Documents */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-brand-400" />
            <h2 className="text-xl font-semibold text-surface-100">My Documents</h2>
            <span className="badge badge-owner">{ownedDocs.length}</span>
          </div>

          {filterDocs(ownedDocs).length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText className="w-12 h-12 text-surface-500 mx-auto mb-3" />
              <p className="text-surface-400 mb-4">
                {searchQuery ? 'No documents match your search' : 'No documents yet'}
              </p>
              {!searchQuery && (
                <button onClick={createDocument} className="btn-primary">
                  Create your first document
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterDocs(ownedDocs).map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isOwner={true}
                  onDelete={() => deleteDocument(doc.id, doc.title)}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </section>

        {/* Shared with me */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-semibold text-surface-100">Shared with Me</h2>
            <span className="badge badge-shared">{sharedDocs.length}</span>
          </div>

          {filterDocs(sharedDocs).length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-12 h-12 text-surface-500 mx-auto mb-3" />
              <p className="text-surface-400">
                {searchQuery ? 'No shared documents match your search' : 'No documents shared with you yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterDocs(sharedDocs).map((doc) => {
                const myShare = doc.shares.find((s) => s.user.id === currentUser?.id);
                return (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    isOwner={false}
                    permission={myShare?.permission}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    formatDate={formatDate}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Upload a File</h3>
            <p className="text-surface-400 text-sm mb-6">
              Supported formats: .txt, .md, .docx, .pdf — Files are converted into editable documents.
            </p>

            <div
              className={`drop-zone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt,.md,.docx,.pdf';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(file);
                };
                input.click();
              }}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-surface-300">Processing file...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-surface-400 mx-auto mb-3" />
                  <p className="text-surface-300 mb-1">Drop a file here or click to browse</p>
                  <p className="text-surface-500 text-sm">.txt, .md, .docx, .pdf • Max 10MB</p>
                </>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowUpload(false)} disabled={uploading} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Document Card Component
function DocumentCard({
  doc,
  isOwner,
  permission,
  onDelete,
  onClick,
  formatDate,
}: {
  doc: Document;
  isOwner: boolean;
  permission?: string;
  onDelete?: () => void;
  onClick: () => void;
  formatDate: (d: string) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);

  // Extract a text preview from the content
  const getPreview = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = doc.content as any;
      if (content?.content) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const node of content.content as any[]) {
          if (node.content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const child of node.content as any[]) {
              if (child.text) return child.text;
            }
          }
        }
      }
    } catch {}
    return 'Empty document';
  };

  return (
    <div
      className="glass-card glass-card-hover p-5 cursor-pointer relative group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-surface-100 text-base truncate pr-8 group-hover:text-brand-300 transition-colors">
          {doc.title}
        </h3>
        {isOwner && onDelete && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded-lg hover:bg-surface-700/50 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-700 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-surface-400 text-sm line-clamp-2 mb-4">{getPreview()}</p>

      <div className="flex items-center justify-between text-xs text-surface-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(doc.updatedAt)}
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <span className="badge badge-owner">Owner</span>
              {doc.shares.length > 0 && (
                <div className="flex -space-x-1.5">
                  {doc.shares.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="w-5 h-5 rounded-full border-2 border-surface-800 flex items-center justify-center text-[9px] text-white font-semibold"
                      style={{ backgroundColor: s.user.avatarColor }}
                      title={s.user.name}
                    >
                      {s.user.name.charAt(0)}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-semibold"
                  style={{ backgroundColor: doc.owner.avatarColor }}
                >
                  {doc.owner.name.charAt(0)}
                </div>
                <span>{doc.owner.name.split(' ')[0]}</span>
              </div>
              <span className={`badge ${permission === 'view' ? 'badge-view' : 'badge-shared'}`}>
                {permission === 'view' ? 'View' : 'Edit'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
