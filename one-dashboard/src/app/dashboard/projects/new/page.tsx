'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create project');
      }

      // Show API key (only shown once)
      setApiKey(data.data.apiKey);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
    }
  };

  // Show API key screen after creation
  if (apiKey) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold">Project Created!</h1>
            <p className="text-muted-foreground mt-2">
              Your API key is shown below. Save it now - you won't be able to see it again.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-600 font-medium mb-2">
              Important: Copy your API key now
            </p>
            <p className="text-xs text-yellow-600/80">
              This is the only time you'll see this key. If you lose it, you'll need to generate a new one.
            </p>
          </div>

          <div className="relative mb-6">
            <label className="block text-sm font-medium mb-2">API Key</label>
            <div className="flex">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-4 py-3 border rounded-l-md bg-secondary font-mono text-sm"
              />
              <button
                onClick={copyApiKey}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-r-md hover:opacity-90"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard/projects"
              className="flex-1 px-4 py-2 text-center border rounded-md hover:bg-secondary"
            >
              View All Projects
            </Link>
            <button
              onClick={() => {
                setApiKey(null);
                setFormData({ name: '', description: '' });
              }}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-card border rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Create New Project</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded-md p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-background"
              placeholder="My Awesome Project"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              A unique name for your project. This will also generate a URL slug.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-md bg-background resize-none"
              rows={4}
              placeholder="Describe what this project is for..."
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard/projects"
              className="flex-1 px-4 py-2 text-center border rounded-md hover:bg-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
