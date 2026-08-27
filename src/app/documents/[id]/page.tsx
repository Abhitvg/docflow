'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Image from '@tiptap/extension-image';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import {
  ArrowLeft, Save, Share2, Download,
  Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Minus,
  Undo2, Redo2, Type, Clock, Check, Highlighter, FileCode,
  AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface ShareEntry {
  id: string;
  permission: string;
  user: User;
}

interface Version {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  createdBy: string;
  createdAt: string;
}

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [docId, setDocId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [permission, setPermission] = useState<string>('owner');
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('edit');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Highlight,
      CharacterCount,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    immediatelyRender: false,
    editable: true,
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
  });

  // Resolve params
  useEffect(() => {
    params.then((p) => setDocId(p.id));
  }, [params]);

  // Load document
  useEffect(() => {
    if (!docId) return;

    const load = async () => {
      try {
        const [authRes, docRes, usersRes] = await Promise.all([
          fetch('/api/auth/login'),
          fetch(`/api/documents/${docId}`),
          fetch('/api/users'),
        ]);

        const authData = await authRes.json();
        if (!authData.user) {
          router.push('/');
          return;
        }
        setCurrentUser(authData.user);

        if (!docRes.ok) {
          toast.error('Document not found or access denied');
          router.push('/dashboard');
          return;
        }

        const docData = await docRes.json();
        const doc = docData.document;
        setTitle(doc.title);
        setOwner(doc.owner);
        setPermission(docData.permission);
        setShares(doc.shares || []);
        setVersions(doc.versions || []);

        // Check for HTML import (read from localStorage to avoid URL length limits)
        const isImported = searchParams.get('imported');
        const importHtml = localStorage.getItem(`import_html_${docId}`);
        
        if (isImported && importHtml && editor) {
          editor.commands.setContent(importHtml);
          localStorage.removeItem(`import_html_${docId}`);
          
          // Save the imported content
          const json = editor.getJSON();
          await fetch(`/api/documents/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: json }),
          });
          // Clean URL
          window.history.replaceState({}, '', `/documents/${docId}`);
        } else if (doc.content && editor) {
          const content = doc.content;
          if (content.type === 'doc' && content.content) {
            editor.commands.setContent(content);
          }
        }

        // Set editable based on permission
        if (docData.permission === 'view' && editor) {
          editor.setEditable(false);
        }

        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      } catch {
        toast.error('Failed to load document');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [docId, editor, router, searchParams]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (content: any) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (!docId || permission === 'view') return;
        setSaving(true);
        try {
          await fetch(`/api/documents/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });
          setLastSaved(new Date());
        } catch {
          toast.error('Auto-save failed');
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [docId, permission]
  );

  // Save title
  const saveTitle = async (newTitle: string) => {
    if (!docId || permission === 'view') return;
    setTitle(newTitle);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      setLastSaved(new Date());
    } catch {
      toast.error('Failed to save title');
    }
  };

  // Manual save with version
  const manualSave = async () => {
    if (!editor || !docId || permission === 'view') return;
    setSaving(true);
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editor.getJSON(),
          title,
          saveVersion: true,
        }),
      });
      setLastSaved(new Date());
      toast.success('Saved with version snapshot');
      // Refresh versions
      const res = await fetch(`/api/documents/${docId}`);
      const data = await res.json();
      setVersions(data.document.versions || []);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Share document
  const handleShare = async () => {
    if (!shareEmail.trim()) return;

    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shareEmail, permission: sharePermission }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Shared with ${shareEmail}`);
        setShareEmail('');
        // Refresh shares
        const sharesRes = await fetch(`/api/documents/${docId}/share`);
        const sharesData = await sharesRes.json();
        setShares(sharesData.shares || []);
      } else {
        toast.error(data.error || 'Failed to share');
      }
    } catch {
      toast.error('Failed to share');
    }
  };

  // Remove share
  const removeShare = async (userId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        toast.success('Access removed');
        setShares((prev) => prev.filter((s) => s.user.id !== userId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to remove');
      }
    } catch {
      toast.error('Failed to remove access');
    }
  };

  // Restore version
  const restoreVersion = async (version: Version) => {
    if (!editor || permission === 'view') return;
    try {
      editor.commands.setContent(version.content);
      setTitle(version.title);
      await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: version.content,
          title: version.title,
          saveVersion: true,
        }),
      });
      toast.success('Version restored');
      setShowVersionModal(false);
    } catch {
      toast.error('Failed to restore version');
    }
  };

  // Export to PDF
  const exportPdf = async () => {
    if (!editor) return;
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(24);
      doc.text(title, 20, 30);
      doc.setFontSize(12);

      const text = editor.getText();
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, 45);
      doc.save(`${title || 'document'}.pdf`);
      toast.success('PDF exported');
    } catch {
      toast.error('PDF export failed');
    }
  };

  // Export to Markdown
  const exportMarkdown = async () => {
    if (!editor) return;
    try {
      const TurndownService = (await import('turndown')).default;
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      });
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'document'}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Markdown exported');
    } catch {
      toast.error('Markdown export failed');
    }
  };

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isReadOnly = permission === 'view';

  return (
    <div className="min-h-screen flex flex-col page-enter">
      {/* Editor Header */}
      <header className="sticky top-0 z-40 border-b border-surface-700/50 bg-surface-900/90 backdrop-blur-lg">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); saveTitle(title); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setEditingTitle(false); saveTitle(title); }
                }}
                className="bg-transparent border-none outline-none text-lg font-semibold text-surface-100 w-full"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-semibold text-surface-100 truncate cursor-pointer hover:text-brand-300 transition-colors"
                onClick={() => { if (!isReadOnly) { setEditingTitle(true); setTimeout(() => titleInputRef.current?.select(), 50); }}}
                title={isReadOnly ? title : 'Click to rename'}
              >
                {title || 'Untitled Document'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save status */}
            <div className="text-xs text-surface-500 hidden sm:flex items-center gap-1">
              {saving ? (
                <>
                  <div className="w-3 h-3 border border-surface-400 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-3 h-3 text-green-400" />
                  Saved
                </>
              ) : null}
            </div>

            {isReadOnly && (
              <span className="badge badge-view text-xs">View Only</span>
            )}

            {!isReadOnly && (
              <button onClick={manualSave} className="toolbar-btn tooltip" data-tooltip="Save version" disabled={saving}>
                <Save className="w-4 h-4" />
              </button>
            )}

            <button onClick={() => setShowVersionModal(true)} className="toolbar-btn tooltip" data-tooltip="Version history">
              <Clock className="w-4 h-4" />
            </button>

            <button onClick={exportPdf} className="toolbar-btn tooltip" data-tooltip="Export PDF">
              <Download className="w-4 h-4" />
            </button>

            <button onClick={exportMarkdown} className="toolbar-btn tooltip" data-tooltip="Export Markdown">
              <FileCode className="w-4 h-4" />
            </button>

            {permission === 'owner' && (
              <button onClick={() => setShowShareModal(true)} className="btn-secondary !py-1.5 !px-3 flex items-center gap-1.5 text-sm">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
                {shares.length > 0 && (
                  <span className="bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {shares.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        {!isReadOnly && editor && (
          <div className="flex items-center gap-0.5 px-4 py-1.5 overflow-x-auto border-t border-surface-800/50">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`} title="Bold (⌘B)">
              <BoldIcon className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`} title="Italic (⌘I)">
              <ItalicIcon className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`} title="Underline (⌘U)">
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`} title="Highlight">
              <Highlighter className="w-4 h-4" />
            </button>

            <div className="toolbar-divider" />

            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`} title="Heading 1">
              <Heading1 className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`} title="Heading 2">
              <Heading2 className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`} title="Heading 3">
              <Heading3 className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().setParagraph().run()} className={`toolbar-btn ${editor.isActive('paragraph') && !editor.isActive('heading') ? 'active' : ''}`} title="Normal text">
              <Type className="w-4 h-4" />
            </button>

            <div className="toolbar-divider" />

            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`} title="Bullet list">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`} title="Numbered list">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`} title="Blockquote">
              <Quote className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`} title="Code block">
              <Code className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="toolbar-btn" title="Horizontal rule">
              <Minus className="w-4 h-4" />
            </button>

            <div className="toolbar-divider" />

            <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="toolbar-btn" title="Undo (⌘Z)">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="toolbar-btn" title="Redo (⌘⇧Z)">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Editor content */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col">
        <div className="glass-card my-6 mx-4 flex-1 min-h-[70vh] relative">
          {editor && !isReadOnly && (
            <BubbleMenu editor={editor} className="flex items-center gap-1 p-1 bg-surface-800 border border-surface-600 rounded-lg shadow-xl">
              <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive('bold') ? 'text-brand-400' : 'text-surface-200'}`}>
                <BoldIcon className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive('italic') ? 'text-brand-400' : 'text-surface-200'}`}>
                <ItalicIcon className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive('underline') ? 'text-brand-400' : 'text-surface-200'}`}>
                <UnderlineIcon className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive('highlight') ? 'text-brand-400' : 'text-surface-200'}`}>
                <Highlighter className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-surface-600 mx-1"></div>
              <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive({ textAlign: 'left' }) ? 'text-brand-400' : 'text-surface-200'}`}>
                <AlignLeft className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive({ textAlign: 'center' }) ? 'text-brand-400' : 'text-surface-200'}`}>
                <AlignCenter className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-surface-700 ${editor.isActive({ textAlign: 'right' }) ? 'text-brand-400' : 'text-surface-200'}`}>
                <AlignRight className="w-4 h-4" />
              </button>
            </BubbleMenu>
          )}

          {editor && !isReadOnly && (
            <FloatingMenu editor={editor} className="flex items-center gap-1 p-1 bg-surface-800 border border-surface-600 rounded-lg shadow-xl">
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-surface-700 text-surface-200`}>
                <Heading1 className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-surface-700 text-surface-200`}>
                <Heading2 className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-surface-700 text-surface-200`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={`p-1.5 rounded hover:bg-surface-700 text-surface-200`}>
                <CheckSquare className="w-4 h-4" />
              </button>
              <button onClick={addImage} className={`p-1.5 rounded hover:bg-surface-700 text-surface-200`}>
                <ImageIcon className="w-4 h-4" />
              </button>
            </FloatingMenu>
          )}

          <EditorContent editor={editor} />
        </div>

        {/* Editor Footer / Stats */}
        {editor && (
          <div className="flex items-center justify-between px-6 pb-6 text-xs text-surface-500">
            <div className="flex items-center gap-3">
              <span>{editor.storage.characterCount.words()} words</span>
              <span className="w-1 h-1 bg-surface-600 rounded-full"></span>
              <span>{editor.storage.characterCount.characters()} characters</span>
            </div>
            <div>
              {Math.max(1, Math.ceil(editor.storage.characterCount.words() / 200))} min read
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <Share2 className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-semibold text-surface-100">Share Document</h3>
            </div>

            {/* Add share form */}
            <div className="flex gap-2 mb-6">
              <input
                type="email"
                placeholder="Enter email address..."
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                className="input-field flex-1"
              />
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="select-field"
              >
                <option value="edit">Edit</option>
                <option value="view">View</option>
              </select>
              <button onClick={handleShare} className="btn-primary !px-4">
                Share
              </button>
            </div>

            {/* Available users hint */}
            <div className="mb-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <p className="text-xs text-surface-400 mb-2">Available users:</p>
              <div className="flex flex-wrap gap-1">
                {allUsers
                  .filter((u) => u.id !== currentUser?.id && !shares.find((s) => s.user.id === u.id))
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setShareEmail(u.email)}
                      className="text-xs px-2 py-1 rounded-full bg-surface-700/50 hover:bg-brand-500/20 text-surface-300 hover:text-brand-300 transition-colors"
                    >
                      {u.email}
                    </button>
                  ))}
              </div>
            </div>

            {/* Current shares */}
            {shares.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-surface-300 mb-3">People with access</h4>
                <div className="space-y-2">
                  {/* Owner */}
                  {owner && (
                    <div className="flex items-center gap-3 p-2 rounded-lg">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: owner.avatarColor }}
                      >
                        {owner.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-surface-200">{owner.name}</div>
                        <div className="text-xs text-surface-400">{owner.email}</div>
                      </div>
                      <span className="badge badge-owner">Owner</span>
                    </div>
                  )}

                  {/* Shared users */}
                  {shares.map((share) => (
                    <div key={share.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800/30">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: share.user.avatarColor }}
                      >
                        {share.user.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-surface-200">{share.user.name}</div>
                        <div className="text-xs text-surface-400">{share.user.email}</div>
                      </div>
                      <span className={`badge ${share.permission === 'view' ? 'badge-view' : 'badge-shared'}`}>
                        {share.permission === 'view' ? 'View' : 'Edit'}
                      </span>
                      <button
                        onClick={() => removeShare(share.user.id)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowShareModal(false)} className="btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && (
        <div className="modal-overlay" onClick={() => setShowVersionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-semibold text-surface-100">Version History</h3>
            </div>

            {versions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-surface-500 mx-auto mb-3" />
                <p className="text-surface-400 mb-1">No saved versions yet</p>
                <p className="text-surface-500 text-sm">
                  Click the save button (💾) to create a version snapshot
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800/30 border border-surface-700/30"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-surface-200">{v.title}</div>
                      <div className="text-xs text-surface-400">
                        {new Date(v.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={() => restoreVersion(v)}
                        className="text-xs text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-500/10"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={() => setShowVersionModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
